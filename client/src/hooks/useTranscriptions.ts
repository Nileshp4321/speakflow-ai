import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  getTranscriptions,
  createTranscription,
  updateTranscription,
  deleteTranscription,
} from '../services/api';
import {
  Transcription,
  TranscriptionFilters,
  CreateTranscriptionPayload,
  UpdateTranscriptionPayload,
  PaginatedResponse,
} from '../types';

export function useTranscriptions() {
  const [data, setData] = useState<PaginatedResponse<Transcription> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTranscriptions = useCallback(async (filters: TranscriptionFilters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getTranscriptions(filters);
      setData(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch transcriptions';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveTranscription = useCallback(async (payload: CreateTranscriptionPayload) => {
    try {
      const doc = await createTranscription(payload);
      toast.success('Transcription saved!');
      return doc;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save transcription';
      toast.error(msg);
      return null;
    }
  }, []);

  const editTranscription = useCallback(
    async (id: string, payload: UpdateTranscriptionPayload) => {
      try {
        const doc = await updateTranscription(id, payload);
        toast.success('Transcription updated!');
        return doc;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to update transcription';
        toast.error(msg);
        return null;
      }
    },
    [],
  );

  const removeTranscription = useCallback(async (id: string) => {
    try {
      await deleteTranscription(id);
      toast.success('Transcription deleted');
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete transcription';
      toast.error(msg);
      return false;
    }
  }, []);

  return {
    data,
    loading,
    error,
    fetchTranscriptions,
    saveTranscription,
    editTranscription,
    removeTranscription,
  };
}
