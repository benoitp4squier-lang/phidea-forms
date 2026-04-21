# phidea-forms

Tiny Vercel project with a single function that receives form POSTs from
`phidea.eu` (static site on GitHub Pages) and creates a Contact in Lightfield.

## Why a proxy

Lightfield's API requires a Bearer token (`sk_lf_...`) on every write and does
not expose a public webhook or unauthenticated form-capture endpoint. The key
cannot live in browser HTML. This proxy holds the key server-side.

## Endpoint

`POST /api/lead` — accepts `application/x-www-form-urlencoded`.

Recognized fields: `email`, `carrier`, `lob`, `variant`.

On success → `303` redirect to `https://phidea.eu/merci.html`.
On Lightfield error or missing API key → `303` redirect to `https://phidea.eu/oops.html`.

## Env vars

- `LIGHTFIELD_API_KEY` — required. Set on Vercel via `vercel env add`.

## Deploy

```bash
vercel link        # once
vercel deploy --prod
```
