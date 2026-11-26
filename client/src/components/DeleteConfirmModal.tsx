import { AlertTriangle, X } from 'lucide-react';

interface DeleteConfirmModalProps {
  title: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirmModal({ title, onConfirm, onCancel }: DeleteConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl animate-slide-up">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-red-500/20">
            <AlertTriangle className="w-6 h-6 text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-100">Delete Transcription</h3>
        </div>

        <p className="text-slate-300 text-sm mb-1">
          Are you sure you want to delete:
        </p>
        <p className="text-slate-100 font-medium text-sm mb-5 truncate">"{title}"</p>
        <p className="text-slate-400 text-xs mb-6">This action cannot be undone.</p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-700 transition-colors text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white transition-colors text-sm font-medium"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
