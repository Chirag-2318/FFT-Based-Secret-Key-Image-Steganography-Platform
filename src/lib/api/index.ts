import { ApiClient } from './types';
import { realClient } from './client';
import { mockClient } from '../mock/mockApi';

export * from './types';
export * from './client';

/**
 * Determines whether mock mode is active.
 * Defaults to true in development, or when VITE_USE_MOCK is explicitly 'true'.
 */
const shouldUseMock =
  import.meta.env.VITE_USE_MOCK === 'true' ||
  (import.meta.env.DEV && import.meta.env.VITE_USE_MOCK !== 'false');

/**
 * Unified API client export.
 * Directly routes calls to the mock backend or the real production backend
 * based on environment configuration.
 */
export const api: ApiClient = shouldUseMock ? mockClient : realClient;
