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
export {
  useLongformList,
  useLongformProject,
  useCreateLongform,
  useSaveLongform,
  useDeleteLongform,
  useStartLongformAnalyze,
  useStartGenerateClip,
  useStartLongformRender,
  useStartLongformYouTubeUpload,
  useLinkLongformYouTubeVideo,
  useGenerateLongformYouTubeMeta,
  useGenerateLongformCaptions,
  useStartLongformUploadCaptions,
} from './hooks/useLongform';
export { useGamesList, useGame, useDeleteGame, useGenerateGame } from './hooks/useGames';
export { useRuntimeViewer, useRuntimeGame } from './hooks/useRuntimeViewer';
export {
  useBlogList,
  useBlogPost,
  useCreateBlog,
  useSaveBlog,
  useDeleteBlog,
  useCardNewsList,
  useCardNewsProject,
  useCreateCardNews,
  useSaveCardNews,
  useDeleteCardNews,
} from './hooks/useMarketing';
export { MetaTab } from './components/MetaTab';
export { TextTab } from './components/TextTab';
export { StyleTab } from './components/StyleTab';
export { PageTab } from './components/PageTab';
export { AudiobookTab } from './components/AudiobookTab';
export { LongformTab } from './components/LongformTab';
export { SceneEditor } from './components/SceneEditor';
export { CaptionsModal } from './components/CaptionsModal';
export { YouTubeUploadModal } from './components/YouTubeUploadModal';
export { GamesTab } from './components/GamesTab';
export { MarketingTab } from './components/MarketingTab';
