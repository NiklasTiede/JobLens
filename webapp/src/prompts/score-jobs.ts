import type { Job } from '../types/job';
import type { UserProfile } from '../types/profile';

export const SCORE_JOBS_SYSTEM_PROMPT = `Score each job 0-100 for the candidate. Be concise.

Weights: skill match 40%, experience level 25%, domain fit 20%, language fit 15%.

Output JSON array only, no markdown:
[{"job_id":"...","score":N,"matching_skills":["..."],"missing_skills":["..."],"reason":"1 sentence max"}]

Rules:
- matching_skills: only list specific technologies/skills the candidate HAS that the job REQUIRES
- missing_skills: only list specific technologies the job requires that the candidate LACKS
- reason: one short sentence, focus on the key differentiator
- score must be an integer`;

export function buildScoreJobsUserMessage(profile: UserProfile, jobs: Job[]): string {
  // Compact profile: only what matters for scoring
  const compactProfile = {
    title: profile.title,
    skills: profile.skills,
    years_exp: profile.years_of_experience,
    languages: profile.languages,
    location: profile.location,
    experience: profile.experience.map((e) => `${e.role} at ${e.company} (${e.duration}): ${e.technologies.join(', ')}`),
  };

  const jobSummaries = jobs.map((j) => ({
    id: j.id,
    title: j.title,
    company: j.company.name,
    place: j.place,
    description: j.description ? j.description.slice(0, 500) : '(no description)',
  }));

  return `Profile:\n${JSON.stringify(compactProfile)}\n\nJobs:\n${JSON.stringify(jobSummaries)}`;
}
