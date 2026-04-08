import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserProfile } from '../types/profile';
import type { ScoredJob } from '../types/job';
import type { LlmProvider } from '../services/llm-client';

export type AppStep = 'settings' | 'profile' | 'search' | 'results';

interface AppState {
  // Navigation
  step: AppStep;
  setStep: (step: AppStep) => void;

  // Settings
  provider: LlmProvider;
  apiKey: string;
  setProvider: (provider: LlmProvider) => void;
  setApiKey: (key: string) => void;

  // Profile
  profile: UserProfile | null;
  setProfile: (profile: UserProfile) => void;

  // Search
  searchQuery: string;
  searchRadius: number;
  maxPages: number;
  setSearchQuery: (query: string) => void;
  setSearchRadius: (radius: number) => void;
  setMaxPages: (pages: number) => void;

  // Results
  scoredJobs: ScoredJob[];
  setScoredJobs: (jobs: ScoredJob[]) => void;

  // Loading
  loading: boolean;
  loadingMessage: string;
  setLoading: (loading: boolean, message?: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      step: 'settings',
      setStep: (step) => set({ step }),

      provider: 'openai',
      apiKey: '',
      setProvider: (provider) => set({ provider }),
      setApiKey: (apiKey) => set({ apiKey }),

      profile: null,
      setProfile: (profile) => set({ profile }),

      searchQuery: '',
      searchRadius: 50,
      maxPages: 5,
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      setSearchRadius: (searchRadius) => set({ searchRadius }),
      setMaxPages: (maxPages) => set({ maxPages }),

      scoredJobs: [],
      setScoredJobs: (scoredJobs) => set({ scoredJobs }),

      loading: false,
      loadingMessage: '',
      setLoading: (loading, message = '') => set({ loading, loadingMessage: message }),
    }),
    {
      name: 'joblens-storage',
      partialize: (state) => ({
        provider: state.provider,
        apiKey: state.apiKey,
        profile: state.profile,
        searchQuery: state.searchQuery,
        searchRadius: state.searchRadius,
        maxPages: state.maxPages,
      }),
    },
  ),
);
