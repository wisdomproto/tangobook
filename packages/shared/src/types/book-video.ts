export type BookVideoFormat = 'long' | 'short';

export interface BookVideoFile {
  key: string;
  url: string;
  name: string;
  contentType: string;
  bytes: number;
}

/** Book page text/TTS remain separate from these video adaptations. */
export interface BookVideoLanguage {
  subtitleSrt: string;
  narrationText: string;
  narration?: BookVideoFile;
  video?: BookVideoFile;
  cover?: BookVideoFile;
}

export interface BookVideoProduction {
  original?: BookVideoFile;
  languages: Record<string, BookVideoLanguage>;
}

export interface BookVideoVersion {
  id: string;
  number: number;
  createdAt: string;
  productions: Record<BookVideoFormat, BookVideoProduction>;
}

export interface BookVideoLibrary {
  bookId: string;
  revision: number;
  versions: BookVideoVersion[];
}

export interface BookVideoRegistration {
  contentId: string;
  projectId: string;
  versionId: string;
  reused: boolean;
}
