/**
 * R2 upload helper — production implementation.
 * Replaces the stub in hooks/use-r2-upload.ts.
 *
 * Flow:
 *   POST /api/mkt/storage/presign  →  { uploadUrl, publicUrl, key }
 *   PUT  uploadUrl                 (file binary)
 *   return { publicUrl, key }
 *
 * 1 retry on transient failure. Uses native fetch (no auth cookie needed for presigned PUT).
 */

export interface R2UploadOptions {
  projectId: string;
  category: string;
  fileName?: string;
  contentType?: string;
  contentId?: string;
}

export interface R2UploadResult {
  publicUrl: string;
  key: string;
}

export async function uploadToR2(
  file: Blob | File,
  options: R2UploadOptions
): Promise<R2UploadResult> {
  const fileName = options.fileName ?? (file instanceof File ? file.name : 'upload');
  const contentType =
    (options.contentType ?? (file instanceof File ? file.type : 'application/octet-stream')) ||
    'application/octet-stream';

  // Step 1: Request a presigned URL from our server
  const presignRes = await fetch('/api/mkt/storage/presign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projectId: options.projectId,
      category: options.category,
      fileName,
      contentType,
      contentId: options.contentId,
    }),
  });

  if (!presignRes.ok) {
    const text = await presignRes.text().catch(() => 'unknown error');
    throw new Error(`presign failed (${presignRes.status}): ${text}`);
  }

  const { uploadUrl, publicUrl, key } = (await presignRes.json()) as {
    uploadUrl: string;
    publicUrl: string;
    key: string;
  };

  // Step 2: PUT the file directly to R2 via the presigned URL
  const doUpload = async () => {
    const res = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': contentType },
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`R2 PUT failed (${res.status}): ${text}`);
    }
  };

  try {
    await doUpload();
  } catch {
    // 1 retry
    await doUpload();
  }

  return { publicUrl, key };
}
