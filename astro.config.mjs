// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://thepaperworkengineer.com',
  output: 'static',
  trailingSlash: 'never',
  build: { format: 'file', inlineStylesheets: 'always' }, // /privacy -> privacy.html, works on GitHub Pages without trailing slashes
  compressHTML: true,
  // Substack post covers are downloaded at build time and served from this site (no third-party image requests).
  image: { domains: ['substack-post-media.s3.amazonaws.com', 'substackcdn.com'] },
  vite: {
    css: {
      preprocessorOptions: {
        scss: { quietDeps: true, silenceDeprecations: ['import', 'global-builtin'] },
      },
    },
  },
});
