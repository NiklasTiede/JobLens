import { useAppStore } from '../store/app-store';
import type { LlmProvider } from '../services/llm-client';

const PROVIDERS: { id: LlmProvider; name: string; hint: string }[] = [
  { id: 'openai', name: 'OpenAI', hint: 'platform.openai.com/api-keys' },
  { id: 'anthropic', name: 'Anthropic', hint: 'console.anthropic.com/settings/keys' },
  { id: 'google', name: 'Google Gemini', hint: 'aistudio.google.com/apikey' },
];

export default function Settings() {
  const { provider, apiKey, setProvider, setApiKey, setStep } = useAppStore();

  const canContinue = apiKey.trim().length > 10;

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900">API Settings</h2>
      <p className="text-gray-600">
        JobLens uses your own API key to process data. Your key is stored only in
        your browser and never sent to our servers.
      </p>

      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">Provider</label>
        <div className="flex gap-2">
          {PROVIDERS.map((p) => (
            <button
              key={p.id}
              onClick={() => setProvider(p.id)}
              className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                provider === p.id
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500">
          Get your key at: {PROVIDERS.find((p) => p.id === provider)?.hint}
        </p>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">API Key</label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="sk-..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
      </div>

      <button
        onClick={() => setStep('profile')}
        disabled={!canContinue}
        className="w-full py-2.5 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Continue
      </button>
    </div>
  );
}
