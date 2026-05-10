import { apiGet, apiPut } from '@/lib/axios';
import type { LibraryConfig } from '@tangobook/shared';

export const libraryConfigApi = {
  get: () => apiGet<LibraryConfig>('/library-config'),
  put: (cfg: LibraryConfig) => apiPut<LibraryConfig>('/library-config', cfg),
};
