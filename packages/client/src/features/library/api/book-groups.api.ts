import { apiGet, apiPut } from '@/lib/axios';
import type { BookGroupsDoc } from '@tangobook/shared';

export const bookGroupsApi = {
  get: () => apiGet<BookGroupsDoc>('/book-groups'),
  put: (doc: BookGroupsDoc) => apiPut<BookGroupsDoc>('/book-groups', doc),
};
