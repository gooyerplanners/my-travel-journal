import { useState } from 'react';
import { emptyProgress, parseProgress, progressKey } from './model';
import type { TripProgress } from './model';

export function useTripProgress(tripId: string) {
  const [initial] = useState(() => {
    try { return { progress: parseProgress(localStorage.getItem(progressKey(tripId))), error: '' }; }
    catch { return { progress: emptyProgress(), error: 'Local saving is unavailable in this browser. Changes will last for this visit only.' }; }
  });
  const [progress, setProgress] = useState(initial.progress);
  const [storageError, setStorageError] = useState(initial.error);
  function updateProgress(next: TripProgress) {
    setProgress(next);
    try {
      localStorage.setItem(progressKey(tripId), JSON.stringify(next));
      setStorageError('');
      return true;
    } catch {
      setStorageError('Your change is kept for this visit, but could not be saved locally. Check your browser storage settings.');
      return false;
    }
  }
  return { progress, updateProgress, storageError };
}
