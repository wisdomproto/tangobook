import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../lib/image-utils', () => ({
  convertToWebpBlob: vi.fn().mockResolvedValue({ blob: new Blob(['x']), mimeType: 'image/webp' }),
}));

vi.mock('../../api/use-r2-upload', () => ({
  uploadToR2: vi.fn().mockResolvedValue({ publicUrl: 'https://r2/img.webp', key: 'k' }),
}));

import { useBatchImageStore, selectBatchProgress } from '../batch-image-store';

describe('batch-image-store', () => {
  beforeEach(() => {
    useBatchImageStore.setState({ jobs: {}, controllers: {} });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: { image: 'BASE64' } }),
      })
    );
  });

  it('runs the job, saves each slide via onSaved, and ends with isRunning=false', async () => {
    const onSaved = vi.fn().mockResolvedValue(undefined);
    await useBatchImageStore.getState().startJob({
      igContentId: 'ig-1',
      prompts: [
        { prompt: 'a', aspectRatio: '4:5', slideIndex: 0 },
        { prompt: 'b', aspectRatio: '4:5', slideIndex: 1 },
      ],
      cardIdsByIndex: ['card-0', 'card-1'],
      imageModel: 'm',
      projectId: 'p-1',
      onSaved,
    });
    expect(onSaved).toHaveBeenCalledWith('card-0', 'https://r2/img.webp');
    expect(onSaved).toHaveBeenCalledWith('card-1', 'https://r2/img.webp');
    // After completion the job flips isRunning=false (cleanup happens 3s later via setTimeout).
    const job = useBatchImageStore.getState().jobs['ig-1'];
    expect(job?.isRunning).toBe(false);
  });

  it('selectBatchProgress returns EMPTY for an unknown id', () => {
    const p = selectBatchProgress('nope')(useBatchImageStore.getState());
    expect(p).toEqual({ current: 0, total: 0, currentSlideIndex: -1, isRunning: false });
  });

  it('does not start a second job while one is running', async () => {
    useBatchImageStore.setState({
      jobs: { 'ig-1': { current: 0, total: 3, currentSlideIndex: 0, isRunning: true } },
    });
    const onSaved = vi.fn();
    await useBatchImageStore.getState().startJob({
      igContentId: 'ig-1',
      prompts: [{ prompt: 'a', aspectRatio: '4:5', slideIndex: 0 }],
      cardIdsByIndex: ['card-0'],
      imageModel: 'm',
      projectId: 'p-1',
      onSaved,
    });
    expect(onSaved).not.toHaveBeenCalled();
  });
});
