export async function journalRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try { response = await fetch(`/api/journal${path}`, { credentials: 'same-origin', ...init }); }
  catch { throw new Error('Your journal is offline. Please check your connection and try again.'); }
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(payload?.error ?? 'The photography service is unavailable. Please try again shortly.');
  if (payload === null) throw new Error('The photo server is unavailable. Open the full application preview and try again.');
  return payload as T;
}
