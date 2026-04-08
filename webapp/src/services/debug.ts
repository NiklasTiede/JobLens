/**
 * Debug utilities for capturing and replaying pipeline data.
 *
 * Usage in browser console:
 *   - After a run: copy(window.__JOBLENS_DEBUG__) → paste into testdata/
 *   - To inspect what the LLM actually received: window.__JOBLENS_DEBUG__.scoringRequests
 */

export interface DebugSnapshot {
  timestamp: string;
  // Stage 1: Profile
  pdfText: string | null;
  extractedProfile: unknown | null;
  // Stage 2: Search
  searchQuery: string | null;
  rawJobs: unknown[] | null;
  // Stage 3: Descriptions
  jobsWithDescriptions: unknown[] | null;
  // Stage 4: Scoring
  scoringRequests: { systemPrompt: string; userMessage: string; response: string }[];
  scoredJobs: unknown[] | null;
}

const snapshot: DebugSnapshot = {
  timestamp: '',
  pdfText: null,
  extractedProfile: null,
  searchQuery: null,
  rawJobs: null,
  jobsWithDescriptions: null,
  scoringRequests: [],
  scoredJobs: null,
};

export function debugCapture<K extends keyof DebugSnapshot>(key: K, value: DebugSnapshot[K]) {
  snapshot[key] = value;
  snapshot.timestamp = new Date().toISOString();
  // Expose on window for easy browser console access
  (window as unknown as Record<string, unknown>).__JOBLENS_DEBUG__ = snapshot;
}

export function debugCaptureScoringRequest(systemPrompt: string, userMessage: string, response: string) {
  snapshot.scoringRequests.push({ systemPrompt, userMessage, response });
  (window as unknown as Record<string, unknown>).__JOBLENS_DEBUG__ = snapshot;
}

export function getDebugSnapshot(): DebugSnapshot {
  return structuredClone(snapshot);
}

/**
 * Download the full debug snapshot as a JSON file.
 * Call from browser console: window.__JOBLENS_DOWNLOAD__()
 */
export function downloadSnapshot() {
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `joblens-debug-${new Date().toISOString().slice(0, 19)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// Expose download function globally
(window as unknown as Record<string, unknown>).__JOBLENS_DOWNLOAD__ = downloadSnapshot;
