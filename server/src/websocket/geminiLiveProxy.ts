/**
 * GeminiLiveProxy
 *
 * Secure backend proxy between the browser client and the Gemini Live API.
 * The API key never leaves the server.
 *
 * Gemini Live API details (verified against official docs, November 2026):
 *  - Model:    gemini-3.8-live  (stable, not deprecated)
 *  - Endpoint: wss://generativelanguage.googleapis.com/ws/
 *              google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=API_KEY
 *  - Input audio:  raw 16-bit PCM, 16 kHz, little-endian, base64-encoded
 *  - mimeType: "audio/pcm;rate=16000"
 *  - Transcription: enabled by { inputAudioTranscription: { mode: 'VERBATIM' } } in setup config
 *  - Transcription text arrives in serverContent.inputTranscription.text
 */

import WebSocket from 'ws';
import { config } from '../config/env';

const GEMINI_WS_URL =
  `wss://generativelanguage.googleapis.com/ws/` +
  `google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent` +
  `?key=${config.geminiApiKey}`;

export type TranscriptCallback = (data: {
  type: 'partial' | 'final' | 'error' | 'status';
  text?: string;
  message?: string;
}) => void;

export class GeminiLiveProxy {
  private geminiWs: WebSocket | null = null;
  private onTranscript: TranscriptCallback;
  private sessionReady = false;
  private pendingAudioQueue: string[] = [];
  private closed = false;

  constructor(onTranscript: TranscriptCallback) {
    this.onTranscript = onTranscript;
  }

  connect(): void {
    if (this.closed) return;

    if (!config.geminiApiKey) {
      this.onTranscript({
        type: 'error',
        message: 'GEMINI_API_KEY is not configured on the server.',
      });
      return;
    }

    console.log(`[Gemini] Connecting to Live API (model: ${config.geminiModel})…`);

    this.geminiWs = new WebSocket(GEMINI_WS_URL);

    this.geminiWs.on('open', () => {
      console.log('[Gemini] WebSocket connected');
      this.sendSetup();
    });

    this.geminiWs.on('message', (raw: WebSocket.RawData) => {
      this.handleGeminiMessage(raw);
    });

    this.geminiWs.on('error', (err: Error) => {
      console.error('[Gemini] WebSocket error:', err.message);
      this.onTranscript({ type: 'error', message: `Gemini connection error: ${err.message}` });
    });

    this.geminiWs.on('close', (code: number, reason: Buffer) => {
      console.log(`[Gemini] WebSocket closed: ${code} ${reason.toString()}`);
      this.sessionReady = false;
      if (!this.closed) {
        this.onTranscript({ type: 'status', message: 'disconnected' });
      }
    });
  }

  private sendSetup(): void {
    const setupMessage = {
      setup: {
        model: `models/${config.geminiModel}`,
        // Enable real-time transcription of user audio input
        // The model will transcribe audio and return text in serverContent.inputTranscription
        inputAudioTranscription: {
          mode: 'VERBATIM', // Use verbatim mode for accurate transcription
        },
        systemInstruction: {
          parts: [
            {
              text:
                'You are a transcription assistant. Transcribe EXACTLY what the user speaks. ' +
                'Do NOT translate. Preserve the original language(s) — including Hindi, English, ' +
                'and Hinglish (mixed Hindi-English). Do not add commentary or responses. ' +
                'Output only the transcribed text with proper punctuation.',
            },
          ],
        },
      },
    };

    this.geminiWs?.send(JSON.stringify(setupMessage));
  }

  private handleGeminiMessage(raw: WebSocket.RawData): void {
    let msg: Record<string, unknown>;

    try {
      msg = JSON.parse(raw.toString()) as Record<string, unknown>;
    } catch {
      // Binary frames are audio output from the model — we don't need them
      return;
    }

    // Setup complete
    if (msg.setupComplete) {
      this.sessionReady = true;
      console.log('[Gemini] Session ready');
      this.onTranscript({ type: 'status', message: 'connected' });

      // Flush queued audio chunks
      for (const chunk of this.pendingAudioQueue) {
        this.sendAudioChunkRaw(chunk);
      }
      this.pendingAudioQueue = [];
      return;
    }

    const sc = (msg.serverContent as Record<string, unknown> | undefined);
    if (!sc) return;

    // Input transcription — the user's speech
    const inputTx = sc.inputTranscription as { text?: string } | undefined;
    if (inputTx?.text?.trim()) {
      const text = inputTx.text.trim();
      const isFinal = !!sc.turnComplete;
      console.log(`[Gemini] Transcription (${isFinal ? 'final' : 'partial'}):`, text);
      this.onTranscript({ type: isFinal ? 'final' : 'partial', text });
    }

    // Turn complete with no transcription text — emit final marker so the
    // frontend knows this speech segment ended.
    if (sc.turnComplete && !inputTx?.text?.trim()) {
      this.onTranscript({ type: 'final', text: '' });
    }
  }

  sendAudioChunk(pcmBase64: string): void {
    if (!this.sessionReady) {
      // Buffer up to 50 chunks while session initialises
      if (this.pendingAudioQueue.length < 50) {
        this.pendingAudioQueue.push(pcmBase64);
      }
      return;
    }
    this.sendAudioChunkRaw(pcmBase64);
  }

  private sendAudioChunkRaw(pcmBase64: string): void {
    if (this.geminiWs?.readyState !== WebSocket.OPEN) return;

    const audioMessage = {
      realtimeInput: {
        audio: {
          data: pcmBase64,
          mimeType: 'audio/pcm;rate=16000',
        },
      },
    };
    this.geminiWs.send(JSON.stringify(audioMessage));
  }

  /**
   * Signal end of the current audio turn so Gemini finalises the transcript.
   */
  sendEndOfTurn(): void {
    if (this.geminiWs?.readyState !== WebSocket.OPEN || !this.sessionReady) return;
    const endMsg = {
      realtimeInput: {
        audioStreamEnd: true,
      },
    };
    this.geminiWs.send(JSON.stringify(endMsg));
  }

  close(): void {
    this.closed = true;
    this.sessionReady = false;
    this.pendingAudioQueue = [];

    if (this.geminiWs) {
      this.geminiWs.removeAllListeners();
      if (
        this.geminiWs.readyState === WebSocket.OPEN ||
        this.geminiWs.readyState === WebSocket.CONNECTING
      ) {
        this.geminiWs.close();
      }
      this.geminiWs = null;
    }
  }

  get isReady(): boolean {
    return this.sessionReady;
  }
}
