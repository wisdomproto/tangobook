/**
 * 파일명에서 안전하지 않은 문자를 제거.
 */
export function sanitizeFilename(name: string, maxLength = 30): string {
  return name.replace(/[^a-zA-Z0-9가-힣_-]/g, '').slice(0, maxLength);
}

export type R2FileType =
  | 'character'
  | 'illustration'
  | 'cover'
  | 'keyobj'
  | 'vocab'
  | 'tts'
  | 'bgm'
  | 'upload'
  | 'audiobook';

interface R2KeyOptions {
  storybookId?: string;
  storybookTitle?: string;
  fileType: R2FileType | string;
  identifier?: string; // character name, page number 등
  extension: string;
}

/**
 * R2 저장소에 업로드할 파일 키를 생성.
 * 빈 값이 있는 부분은 자동으로 제외.
 * 예: {storybookId}-{title}-{fileType}-{identifier}-{timestamp}.{ext}
 */
export function buildR2Key(options: R2KeyOptions): string {
  const { storybookId, storybookTitle, fileType, identifier, extension } = options;
  const parts: string[] = [];
  if (storybookId) parts.push(storybookId);
  if (storybookTitle) parts.push(sanitizeFilename(storybookTitle));
  parts.push(fileType);
  if (identifier) parts.push(sanitizeFilename(identifier));
  parts.push(String(Date.now()));
  return `${parts.join('-')}.${extension}`;
}
