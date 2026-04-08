export interface JobCompany {
  id: string;
  name: string;
  logoImage?: { src: string };
  slug: string;
}

export interface Job {
  id: string;
  title: string;
  company: JobCompany;
  place: string;
  coordinates?: { lon: number; lat: number };
  publicationDate: string;
  employmentGrades: number[];
  employmentTypeIds: string[];
  benefitIds: string[];
  listingTags: { name: string }[];
  description?: string;
  distanceKm?: number;
}

export interface JobSearchResponse {
  rows: number;
  numPages: number;
  currentPage: number;
  totalHits: number;
  start: number;
  documents: Job[];
  hash: string;
}

export interface JobScore {
  job_id: string;
  score: number;
  matching_skills: string[];
  missing_skills: string[];
  reason: string;
}

export interface ScoredJob extends Job {
  scoring: JobScore;
}
