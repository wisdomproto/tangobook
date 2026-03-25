import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { AppError } from '../middleware/error.middleware.js';
import { R2Repository } from '../repositories/r2.repository.js';
import { buildR2Key } from '../utils/r2-key.js';
import { buildAudiobookRenderData } from '@tangobook/shared';
import type { AudiobookProject } from '@tangobook/shared';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type RenderProgress = { progress: number; step: string; error?: string };
const renderProgressMap = new Map<string, RenderProgress>();

let cachedBundlePath: string | null = null;

async function getBundlePath(): Promise<string> {
  if (cachedBundlePath && fs.existsSync(cachedBundlePath)) {
    return cachedBundlePath;
  }
  // entry.ts contains registerRoot() — required for Remotion bundling
  const remotionEntry = path.resolve(__dirname, '../../../remotion/src/entry.ts');
  cachedBundlePath = await bundle({ entryPoint: remotionEntry });
  return cachedBundlePath;
}

export const AudiobookService = {
  getRenderProgress(projectId: string): RenderProgress | null {
    return renderProgressMap.get(projectId) ?? null;
  },

  async render(req: { storybookId: string; projectId: string }): Promise<{ outputUrl: string }> {
    const { storybookId, projectId } = req;

    if (!storybookId) throw new AppError(400, 'storybookId는 필수입니다.');
    if (!projectId) throw new AppError(400, 'projectId는 필수입니다.');

    // 1. Load storybook
    const storybook = await R2Repository.getStorybook(storybookId);
    if (!storybook) throw new AppError(404, '동화책을 찾을 수 없습니다.');

    const project = storybook.audiobookProjects?.find((p: AudiobookProject) => p.id === projectId);
    if (!project) throw new AppError(404, '오디오북 프로젝트를 찾을 수 없습니다.');

    // 2. Build render props
    const renderData = buildAudiobookRenderData(storybook, project);
    if (renderData.slides.length === 0) {
      throw new AppError(400, '렌더링할 페이지가 없습니다 (삽화가 있는 페이지 필요).');
    }

    renderProgressMap.set(projectId, { progress: 0, step: '준비 중' });

    const workDir = path.join(os.tmpdir(), `audiobook-${projectId}-${Date.now()}`);
    fs.mkdirSync(workDir, { recursive: true });

    try {
      // 3. Bundle (cached)
      renderProgressMap.set(projectId, { progress: 5, step: 'Remotion 번들링' });
      const bundlePath = await getBundlePath();

      // 4. Select composition
      renderProgressMap.set(projectId, { progress: 10, step: '컴포지션 준비' });
      const composition = await selectComposition({
        serveUrl: bundlePath,
        id: 'Audiobook',
        inputProps: renderData,
      });

      // 5. Render
      const outputPath = path.join(workDir, 'output.mp4');
      renderProgressMap.set(projectId, { progress: 15, step: '렌더링 중' });

      await renderMedia({
        composition,
        serveUrl: bundlePath,
        codec: 'h264',
        outputLocation: outputPath,
        inputProps: renderData,
        timeoutInMilliseconds: 600000, // 10 minutes
        onProgress: ({ progress }) => {
          const percent = 15 + Math.round(progress * 75); // 15-90%
          renderProgressMap.set(projectId, { progress: percent, step: '렌더링 중' });
        },
      });

      // 6. Upload to R2
      renderProgressMap.set(projectId, { progress: 92, step: 'R2 업로드 중' });
      const videoBuffer = fs.readFileSync(outputPath);
      const key = buildR2Key({
        storybookId,
        storybookTitle: storybook.title,
        fileType: 'audiobook',
        identifier: project.name,
        extension: 'mp4',
      });
      const outputUrl = await R2Repository.uploadBuffer(videoBuffer, key, 'video/mp4');

      // 7. Update storybook
      const proj = storybook.audiobookProjects?.find((p: AudiobookProject) => p.id === projectId);
      if (proj) {
        proj.outputUrl = outputUrl;
        proj.createdAt = new Date().toISOString();
        await R2Repository.saveStorybook(storybook);
      }

      renderProgressMap.set(projectId, { progress: 100, step: '완료' });
      setTimeout(() => renderProgressMap.delete(projectId), 30_000);

      return { outputUrl };
    } catch (err: any) {
      renderProgressMap.set(projectId, {
        progress: -1,
        step: '렌더링 실패',
        error: err.message || '알 수 없는 오류',
      });
      setTimeout(() => renderProgressMap.delete(projectId), 30_000);
      throw err;
    } finally {
      fs.rmSync(workDir, { recursive: true, force: true });
    }
  },
};
