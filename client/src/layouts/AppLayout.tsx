import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  Mic,
  LayoutDashboard,
  History,
  Settings,
  Menu,
  X,
  Zap,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/transcribe', icon: Mic, label: 'Live Transcription' },
  { to: '/history', icon: History, label: 'History' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-700/50">
        <div className="p-1.5 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-base font-bold text-white leading-none">SpeakFlow</h1>
          <p className="text-xs text-brand-400 leading-none mt-0.5">AI Transcription</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-brand-600/20 text-brand-400 border border-brand-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
              }`
            }
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-4 py-4 border-t border-slate-700/50">
        <button
          onClick={toggleTheme}
          className="flex items-center gap-2 px-3 py-2 w-full rounded-xl text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-all"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-56 bg-slate-900 border-r border-slate-700/50 flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative flex flex-col w-64 bg-slate-900 border-r border-slate-700/50 h-full">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 p-1"
            >
              <X className="w-5 h-5" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-700/50">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-gradient-to-br from-brand-500 to-purple-600">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white text-sm">SpeakFlow AI</span>
          </div>
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-slate-400 hover:text-slate-200 p-1"
          >
            <Menu className="w-5 h-5" />
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
