import { useCallback, useEffect, useState } from 'react';
import type { PhotoStatus } from './types';
import { journalRequest } from './api';
let statusRequest: Promise<PhotoStatus> | undefined;
export function photographyStatus(force = false) {
  if (!statusRequest || force) statusRequest = journalRequest<PhotoStatus>('/status').catch(error => { statusRequest = undefined; throw error; });
  return statusRequest;
}
export function usePhotographyStatus() {
  const [status, setStatus] = useState<PhotoStatus>({ searchConfigured: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const refresh = useCallback(async (force = false) => {
    setLoading(true);
    try { setStatus(await photographyStatus(force)); setError(''); }
    catch (err) { setError((err as Error).message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);
  return { status, loading, error, refresh: () => refresh(true) };
}
