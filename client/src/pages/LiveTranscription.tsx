import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  Mic,
  MicOff,
  Pause,
  Play,
  Square,
  Copy,
  Save,
  Download,
  Trash2,
  ChevronDown,
  Globe,
  AlertCircle,
} from 'lucide-react';
import { useRecording } from '../hooks/useRecording';
import { useTranscriptions } from '../hooks/useTranscriptions';
import { AudioVisualizer } from '../components/AudioVisualizer';
import { ConnectionStatusBadge } from '../components/StatusBadge';
import { TranscriptDisplay } from '../components/TranscriptDisplay';
import { formatDuration, copyToClipboard, downloadAsText, downloadAsPdf, generateTitle } from '../utils';

export function LiveTranscription() {
  const {
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
  } = useRecording();

  const { saveTranscription } = useTranscriptions();
  const [saving, setSaving] = useState(false);
  const [micDropdownOpen, setMicDropdownOpen] = useState(false);

  const isRecording = status === 'recording';
  const isPaused = status === 'paused';
  const isActive = isRecording || isPaused;
  const isConnecting = status === 'connecting';

  const handleSave = async () => {
    if (!fullTranscript.trim()) {
      toast.error('Nothing to save — transcript is empty');
      return;
    }
    setSaving(true);
    await saveTranscription({
      transcript: fullTranscript,
      title: generateTitle(fullTranscript),
      duration,
      language: 'auto',
    });
    setSaving(false);
  };

  const handleCopy = async () => {
    if (!fullTranscript.trim()) {
      toast.error('Nothing to copy');
      return;
    }
    const ok = await copyToClipboard(fullTranscript);
    if (ok) toast.success('Copied to clipboard!');
    else toast.error('Failed to copy');
  };

  const handleDownloadTxt = () => {
    if (!fullTranscript.trim()) {
      toast.error('Nothing to download');
      return;
    }
    downloadAsText(fullTranscript, `speakflow-${Date.now()}.txt`);
    toast.success('Downloaded as TXT');
  };

  const handleDownloadPdf = () => {
    if (!fullTranscript.trim()) {
      toast.error('Nothing to download');
      return;
    }
    downloadAsPdf(fullTranscript, generateTitle(fullTranscript));
  };

  const wordCount = fullTranscript.trim().split(/\s+/).filter(Boolean).length;
  const charCount = fullTranscript.length;
  
  // Debug logging
  console.log('[LiveTranscription] fullTranscript:', fullTranscript);
  console.log('[LiveTranscription] isActive:', isActive);
  console.log('[LiveTranscription] Show save button?', fullTranscript && !isActive);

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Live Transcription</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Speak naturally — Hindi, English, or Hinglish
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <ConnectionStatusBadge wsStatus={wsStatus} recordingStatus={status} />
          <span className="flex items-center gap-1 text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded-full">
            <Globe className="w-3 h-3" /> Auto-detect language
          </span>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-start gap-2 p-3 mb-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Mic selector */}
      {availableMics.length > 1 && (
        <div className="relative mb-4">
          <button
            onClick={() => setMicDropdownOpen((o) => !o)}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-xl text-sm text-slate-300 hover:border-slate-500 transition-colors"
          >
            <Mic className="w-3.5 h-3.5" />
            <span className="max-w-[200px] truncate">
              {availableMics.find((m) => m.deviceId === selectedMicId)?.label || 'Default Mic'}
            </span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          {micDropdownOpen && (
            <div className="absolute top-full mt-1 left-0 z-10 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden min-w-[240px]">
              {availableMics.map((mic) => (
                <button
                  key={mic.deviceId}
                  onClick={() => {
                    setSelectedMicId(mic.deviceId);
                    setMicDropdownOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors truncate ${
                    mic.deviceId === selectedMicId
                      ? 'bg-brand-600/20 text-brand-400'
                      : 'text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {mic.label || `Microphone ${mic.deviceId.slice(0, 8)}…`}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Recording controls */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 mb-4">
        {/* Visualizer */}
        <div className="mb-4 h-16 flex items-center">
          <AudioVisualizer
            analyserNode={analyserNode}
            isActive={isRecording}
            barCount={40}
            className="h-16"
          />
        </div>

        {/* Timer */}
        <div className="text-center mb-5">
          <span
            className={`text-4xl font-mono font-bold tracking-wider ${
              isRecording ? 'text-brand-400' : isPaused ? 'text-amber-400' : 'text-slate-500'
            }`}
          >
            {formatDuration(duration)}
          </span>
          {isRecording && (
            <div className="flex items-center justify-center gap-1.5 mt-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-400" />
              </span>
              <span className="text-xs text-red-400 font-medium">Recording</span>
            </div>
          )}
          {isPaused && (
            <p className="text-xs text-amber-400 mt-1 font-medium">Paused</p>
          )}
        </div>

        {/* Control buttons */}
        <div className="flex items-center justify-center gap-3 flex-wrap">
          {!isActive && !isConnecting && (
            <button
              onClick={startRecording}
              className="flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-medium text-sm transition-all shadow-lg shadow-brand-600/25 hover:shadow-brand-600/40"
            >
              <Mic className="w-4 h-4" />
              Start Recording
            </button>
          )}

          {isConnecting && (
            <button
              disabled
              className="flex items-center gap-2 px-6 py-3 bg-brand-600/50 text-white/70 rounded-xl font-medium text-sm cursor-not-allowed"
            >
              <span className="animate-pulse">Connecting…</span>
            </button>
          )}

          {isActive && (
            <>
              {isRecording ? (
                <button
                  onClick={pauseRecording}
                  className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 rounded-xl font-medium text-sm transition-all"
                >
                  <Pause className="w-4 h-4" />
                  Pause
                </button>
              ) : (
                <button
                  onClick={resumeRecording}
                  className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 rounded-xl font-medium text-sm transition-all"
                >
                  <Play className="w-4 h-4" />
                  Resume
                </button>
              )}

              <button
                onClick={stopRecording}
                className="flex items-center gap-2 px-4 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-xl font-medium text-sm transition-all"
              >
                <Square className="w-4 h-4" />
                Stop
              </button>
            </>
          )}
        </div>
      </div>

      {/* Transcript area */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-slate-200">Transcript</h2>
            {fullTranscript && (
              <span className="text-xs text-slate-500">
                {wordCount} words · {charCount} chars
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              disabled={!fullTranscript}
              title="Copy"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={handleDownloadTxt}
              disabled={!fullTranscript}
              title="Download TXT"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={clearTranscript}
              disabled={transcriptChunks.length === 0}
              title="Clear"
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="min-h-[160px] max-h-[400px] overflow-y-auto rounded-xl bg-slate-900/50 p-4">
          <TranscriptDisplay chunks={transcriptChunks} />
        </div>

        {/* Save button */}
        {fullTranscript && !isActive && (
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-all"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving…' : 'Save to History'}
            </button>
            <button
              onClick={handleDownloadPdf}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-sm font-medium transition-all"
            >
              <Download className="w-4 h-4" />
              PDF
            </button>
          </div>
        )}
      </div>

      {/* Partial text legend */}
      <p className="text-xs text-slate-600 mt-3 text-center">
        <span className="text-slate-400 italic">Italic text</span> = in progress ·{' '}
        <span className="text-slate-300">Normal text</span> = finalized
      </p>
    </div>
  );
}
