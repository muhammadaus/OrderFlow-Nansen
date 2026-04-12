# OrderFlow Nansen

Lightweight React + Vite frontend aligned to the documented Nansen `v1 tgm/flow-intelligence` API.

## Product direction

The active frontend now focuses on one Nansen-native information category:

- segment-level token flow intelligence for a selected token
- exact `v1 tgm/flow-intelligence` response fields
- Vercel serverless proxy for `POST /api/v1/tgm/flow-intelligence`
- schema-compatible mock fallback when live access is unavailable

## Current app shape

- Single-screen flow intelligence surface
- Exact Nansen-compatible segment flow fields
- Raw API response inspector
- Vercel API route at `api/nansen/flow-intelligence.js`

## Quick start

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
npm run preview
```

## Nansen setup

```bash
NANSEN_API_KEY=your_key npm run dev
```

For Vercel:

- set `NANSEN_API_KEY`
- optionally set `NANSEN_MOCK_FALLBACK=1` to force schema-compatible mock data
- optionally set `VITE_NANSEN_DEMO=1` for frontend-only demo mode

## Stack

- React 18
- Vite 5
- Tailwind CSS
- Vercel Functions
- Native `fetch` for HTTP requests

## License

MIT
