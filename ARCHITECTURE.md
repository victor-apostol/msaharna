# Architecture

Monorepo (Bun workspaces) for the Mănăstirea Saharna site. Two apps live under `apps/`:

```
manastirea-saharna/
├── apps/
│   ├── client/   # public static site
│   └── cms/      # content management backend
└── package.json  # workspace root
```

## `apps/client`

Public-facing static site.

- **Stack:** Astro (static output, `output: "static"`) + Qwik islands (`@qwikdev/astro`) + Tailwind v4.
- **i18n:** `astro-i18n-aut` with three locales — `ro` (default), `en`, `ru`. Translations live in `src/i18n/index.ts`; the request locale is resolved in `src/middleware.ts` and exposed on `context.locals.lang`.
- **Forms:** one contact form — visitor enters their email + message, the monastery receives it as a regular email with the visitor's address in `Reply-To` so hitting "Reply" returns directly to them. Submission flow lives in a Cloudflare Worker, not on the site itself (see [Contact form](#contact-form)).
- **Build:** `bun run build:client` produces `apps/client/dist/`, deployed as static assets.

## `apps/cms`

Backend for editors to create and manage posts. Currently scaffolded (empty) — planned stack is **Payload CMS** (Node + TypeScript, self-hosted), chosen for its extensibility: custom collections, fields, hooks, and access control are all just code.

- Stores post content + media (Payload + a database — Postgres or MongoDB — and a media adapter, e.g. local disk or S3-compatible storage).
- Exposes the Payload admin UI for editors and an auto-generated REST/GraphQL API.
- On publish (`afterChange` hook on the relevant collections), fires a GitHub `repository_dispatch` to kick off the client redeploy workflow.
- Single-user (one editor), low-traffic admin — sizing decisions can assume "cold most of the time, occasional bursts when publishing."

## Hosting & cost

Goal: **zero recurring runtime cost.** Everything lives on free tiers.

| Piece               | Service                                                                         | Why                                                                                 |
| ------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Static client       | **GitHub Pages**                                                                | Free, unlimited for public repos; deploys straight from CI.                         |
| Image / media       | **Cloudflare R2** bucket                                                        | Free egress, generous free storage; S3-compatible API for Payload's media adapter.  |
| Database            | **Neon** (Postgres) — or Railway / similar free tier                            | Neon free tier scales to zero; fine for a single-editor CMS.                        |
| CMS runtime         | Any free Node host (Railway, Render, Fly.io free app, Payload Cloud free, etc.) | Only needs to be reachable when the one editor logs in; cold starts are acceptable. |
| Form handler        | **Cloudflare Worker**                                                           | Free 100 k req/day; decouples the contact form from CMS uptime.                     |
| Transactional email | **Resend** free tier (3 k/mo, 100/day) — fallback Brevo (300/day)               | Worker calls Resend's API to forward the form to the monastery inbox.               |
| Build / deploy      | **GitHub Actions**                                                              | Free CI minutes on public repos cover the occasional rebuild.                       |

Constraints this places on design choices:

- The CMS host **may sleep** between sessions — the editor flow must tolerate cold starts; the public site never depends on it being up.
- Media URLs must be **public R2 URLs** baked into the static build, so the live site doesn't proxy through the CMS.
- DB choice should support **scale-to-zero / generous free tier**; Neon is the default pick, but the schema stays portable (vanilla Postgres) so we can swap hosts without code changes.

## Contact form

The site has one public form. The visitor types their email and a message; a Cloudflare Worker sends **one** email to the monastery's inbox, authenticated against our own domain (`manastirea-saharna.md`) via Resend. **After that, our system is out of the loop** — the monastery hits "Reply" in their normal mail client (Gmail, Outlook, whatever they use) and the thread continues directly between them and the visitor. We never see the reply.

```
visitor (types email + message)
        │
        ▼
  Cloudflare Worker  ── Turnstile + honeypot check
        │
        ▼
   Resend            ── From:     noreply@manastirea-saharna.md
        │                Reply-To: <visitor email>
        │                To:       <monastery inbox>
        ▼
  monastery inbox    ── monastery hits "Reply"
                          │
                          ▼
                    rest of the conversation lives in normal email,
                    end-to-end between the monastery and the visitor.
                    Our infrastructure is no longer involved.
```

