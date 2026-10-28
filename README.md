# OrderlyPOS admin and kiosk

This repository is the signed-in app and the guest kiosk. Host it on Vercel.

Set these before the Vercel build:

- `BACKEND_URL` — `https://orderlypos-backend.onrender.com`, with no trailing slash. Next bakes this into the API proxy at build time. `vercel.json` already sets it.
- `NEXT_PUBLIC_WEBSITE_URL` — `https://orderlypos-eight.vercel.app`. Marketing links go there. `vercel.json` already sets it.
- `NEXT_PUBLIC_SITE_URL` — `https://orderlypos-ui.vercel.app`

The API and the Neon database live in the backend repository.

Open these on the admin host, not on the public website:

- Kiosk: `https://orderlypos-ui.vercel.app/kiosk/<token>`
- Guest phone page: `https://orderlypos-ui.vercel.app/guest/<token>`
- Customer display: `https://orderlypos-ui.vercel.app/customer-display`

Settings shows the kiosk and guest addresses after the kiosk is enabled. The till page opens the customer display. Both use this site’s origin, so they keep working when the page is served from `https://orderlypos-ui.vercel.app`.
