import { defineConfig } from 'vite';
// This module runs in Vite's Node server only; it is never imported by the frontend.
import { createPhotoApi } from './server/photo-api.mjs';
import { loadEnv } from 'vite';
export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env };
  return {
    plugins: [{
      name: 'destination-photography-api',
      configureServer(server) { server.middlewares.use(createPhotoApi({ env })); },
      configurePreviewServer(server) { server.middlewares.use(createPhotoApi({ env })); },
    }],
  };
});