- **"Our email server" = our domain on Resend.** Resend is the SMTP infrastructure, but `From:` and the DKIM/SPF authority both live on `manastirea-saharna.md`. To the recipient it's just a regular email from our domain.
- **Worker, not the Payload server** — the form must work even when the CMS host is asleep, and the Resend API key stays off the static site.
- **Anti-spam** — Cloudflare Turnstile + a hidden honeypot, both verified server-side in the Worker before any email is sent.
- **One-time setup** — verify the sending domain in Resend (DNS: SPF + DKIM records).
- **No storage** — the email is the only record. The Worker doesn't persist submissions and the Payload database is not involved.

Implementation lives in:

- `apps/client/src/components/PrayerRequestForm.astro` — static form markup, Turnstile widget, and POST target.
- `workers/pomelnic/src/index.ts` — Cloudflare Worker validation + Resend delivery.
- `.github/workflows/deploy-worker.yml` — CI deploy to Cloudflare Workers.

Runtime configuration:

- GitHub Actions repository variables for the static client build:
  - `PUBLIC_POMELNIC_WORKER_URL`
  - `PUBLIC_TURNSTILE_SITE_KEY`
  - `PAYLOAD_API_URL` (optional; CI falls back to the Render URL currently in use)
- GitHub Actions repository secrets for Worker deployment:
  - `CLOUDFLARE_API_TOKEN`
  - `CLOUDFLARE_ACCOUNT_ID`
- Cloudflare Worker secrets:
  - `RESEND_API_KEY`
  - `TURNSTILE_SECRET_KEY`
- Cloudflare Worker vars in `workers/pomelnic/wrangler.jsonc`:
  - `ALLOWED_ORIGIN`
  - `POMELNIC_TO`
  - `RESEND_FROM`
  - `SITE_URL`

## Email sending

The Worker sends mail through an HTTP-based provider — Cloudflare Workers can't open outbound SMTP connections, so SMTP libraries are off the table. Free tiers that actually exist in 2026:

| Service        | Free tier               | Send from our domain | Notes                        |
| -------------- | ----------------------- | -------------------- | ---------------------------- |
| **Resend**     | 3 k / mo, 100 / day     | yes (SPF + DKIM)     | Default pick — cleanest API. |
| **Brevo**      | 300 / day forever       | yes (SPF + DKIM)     | Documented fallback.         |
| **MailerSend** | 3 k / mo                | yes (SPF + DKIM)     | Similar profile to Resend.   |
| MailChannels   | ~~free for CF Workers~~ | —                    | Killed mid-2024. Skip.       |

- **Volume reality:** a monastery contact form sees maybe 5–50 submissions/month — the free-tier limits give 2–3 orders of magnitude headroom. The realistic risk is **provider deprecation** (as MailChannels showed), not volume.
- **Swap cost is contained:** the Worker is the only piece that knows the provider. Migrating off Resend = change the HTTP endpoint + JSON body shape, ~30 lines. The static site and the CMS are unaffected.
- **One-time DNS:** add 2–3 TXT records (SPF, DKIM, optionally DMARC) for `manastirea-saharna.md`. Resend/Brevo give the exact values. Without this, mail lands in spam or gets refused. DNS lives in Cloudflare alongside R2 — already set up.
- **Escape hatch:** if running a Worker ever feels like too much, **Web3Forms** or **Formsubmit.co** absorb the whole form-to-email pipeline for free (POST the form, they email you). Trade-off: `From:` becomes their domain; `Reply-To` still works so the conversation flow is identical. Strictly less control, strictly less infra.

## Build & deploy flow

```
editor ──▶ Payload admin ──▶ (publish hook) ──▶ repository_dispatch
                                                       │
                                                       ▼
                                              GitHub Actions ──▶ build client ──▶ deploy static site
                                                       ▲
                                                       └── also runs on push to main
```

- Content changes never hit the live site directly; every publish is a full static rebuild.
- The client has no runtime dependency on the CMS — at request time it serves pre-rendered HTML only.

## Conventions

- TypeScript everywhere; shared lint/format config at the repo root (`eslint.config.mjs`, `prettier.config.mjs`).
- Path aliases in `apps/client`: `@i18n`, `@layouts`, `@utils`, `@components`.
- Runtime pinned via `.tool-versions` (Bun 1.2.19, Node LTS).
