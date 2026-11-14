import type { ImageMetadata } from 'astro';
import { XMLParser } from 'fast-xml-parser';
import data from '../data/posts.json';
import { site } from '../data/site';
/** Shown when a post has no picture of its own. */
import defaultPicture from '../assets/characters/reading.jpg';

export interface Post {
  title: string;
  url: string;
  date: Date;
  slug: string;
  tag?: string;
  /** The post's Substack cover, downloaded and optimised at build time … */
  cover?: string;
  /** … or a local picture: src/assets/posts/<slug>.jpg, else the default picture. */
  image?: ImageMetadata;
  /** CSS object-position for the picture's crop */
  position?: string;
}

const extras = data.extras as Record<string, { tag?: string; position?: string }>;
const allowedTags = new Set(data.tags);

const postImages = import.meta.glob<{ default: ImageMetadata }>('../assets/posts/*.{jpg,jpeg,png,webp}', { eager: true });
const ownImage = (slug: string) =>
  Object.entries(postImages).find(([path]) => path.split('/').pop()!.replace(/\.\w+$/, '') === slug)?.[1].default;

function slugOf(url: string) {
  const m = url.match(/\/p\/([^/?#]+)/);
  return m ? m[1] : url;
}

/** Substack often wraps images in a resizing URL; unwrap it to the original file. */
function originalImage(url?: string | null) {
  if (!url) return undefined;
  const i = url.lastIndexOf('/https%3A');
  return i >= 0 ? decodeURIComponent(url.slice(i + 1)) : url;
}

type Raw = { title: string; url: string; date: string; cover?: string };

/** Hosts the build may download cover pictures from (must match image.domains in astro.config.mjs). */
const IMAGE_HOSTS = ['substack-post-media.s3.amazonaws.com', 'substackcdn.com'];
const trustedImage = (url?: string) => {
  try { const u = new URL(url!); return u.protocol === 'https:' && IMAGE_HOSTS.includes(u.hostname); } catch { return false; }
};
/** Keeps only posts with a real title, a Substack address and a valid date. */
const valid = (p: Raw) =>
  typeof p.title === 'string' && p.title.trim() !== '' && p.title !== 'null' && p.title !== 'undefined' &&
  /^https:\/\/[^/]*substack\.com\/p\//.test(p.url) && !Number.isNaN(new Date(p.date).getTime());

/** On GitHub, a warning also shows on the workflow run's summary page. */
const warn = (msg: string) => console.warn((globalThis as any).process?.env?.GITHUB_ACTIONS ? `::warning title=Substack posts::${msg}` : `[posts] ${msg}`);

const get = (url: string) =>
  fetch(url, { headers: { 'user-agent': 'thepaperworkengineer.com site build' }, signal: AbortSignal.timeout(15000) });

/** Substack's posts API. It has each post's current cover image (the RSS feed can lag behind). */
async function fromApi(): Promise<Raw[]> {
  const res = await get(site.substackApi);
  if (!res.ok) throw new Error(`API returned ${res.status}`);
  const list = await res.json();
  if (!Array.isArray(list)) throw new Error('API returned an unexpected shape');
  return list
    .filter((i: any) => i.is_published !== false && i.audience !== 'only_paid' && i.canonical_url)
    .map((i: any) => ({
      title: typeof i.title === 'string' ? i.title.trim() : '',
      url: String(i.canonical_url).trim(),
      date: String(i.post_date),
      cover: originalImage(i.cover_image),
    }));
}

/** The RSS feed, used if the API fails. */
async function fromFeed(): Promise<Raw[]> {
  const res = await get(site.substackFeed);
  if (!res.ok) throw new Error(`Feed returned ${res.status}`);
  const parsed = new XMLParser({ ignoreAttributes: false }).parse(await res.text());
  const items = parsed?.rss?.channel?.item;
  const list = Array.isArray(items) ? items : items ? [items] : [];
  return list.map((i: any) => ({
    title: typeof i.title === 'string' ? i.title.trim() : '',
    url: String(i.link ?? '').trim(),
    date: String(i.pubDate),
    cover: originalImage(i.enclosure?.['@_url']),
  }));
}

/** True if the address is a trusted host and really serves a picture right now, so a bad file never breaks the build. */
async function reachable(url: string) {
  if (!trustedImage(url)) return false;
  try {
    const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(10000) });
    return res.ok && (res.headers.get('content-type') ?? '').startsWith('image/');
  } catch {
    return false;
  }
}

let cache: Post[] | undefined;

/** Latest posts, read from Substack at build time. Falls back to the saved list in posts.json. */
export async function getPosts(): Promise<Post[]> {
  if (cache) return cache;
  let raw: Raw[] | undefined;
  for (const [name, load] of [['API', fromApi], ['feed', fromFeed]] as const) {
    try {
      const list = (await load()).filter(valid);
      if (!list.length) throw new Error('no usable posts');
      raw = list;
      console.log(`[posts] ${raw.length} posts from the Substack ${name}`);
      break;
    } catch (err) {
      warn(`Substack ${name} unavailable (${(err as Error).message})`);
    }
  }
  if (!raw) {
    warn('Substack could not be read, so the site shows the saved list in src/data/posts.json. New posts will appear once Substack is reachable again.');
    raw = data.fallback;
  }
  // A post without a cover can inherit the publication's image, which then repeats. Ignore repeats.
  const coverCount = new Map<string, number>();
  raw.forEach((p) => p.cover && coverCount.set(p.cover, (coverCount.get(p.cover) ?? 0) + 1));

  const latest = raw
    .map((p) => ({ ...p, date: new Date(p.date), slug: slugOf(p.url) }))
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, site.postsOnHomepage);

  cache = await Promise.all(
    latest.map(async (p) => {
      const tag = extras[p.slug]?.tag;
      if (tag && !allowedTags.has(tag)) console.warn(`[posts] tag "${tag}" on ${p.slug} is not in the tags list`);
      let cover = p.cover && coverCount.get(p.cover) === 1 ? p.cover : undefined;
      if (cover && !(await reachable(cover))) {
        warn(`cover for ${p.slug} could not be used; showing a local picture instead`);
        cover = undefined;
      }
      return {
        title: p.title, url: p.url, date: p.date, slug: p.slug,
        tag: tag && allowedTags.has(tag) ? tag : undefined,
        cover,
        image: cover ? undefined : ownImage(p.slug) ?? defaultPicture,
        position: extras[p.slug]?.position,
      };
    }),
  );
  return cache;
}
