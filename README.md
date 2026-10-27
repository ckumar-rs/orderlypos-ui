# OrderlyPOS admin and kiosk

This repository is the signed-in app and the guest kiosk. Host it on Vercel.

Set these before the Vercel build:

- `BACKEND_URL` — the Render API origin, with no trailing slash. Next bakes this into the API proxy at build time.
- `NEXT_PUBLIC_WEBSITE_URL` — the public website on Vercel. Marketing links go there.

The API and the Neon database live in the backend repository.
