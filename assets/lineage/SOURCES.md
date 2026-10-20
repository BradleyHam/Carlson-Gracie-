# Lineage portraits

The order and spelling were supplied by José Gomes on 20 October 2026:
Carlos Gracie → Carlson Gracie → Alexandre Penão → Rogério Leite → José Gomes → You.

- `alexandre-penao.jpg`: supplied `WhatsApp Image 2026-10-20 at 10.41.33.jpeg`.
- `rogerio-leite.jpg`: supplied `2.jpeg`; crop excludes the screenshot overlay.
- `jose-gomes.jpg`: existing academy portrait `assets/coach-jose.jpg`.
- `carlos-gracie.jpg`: historical portrait from [Bayside Jiu Jitsu](https://www.baysidewarrior.com/our-history), https://images.squarespace-cdn.com/content/v1/63b8763c3704a52e93d1eee1/d28b0f1a-f886-4213-b9ec-56761bf18db7/carlos_gracie.jpeg
- `carlson-gracie.jpg`: historical portrait from [Elite Sports](https://www.elitesports.com/blogs/news/all-you-need-to-know-about-ibjjf-hall-of-fame-award), https://cdn.shopify.com/s/files/1/0030/3742/9849/files/3.6_Carlson_Gracie.jpg?v=1686584814

## CMS bindings

The lineage section keeps its section key and gains named `lineage-name-*` and
`lineage-photo-*` bindings in the manifest and seed. The three legacy placeholder
name keys are retired, so old published placeholders cannot overwrite José’s
confirmed sequence during a build or browser refresh. Existing section copy and
its original image binding are unchanged. Existing Sanity documents need the
new fields merged at release; `cms:import` does not modify existing documents.

The homepage lineage description also uses a new `home-confirmed-lineage` key,
so its former direct Carlson Gracie Jr attribution cannot overwrite this copy.
