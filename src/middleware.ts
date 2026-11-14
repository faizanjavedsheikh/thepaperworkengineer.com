import { defineMiddleware } from 'astro:middleware';
import { keepTogether } from './lib/keep-together.mjs';

// Every page passes through keepTogether, in dev and in the build, so phrases stay on one line.
export const onRequest = defineMiddleware(async (_context, next) => {
  const res = await next();
  if (!res.headers.get('content-type')?.includes('text/html')) return res;
  const html = keepTogether(await res.text());
  const headers = new Headers(res.headers);
  headers.delete('content-length');
  return new Response(html, { status: res.status, statusText: res.statusText, headers });
});
