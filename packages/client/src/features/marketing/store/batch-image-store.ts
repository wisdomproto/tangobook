/**
 * Batch-image job store for Instagram cardnews slide generation.
 *
 * Port of ContentFlow stores/batch-image-store.ts (149 lines) with four bridges:
 *   1. `/api/ai/generate-image` → `/api/mkt/ai/generate-image`
 *   2. Response shape `data.image` / `data.mimeType:'image/png'` (matches use-image-generation.ts)
 *   3. CF `useProjectStore.getState().getInstagramCards()` → injected `cardIdsByIndex: string[]`
 *   4. CF `store.updateInstagramCard(id, { background_image_url })` → injected `onSaved(cardId, url)`
 *
 * Decision O-E (spec §5.5): this is the one legitimate Zustand-holds-state exception —
 * it stores job/progress state ONLY. Results land in the TanStack cache via `onSaved`
 * → `invalidateQueries`. No server data in Zustand.
 *
 * The batch loop survives tab switches (module-level singleton, CF comment cardnews-panel.tsx:25-27).
 */
import { create } from 'zustand';
import { convertToWebpBlob } from '../lib/image-utils';
import { uploadToR2 } from '../api/use-r2-upload';

export interface BatchJobProgress {
  current: number;
  total: number;
  currentSlideIndex: number;
  isRunning: boolean;
}

export interface StartJobArgs {
  igContentId: string;
  prompts: { prompt: string; aspectRatio: string; slideIndex: number }[];
  /** slideIndex → cardId snapshot (replaces CF's useProjectStore card read). */
  cardIdsByIndex: string[];
  imageModel: string;
  projectId: string;
  /** Bridge to useUpdateInstagramCard — persists the saved URL into the TanStack cache. */
  onSaved: (cardId: string, url: string) => void | Promise<void>;
}

interface BatchState {
  jobs: Record<string, BatchJobProgress>;
  controllers: Record<string, AbortController>;
  startJob: (args: StartJobArgs) => Promise<void>;
  abortJob: (igContentId: string) => void;
  getJob: (igContentId: string) => BatchJobProgress | undefined;
}

const EMPTY: BatchJobProgress = {
  current: 0,
  total: 0,
  currentSlideIndex: -1,
  isRunning: false,
};

/**
 * Selector: returns progress for a given igContentId, or EMPTY sentinel if not found.
 * Usage: `const progress = useBatchImageStore(selectBatchProgress(igContentId))`.
 */
export function selectBatchProgress(igContentId: string) {
  return (state: BatchState): BatchJobProgress => state.jobs[igContentId] ?? EMPTY;
}

export const useBatchImageStore = create<BatchState>()((set, get) => ({
  jobs: {},
  controllers: {},

  getJob: (igContentId) => get().jobs[igContentId],

  startJob: async ({ igContentId, prompts, cardIdsByIndex, imageModel, projectId, onSaved }) => {
    // Guard: don't start a second job while one is already running.
    if (get().jobs[igContentId]?.isRunning) return;

    const controller = new AbortController();
    set((s) => ({
      jobs: {
        ...s.jobs,
        [igContentId]: {
          current: 0,
          total: prompts.length,
          currentSlideIndex: -1,
          isRunning: true,
        },
      },
      controllers: { ...s.controllers, [igContentId]: controller },
    }));

    const updateProgress = (patch: Partial<BatchJobProgress>) => {
      set((s) => {
        const existing = s.jobs[igContentId];
        if (!existing) return s;
        return { jobs: { ...s.jobs, [igContentId]: { ...existing, ...patch } } };
      });
    };

    for (let i = 0; i < prompts.length; i++) {
      if (controller.signal.aborted) break;
      const p = prompts[i];
      updateProgress({ current: i, currentSlideIndex: p.slideIndex });

      const cardId = cardIdsByIndex[p.slideIndex];
      if (!cardId) continue;

      try {
        const res = await fetch('/api/mkt/ai/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: p.prompt, model: imageModel, aspectRatio: p.aspectRatio }),
          signal: controller.signal,
        });
        if (!res.ok) {
          console.warn(`[batch] Slide ${i + 1} HTTP ${res.status}`);
          continue;
        }
        const json = (await res.json()) as { success?: boolean; data?: { image?: string } };
        const base64 = json.data?.image;
        if (!json.success || !base64) continue;

        // Default to data URL; upgrade to R2 public URL if upload succeeds.
        let savedUrl = `data:image/png;base64,${base64}`;
        try {
          const { blob } = await convertToWebpBlob(base64, 'image/png');
          const { publicUrl } = await uploadToR2(blob, {
            projectId,
            category: 'images',
            fileName: `${cardId}.webp`,
            contentType: 'image/webp',
            contentId: cardId,
          });
          savedUrl = publicUrl;
        } catch {
          /* keep data URL fallback — matches CF `:91-105` */
        }

        await onSaved(cardId, savedUrl);
      } catch (err) {
        if ((err as Error).name === 'AbortError') break;
        console.warn(`[batch] Slide ${i + 1} error:`, (err as Error).message);
      }
    }

    updateProgress({ current: prompts.length, currentSlideIndex: -1, isRunning: false });

    // Self-clean after 3 s so stale entries don't accumulate.
    setTimeout(() => {
      set((s) => {
        if (s.jobs[igContentId]?.isRunning) return s; // A new job started — leave it.
        const { [igContentId]: _removedJob, ...restJobs } = s.jobs;
        const { [igContentId]: _removedCtrl, ...restCtrls } = s.controllers;
        void _removedJob;
        void _removedCtrl;
        return { jobs: restJobs, controllers: restCtrls };
      });
    }, 3000);
  },

  abortJob: (igContentId) => {
    get().controllers[igContentId]?.abort();
    set((s) => {
      const { [igContentId]: _removedJob, ...restJobs } = s.jobs;
      const { [igContentId]: _removedCtrl, ...restCtrls } = s.controllers;
      void _removedJob;
      void _removedCtrl;
      return { jobs: restJobs, controllers: restCtrls };
    });
  },
}));
