import type { Job, JobScore, ScoredJob } from '../types/job';
import type { UserProfile } from '../types/profile';
import type { LlmProvider } from './llm-client';
import { callLlm } from './llm-client';
import { SCORE_JOBS_SYSTEM_PROMPT, buildScoreJobsUserMessage } from '../prompts/score-jobs';
import { debugCaptureScoringRequest } from './debug';

const BATCH_SIZE = 20;

const SCORING_CONCURRENCY = 3;

export async function scoreJobs(
  jobs: Job[],
  profile: UserProfile,
  provider: LlmProvider,
  apiKey: string,
  onProgress?: (scored: number, total: number) => void,
): Promise<ScoredJob[]> {
  const batches = chunkArray(jobs, BATCH_SIZE);
  let completed = 0;

  // Run scoring batches in parallel (up to SCORING_CONCURRENCY at a time)
  const batchResults: JobScore[][] = [];
  for (let i = 0; i < batches.length; i += SCORING_CONCURRENCY) {
    const parallelBatches = batches.slice(i, i + SCORING_CONCURRENCY);
    const results = await Promise.all(
      parallelBatches.map((batch) => scoreBatch(batch, profile, provider, apiKey)),
    );
    batchResults.push(...results);
    completed += parallelBatches.reduce((sum, b) => sum + b.length, 0);
    onProgress?.(Math.min(completed, jobs.length), jobs.length);
  }

  const allScores = batchResults.flat();
  const scoreMap = new Map(allScores.map((s) => [s.job_id, s]));

  const scoredJobs: ScoredJob[] = jobs.map((job) => ({
    ...job,
    scoring: scoreMap.get(job.id) || {
      job_id: job.id,
      score: 0,
      matching_skills: [],
      missing_skills: [],
      reason: 'Scoring failed',
    },
  }));

  return scoredJobs.sort((a, b) => b.scoring.score - a.scoring.score);
}

async function scoreBatch(
  jobs: Job[],
  profile: UserProfile,
  provider: LlmProvider,
  apiKey: string,
): Promise<JobScore[]> {
  const userMessage = buildScoreJobsUserMessage(profile, jobs);

  const response = await callLlm(
    { provider, apiKey },
    SCORE_JOBS_SYSTEM_PROMPT,
    userMessage,
  );

  debugCaptureScoringRequest(SCORE_JOBS_SYSTEM_PROMPT, userMessage, response);

  // Extract JSON from the response (handle markdown code blocks)
  const jsonMatch = response.match(/\[[\s\S]*]/);
  if (!jsonMatch) {
    throw new Error('LLM response did not contain a JSON array');
  }

  return JSON.parse(jsonMatch[0]);
}

function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}
