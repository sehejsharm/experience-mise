# Mise — experiential site

Static single page (plain HTML/CSS/JS, no build). Deploy as-is on Vercel or Cloudflare Pages (framework: none, output dir: `/`).

- Screenshot journey: edit `journey-data.js` only. `src: null` shows a "Coming soon" placeholder; a missing file shows "Screenshot pending".
- Images go in `public/screens/` (filenames provisional — see `journey-data.js`).
- Contact button: set `MISE_CONTACT_HREF` in `journey-data.js`.
- Local preview: `python3 -m http.server` then open http://localhost:8000
