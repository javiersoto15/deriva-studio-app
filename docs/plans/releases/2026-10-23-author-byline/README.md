# Author byline restoration release evidence

This release restores the previously approved menu-item author byline in the exact production source tree identified by Vercel deployment `dpl_CAVCit6C8astHC2ksF9GzjDpVv5M`. The unified patch is based on that deployment source: `CartaBody.tsx` was fetched from the deployment, while the CSS and generated API schema originals were independently verified against the deployment SHA1s.

The source hash manifest records 355 unchanged deployed source files, three author-only edits to deployed files, three new author-restoration files, and no unexpected mismatches or extras. The SSR integration test is also preserved at `tests/menu/carta-author-render.test.tsx`.

Validation on the isolated release source passed: `npm run test:menu` (56/56), `npm run typecheck`, and `npm run build`.

The release was staged and promoted as Vercel deployment `dpl_Fm5dVQpDAfWdHkFj7Y1Pm915CWqn`. The staged deployment returned HTTP 200 for `/` and `/menu`; its server-rendered menu contained three Maria bylines and one Benja byline. After promotion, `derivastudio.cl` resolved to that deployment and `/` and `/menu` returned HTTP 200 with no application-error markers. The Vercel error-log query returned no errors.
