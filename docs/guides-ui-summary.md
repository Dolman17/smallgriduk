# Guides UI — Summary of changes

This branch collects the work to modernise the Guides/Tutorials UI.

Main changes:

- Added a new `/tutorials/` page that lists guides with featured items and client-side tag filtering.
- Enhanced guide pages (`/guides/[slug]/`) with:
  - optional cover/hero images (frontmatter `cover`)
  - reading time estimate
  - generated table of contents with active-section highlighting and smooth scrolling
  - a compact hero area and improved meta chips
- Replaced placeholder hero SVGs with richer illustrative artwork for all guides; files in `public/images/guides/`.
- Styling improvements in `src/styles/global.css`:
  - hero/cover styles, reading-time pill, responsive TOC layout
  - animated h2 underline and TOC active-link styles
- Tutorials index and guides collection handling updated in `src/pages/tutorials.astro` and `src/pages/guides/index.astro` (layout parity maintained).

Notes:

- All changes were merged into `main` and the feature branch was removed; this branch contains an on-repo summary file so we can open a focused PR describing the work.
- If you want photographic hero images instead of SVGs, I can swap them in and update the frontmatter paths.

Files touched (high-level):

- `src/pages/tutorials.astro`
- `src/pages/guides/[...slug].astro`
- `src/styles/global.css`
- `src/content/guides/*.md` (added `cover` frontmatter)
- `public/images/guides/*-hero.svg` (new illustrative artwork)

Suggested PR title: "chore(guides): modernise guides UI — hero images, TOC, tutorials index"

Reviewer notes:

- The dev server should be started locally to verify visual layout: `npm run dev`.
- The TOC is generated client-side, so server-rendered HTML won't contain TOC entries; this keeps markdown render simple.
