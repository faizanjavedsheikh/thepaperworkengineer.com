# The Paperwork Engineer — website

The source for thepaperworkengineer.com: a static site built with Astro, Carbon Design System foundations (spacing, breakpoints, color tokens) and self-hosted IBM Plex.

## Run it on your computer

You need Node.js 22 or newer.

```bash
npm install        # once
npm run dev        # live preview at http://localhost:4321
npm run build      # builds the finished site into dist/
npm run preview    # serves the built site from dist/
```

## Edit things

| What | Where |
|---|---|
| Links (Calendly, Substack, LinkedIn, socials), privacy email | `src/data/site.ts` |
| Homepage text | `src/pages/index.astro` |
| 404 page | `src/pages/404.astro` |
| Privacy note | `src/pages/privacy.astro` |
| Colors, spacing, type | `src/styles/global.scss` (colors are the `--cds-…` variables at the top) |
| Character images | `src/assets/characters/` (swap a file, keep the name) |

**Email.** Your public address is `email` in `src/data/site.ts`. It shows under "Let's talk" and on the privacy page. Set it to `''` to hide it in both places.

### Substack posts (automatic)

On every build, the site asks Substack for your posts (its posts API, or the RSS feed if that fails) and shows your 3 newest. If Substack can't be reached, it uses the saved list in `src/data/posts.json`.

**Topic tags** come from one fixed list (`tags` in `src/data/posts.json`), so they stay consistent. Set a post's tag under `extras`, using its slug (the part of the post URL after `/p/`):

```json
"my-new-post-slug": { "tag": "CAPA" }
```

**Post pictures**, in order of preference:
1. The post's cover image on Substack (Settings → Social preview in the Substack editor). It's downloaded at build time and served from this site.
2. An image in `src/assets/posts/` named after the slug, e.g. `src/assets/posts/my-new-post-slug.jpg`. Only used if the post has no cover, or Substack is down during a build.
3. The default picture, `src/assets/characters/reading.jpg`.

### Instagram reels (by hand)

1. Save the reel's cover still in `src/assets/reels/` (the 1080×1920 cover works as is).
2. Add it to `src/data/reels.json` with its date. The homepage shows the newest 3 by date (change `reelsOnHomepage` in `src/data/site.ts`):

```json
{ "title": "CAPA in 60 seconds", "url": "https://www.instagram.com/p/XXXX/", "image": "XXXX.jpg", "date": "2026-11-20" }
```

- `title` is optional: without one, the tile shows the date.
- Add `"position": "50% 75%"` if the crop cuts off the Engineer (higher % = show more of the bottom).
- The title and date sit under each cover. On tablets and up they sit 3 across; on phones they become a swipeable row.

## Put it online (GitHub Pages + your Porkbun domain)

1. Create a GitHub repository and push this folder to its `main` branch.
2. In the repository: **Settings → Pages → Source: GitHub Actions.**
3. The workflow in `.github/workflows/deploy.yml` builds and publishes the site on every push. It also rebuilds daily at 06:17 Lahore time, so new Substack posts appear on their own. You can also run it by hand from the **Actions** tab.
4. Custom domain: `public/CNAME` already contains `thepaperworkengineer.com`. In **Settings → Pages**, enter the same domain and tick **Enforce HTTPS** once it's available.
5. At Porkbun, add the DNS records GitHub lists for an apex domain: four `A` records for `@`, and a `CNAME` for `www` pointing to `<your-github-username>.github.io`. GitHub's guide, "Managing a custom domain for your GitHub Pages site", has the current IP addresses.

## What's in here

- `src/layouts/Base.astro`: page shell (SEO tags, structured data, header, footer, phone menu)
- `src/components/Art.astro`: responsive images (AVIF, WebP and JPEG at several widths)
- `src/components/Icon.astro`: the Carbon icons used on the site
- `src/lib/posts.ts`: reads your Substack posts at build time
- `src/pages/sitemap.xml.ts`: sitemap (home and privacy pages)
- `public/`: fonts, favicons, share image, robots.txt, CNAME

Fonts: IBM Plex Sans, © IBM Corp., SIL Open Font License 1.1 (`public/fonts/OFL-IBM-Plex.txt`).

## After launch: search engines

1. **Google Search Console**: add `thepaperworkengineer.com` as a *Domain* property and verify it with the TXT record Google gives you (add it in Porkbun's DNS). Then submit `https://thepaperworkengineer.com/sitemap.xml` and use URL Inspection → *Request indexing* on the homepage.
2. **Bing Webmaster Tools**: sign in and choose *Import from Google Search Console*. This also covers DuckDuckGo and ChatGPT search, which use Bing's index.
3. **One address only**: in Porkbun, point `www` at `<your-github-username>.github.io` (CNAME) so `www.thepaperworkengineer.com` redirects to the main address. In the repo's *Settings → Pages*, tick *Enforce HTTPS*.
4. **Links in**: put `https://thepaperworkengineer.com` in your Substack *About* page and publication settings, LinkedIn *Contact info* and *Featured*, and your Instagram, TikTok, X, Bluesky and Threads bios.
5. **When you edit page text**, update `pageUpdated` in `src/data/site.ts` so the sitemap date stays honest.
