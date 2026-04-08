import { useCallback, useState } from 'react';
import { useAppStore } from '../store/app-store';
import { extractTextFromPdf } from '../services/pdf-parser';
import { callLlm } from '../services/llm-client';
import {
  EXTRACT_PROFILE_SYSTEM_PROMPT,
  buildExtractProfileUserMessage,
} from '../prompts/extract-profile';
import type { UserProfile } from '../types/profile';
import { debugCapture } from '../services/debug';

export default function ProfileUpload() {
  const { provider, apiKey, profile, setProfile, setStep, setSearchQuery, setLoading, loading, loadingMessage } =
    useAppStore();
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      if (file.type !== 'application/pdf') {
        setError('Please upload a PDF file.');
        return;
      }

      setError(null);
      setLoading(true, 'Extracting text from PDF...');

      try {
        const text = await extractTextFromPdf(file);
        debugCapture('pdfText', text);

        setLoading(true, 'Analyzing profile with AI...');
        const response = await callLlm(
          { provider, apiKey },
          EXTRACT_PROFILE_SYSTEM_PROMPT,
          buildExtractProfileUserMessage(text),
          true, // use smart model for accurate profile extraction
        );

        // Strip markdown code blocks if present
        const jsonStr = response.replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '');
        const parsed: UserProfile = JSON.parse(jsonStr);
        debugCapture('extractedProfile', parsed);
        setProfile(parsed);

        // Pre-fill search query from profile
        if (parsed.title) {
          setSearchQuery(parsed.title);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to process PDF');
      } finally {
        setLoading(false);
      }
    },
    [provider, apiKey, setProfile, setSearchQuery, setLoading],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900">Upload Your Profile</h2>
      <p className="text-gray-600">
        Upload your LinkedIn "Save as PDF" export. The AI will extract your skills
        and experience.
      </p>

      {!profile && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center hover:border-blue-400 transition-colors cursor-pointer"
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.pdf';
            input.onchange = (e) => {
              const file = (e.target as HTMLInputElement).files?.[0];
              if (file) handleFile(file);
            };
            input.click();
          }}
        >
          {loading ? (
            <div className="space-y-2">
              <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto" />
              <p className="text-sm text-gray-500">{loadingMessage}</p>
            </div>
          ) : (
            <>
              <p className="text-gray-500 font-medium">
                Drop your LinkedIn PDF here or click to browse
              </p>
              <p className="text-xs text-gray-400 mt-2">PDF files only</p>
            </>
          )}
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {profile && (
        <div className="border border-gray-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">{profile.name}</h3>
            <button
              onClick={() => setProfile(null as unknown as UserProfile)}
              className="text-sm text-gray-500 hover:text-red-500"
            >
              Remove
            </button>
          </div>
          <p className="text-sm text-gray-600">
            {profile.title} &middot; {profile.location}
          </p>
          <p className="text-sm text-gray-600">
            {profile.years_of_experience} years experience
          </p>
          <div className="flex flex-wrap gap-1.5">
            {profile.skills.map((skill) => (
              <span
                key={skill}
                className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium"
              >
                {skill}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {profile.languages.map((lang) => (
              <span
                key={lang}
                className="px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs font-medium"
              >
                {lang}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => setStep('settings')}
          className="px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Back
        </button>
        <button
          onClick={() => setStep('search')}
          disabled={!profile}
          className="flex-1 py-2.5 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Continue to Search
        </button>
      </div>
    </div>
  );
}
