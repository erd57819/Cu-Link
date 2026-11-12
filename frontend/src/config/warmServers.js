import { BACKEND_URL, FASTAPI_URL } from './api';

let warming;

// Start both free servers while the visitor reads the opening page.
// One attempt per page load, shared by React StrictMode; no periodic pings.
export function warmServers() {
  if (!warming) {
    warming = Promise.allSettled(
      [`${BACKEND_URL}/health`, `${FASTAPI_URL}/`].map(async (url) => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 90000);
        try {
          await fetch(url, { signal: controller.signal, cache: 'no-store' });
        } finally {
          clearTimeout(timeout);
        }
      })
    );
  }
  return warming;
}
