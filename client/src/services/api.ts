import axios, { AxiosInstance } from 'axios';
import {
  Transcription,
  CreateTranscriptionPayload,
  UpdateTranscriptionPayload,
  PaginatedResponse,
  ApiResponse,
  TranscriptionFilters,
  DashboardStats,
} from '../types';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const http: AxiosInstance = axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Response interceptor — unwrap or surface errors
http.interceptors.response.use(
  (res) => res,
  (err) => {
    const message =
      err.response?.data?.message || err.message || 'Network error';
    return Promise.reject(new Error(message));
  },
);

// ─── Transcription CRUD ──────────────────────────────────────────────────────

export async function createTranscription(
  payload: CreateTranscriptionPayload,
): Promise<Transcription> {
  const res = await http.post<ApiResponse<Transcription>>('/transcriptions', payload);
  return res.data.data!;
}

export async function getTranscriptions(
  filters: TranscriptionFilters = {},
): Promise<PaginatedResponse<Transcription>> {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== undefined && v !== ''),
  );
  const res = await http.get<PaginatedResponse<Transcription>>('/transcriptions', { params });
  return res.data;
}

export async function getTranscriptionById(id: string): Promise<Transcription> {
  const res = await http.get<ApiResponse<Transcription>>(`/transcriptions/${id}`);
  return res.data.data!;
}

export async function updateTranscription(
  id: string,
  payload: UpdateTranscriptionPayload,
): Promise<Transcription> {
  const res = await http.put<ApiResponse<Transcription>>(`/transcriptions/${id}`, payload);
  return res.data.data!;
}

export async function deleteTranscription(id: string): Promise<void> {
  await http.delete(`/transcriptions/${id}`);
}

// ─── Dashboard Stats ─────────────────────────────────────────────────────────

export async function getDashboardStats(): Promise<DashboardStats> {
  // Pull first page with no filters to get total count
  const [all, today] = await Promise.all([
    http.get<PaginatedResponse<Transcription>>('/transcriptions', {
      params: { limit: 1, page: 1 },
    }),
    http.get<PaginatedResponse<Transcription>>('/transcriptions', {
      params: {
        limit: 100,
        page: 1,
        dateFrom: new Date(new Date().setHours(0, 0, 0, 0)).toISOString(),
        dateTo: new Date(new Date().setHours(23, 59, 59, 999)).toISOString(),
      },
    }),
  ]);

  const totalTranscriptions = all.data.pagination.total;
  const todayCount = today.data.pagination.total;

  // Sum durations from today's records for a rough total
  const totalDuration = today.data.data.reduce((acc, t) => acc + (t.duration || 0), 0);

  return { totalTranscriptions, totalDuration, todayCount };
}

// ─── Health ──────────────────────────────────────────────────────────────────

export async function checkHealth(): Promise<{ status: string; database: string }> {
  const res = await http.get('/health');
  return res.data;
}
