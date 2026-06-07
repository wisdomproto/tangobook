/**
 * Re-exports the production uploadToR2 from api/use-r2-upload.
 * channel-translator imports this path — do NOT change the path here.
 */
export type { R2UploadOptions, R2UploadResult } from '../api/use-r2-upload';
export { uploadToR2 } from '../api/use-r2-upload';
