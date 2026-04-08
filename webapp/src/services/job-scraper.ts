import type {Job, JobSearchResponse} from '../types/job';

const PROXY_BASE = import.meta.env.VITE_PROXY_URL || 'http://localhost:8787';
const SEARCH_API = 'job-search-api.jobs.ch/search/semantic';
const DETAIL_BASE = 'www.jobs.ch/de/stellenangebote/detail';
const RATE_LIMIT_MS = 1000;

export interface SearchParams {
  query: string;
  rows?: number;
  page?: number;
}

export async function searchJobs(params: SearchParams): Promise<JobSearchResponse> {
  const { query, rows = 20, page = 1 } = params;
  const url = `${PROXY_BASE}/proxy/${SEARCH_API}?query=${encodeURIComponent(query)}&rows=${rows}&page=${page}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Search API error: ${res.status}`);
  }

  return res.json();
}

export async function searchAllPages(
  params: SearchParams,
  maxPages: number = 5,
  onProgress?: (loaded: number, total: number) => void,
): Promise<Job[]> {
  const firstPage = await searchJobs({ ...params, page: 1 });
  const allJobs = [...firstPage.documents];
  const totalPages = Math.min(firstPage.numPages, maxPages);

  onProgress?.(1, totalPages);

  for (let page = 2; page <= totalPages; page++) {
    await sleep(RATE_LIMIT_MS);
    const result = await searchJobs({ ...params, page });
    allJobs.push(...result.documents);
    onProgress?.(page, totalPages);
  }

  return allJobs;
}

export async function fetchJobDescription(jobId: string): Promise<string | null> {
  const url = `${PROXY_BASE}/proxy/${DETAIL_BASE}/${jobId}/`;

  const res = await fetch(url);
  if (!res.ok) return null;

  const html = await res.text();
  return extractJsonLdDescription(html);
}

export function extractJsonLdDescription(html: string): string | null {
  const regex = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
  let match;

  while ((match = regex.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(match[1]);
      // JSON-LD can be a single object or an array of objects
      const items = Array.isArray(parsed) ? parsed : [parsed];
      for (const data of items) {
        if (data['@type'] === 'JobPosting' && data.description) {
          return data.description.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        }
      }
    } catch {

    }
  }

  return null;
}

const CONCURRENCY = 5;

export async function enrichJobsWithDescriptions(
  jobs: Job[],
  maxJobs: number = 50,
  onProgress?: (loaded: number, total: number) => void,
): Promise<Job[]> {
  const toEnrich = [...jobs.slice(0, maxJobs)];
  const total = toEnrich.length;
  let completed = 0;

  // Process in parallel batches of CONCURRENCY
  for (let i = 0; i < total; i += CONCURRENCY) {
    const batch = toEnrich.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      batch.map((job) => fetchJobDescription(job.id)),
    );

    for (let j = 0; j < batch.length; j++) {
      if (results[j]) {
        toEnrich[i + j] = { ...toEnrich[i + j], description: results[j]! };
      }
    }

    completed += batch.length;
    onProgress?.(completed, total);

    // Small delay between batches to be respectful
    if (i + CONCURRENCY < total) {
      await sleep(300);
    }
  }

  return [...toEnrich, ...jobs.slice(maxJobs)];
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
