// ─── Transcription ───────────────────────────────────────────────────────────

export interface TranscriptionSegment {
  text: string;
  startTime?: number;
  endTime?: number;
  language?: string;
}

export interface Transcription {
  _id: string;
  title: string;
  transcript: string;
  language: string;
  duration: number;
  wordCount: number;
  segments: TranscriptionSegment[];
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTranscriptionPayload {
  title?: string;
  transcript: string;
  language?: string;
  duration?: number;
  segments?: TranscriptionSegment[];
  metadata?: Record<string, unknown>;
}

export interface UpdateTranscriptionPayload {
  title?: string;
  transcript?: string;
  language?: string;
  duration?: number;
}

// ─── API Response Shapes ─────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface TranscriptionFilters {
  search?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'title' | 'duration' | 'wordCount';
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  dateFrom?: string;
  dateTo?: string;
}

// ─── Recording / Live Transcription ─────────────────────────────────────────

export type RecordingStatus = 'idle' | 'connecting' | 'recording' | 'paused' | 'stopping';
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface LiveTranscriptChunk {
  id: string;
  text: string;
  type: 'partial' | 'final';
  timestamp: number;
}

// ─── Dashboard Stats ─────────────────────────────────────────────────────────

export interface DashboardStats {
  totalTranscriptions: number;
  totalDuration: number;
  todayCount: number;
}
