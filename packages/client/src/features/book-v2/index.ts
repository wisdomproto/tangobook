export { bookV2Api } from './api/book-v2.api';
export type { UpdateBookMetaPatch, VariantPatch } from './api/book-v2.api';
export { useBookIndex, useBookManifest } from './hooks/useBookIndex';
export { useUpdateBookMeta, usePatchVariants } from './hooks/useBookMutations';
export { MetaTab } from './components/MetaTab';
