import { useState } from 'react';
import { X, Save } from 'lucide-react';
import { Transcription } from '../types';

interface EditTranscriptionModalProps {
  transcription: Transcription;
  onSave: (id: string, data: { title: string; transcript: string }) => Promise<void>;
  onClose: () => void;
}

export function EditTranscriptionModal({
  transcription,
  onSave,
  onClose,
}: EditTranscriptionModalProps) {
  const [title, setTitle] = useState(transcription.title);
  const [transcript, setTranscript] = useState(transcription.transcript);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!transcript.trim()) return;
    setSaving(true);
    await onSave(transcription._id, { title, transcript });
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-2xl w-full shadow-2xl animate-slide-up max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-slate-100">Edit Transcription</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 flex-1 overflow-y-auto">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2.5 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              maxLength={300}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Transcript</label>
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              rows={10}
              className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2.5 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none leading-relaxed"
            />
            <p className="text-xs text-slate-500 mt-1">
              {transcript.trim().split(/\s+/).filter(Boolean).length} words
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-5 pt-4 border-t border-slate-700">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-700 transition-colors text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !transcript.trim()}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors text-sm font-medium"
          >
            {saving ? (
              <span className="animate-pulse">Saving…</span>
            ) : (
              <>
                <Save className="w-4 h-4" /> Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
