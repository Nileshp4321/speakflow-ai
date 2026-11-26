import { useEffect, useState, useCallback } from 'react';
import {
  Search,
  SortAsc,
  SortDesc,
  FileText,
  Clock,
  Edit2,
  Trash2,
  Copy,
  Download,
  ChevronLeft,
  ChevronRight,
  Mic,
} from 'lucide-react';
import { useTranscriptions } from '../hooks/useTranscriptions';
import { TranscriptionFilters, Transcription } from '../types';
import { formatRelativeTime, formatDurationHuman, copyToClipboard, downloadAsText } from '../utils';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { EditTranscriptionModal } from '../components/EditTranscriptionModal';
import { TableRowSkeleton } from '../components/LoadingSkeleton';
import { getTranscriptionById } from '../services/api';
import toast from 'react-hot-toast';

export function History() {
  const { data, loading, error, fetchTranscriptions, editTranscription, removeTranscription } =
    useTranscriptions();

  const [filters, setFilters] = useState<TranscriptionFilters>({
    sortBy: 'createdAt',
    order: 'desc',
    page: 1,
    limit: 10,
  });
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Transcription | null>(null);
  const [editTarget, setEditTarget] = useState<Transcription | null>(null);

  const loadData = useCallback(
    (overrides: Partial<TranscriptionFilters> = {}) => {
      const f = { ...filters, ...overrides, search: search || undefined };
      fetchTranscriptions(f);
    },
    [filters, search, fetchTranscriptions],
  );

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const handleSearch = () => {
    setFilters((f) => ({ ...f, page: 1 }));
    loadData({ page: 1 });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const toggleSort = () => {
    const newOrder = filters.order === 'desc' ? 'asc' : 'desc';
    setFilters((f) => ({ ...f, order: newOrder, page: 1 }));
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const ok = await removeTranscription(deleteTarget._id);
    setDeleteTarget(null);
    if (ok) loadData();
  };

  const handleEdit = async (id: string, payload: { title: string; transcript: string }) => {
    const updated = await editTranscription(id, payload);
    if (updated) {
      setEditTarget(null);
      loadData();
    }
  };

  const handleCopy = async (t: Transcription) => {
    const ok = await copyToClipboard(t.transcript);
    if (ok) toast.success('Copied!');
    else toast.error('Copy failed');
  };

  const handleDownload = (t: Transcription) => {
    downloadAsText(t.transcript, `${t.title.slice(0, 40)}.txt`);
    toast.success('Downloaded');
  };

  const handleEditClick = async (t: Transcription) => {
    // Fetch full record to get latest content
    try {
      const full = await getTranscriptionById(t._id);
      setEditTarget(full);
    } catch {
      setEditTarget(t);
    }
  };

  const pagination = data?.pagination;
  const transcriptions = data?.data || [];

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-100">Transcription History</h1>
        <p className="text-slate-400 text-sm mt-0.5">
          {pagination ? `${pagination.total} transcription${pagination.total !== 1 ? 's' : ''}` : 'Loading…'}
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-5 flex-wrap">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search transcriptions…"
            className="w-full bg-slate-800/50 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={handleSearch}
          className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-medium transition-colors"
        >
          Search
        </button>
        <button
          onClick={toggleSort}
          className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-800/50 border border-slate-700 hover:border-slate-500 text-slate-300 rounded-xl text-sm transition-colors"
          title={filters.order === 'desc' ? 'Newest first' : 'Oldest first'}
        >
          {filters.order === 'desc' ? (
            <SortDesc className="w-4 h-4" />
          ) : (
            <SortAsc className="w-4 h-4" />
          )}
          {filters.order === 'desc' ? 'Newest' : 'Oldest'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 mb-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden">
        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Title
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Preview
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Words
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="text-right px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => <TableRowSkeleton key={i} />)
              ) : transcriptions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                    <Mic className="w-8 h-8 mx-auto mb-2 text-slate-700" />
                    No transcriptions found
                  </td>
                </tr>
              ) : (
                transcriptions.map((t) => (
                  <tr
                    key={t._id}
                    className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="text-sm text-slate-200 font-medium line-clamp-1 max-w-[200px] block">
                        {t.title}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-400 line-clamp-2 max-w-[260px] block leading-relaxed">
                        {t.transcript.slice(0, 120)}{t.transcript.length > 120 ? '…' : ''}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-400">{t.wordCount}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-400 whitespace-nowrap">
                        {formatRelativeTime(t.createdAt)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => handleCopy(t)}
                          title="Copy"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDownload(t)}
                          title="Download"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleEditClick(t)}
                          title="Edit"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-brand-400 hover:bg-brand-500/10 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(t)}
                          title="Delete"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-slate-700/30">
          {loading ? (
            <div className="p-4 space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse space-y-2">
                  <div className="h-4 bg-slate-700 rounded w-3/4" />
                  <div className="h-3 bg-slate-700/70 rounded w-full" />
                  <div className="h-3 bg-slate-700/70 rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : transcriptions.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <Mic className="w-8 h-8 mx-auto mb-2 text-slate-700" />
              No transcriptions found
            </div>
          ) : (
            transcriptions.map((t) => (
              <div key={t._id} className="p-4">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <h3 className="text-sm font-medium text-slate-200 line-clamp-1 flex-1">{t.title}</h3>
                  <span className="text-xs text-slate-500 flex-shrink-0">
                    {formatRelativeTime(t.createdAt)}
                  </span>
                </div>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
                  {t.transcript.slice(0, 120)}{t.transcript.length > 120 ? '…' : ''}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <FileText className="w-3 h-3" /> {t.wordCount}w
                    </span>
                    {t.duration > 0 && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {formatDurationHuman(t.duration)}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => handleCopy(t)} className="p-1.5 text-slate-400 hover:text-slate-200">
                      <Copy className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleEditClick(t)} className="p-1.5 text-slate-400 hover:text-brand-400">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDeleteTarget(t)} className="p-1.5 text-slate-400 hover:text-red-400">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-xs text-slate-500">
            Page {pagination.page} of {pagination.pages} ({pagination.total} total)
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setFilters((f) => ({ ...f, page: Math.max(1, (f.page || 1) - 1) }))}
              disabled={pagination.page <= 1}
              className="p-2 rounded-xl border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() =>
                setFilters((f) => ({ ...f, page: Math.min(pagination.pages, (f.page || 1) + 1) }))
              }
              disabled={pagination.page >= pagination.pages}
              className="p-2 rounded-xl border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {deleteTarget && (
        <DeleteConfirmModal
          title={deleteTarget.title}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
      {editTarget && (
        <EditTranscriptionModal
          transcription={editTarget}
          onSave={handleEdit}
          onClose={() => setEditTarget(null)}
        />
      )}
    </div>
  );
}
