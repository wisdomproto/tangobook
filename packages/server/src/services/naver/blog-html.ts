import type { BlogPostV2 } from '@tangobook/shared';

export type InjectionBlock =
  | { kind: 'heading'; text: string; sectionId: string }
  | { kind: 'text'; text: string; sectionId: string }
  | { kind: 'image'; imageUrl: string; caption?: string; sectionId: string };

export interface InjectionPlan {
  title: string;
  tags: string[];
  blocks: InjectionBlock[];
}

/** BlogPostV2 → 에디터 주입 지시서. 부수효과 없음(순수). */
export function buildInjectionPlan(post: BlogPostV2): InjectionPlan {
  const blocks: InjectionBlock[] = [];
  for (const s of post.sections) {
    if (s.header?.trim()) blocks.push({ kind: 'heading', text: s.header, sectionId: s.id });
    if (s.text?.trim()) blocks.push({ kind: 'text', text: s.text, sectionId: s.id });
    if (s.imageUrl)
      blocks.push({
        kind: 'image',
        imageUrl: s.imageUrl,
        caption: s.imageCaption,
        sectionId: s.id,
      });
  }
  return { title: post.title, tags: post.tags ?? [], blocks };
}
