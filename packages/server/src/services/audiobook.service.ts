import fs from 'fs';
import path from 'path';
import os from 'os';
import type { AudiobookGenerateRequest, AudiobookResult } from '@tangobook/shared';
import type { AudiobookProject, Page } from '@tangobook/shared';
import { AppError } from '../middleware/error.middleware.js';
import { R2Repository } from '../repositories/r2.repository.js';
import { generateAudiobook } from '../providers/audiobook.provider.js';
import { buildR2Key } from '../utils/r2-key.js';
import type { AudiobookPageData, ProgressInfo } from '../providers/audiobook.provider.js';

// 프로젝트별 진행률 저장 (메모리)
const progressMap = new Map<string, ProgressInfo>();

export const AudiobookService = {
  getProgress(projectId: string): ProgressInfo | null {
    return progressMap.get(projectId) ?? null;
  },

  async generate(req: AudiobookGenerateRequest): Promise<AudiobookResult> {
    const { storybookId, projectId } = req;

    if (!storybookId) throw new AppError(400, 'storybookId는 필수입니다.');
    if (!projectId) throw new AppError(400, 'projectId는 필수입니다.');

    // 1. 동화책 로드
    const storybook = await R2Repository.getStorybook(storybookId);
    if (!storybook) throw new AppError(404, '동화책을 찾을 수 없습니다.');

    // 2. 프로젝트 설정 찾기
    const project = storybook.audiobookProjects?.find((p: AudiobookProject) => p.id === projectId);
    if (!project) throw new AppError(404, '오디오북 프로젝트를 찾을 수 없습니다.');

    // 3. 페이지 범위 추출
    const allPages = storybook.pages ?? [];
    const startIdx = Math.max(0, (project.startPage ?? 1) - 1);
    const endIdx = Math.min(allPages.length, project.endPage ?? allPages.length);
    const pages = allPages.slice(startIdx, endIdx);

    if (pages.length === 0) throw new AppError(400, '선택된 페이지가 없습니다.');

    // 4. 페이지 데이터 준비 (언어별 텍스트/TTS 선택)
    const lang = project.language ?? 'ko';
    const pageData: AudiobookPageData[] = pages.map((page: Page) => {
      let text = page.text;
      let audioUrl = page.ttsUrl;

      if (lang !== 'ko' && page.translations?.[lang]) {
        text = page.translations[lang].text ?? text;
        audioUrl = page.translations[lang].ttsUrl ?? audioUrl;
      }

      return {
        imageUrl: page.illustrationUrl ?? '',
        audioUrl: audioUrl ?? undefined,
        text,
      };
    });

    // 삽화가 없는 페이지 필터링 경고 (삽화 없으면 건너뜀)
    const validPages = pageData.filter((p) => p.imageUrl);
    if (validPages.length === 0) throw new AppError(400, '삽화가 있는 페이지가 없습니다.');

    // 5. 임시 작업 디렉토리 생성
    const workDir = path.join(os.tmpdir(), `tangobook-audiobook-${Date.now()}`);
    fs.mkdirSync(workDir, { recursive: true });
    const outputPath = path.join(workDir, 'output.mp4');

    try {
      // 6. 표지 데이터 (프로젝트에서 선택한 표지 우선, 없으면 대표 표지)
      const coverUrl = project.coverImageUrl ?? storybook.coverImage;
      const cover =
        project.includeCover && coverUrl
          ? { imageUrl: coverUrl, duration: project.coverDuration ?? 3 }
          : undefined;

      // 7. BGM URL 결정
      const bgmUrl = project.includeBgm
        ? (project.bgmUrl ?? storybook.backgroundMusicUrl)
        : undefined;

      // 8. Python 스크립트 호출
      progressMap.set(projectId, { progress: 0, step: '시작' });
      await generateAudiobook(
        {
          pages: validPages,
          cover,
          format: project.format,
          aspectRatio: project.aspectRatio,
          layout: project.layout,
          bgmUrl: bgmUrl ?? undefined,
          bgmVolume: project.bgmVolume ?? 30,
          includeSubtitles: project.includeSubtitles ?? true,
          subtitleColor: project.subtitleColor ?? '#ffffff',
          subtitleSize: project.subtitleSize ?? 'md',
          subtitlePosition: project.subtitlePosition ?? 'bottom',
          subtitleBg: project.subtitleBg ?? '#00000080',
          workDir,
          outputPath,
        },
        (info) => {
          progressMap.set(projectId, info);
        }
      );

      progressMap.set(projectId, { progress: 95, step: 'R2 업로드 중' });

      // 9. 결과 파일을 R2에 업로드
      const videoBuffer = fs.readFileSync(outputPath);
      const key = buildR2Key({
        storybookId,
        storybookTitle: storybook.title,
        fileType: 'audiobook',
        identifier: project.name,
        extension: 'mp4',
      });
      const outputUrl = await R2Repository.uploadBuffer(videoBuffer, key, 'video/mp4');

      // 10. 결과 URL을 스토리북에 저장 (서버 측 영구 저장)
      const proj = storybook.audiobookProjects?.find((p: AudiobookProject) => p.id === projectId);
      if (proj) {
        proj.outputUrl = outputUrl;
        proj.createdAt = new Date().toISOString();
        await R2Repository.saveStorybook(storybook);
      }

      progressMap.set(projectId, { progress: 100, step: '완료' });
      setTimeout(() => progressMap.delete(projectId), 30_000);

      return { outputUrl };
    } finally {
      // 10. 임시 디렉토리 정리
      fs.rmSync(workDir, { recursive: true, force: true });
    }
  },
};
