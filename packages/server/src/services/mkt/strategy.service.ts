import fs from 'node:fs/promises';
import path from 'node:path';

/** One strategy-template HTML file discovered on disk. */
export interface StrategyTemplateMeta {
  filename: string;
  title: string;
  description: string;
  size: number;
  modifiedAt: string;
  url: string;
}

const DEV_DIR = path.join(process.cwd(), 'packages/client/public/marketing-strategy-templates');
const DIST_DIR = path.join(process.cwd(), 'packages/client/dist/marketing-strategy-templates');

/**
 * List the strategy-template `*.html` files from the server-owned directory.
 * The HTML import/parse is client-side; this only enumerates files + reads
 * title/description from each head. A missing dir yields an empty list (no throw).
 * Ported from ContentFlow `src/app/api/strategy/templates/route.ts`.
 */
export async function listStrategyTemplates(): Promise<{ templates: StrategyTemplateMeta[] }> {
  const dir = process.env.NODE_ENV === 'production' ? DIST_DIR : DEV_DIR;

  let files: string[];
  try {
    files = (await fs.readdir(dir)).filter((f) => f.endsWith('.html'));
  } catch {
    return { templates: [] };
  }

  const items = await Promise.all(
    files.map(async (filename) => {
      const full = path.join(dir, filename);
      const stat = await fs.stat(full);
      const head = (await fs.readFile(full, 'utf-8')).slice(0, 4000);
      const titleMatch =
        head.match(/<meta\s+name=["']title["']\s+content=["']([^"']+)["']/i) ||
        head.match(/<title>([^<]+)<\/title>/i);
      const descMatch = head.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
      return {
        filename,
        title: titleMatch?.[1] ?? filename,
        description: descMatch?.[1] ?? '',
        size: stat.size,
        modifiedAt: stat.mtime.toISOString(),
        url: `/marketing-strategy-templates/${filename}`,
      };
    })
  );

  items.sort((a, b) => a.title.localeCompare(b.title));
  return { templates: items };
}
