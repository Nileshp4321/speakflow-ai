import { useState, useEffect } from 'react';
import { Server, Database, Cpu, ExternalLink, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { checkHealth } from '../services/api';
import { useTheme } from '../context/ThemeContext';

export function Settings() {
  const { theme, toggleTheme } = useTheme();
  const [health, setHealth] = useState<{ status: string; database: string } | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [healthError, setHealthError] = useState<string | null>(null);

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:5000';

  const checkBackend = async () => {
    setHealthLoading(true);
    setHealthError(null);
    try {
      const h = await checkHealth();
      setHealth(h);
    } catch (err) {
      setHealthError(err instanceof Error ? err.message : 'Health check failed');
      setHealth(null);
    } finally {
      setHealthLoading(false);
    }
  };

  useEffect(() => {
    checkBackend();
  }, []);

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-100">Settings</h1>
        <p className="text-slate-400 text-sm mt-0.5">Application configuration and status</p>
      </div>

      <div className="space-y-4">
        {/* Backend health */}
        <section className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-brand-400" />
              <h2 className="text-sm font-semibold text-slate-200">Backend Status</h2>
            </div>
            <button
              onClick={checkBackend}
              disabled={healthLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors disabled:opacity-50"
            >
              {healthLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
              Refresh
            </button>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between py-2 border-b border-slate-700/30">
              <span className="text-xs text-slate-400">API URL</span>
              <span className="text-xs text-slate-300 font-mono">{apiUrl}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-700/30">
              <span className="text-xs text-slate-400">WebSocket URL</span>
              <span className="text-xs text-slate-300 font-mono">{wsUrl}/ws</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-700/30">
              <span className="text-xs text-slate-400">Server</span>
              {healthLoading ? (
                <Loader2 className="w-3.5 h-3.5 text-slate-500 animate-spin" />
              ) : healthError ? (
                <span className="flex items-center gap-1 text-xs text-red-400">
                  <XCircle className="w-3.5 h-3.5" /> Unreachable
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Online
                </span>
              )}
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5" /> MongoDB
              </span>
              {healthLoading ? (
                <Loader2 className="w-3.5 h-3.5 text-slate-500 animate-spin" />
              ) : healthError ? (
                <span className="text-xs text-slate-500">—</span>
              ) : health?.database === 'connected' ? (
                <span className="flex items-center gap-1 text-xs text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Connected
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-red-400">
                  <XCircle className="w-3.5 h-3.5" />
                  {health?.database || 'Disconnected'}
                </span>
              )}
            </div>
          </div>
        </section>

        {/* Gemini model info */}
        <section className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Cpu className="w-4 h-4 text-purple-400" />
            <h2 className="text-sm font-semibold text-slate-200">Gemini Live API</h2>
          </div>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between py-2 border-b border-slate-700/30">
              <span className="text-xs text-slate-400">Model</span>
              <span className="text-xs text-purple-300 font-mono">gemini-3.8-live</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-700/30">
              <span className="text-xs text-slate-400">Audio format</span>
              <span className="text-xs text-slate-300 font-mono">PCM 16-bit 16kHz</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-700/30">
              <span className="text-xs text-slate-400">Languages</span>
              <span className="text-xs text-slate-300">EN · HI · Hinglish + 70 more</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-xs text-slate-400">Documentation</span>
              <a
                href="https://aistudio.google.com/docs/live-api"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 transition-colors"
              >
                Live API Docs <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </section>

        {/* Appearance */}
        <section className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-slate-200 mb-4">Appearance</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-300">Theme</p>
              <p className="text-xs text-slate-500 mt-0.5">Currently using {theme} mode</p>
            </div>
            <button
              onClick={toggleTheme}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl text-sm transition-colors"
            >
              Switch to {theme === 'dark' ? 'Light' : 'Dark'}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
