# Product Intelligence Dashboard — Backend API

Backend for the **Product Intelligence Dashboard for E-commerce Sellers** (Quantacus intern assignment).

A Flipkart seller uploads a product video (or CSV), and the system simulates/extracts product
details, validates listing quality, generates enhanced titles, compares competitor prices, and
raises actionable alerts — all tracked through processing jobs.

> **Frontend repo:** https://github.com/SaxenaAarohi/Quantcus_frontend
> Real integrations (OCR / AI / scraping) are **simulated or mocked** with clear assumptions,
> as the assignment explicitly allows.

---

## Table of Contents
- [Tech Stack](#tech-stack)
- [How to Run Locally](#how-to-run-locally)
- [Environment Variables](#environment-variables)
- [Using the Deployed API](#using-the-deployed-api)
- [API Documentation](#api-documentation)
- [Data Model / Schema](#data-model--schema)
- [Validation & Alert Rules](#validation--alert-rules)
- [Sample Data](#sample-data)
- [What is Real vs Mocked](#what-is-real-vs-mocked)
- [Assumptions](#assumptions)
- [Trade-offs & Limitations](#trade-offs--limitations)
- [What I Would Improve With More Time](#what-i-would-improve-with-more-time)
- [Deployment Links](#deployment-links)

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Runtime | Node.js 18+ |
| Framework | Express.js |
| Database | MongoDB (Atlas) |
| ORM | Prisma |
| File uploads | Multer (local `/uploads`) |
| CSV parsing | Custom, dependency-free parser |
| Config / misc | dotenv, cors, nodemon (dev) |

No Next.js, Docker, Kafka, Redis or heavy infra — kept simple and reviewable.

---

## How to Run Locally

**Prerequisites:** Node.js 18+ and a MongoDB connection string. Prisma + MongoDB requires a
**replica set**, so a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster is easiest
(Atlas clusters are replica sets by default). For local Mongo, run `mongod --replSet rs0` and
`rs.initiate()` once.

```bash
cd server
npm install
cp .env.example .env          # then edit DATABASE_URL
npm run prisma:generate       # generate the Prisma client
npm run prisma:push           # push schema to MongoDB (creates collections + indexes)
npm run seed                  # optional: load sample products + prices + alerts + jobs
npm run dev                   # starts the API on http://localhost:5000
```

Verify it is up: open http://localhost:5000/health → `{"status":"ok"}`.

### npm scripts
| Script | Action |
|--------|--------|
| `npm run dev` | Start with nodemon (auto-reload) |
| `npm start` | Start once (`node src/index.js`) |
| `npm run prisma:generate` | `prisma generate` |
| `npm run prisma:push` | `prisma db push` |
| `npm run seed` | Load demo data (4 products, 2 alerts, 3 jobs) |

---

## Environment Variables

`server/.env` (see `.env.example`):

```
DATABASE_URL="mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<db>?retryWrites=true&w=majority"
PORT=5000
CLIENT_URL=http://localhost:5173
```

- `CLIENT_URL` is the CORS allow-list. It accepts a **comma-separated** list and ignores
  trailing slashes, e.g. `CLIENT_URL=https://your-frontend.vercel.app,http://localhost:5173`.
  Use `*` to allow all origins while testing.
- `PORT` is provided automatically by hosts like Render — no need to set it there.

---

## Using the Deployed API

Base URL: `https://<your-backend>.onrender.com/api`

Quick checks:
```bash
curl https://<your-backend>.onrender.com/health
curl https://<your-backend>.onrender.com/api/dashboard/summary
```

---

## API Documentation

Base path: `/api`

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/upload-video` | Upload video (form field `video`) + `enhanceTitle` flag. Creates a job and a blank **draft** product to complete. |
| POST | `/upload-products-csv` | Upload product CSV (form field `csv`). Validates each row; returns saved + failed rows. |
| GET  | `/jobs` | List all jobs. |
| GET  | `/jobs/:id` | Job status, progress, timestamps, error details. |
| GET  | `/products` | List products. Filters: `?severity=HIGH|MEDIUM|LOW`, `?category=`, `?alert=true`. |
| GET  | `/products/:skuId` | Product detail (issues, competitor prices, alerts). |
| PUT  | `/products/:skuId` | Manual edit; re-validates and recomputes the quality score. |
| GET  | `/products/:skuId/issues` | Listing issues for one product. |
| POST | `/products/:skuId/enhance-title` | Generate an enhanced title (original, keywords, enhanced, reason). |
| GET  | `/products/:skuId/competitor-prices` | Competitor prices + comparison stats. |
| POST | `/competitor-prices/upload` | Upload competitor price CSV (form field `csv`). |
| POST | `/competitor-prices/refresh` | Simulate/refresh prices (all, or `?skuId=`). Tracked as a job. |
| GET  | `/dashboard/summary` (alias `/dashboard/quality-summary`) | Dashboard aggregates. |
| GET  | `/alerts` | Alert history. Filter: `?severity=HIGH|MEDIUM|LOW`. |
| GET  | `/` and `/health` | Health checks. |

### Example responses

`GET /api/dashboard/summary`
```json
{
  "totalProducts": 4,
  "issuesBySeverity": { "HIGH": 3, "MEDIUM": 4, "LOW": 2 },
  "missingImageCount": 0,
  "invalidPriceCount": 0,
  "weakListings": 3,
  "avgQualityScore": 69,
  "totalAlerts": 2,
  "alertsBySeverity": { "HIGH": 1, "MEDIUM": 1, "LOW": 0 },
  "totalIssues": 9
}
```

`POST /api/upload-video` →
```json
{
  "jobId": "…",
  "jobStatus": "COMPLETED",
  "draft": true,
  "product": { "skuId": "DRAFT-123456", "title": "", "...": "" },
  "issues": [ /* … */ ],
  "qualityScore": 0,
  "note": "Draft listing created from \"clip.mp4\". Add the product details to complete it."
}
```

---

## Data Model / Schema

Prisma models (MongoDB). Full schema in `prisma/schema.prisma`.

| Model | Key fields | Relations |
|-------|-----------|-----------|
| **Job** | `type` (VIDEO_PROCESSING / CSV_VALIDATION / PRICE_REFRESH), `status`, `progress`, `message`, `errorDetails`, `startedAt`, `completedAt` | has many Products |
| **Product** | `skuId` (unique), listing fields (title, brand, category, price, mrp, imageUrl, color, size, material, availability…), `source`, `qualityScore`, `enhancedTitle`, `suggestedKeywords`, `enhancedTitleReason` | belongs to Job; has many Issues, CompetitorPrices, Alerts |
| **ProductIssue** | `issueType`, `severity`, `message`, `suggestedFix` | belongs to Product |
| **CompetitorPrice** | `platform`, `competitorPrice`, `currency`, `competitorUrl`, `lastCheckedAt` | belongs to Product |
| **Alert** | `alertType`, `severity`, `message`, `status` | belongs to Product |

**Relationships:** a `Job` has many `Product`s; a `Product` has many `ProductIssue`s,
`CompetitorPrice`s, and `Alert`s.

---

## Validation & Alert Rules

**Validation issues** (`src/services/validationService.js`):

| Issue | Severity |
|-------|----------|
| Missing title, Invalid price, MRP < price, Missing image, Duplicate SKU | HIGH |
| Weak title, Missing brand, Broken image URL, Missing attributes | MEDIUM |
| Weak description, Out of stock | LOW |

**Quality score** = `100 − (HIGH×25 + MEDIUM×12 + LOW×5)`, floored at 0.

**Alert rules** (`src/services/alertService.js` + price refresh):
- **HIGH:** missing title / invalid price; Flipkart price >10% above the lowest competitor.
- **MEDIUM:** weak title / missing attributes; competitor price drops >15% on refresh.
- **LOW:** weak description / out of stock.

---

## Sample Data

In `server/sample-data/`:
- `sample-products.csv` — intentional edge cases (missing title/brand, negative price,
  MRP < price, broken image URL, duplicate SKU) to demonstrate validation.
- `single-product.csv` — one clean product for a happy-path import test.
- `sample-competitor-prices.csv` — competitor prices across Amazon / Myntra / Ajio / etc.

For the video flow, **any small video file works** — extraction is simulated, so the file
content does not matter; it produces a blank draft to complete.

---

## What is Real vs Mocked

| Capability | Status |
|------------|--------|
| Video upload & storage | **Real** (Multer → local `/uploads`) |
| Product extraction from video | **Mocked** — creates a labelled blank **draft** product to complete manually (no OCR/AI) |
| CSV parsing & validation | **Real** (custom parser + rule engine) |
| Title enhancement | **Real but rule-based** (brand + color + trending keyword; no AI) |
| Competitor prices | **Mocked** (generated around our price) or **real** via CSV upload |
| Price comparison & recommendation | **Real** logic |
| Alerts | **Real**, in-app only (no email/Slack/etc.) |
| Job tracking | **Real** (DB-backed status + progress + timestamps) |

---

## Assumptions

- We sell on **Flipkart**; competitors are other marketplaces.
- No website scraping (per the assignment) — competitor data is mocked or CSV-uploaded.
- `sku_id` is the unique product key; re-uploading the same SKU **upserts** the product.
- A video upload produces a **blank draft** (rather than fabricated data) so behavior is
  predictable; the seller fills in details via the product edit page or a CSV.
- A "weak" title is `< 15` characters or `< 3` words; a "weak" description is `< 30` characters.
- Jobs complete quickly but are still modeled with status/progress to match the spec.

---

## Trade-offs & Limitations

- **No real OCR/AI** — extraction is mocked; the focus is the end-to-end product flow.
- **Uploads are ephemeral on most hosts** (e.g. Render wipes the disk on redeploy). Fine here
  because files are processed immediately and not relied on afterwards.
- **No authentication** — single-seller demo; all data is shared.
- **In-memory CSV parsing** — suitable for demo-sized files, not huge feeds.
- Competitor prices use `Math.random()` around our price, so refreshes vary between runs.

---

## What I Would Improve With More Time

- Real frame extraction (ffmpeg) + OCR (Tesseract) or an LLM vision API for true extraction.
- Real notifications (email / Slack / Telegram) and a scheduled price-refresh cron.
- Persisted competitor **price-history** chart over time.
- Authentication and per-seller data isolation.
- Retry failed jobs and a real background queue for large CSV feeds.
- OpenAPI/Swagger documentation.

---

## Deployment Links

- **Backend (this repo):** `https://<your-backend>.onrender.com`  _(update after deploy)_
- **Frontend:** `https://<your-frontend>.vercel.app`  _(update after deploy)_

### Deploying on Render (summary)
1. Allow Atlas access from anywhere (Network Access → `0.0.0.0/0`).
2. New Web Service → connect this repo → Build: `npm install && npx prisma generate`,
   Start: `npm start`.
3. Env vars: `DATABASE_URL`, `CLIENT_URL` (your frontend origin). Do **not** set `PORT`.
4. After first deploy, in the Render Shell run `npx prisma db push` and `npm run seed`.
