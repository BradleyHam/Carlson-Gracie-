# Carlson Gracie content editing

## Links and access

- Editor: https://carlson-gracie-nz.sanity.studio/
- Website: https://carlson-gracie-eight.vercel.app/
- Project: i27dttcu, dataset: production
- Owner invitation is deliberately deferred until Bradley confirms the email address. No invitation has been sent.

The dataset contains public website content and photos. Editing requires project membership. It is not a place for member records or private information.

## Using the editor

1. Sign in with an account that has access to this Sanity project.
2. Open Pages, choose a page, and expand the relevant section.
3. Edit the text or replace a photo. Add a useful photo description.
4. Click Publish. Draft changes stay off the website.
5. Reload the website after publishing. CDN caching can cause a short delay; the automatic rebuild also updates the saved HTML.

For events, open Events and create a document. Enter its name, summary, location, start/end dates and photo. Check the displayed timezone when entering New Zealand dates. Publish to show it on the site; unpublish to remove it. Completed events move into Past Events. If multiple upcoming events are featured, the earliest appears at the top.

## Editing boundaries

Existing copy and photos across 31 pages are grouped into fixed sections. This includes supported coach biographies, existing FAQ text, membership copy and academy pages. Search titles/descriptions are also editable.

Layouts, navigation, forms, link destinations, video, decorative/animated text and paragraphs with embedded formatting or links remain in source. New coach cards, FAQ rows and full news articles are not created by this initial integration. Repeated copy on separate pages is edited separately.

The timetable page, timetable sections and timetable modal are excluded. Gymdesk remains a separate future integration. Event dates do not control the weekly class timetable.

The release uses the existing live layout. Sixteen fields belonging to unpublished local layout edits were excluded; those edits remain in the working tree and can be connected when that layout is published.

## Content and publishing

The initial import includes 31 page documents and 56 existing photos, referenced in 145 image fields. Example events were not imported. Existing hand-authored historical event cards remain in the site.

The browser fetches published content from Sanity's CDN. Production builds also embed published page copy/photos and a real event snapshot. If requests fail, the last built content remains visible; configured builds fail on a Sanity fetch error instead of silently deploying stale content. Empty event collections remain empty during an outage, without reverting to demo events.

The Vercel deploy hook named Sanity content publish targets main. The Sanity webhook named Rebuild Carlson Gracie website handles published page/event creation, updates and deletion; drafts and version documents are excluded. The webhook URL is stored in the services, not in source. Website releases use GitHub main.

## Development

Run npm ci for website dependencies and npm ci --prefix studio for editor dependencies.

- npm run dev: website preview.
- npm run studio:dev: local editor.
- npm run test:cms: binding integrity, design preservation, timetable exclusion and safe rendering checks.
- npm run build / npm run studio:build: production builds.
- npm run studio:deploy: deploy the editing application.
- npm run cms:import: seed missing documents, with SANITY_API_TOKEN supplied only to the shell. Existing documents are never overwritten.

cms/config.js contains public identifiers only. Never put an API token in website code or VITE_ variables. The Studio has its own dependency manifest/lockfile and is hosted separately.

cms/manifest.json contains stable bindings to the HTML. cms/seed.ndjson contains initial content and imported photo references. Do not regenerate the manifest after import without a migration: replacing keys can disconnect edits. When source structure changes, update affected bindings and run the checks. Keep document IDs stable.

## Validation

Website and Studio builds pass. Schema validation reports zero errors and warnings. CMS checks cover all connected pages, escaped content, published queries and timetable exclusion. Browser checks cover mobile/desktop layouts, published copy, images, empty events, outage fallback and the timetable modal. Invitations and owner-specific sign-in remain deferred.

Compatible dependency patches removed high-severity Studio audit findings. Five moderate upstream CLI/UUID findings remain; no forced major dependency changes were applied.

Official references: [Studio setup](https://www.sanity.io/docs/studio/installation), [hosting](https://www.sanity.io/docs/studio/deployment), [webhooks](https://www.sanity.io/docs/http-reference/webhooks).
