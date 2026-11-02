import type { IncomingMessage, ServerResponse } from 'node:http';
export interface PhotoApiOptions {
  env?: Record<string, string | undefined>;
  fetcher?: (url: string, init?: RequestInit) => Promise<Response>;
  now?: () => number;
}
export function createPhotoApi(options?: PhotoApiOptions): (req: IncomingMessage, res: ServerResponse, next?: () => void) => Promise<void>;
