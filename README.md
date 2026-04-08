# JobLens

AI-powered job matching for Switzerland. Upload your LinkedIn profile, and JobLens scores hundreds of real job postings against your skills using the LLM of your choice.

**Everything runs in your browser.** Your API keys and profile data never touch a server -- you bring your own key (BYOK), and all processing happens client-side.

## Features

- **LinkedIn PDF parsing** -- drag-and-drop your LinkedIn export, and an LLM extracts a structured profile (skills, experience, languages, education)
- **jobs.ch integration** -- searches Switzerland's largest job board via its semantic search API and scrapes full job descriptions
- **LLM-powered scoring** -- each job is scored 0-100 based on skill match (40%), experience level (25%), domain fit (20%), and language fit (15%)
- **Multi-provider support** -- works with OpenAI (GPT-4o), Anthropic (Claude Sonnet), or Google Gemini
- **Filtering & sorting** -- filter by minimum score, sort by match score, date, distance, or company
- **Distance calculation** -- shows how far each job is from your city (Haversine formula, 24 Swiss cities)
- **Privacy-first** -- no backend, no database, no tracking. API keys are stored only in your browser's localStorage

## Getting Started

### Prerequisites

- Node.js 18+
- An API key from [OpenAI](https://platform.openai.com/), [Anthropic](https://console.anthropic.com/), or [Google AI Studio](https://aistudio.google.com/)

### Run locally

```bash
# 1. Start the CORS proxy
cd worker
npm install
npm run dev          # runs on http://localhost:8787

# 2. Start the webapp (in a second terminal)
cd webapp
npm install
npm run dev          # runs on http://localhost:5173
```

Open http://localhost:5173 and follow the 4-step wizard.

### Deploy

- **Webapp**: deploy the `webapp/` directory to Vercel, Netlify, or GitHub Pages (`npm run build` produces a static `dist/` folder)
- **Proxy**: deploy the worker to Cloudflare (`cd worker && npm run deploy`), then set `VITE_PROXY_URL` to your worker URL before building the webapp

## How It Works

1. **Settings** -- pick your LLM provider and enter your API key
2. **Profile** -- upload your LinkedIn PDF; text is extracted client-side with pdf.js, then an LLM structures it into JSON
3. **Search** -- enter keywords (pre-filled from your profile title); JobLens fetches up to 2000 jobs from jobs.ch, enriches the top 50 with full descriptions, and batch-scores them with your LLM
4. **Results** -- browse scored jobs with color-coded match scores, matching/missing skills, and direct links to job postings

## Architecture

```
                        +-----------------------+
                        |    User's Browser     |
                        |                       |
                        |  React SPA (Vite)     |
                        |  - PDF parsing        |
                        |  - LLM calls          |
                        |  - Job scoring         |
                        |  - Zustand state      |
                        +----------+------------+
                                   |
                          All requests via
                          /proxy/<host>/...
                                   |
                        +----------v------------+
                        |  Cloudflare Worker    |
                        |  (CORS Proxy)         |
                        |                       |
                        |  - Stateless          |
                        |  - No storage/logging |
                        |  - Host whitelist     |
                        +----+------+-------+---+
                             |      |       |
               +-------------+  +---+---+  +------------+
               |                |       |               |
        +------v------+  +-----v-----+ |  +------------v---+
        |  LLM APIs   |  | jobs.ch   | |  | jobs.ch        |
        |             |  | Search API| |  | Detail Pages   |
        | - OpenAI    |  +-----------+ |  | (JSON-LD)      |
        | - Anthropic |                |  +----------------+
        | - Gemini    |                |
        +-------------+                |
                                       |
                              +--------v--------+
                              | review-api      |
                              | .jobs.ch        |
                              +-----------------+
```

### Webapp (`webapp/`)

| Directory | Purpose |
|-----------|---------|
| `src/components/` | 4 step components (`Settings`, `ProfileUpload`, `JobSearch`, `JobResults`) + `JobCard` |
| `src/services/` | Core logic: `llm-client` (multi-provider LLM wrapper), `job-scraper` (jobs.ch API + HTML scraping), `job-scorer` (batch scoring), `pdf-parser` (pdf.js text extraction), `geo` (distance calc) |
| `src/prompts/` | LLM prompt templates for profile extraction and job scoring |
| `src/store/` | Zustand store with localStorage persistence (API key, profile, search params) |
| `src/types/` | TypeScript interfaces for `Job`, `ScoredJob`, `UserProfile`, etc. |

### CORS Proxy (`worker/`)

A ~70-line Cloudflare Worker that transparently forwards requests to whitelisted hosts. It exists solely to bypass browser CORS restrictions. It does not store, log, or transform any data. Allowed hosts:

- `api.openai.com`, `api.anthropic.com`, `generativelanguage.googleapis.com` (LLM providers)
- `job-search-api.jobs.ch`, `www.jobs.ch`, `review-api.jobs.ch` (job data)

### Data Flow

1. **PDF upload** -- `pdf-parser.ts` extracts raw text using pdf.js (entirely client-side)
2. **Profile extraction** -- `llm-client.ts` sends text to chosen LLM with a structured extraction prompt; returns `UserProfile` JSON
3. **Job search** -- `job-scraper.ts` calls jobs.ch semantic search API (paginated, up to 20 pages of 100 jobs). For the top 50 results, it fetches detail pages and extracts descriptions from JSON-LD markup
4. **Distance enrichment** -- `geo.ts` calculates Haversine distance from the user's city to each job's coordinates
5. **Scoring** -- `job-scorer.ts` batches 20 jobs per LLM call (3 concurrent batches), scoring each job 0-100 with matching/missing skills
6. **Display** -- `JobResults.tsx` renders sorted/filtered results with `JobCard` components

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite |
| Styling | Tailwind CSS |
| State | Zustand (with localStorage persistence) |
| PDF parsing | pdfjs-dist (client-side) |
| CORS proxy | Cloudflare Workers |
| LLM providers | OpenAI, Anthropic, Google Gemini |
| Job data | jobs.ch (search API + HTML scraping) |
| Testing | Vitest |

## Development

```bash
npm run dev          # start dev server (webapp or worker)
npm run build        # type-check + production build (webapp)
npm run test         # run tests (webapp)
npm run test:watch   # run tests in watch mode (webapp)
npm run lint         # ESLint (webapp)
npm run deploy       # deploy to Cloudflare (worker)
```

## License

[MIT](LICENSE)
