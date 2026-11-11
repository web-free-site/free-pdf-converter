# Free PDF Converter

Client-side PDF toolkit for **Gentil M.** (Kigali, Rwanda), based on [BentoPDF](https://github.com/alam00000/bentopdf) (AGPL-3.0). Files are processed in your browser; nothing is uploaded.

## Local development

```bash
npm ci
cp .env.production .env.local   # optional: edit SITE_URL for local SEO
npm run dev -- --port 4319 --host 127.0.0.1
```

## Production build

```bash
npm run build:site
npm run preview -- --port 4319 --host 127.0.0.1
```

`build:site` loads `.env.production`, runs the full static build, and applies Free PDF Converter branding.

## Deploy to Cloudflare Workers

Worker name: `free-pdf-converter` (account `9b2252baefadd95947f73bc833b3234f`).

1. Add a Cloudflare API token to your environment as `CLOUDFLARE_API_TOKEN` (Workers Scripts Edit + Account Read).
2. Set `SITE_URL` in `.env.production` to your live URL (e.g. `https://free-pdf-converter.<subdomain>.workers.dev`), then rebuild.
3. Deploy:

```bash
npm run deploy
```

## Adsterra

Paste Adsterra tags into **`public/ads.json`**, then run `npm run deploy` (or `npm run build:site` + `wrangler deploy`).

| Key             | Placement                           |
| --------------- | ----------------------------------- |
| `banner728x90`  | Header (all pages)                  |
| `banner300x250` | Between tool UI and FAQ             |
| `banner160x600` | Desktop sidebar (tool pages)        |
| `banner320x50`  | Mobile sticky footer                |
| `nativeBanner`  | Below download / results area       |
| `socialBar`     | Site-wide (injected at end of body) |
| `popunder`      | Once per session                    |
| `banner468x60`  | Reserved in config (optional slot)  |

Empty values keep reserved space but render no ad.

## License

This project is AGPL-3.0. See [LICENSE](LICENSE). You must keep source available and attribute BentoPDF.
