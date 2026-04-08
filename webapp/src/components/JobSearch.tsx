import { useState } from 'react';
import { useAppStore } from '../store/app-store';
import { searchAllPages, enrichJobsWithDescriptions } from '../services/job-scraper';
import { scoreJobs } from '../services/job-scorer';
import { distanceKm, geocodeCity } from '../services/geo';
import { debugCapture } from '../services/debug';

export default function JobSearch() {
  const {
    profile,
    provider,
    apiKey,
    searchQuery,
    setSearchQuery,
    maxPages,
    setMaxPages,
    setStep,
    setScoredJobs,
    setLoading,
    loading,
    loadingMessage,
  } = useAppStore();
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!profile) return;
    setError(null);

    try {
      setLoading(true, 'Searching jobs...');
      let jobs = await searchAllPages(
        { query: searchQuery },
        maxPages,
        (loaded, total) => setLoading(true, `Loading page ${loaded}/${total}...`),
      );

      // Compute distances
      const userCoords = geocodeCity(profile.location);
      if (userCoords) {
        jobs = jobs.map((job) => ({
          ...job,
          distanceKm: job.coordinates
            ? Math.round(distanceKm(userCoords.lat, userCoords.lon, job.coordinates.lat, job.coordinates.lon))
            : undefined,
        }));
      }

      debugCapture('searchQuery', searchQuery);
      debugCapture('rawJobs', jobs);

      setLoading(true, `Fetching job descriptions (0/${Math.min(jobs.length, 50)})...`);
      jobs = await enrichJobsWithDescriptions(jobs, 50, (loaded, total) =>
        setLoading(true, `Fetching descriptions ${loaded}/${total}...`),
      );

      debugCapture('jobsWithDescriptions', jobs);

      setLoading(true, 'Scoring jobs with AI...');
      const scored = await scoreJobs(jobs, profile, provider, apiKey, (done, total) =>
        setLoading(true, `Scoring ${done}/${total} jobs...`),
      );

      debugCapture('scoredJobs', scored);
      setScoredJobs(scored);
      setStep('results');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900">Job Search</h2>
      <p className="text-gray-600">
        Configure your search. Keywords are pre-filled from your profile.
      </p>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Search Keywords</label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="e.g. Java Developer"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Max pages to scan ({maxPages * 20} jobs max)
          </label>
          <input
            type="range"
            min={1}
            max={20}
            value={maxPages}
            onChange={(e) => setMaxPages(Number(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-400">
            <span>1 page (20)</span>
            <span>{maxPages} pages ({maxPages * 20})</span>
            <span>20 pages (400)</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
          <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full" />
          <p className="text-sm text-blue-700">{loadingMessage}</p>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => setStep('profile')}
          disabled={loading}
          className="px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-40"
        >
          Back
        </button>
        <button
          onClick={handleSearch}
          disabled={loading || !searchQuery.trim()}
          className="flex-1 py-2.5 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Searching...' : 'Search & Score Jobs'}
        </button>
      </div>
    </div>
  );
}
