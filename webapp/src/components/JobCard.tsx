import type { ScoredJob } from '../types/job';

function scoreColor(score: number): string {
  if (score >= 75) return 'bg-green-100 text-green-800 border-green-200';
  if (score >= 50) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  return 'bg-red-100 text-red-800 border-red-200';
}

export default function JobCard({ job }: { job: ScoredJob }) {
  const detailUrl = `https://www.jobs.ch/de/stellenangebote/detail/${job.id}/`;

  return (
    <div className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h3 className="font-semibold text-gray-900 truncate">{job.title}</h3>
            <span
              className={`px-2.5 py-0.5 rounded-full text-sm font-bold border shrink-0 ${scoreColor(job.scoring.score)}`}
            >
              {job.scoring.score}
            </span>
          </div>
          <p className="text-sm text-gray-600">
            {job.company.name} &middot; {job.place}
            {job.distanceKm != null && (
              <span className="text-gray-400"> &middot; {job.distanceKm} km</span>
            )}
          </p>
          {job.employmentGrades.length > 0 && (
            <p className="text-xs text-gray-400 mt-0.5">
              {Math.min(...job.employmentGrades)}-{Math.max(...job.employmentGrades)}%
            </p>
          )}
        </div>

        {job.company.logoImage?.src && (
          <img
            src={job.company.logoImage.src}
            alt=""
            className="w-10 h-10 rounded object-contain shrink-0"
          />
        )}
      </div>

      <p className="text-sm text-gray-600 mt-3">{job.scoring.reason}</p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {job.scoring.matching_skills.map((skill) => (
          <span key={skill} className="px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs">
            {skill}
          </span>
        ))}
        {job.scoring.missing_skills.map((skill) => (
          <span key={skill} className="px-2 py-0.5 bg-red-50 text-red-500 rounded text-xs">
            {skill}
          </span>
        ))}
      </div>

      <div className="mt-4">
        <a
          href={detailUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          View on jobs.ch →
        </a>
      </div>
    </div>
  );
}
