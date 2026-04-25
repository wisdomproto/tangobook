export { bookV2Api } from './api/book-v2.api';
export type { UpdateBookMetaPatch, VariantPatch } from './api/book-v2.api';
export { useBookIndex, useBookManifest } from './hooks/useBookIndex';
export { useUpdateBookMeta, usePatchVariants } from './hooks/useBookMutations';
export { useTextSlice, useSaveTextSlice } from './hooks/useTextSlice';
export {
  useStyleSlice,
  useSaveCharacters,
  useUploadCover,
  useUploadKeyObjectImage,
  useUploadVocabImage,
  useUploadPageImage,
} from './hooks/useStyleSlice';
export {
  useAudiobookProject,
  useSaveAudiobookProject,
  useAudiobookRenders,
} from './hooks/useAudiobook';
export { MetaTab } from './components/MetaTab';
export { TextTab } from './components/TextTab';
export { StyleTab } from './components/StyleTab';
export { PageTab } from './components/PageTab';
export { AudiobookTab } from './components/AudiobookTab';
