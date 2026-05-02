# Frontend (Next.js 14)

App-router Next.js app. Talks to the Go backend at `NEXT_PUBLIC_API_URL`.

## Run

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open http://localhost:3000.

## Mental model

Tenants don't build agents. There's one platform agent the SaaS owns. Tenants only:

1. Upload **knowledge** (files → embedded chunks)
2. Connect a **channel** (Facebook page, LINE channel)
3. Optionally test in the embedded playground on the dashboard

So the UI is intentionally narrow — no model picker, no temperature slider, no system prompt textarea.

## Pages

| Route               | What it does                                                                 |
| ------------------- | ---------------------------------------------------------------------------- |
| `/`                 | Landing                                                                      |
| `/register`         | Creates tenant + owner user, stores JWT in `localStorage`                    |
| `/login`            | Same JWT flow                                                                |
| `/dashboard`        | Three stat cards (Knowledge / Channels / Status) + embedded `<Playground />` |
| `/knowledge`        | List + create knowledge bases                                                |
| `/knowledge/[id]`   | File upload (PDF / TXT / MD / CSV), file list, delete                        |
| `/channels`         | Connect / disconnect Facebook page and LINE channel via pasted credentials   |

The old `/agents/new` and `/agents/[id]` routes have been replaced with `redirect()` stubs that send users to `/knowledge` or `/dashboard` — they exist only because the dev sandbox couldn't delete the files.

## Components

- `src/components/Playground.tsx` — chat playground that calls `POST /api/v1/playground/chat`. No `agentId` prop; the agent is the platform.
- `src/lib/api.ts` — typed fetch client. Exposes `api.knowledge.*`, `api.channels.*`, `api.playground.*`. The old `api.agents` and `api.chat` are gone.

## What's stubbed (next pages to build)

- `/inbox` — multi-channel chat inbox with a "Take over" button that flips `is_human_handling` on the conversation
- Auth context + protected layout (each protected page currently checks the token in `useEffect`)
- KB attachment UI on the channels page (right now, every tenant's channel uses every KB the tenant owns; a per-channel KB selector would be the next iteration)
- Token rotation flows (re-paste new FB/LINE tokens without first disconnecting)
