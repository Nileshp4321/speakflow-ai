import { WsStatus } from '../services/wsClient';
import { RecordingStatus } from '../types';
import { Wifi, WifiOff, AlertCircle, Loader2 } from 'lucide-react';

interface ConnectionStatusBadgeProps {
  wsStatus: WsStatus;
  recordingStatus: RecordingStatus;
}

export function ConnectionStatusBadge({ wsStatus, recordingStatus }: ConnectionStatusBadgeProps) {
  if (recordingStatus === 'connecting' || wsStatus === 'connecting') {
    return (
      <span className="flex items-center gap-1.5 text-xs font-medium text-yellow-400 bg-yellow-400/10 px-2.5 py-1 rounded-full">
        <Loader2 className="w-3 h-3 animate-spin" />
        Connecting…
      </span>
    );
  }

  if (wsStatus === 'error') {
    return (
      <span className="flex items-center gap-1.5 text-xs font-medium text-red-400 bg-red-400/10 px-2.5 py-1 rounded-full">
        <AlertCircle className="w-3 h-3" />
        Error
      </span>
    );
  }

  if (wsStatus === 'connected' && recordingStatus === 'recording') {
    return (
      <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-full">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
        </span>
        Live
      </span>
    );
  }

  if (recordingStatus === 'paused') {
    return (
      <span className="flex items-center gap-1.5 text-xs font-medium text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full">
        <span className="h-2 w-2 rounded-sm bg-amber-400" />
        Paused
      </span>
    );
  }

  if (wsStatus === 'disconnected') {
    return (
      <span className="flex items-center gap-1.5 text-xs font-medium text-slate-400 bg-slate-400/10 px-2.5 py-1 rounded-full">
        <WifiOff className="w-3 h-3" />
        Offline
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1.5 text-xs font-medium text-slate-400 bg-slate-400/10 px-2.5 py-1 rounded-full">
      <Wifi className="w-3 h-3" />
      Ready
    </span>
  );
}
