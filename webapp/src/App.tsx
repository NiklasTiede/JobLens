import { useAppStore } from './store/app-store';
import Settings from './components/Settings';
import ProfileUpload from './components/ProfileUpload';
import JobSearch from './components/JobSearch';
import JobResults from './components/JobResults';
import type { AppStep } from './store/app-store';

const STEPS: { key: AppStep; label: string }[] = [
  { key: 'settings', label: 'Settings' },
  { key: 'profile', label: 'Profile' },
  { key: 'search', label: 'Search' },
  { key: 'results', label: 'Results' },
];

function StepIndicator() {
  const { step } = useAppStore();
  const currentIndex = STEPS.findIndex((s) => s.key === step);

  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {STEPS.map((s, i) => (
        <div key={s.key} className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              i <= currentIndex
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-500'
            }`}
          >
            {i + 1}
          </div>
          <span
            className={`text-sm hidden sm:inline ${
              i <= currentIndex ? 'text-gray-900' : 'text-gray-400'
            }`}
          >
            {s.label}
          </span>
          {i < STEPS.length - 1 && (
            <div
              className={`w-8 h-0.5 ${
                i < currentIndex ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const { step } = useAppStore();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-xl font-bold text-gray-900 text-center">
          JobLens
        </h1>
        <p className="text-center text-sm text-gray-500">
          AI-powered job matching for Switzerland
        </p>
      </header>

      <main className="px-4 py-8">
        <StepIndicator />

        {step === 'settings' && <Settings />}
        {step === 'profile' && <ProfileUpload />}
        {step === 'search' && <JobSearch />}
        {step === 'results' && <JobResults />}
      </main>
    </div>
  );
}
