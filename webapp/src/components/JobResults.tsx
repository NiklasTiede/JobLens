import { useMemo, useState } from 'react';
import { useAppStore } from '../store/app-store';
import JobCard from './JobCard';

type SortKey = 'score' | 'date' | 'distance' | 'company';

export default function JobResults() {
  const { scoredJobs, setStep } = useAppStore();
  const [sortBy, setSortBy] = useState<SortKey>('score');
  const [minScore, setMinScore] = useState(0);

  const sorted = useMemo(() => {
    const filtered = scoredJobs.filter((j) => j.scoring.score >= minScore);

    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'score':
          return b.scoring.score - a.scoring.score;
        case 'date':
          return new Date(b.publicationDate).getTime() - new Date(a.publicationDate).getTime();
        case 'distance':
          return (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999);
        case 'company':
          return a.company.name.localeCompare(b.company.name);
      }
    });
  }, [scoredJobs, sortBy, minScore]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900">
          Results ({sorted.length}/{scoredJobs.length})
        </h2>
        <button
          onClick={() => setStep('search')}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          New search
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Sort:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            className="text-sm border border-gray-300 rounded-lg px-2 py-1"
          >
            <option value="score">Match Score</option>
            <option value="date">Newest</option>
            <option value="distance">Nearest</option>
            <option value="company">Company</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Min score:</label>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={minScore}
            onChange={(e) => setMinScore(Number(e.target.value))}
            className="w-24"
          />
          <span className="text-sm text-gray-500 w-8">{minScore}</span>
        </div>
      </div>

      <div className="space-y-4">
        {sorted.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
        {sorted.length === 0 && (
          <p className="text-center text-gray-500 py-10">
            No jobs match your filter criteria.
          </p>
        )}
      </div>
    </div>
  );
}
