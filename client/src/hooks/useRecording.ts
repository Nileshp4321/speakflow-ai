/**
 * useRecording
 *
 * Manages the full recording lifecycle:
 *  1. Opens MediaStream from the selected microphone
 *  2. Creates an AudioContext at 16kHz (required by Gemini Live API)
 *  3. Uses a ScriptProcessorNode to capture raw PCM chunks
 *  4. Converts Float32 PCM → Int16 PCM → Base64 and sends via WS
 *  5. Manages pause/resume by stopping/starting chunk forwarding
 *
 * Audio spec: raw 16-bit PCM, 16kHz, little-endian (Gemini Live API requirement)
 */

import { useRef, useState, useCallback, useEffect } from 'react';
import { SpeakFlowWsClient, WsStatus } from '../services/wsClient';
import { LiveTranscriptChunk, RecordingStatus } from '../types';

const WS_URL =
  (import.meta.env.VITE_WS_URL || 'ws://localhost:5000') + '/ws';

const SAMPLE_RATE = 16000;
const CHUNK_SIZE = 4096; // samples per chunk

function float32ToInt16Base64(float32Array: Float32Array): string {
  const int16 = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const clamped = Math.max(-1, Math.min(1, float32Array[i]));
    int16[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
  }
  const bytes = new Uint8Array(int16.buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export interface UseRecordingReturn {
  status: RecordingStatus;
  wsStatus: WsStatus;
  transcriptChunks: LiveTranscriptChunk[];
  fullTranscript: string;
  duration: number;
  analyserNode: AnalyserNode | null;
  availableMics: MediaDeviceInfo[];
  selectedMicId: string;
  setSelectedMicId: (id: string) => void;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  clearTranscript: () => void;
  error: string | null;
}

export function useRecording(): UseRecordingReturn {
  const [status, setStatusState] = useState<RecordingStatus>('idle');
  
  // Keep statusRef in sync with status state
  const setStatus = useCallback((newStatus: RecordingStatus) => {
    statusRef.current = newStatus;
    setStatusState(newStatus);
  }, []);
  const [wsStatus, setWsStatus] = useState<WsStatus>('disconnected');
  const [transcriptChunks, setTranscriptChunks] = useState<LiveTranscriptChunk[]>([]);
  const [duration, setDuration] = useState(0);
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);
  const [availableMics, setAvailableMics] = useState<MediaDeviceInfo[]>([]);
  const [selectedMicId, setSelectedMicId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<SpeakFlowWsClient | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pausedRef = useRef(false);
  const durationRef = useRef(0);
  const statusRef = useRef<RecordingStatus>('idle');

  // Build a transcript string from finalized chunks
  const fullTranscript = transcriptChunks
    .filter((c) => c.type === 'final')
    .map((c) => c.text)
    .filter(Boolean)
    .join(' ');
  
  // Debug logging
  if (typeof window !== 'undefined') {
    (window as any)._transcriptDebug = {
      chunks: transcriptChunks,
      fullTranscript,
      finalCount: transcriptChunks.filter((c) => c.type === 'final').length,
      partialCount: transcriptChunks.filter((c) => c.type === 'partial').length,
    };
  }

  // Enumerate microphones
  useEffect(() => {
    async function getMics() {
      try {
        // Brief request to trigger permission dialog so labels are populated
        const tempStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        tempStream.getTracks().forEach((t) => t.stop());

        const devices = await navigator.mediaDevices.enumerateDevices();
        const mics = devices.filter((d) => d.kind === 'audioinput');
        setAvailableMics(mics);
        if (mics.length > 0 && !selectedMicId) {
          setSelectedMicId(mics[0].deviceId);
        }
      } catch {
        // No mic permission yet — will be requested on startRecording
      }
    }
    getMics();
  }, []);

  const clearTranscript = useCallback(() => {
    setTranscriptChunks([]);
    setDuration(0);
    durationRef.current = 0;
  }, []);

  const stopAllTracks = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    processorRef.current?.disconnect();
    processorRef.current = null;
    sourceRef.current?.disconnect();
    sourceRef.current = null;
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close();
    }
    audioCtxRef.current = null;
    setAnalyserNode(null);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    if (statusRef.current !== 'idle') {
      console.log('[Recording] Cannot start - current status:', statusRef.current);
      return;
    }
    
    // If there's existing transcript, ask user what to do
    if (transcriptChunks.length > 0) {
      const shouldContinue = window.confirm(
        'You have an unsaved recording. Starting a new recording will clear it. Continue?'
      );
      if (!shouldContinue) {
        return;
      }
      // Clear existing transcript
      setTranscriptChunks([]);
    }
    
    console.log('[Recording] Starting recording...');
    setError(null);
    setStatus('connecting');
    
    // Reset timer and audio chunk counter when starting a new recording
    durationRef.current = 0;
    setDuration(0);
    if (typeof window !== 'undefined') {
      (window as any)._audioChunkCount = 0;
    }

    try {
      // Request microphone
      const constraints: MediaStreamConstraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: SAMPLE_RATE,
          ...(selectedMicId ? { deviceId: { exact: selectedMicId } } : {}),
        },
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      // Refresh mic list with labels now that we have permission
      const devices = await navigator.mediaDevices.enumerateDevices();
      const mics = devices.filter((d) => d.kind === 'audioinput');
      setAvailableMics(mics);

      // Create AudioContext at target sample rate
      const audioCtx = new AudioContext({ sampleRate: SAMPLE_RATE });
      audioCtxRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      sourceRef.current = source;

      // Analyser for visualizer
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      setAnalyserNode(analyser);

      // ScriptProcessor for PCM capture
      const processor = audioCtx.createScriptProcessor(CHUNK_SIZE, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (pausedRef.current) return;
        if (!wsRef.current) return;

        try {
          const channelData = e.inputBuffer.getChannelData(0);
          const base64 = float32ToInt16Base64(channelData);
          
          // Log first few chunks to verify audio is being processed
          if (!window._audioChunkCount) window._audioChunkCount = 0;
          window._audioChunkCount++;
          if (window._audioChunkCount <= 3) {
            console.log(`[Recording] Sending audio chunk #${window._audioChunkCount}, size:`, base64.length);
          }
          
          wsRef.current.sendAudioChunk(base64);
        } catch (error) {
          console.error('[Recording] Error processing audio chunk:', error);
        }
      };

      // Connect analyser for visualization
      source.connect(analyser);
      
      // Connect processor to source (not analyser) to capture audio
      source.connect(processor);
      
      // IMPORTANT: Connect to destination to keep audio processing active
      // Without this, some browsers won't fire onaudioprocess events
      processor.connect(audioCtx.destination);

      // Connect WebSocket to backend
      wsRef.current = new SpeakFlowWsClient(
        WS_URL,
        (msg) => {
          console.log('[Recording] Received message:', msg);
          if (msg.type === 'transcript') {
            const text = (msg.text || '').trim();
            console.log('[Recording] Transcript text:', text, 'Type:', msg.transcriptType);
            if (!text) return;

            setTranscriptChunks((prev) => {
              if (msg.transcriptType === 'partial') {
                // Replace last partial or append
                const lastIdx = prev.findLastIndex((c) => c.type === 'partial');
                if (lastIdx >= 0) {
                  const updated = [...prev];
                  updated[lastIdx] = { ...updated[lastIdx], text, timestamp: Date.now() };
                  console.log('[Recording] Updated partial chunk:', text);
                  return updated;
                }
                console.log('[Recording] Added new partial chunk:', text);
                return [
                  ...prev,
                  { id: crypto.randomUUID(), text, type: 'partial', timestamp: Date.now() },
                ];
              } else {
                // Finalize: remove all partials, add final
                const withoutPartials = prev.filter((c) => c.type !== 'partial');
                console.log('[Recording] Added FINAL chunk:', text);
                console.log('[Recording] Total final chunks:', withoutPartials.length + 1);
                return [
                  ...withoutPartials,
                  { id: crypto.randomUUID(), text, type: 'final', timestamp: Date.now() },
                ];
              }
            });
          } else if (msg.type === 'error') {
            setError(msg.message || 'Unknown error');
          }
        },
        (s) => {
          console.log('[Recording] WebSocket status changed to:', s, 'Current recording status:', status);
          setWsStatus(s);
          if (s === 'connected') {
            console.log('[Recording] Setting status to "recording"');
            setStatus('recording');
            pausedRef.current = false;
            // Start timer
            timerRef.current = setInterval(() => {
              durationRef.current += 1;
              setDuration(durationRef.current);
            }, 1000);
          } else if (s === 'error') {
            setError('Connection to server failed. Check that the backend is running.');
            setStatus('idle');
            stopAllTracks();
          } else if (s === 'disconnected') {
            // Handle unexpected disconnection
            if (status === 'connecting' || status === 'recording' || status === 'paused') {
              console.warn('[Recording] WebSocket disconnected unexpectedly');
              // Don't automatically clean up - user might want to retry
              // But stop the timer
              if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
              }
            }
          }
        },
      );

      wsRef.current.connect();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to start recording';
      setError(msg);
      setStatus('idle');
      stopAllTracks();
    }
  }, [selectedMicId, stopAllTracks, setError, setStatus, setWsStatus]);

  const stopRecording = useCallback(() => {
    if (statusRef.current === 'idle') {
      console.log('[Recording] stopRecording called but status is already idle, ignoring');
      return;
    }
    console.log('[Recording] Stopping recording...');
    console.trace('[Recording] stopRecording called from:');
    setStatus('stopping');

    // Send end of turn to finalize any pending transcription
    wsRef.current?.sendEndOfTurn();
    
    // Wait a moment for Gemini to finalize the transcript
    setTimeout(() => {
      console.log('[Recording] Finalizing transcript and closing WebSocket');
      
      // Convert any remaining partial chunks to final before closing
      setTranscriptChunks((prev) => {
        const hasPartials = prev.some((c) => c.type === 'partial');
        if (hasPartials) {
          console.log('[Recording] Converting partial chunks to final');
          return prev.map((c) => 
            c.type === 'partial' ? { ...c, type: 'final' as const } : c
          );
        }
        return prev;
      });
      
      wsRef.current?.stopSession();
      wsRef.current?.close();
      wsRef.current = null;

      stopAllTracks();
      pausedRef.current = false;

      setStatus('idle');
      setWsStatus('disconnected');
      
      // Note: We DON'T clear transcript or reset timer here
      // User needs to manually save or clear the transcript
    }, 500); // Wait 500ms for finalization
  }, [stopAllTracks, setStatus, setWsStatus, setTranscriptChunks]);

  const pauseRecording = useCallback(() => {
    if (statusRef.current !== 'recording') return;
    pausedRef.current = true;
    setStatus('paused');
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [setStatus]);

  const resumeRecording = useCallback(() => {
    if (statusRef.current !== 'paused') return;
    pausedRef.current = false;
    setStatus('recording');
    timerRef.current = setInterval(() => {
      durationRef.current += 1;
      setDuration(durationRef.current);
    }, 1000);
  }, [setStatus]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      wsRef.current?.close();
      stopAllTracks();
    };
  }, [stopAllTracks]);

  return {
    status,
    wsStatus,
    transcriptChunks,
    fullTranscript,
    duration,
    analyserNode,
    availableMics,
    selectedMicId,
    setSelectedMicId,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    clearTranscript,
    error,
  };
}
