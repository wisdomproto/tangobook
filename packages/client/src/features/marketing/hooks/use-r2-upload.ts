/**
 * Stub for the R2 upload hook — to be implemented in Phase 1+.
 * The type signature matches contentflow's uploadToR2 hook.
 */

export interface R2UploadOptions {
  projectId: string;
  category: string;
  fileName: string;
  contentType: string;
  contentId?: string;
}

export interface R2UploadResult {
  publicUrl: string;
  key: string;
}

/**
 * Upload a blob to R2 storage via the marketing API.
 * This stub throws until wired up in Phase 1.
 */
export async function uploadToR2(_blob: Blob, _options: R2UploadOptions): Promise<R2UploadResult> {
  throw new Error('uploadToR2 not yet implemented — Phase 1+ only');
}
