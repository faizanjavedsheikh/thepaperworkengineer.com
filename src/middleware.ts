import { defineMiddleware } from 'astro:middleware';
import { keepTogether } from './lib/keep-together.mjs';

// Astro writes an empty alt as a bare `alt`. That's valid HTML and screen readers treat it as decorative,
// but some site scanners (e.g. Bing Webmaster Tools) report it as missing, so spell it out as alt="".
const explicitEmptyAlt = (html: string) => html.replace(/(<img\b[^>]*?\s)alt(?=[\s>\/])/g, '$1alt=""');

// Every page passes through keepTogether, in dev and in the build, so phrases stay on one line.
export const onRequest = defineMiddleware(async (_context, next) => {
  const res = await next();
  if (!res.headers.get('content-type')?.includes('text/html')) return res;
  const html = explicitEmptyAlt(keepTogether(await res.text()));
  const headers = new Headers(res.headers);
  headers.delete('content-length');
  return new Response(html, { status: res.status, statusText: res.statusText, headers });
});
