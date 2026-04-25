import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/error.middleware.js';
import {
  loadV1Storybooks,
  fetchV1Storybook,
  migrateBookToV2,
  classifyV1Id,
  type V1ListEntry,
} from '../services/book-v2-migration.service.js';
import { verifyBookV2 } from '../services/book-v2-verify.service.js';
import { seedCurriculumMeta } from '../services/book-v2-curriculum-seed.service.js';
import { listR2Objects } from '../providers/r2.provider.js';
import type { ReadingLevel, Storybook } from '@tangobook/shared';

// 5분 캐시 — scan 결과를 migrate 호출 시 재사용
let groupsCache: Map<string, V1ListEntry[]> | null = null;
let groupsCacheTime = 0;
const TTL = 5 * 60 * 1000;

async function ensureGroups(force = false) {
  if (!force && groupsCache && Date.now() - groupsCacheTime < TTL) return groupsCache;
  groupsCache = await loadV1Storybooks();
  groupsCacheTime = Date.now();
  return groupsCache;
}

export async function scan(_req: Request, res: Response, next: NextFunction) {
  try {
    const groups = await ensureGroups(true);
    const summary = [...groups.entries()]
      .map(([baseBid, variants]) => ({
        baseBid,
        levels: variants.map((v) => v.level).sort(),
        variantIds: variants.map((v) => v.storybookId),
        count: variants.length,
      }))
      .sort((a, b) => a.baseBid.localeCompare(b.baseBid));
    res.json({
      success: true,
      data: {
        totalGroups: summary.length,
        totalStorybooks: summary.reduce((n, g) => n + g.count, 0),
        groups: summary,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function migrateOne(req: Request, res: Response, next: NextFunction) {
  try {
    const { baseBid, variantIds, dryRun, force } = req.body as {
      baseBid?: string;
      variantIds?: string[];
      dryRun?: boolean;
      force?: boolean;
    };
    if (!baseBid) throw new AppError(400, 'baseBid required');

    const groups = await ensureGroups();
    const groupVariants =
      variantIds && variantIds.length > 0
        ? variantIds.map((id) => {
            const m = classifyV1Id(id);
            return { storybookId: id, baseBid: m.baseBid, level: m.level } as V1ListEntry;
          })
        : groups.get(baseBid);

    if (!groupVariants || groupVariants.length === 0) {
      throw new AppError(404, `no v1 storybooks for baseBid=${baseBid}`);
    }

    // fetch full storybook bodies in parallel
    const fetched = await Promise.all(
      groupVariants.map(async (v) => {
        const storybook: Storybook = await fetchV1Storybook(v.storybookId);
        // readingLevel 우선, 없으면 v.level (suffix), 없으면 L3
        const level: ReadingLevel = (storybook.readingLevel ?? v.level ?? 'L3') as ReadingLevel;
        return { storybookId: v.storybookId, level, storybook };
      })
    );

    const result = await migrateBookToV2(baseBid, fetched, { dryRun, force });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function listBids(_req: Request, res: Response, next: NextFunction) {
  try {
    const objects = await listR2Objects('books/');
    const bids = [
      ...new Set(
        objects
          .map((o) => o.Key)
          .filter((k): k is string => !!k && k.endsWith('/manifest.json'))
          .map((k) => k.replace(/^books\//, '').replace(/\/manifest\.json$/, ''))
      ),
    ].sort();
    res.json({ success: true, data: { count: bids.length, bids } });
  } catch (err) {
    next(err);
  }
}

export async function verifyOne(req: Request, res: Response, next: NextFunction) {
  try {
    const { bid } = req.body as { bid?: string };
    if (!bid) throw new AppError(400, 'bid required');
    const result = await verifyBookV2(bid);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function seedMeta(req: Request, res: Response, next: NextFunction) {
  try {
    const { dryRun } = req.body as { dryRun?: boolean };
    const result = await seedCurriculumMeta({ dryRun });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}
