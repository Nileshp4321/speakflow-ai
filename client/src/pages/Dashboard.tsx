import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Mic,
  Clock,
  FileText,
  TrendingUp,
  ArrowRight,
  Calendar,
} from 'lucide-react';
import { getDashboardStats, getTranscriptions } from '../services/api';
import { DashboardStats, Transcription } from '../types';
import { formatDurationHuman, formatRelativeTime } from '../utils';
import { StatsCardSkeleton, CardSkeleton } from '../components/LoadingSkeleton';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}

function StatCard({ icon, label, value, sub, color }: StatCardProps) {
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 hover:border-slate-600/50 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-slate-400 font-medium">{label}</span>
        <div className={`p-2 rounded-xl ${color}`}>{icon}</div>
      </div>
      <div className="text-3xl font-bold text-slate-100 mb-0.5">{value}</div>
      {sub && <div className="text-xs text-slate-500">{sub}</div>}
    </div>
  );
}

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recent, setRecent] = useState<Transcription[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingRecent, setLoadingRecent] = useState(true);

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .finally(() => setLoadingStats(false));

    getTranscriptions({ limit: 5, sortBy: 'createdAt', order: 'desc' })
      .then((r) => setRecent(r.data))
      .finally(() => setLoadingRecent(false));
  }, []);

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-100">Dashboard</h1>
        <p className="text-slate-400 text-sm mt-0.5">
          Your speech-to-text activity overview
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
        {loadingStats ? (
          <>
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              icon={<FileText className="w-5 h-5 text-brand-400" />}
              label="Total Transcriptions"
              value={stats?.totalTranscriptions ?? 0}
              sub="All time"
              color="bg-brand-500/20"
            />
            <StatCard
              icon={<Clock className="w-5 h-5 text-emerald-400" />}
              label="Recording Time"
              value={formatDurationHuman(stats?.totalDuration ?? 0)}
              sub="Total recorded"
              color="bg-emerald-500/20"
            />
            <StatCard
              icon={<Calendar className="w-5 h-5 text-purple-400" />}
              label="Today"
              value={stats?.todayCount ?? 0}
              sub="Transcriptions today"
              color="bg-purple-500/20"
            />
          </>
        )}
      </div>

      {/* Quick action */}
      <Link
        to="/transcribe"
        className="flex items-center justify-between p-4 mb-8 bg-gradient-to-r from-brand-600/20 to-purple-600/20 border border-brand-500/30 rounded-2xl hover:from-brand-600/30 hover:to-purple-600/30 transition-all group"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-brand-600/30">
            <Mic className="w-5 h-5 text-brand-400" />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-100">Start Live Transcription</div>
            <div className="text-xs text-slate-400">English, Hindi, Hinglish supported</div>
          </div>
        </div>
        <ArrowRight className="w-5 h-5 text-brand-400 group-hover:translate-x-1 transition-transform" />
      </Link>

      {/* Recent transcriptions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-slate-200">Recent Transcriptions</h2>
          <Link
            to="/history"
            className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors"
          >
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {loadingRecent ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : recent.length === 0 ? (
          <div className="text-center py-12 bg-slate-800/30 rounded-2xl border border-slate-700/30">
            <Mic className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">No transcriptions yet.</p>
            <Link
              to="/transcribe"
              className="inline-block mt-3 text-xs text-brand-400 hover:text-brand-300 transition-colors"
            >
              Record your first transcription →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recent.map((t) => (
              <div
                key={t._id}
                className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 hover:border-slate-600/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-sm font-medium text-slate-200 truncate flex-1">{t.title}</h3>
                  <span className="text-xs text-slate-500 flex-shrink-0">
                    {formatRelativeTime(t.createdAt)}
                  </span>
                </div>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {t.transcript}
                </p>
                <div className="flex gap-3 mt-2.5">
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    {t.wordCount} words
                  </span>
                  {t.duration > 0 && (
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDurationHuman(t.duration)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
