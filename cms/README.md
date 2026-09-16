# Carlson Gracie content editing

[Owner guide](./OWNER-GUIDE.md) · Studio: https://carlson-gracie-nz.sanity.studio/ · Website: https://carlson-gracie-eight.vercel.app/

Project `i27dttcu`, dataset `production`. Content and assets are public. No owner invitation has been sent; the owner’s email must be confirmed first.

## Content model

- 31 fixed-layout `sitePage` documents, grouped in the Studio by owner task.
- `coachProfile` and `seminarProfile` documents contain shared details. Page sections hold ordered strong references in `coachRefs` and `seminarRefs`.
- Profile `pageCopy` entries preserve deliberate or unresolved differences from the original pages. Clear an override to inherit the main value. Notes identify missing details and differences; they are not rendered on the website.
- Academy coach lists use the same shared records. Existing placeholder people and missing portraits are retained and marked for review.
- `siteSettings` is a singleton for the existing main phone/social/signup links on supported pages.
- `event` documents remain dated events; a guest reference is optional. Published events move to the archive after their end date.

The timetable is excluded. Layouts, navigation structure, video, embedded maps remain source-managed. FAQs, pricing and other page-specific copy stay with their pages. Local unpublished layout changes remain separate from production.

## Rendering and publishing

`cms/manifest.json` contains stable HTML bindings and list selectors. Never regenerate it without a migration. `cms/profiles.js` expands published references and applies optional page-specific values. Hidden, missing and empty reference lists do not resurrect fallback cards. Missing unmigrated reference fields retain existing content for backward compatibility.

Build and browser queries read published content. Production builds embed the current content; the browser refreshes it. On an outage the last built content remains available. A configured build fails if content fetching fails. Text is escaped; image and settings URLs are constrained.

The existing Sanity rebuild webhook must include `sitePage`, `event`, `coachProfile`, `seminarProfile` and `siteSettings`, excluding drafts and version documents. Website releases use GitHub main. The webhook target is stored in the services, never in this repository.

## Development and validation

- `npm run dev`: website preview.
- `npm run studio:dev`: local editor.
- `npm run test:cms`: bindings, safe rendering, lists, shared updates and empty/archive behaviour.
- `npm run build` / `npm run studio:build`: production builds.
- `npm --prefix studio run check`: schema validation.
- `npm run studio:deploy`: deploy Studio.
- `npm run cms:import`: seed missing shared records and pages; existing documents are never overwritten.

`seed.ndjson` contains page seeds; `shared-seed.ndjson` contains shared records. Legacy fixtures exist only for migration tests. The initial coach/seminar migration scripts skip pages already using references.

`migrate-owner-model.mjs` applies a reviewed migration plan from `OWNER_MIGRATION_PLAN`, requires `OWNER_MIGRATION_BACKUP`, and reads `SANITY_API_TOKEN` only from the process environment. It aborts on changed page revisions or unreviewed drafts, creates shared profiles and page references atomically, then verifies the saved state. Keep tokens and backup credentials out of source and browser variables.

## Blog publishing
`post` documents contain a title, unique slug, category (News/Technique), article date, excerpt, cover and Portable Text body. `cms/posts-plugin.js` reads only published documents during the build, replaces the category/home placeholder feeds and generates static `/blog/{slug}/index.html` articles. Publishing, unpublishing and deleting trigger the existing rebuild webhook. No client token or draft content is shipped. Article dates are display/order metadata, not scheduled publication. Development serves article routes from the published API. Empty lists show an honest empty state; old placeholder fields were removed in a revision-guarded migration.
