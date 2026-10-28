# OrderlyPOS admin and kiosk

This repository is the signed-in app and the guest kiosk. Host it on Vercel.

Set these before the Vercel build:

- `BACKEND_URL` — `https://orderlypos-backend.onrender.com`, with no trailing slash. Next bakes this into the API proxy at build time. `vercel.json` already sets it.
- `NEXT_PUBLIC_WEBSITE_URL` — the public website on Vercel. Marketing links go there.

The API and the Neon database live in the backend repository.
