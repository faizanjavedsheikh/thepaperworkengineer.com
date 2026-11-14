import { site } from '../data/site';
import { getPosts } from '../lib/posts';
import reels from '../data/reels.json';

// Only real pages: home and privacy (the 404 page is excluded on purpose).
// lastmod is the last real change: a copy edit, a new post or a new reel. Not the build date,
// because the site rebuilds daily and Google stops trusting dates that change without content changes.
export async function GET() {
  const day = (d: string | Date) => new Date(d).toISOString().slice(0, 10);
  const posts = await getPosts();
  const home = [site.pageUpdated.home, ...posts.map((p) => day(p.date)), ...reels.reels.map((r) => day(r.date))].sort().at(-1);
  const pages: [string, string][] = [['/', home!], ['/privacy', site.pageUpdated.privacy]];
  const urls = pages
    .map(([p, mod]) => `  <url><loc>${new URL(p, site.url).href}</loc><lastmod>${mod}</lastmod></url>`)
    .join('\n');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`, {
    headers: { 'Content-Type': 'application/xml' },
  });
}
