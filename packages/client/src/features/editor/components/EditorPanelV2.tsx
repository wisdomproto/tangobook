import { useCallback, useEffect, useMemo, useState } from 'react';
import { useEditorStore } from '@/store/editor.store';
import { useStorybooks, useCreateVariant, useDeleteStorybook } from '@/features/storybook';
import { LevelEditCard } from '@/features/editor/components/LevelEditCard';
import { AddLevelConfirmModal } from '@/features/editor/components/VariantConfirmModals';
import type { ReadingLevel } from '@tangobook/shared';

const LEVEL_INFO: Record<ReadingLevel, { label: string; age: string; emoji: string }> = {
  L1: { label: '씨앗', age: '3~4세', emoji: '📗' },
  L2: { label: '새싹', age: '4~6세', emoji: '📘' },
  L3: { label: '나무', age: '6~7세', emoji: '📙' },
};
const LEVEL_ORDER: ReadingLevel[] = ['L1', 'L2', 'L3'];

function stripLevelSuffix(id: string): string {
  return id.replace(/__L[1-4]$/, '');
}
function extractLevel(id: string): ReadingLevel | null {
  const m = id.match(/__L([1-4])$/);
  return m ? (`L${m[1]}` as ReadingLevel) : null;
}

interface VariantEntry {
  id: string;
  level: ReadingLevel;
  title: string;
  isBase: boolean;
}

/**
 * /editor2 — 책 한 권을 레벨별 펼침/접힘 카드 stack 으로 보여줌.
 *
 * 레이아웃:
 *   ┌────────────────────────────────────────┐
 *   │ [📋 메타] [📖 편집]                      │  mode toggle (top)
 *   ├────────────────────────────────────────┤
 *   │ 메타: 책 종합 뷰 (variant overview, 가이드)│
 *   │ 편집: 레벨별 카드 stack (단일 펼침 accordion)│
 *   │   ┌─ 📗 L1 (collapsed) ─┐               │
 *   │   ├─ 📘 L2 (collapsed) ─┤               │
 *   │   ╔═ 📙 L3 (expanded) ═╗               │
 *   │   ║   [그림체 ▾] [언어]  ║               │
 *   │   ║   [기본설정][캐릭터]║               │
 *   │   ║   <콘텐츠>          ║               │
 *   │   ╚═════════════════════╝               │
 *   │   ┌─ ➕ L4 만들기 ──────┐               │
 *   └────────────────────────────────────────┘
 */
export function EditorPanelV2({ storybookId }: { storybookId: string }) {
  const { data: list } = useStorybooks();
  const setSelectedId = useEditorStore((s) => s.setSelectedStorybookId);
  const baseId = stripLevelSuffix(storybookId);

  // sibling pattern 으로 variant 감지
  const variants = useMemo<VariantEntry[]>(() => {
    if (!list) return [];
    return list
      .filter((b) => stripLevelSuffix(b.id) === baseId)
      .map((b): VariantEntry => {
        const lv = extractLevel(b.id);
        return {
          id: b.id,
          level: lv ?? 'L3', // base 책은 L3 가정
          title: b.title,
          isBase: lv === null,
        };
      })
      .sort((a, b) => LEVEL_ORDER.indexOf(a.level) - LEVEL_ORDER.indexOf(b.level));
  }, [list, baseId]);

  const existingLevels = new Set(variants.map((v) => v.level));
  const missingLevels = LEVEL_ORDER.filter((lv) => !existingLevels.has(lv));

  // 단일 펼침 accordion — 처음엔 사이드바에서 클릭한 storybookId 의 레벨을 펼침
  const initialLevel = useMemo(() => {
    const matched = variants.find((v) => v.id === storybookId);
    return matched?.level ?? variants.find((v) => v.isBase)?.level ?? 'L3';
  }, [variants, storybookId]);
  const [expandedLevel, setExpandedLevel] = useState<ReadingLevel | null>(initialLevel);
  // 한 번이라도 펼친 레벨 — 카드 mount 유지 (collapse 시에도)
  const [mountedLevels, setMountedLevels] = useState<Set<ReadingLevel>>(
    () => new Set([initialLevel])
  );

  // 사이드바에서 다른 책으로 이동 시 펼침 상태 초기화
  useEffect(() => {
    setExpandedLevel(initialLevel);
    setMountedLevels(new Set([initialLevel]));
  }, [storybookId, initialLevel]);

  // 추가/삭제 mutations
  const createVariantMutation = useCreateVariant();
  const deleteMutation = useDeleteStorybook();
  const [pendingLevelAdd, setPendingLevelAdd] = useState<ReadingLevel | null>(null);

  const handleAddLevel = useCallback((lv: ReadingLevel) => {
    setPendingLevelAdd(lv);
  }, []);

  const confirmAddLevel = useCallback(() => {
    if (!pendingLevelAdd) return;
    const lv = pendingLevelAdd;
    createVariantMutation.mutate(
      { id: baseId, level: lv },
      {
        onSuccess: (data) => {
          setSelectedId(data.id);
          setExpandedLevel(lv);
          setMountedLevels((s) => new Set(s).add(lv));
          setPendingLevelAdd(null);
        },
        onError: (e) => {
          alert((e as Error).message || '레벨 variant 생성 실패');
          setPendingLevelAdd(null);
        },
      }
    );
  }, [pendingLevelAdd, baseId, createVariantMutation, setSelectedId]);

  const handleDeleteVariant = useCallback(
    (variantId: string, level: ReadingLevel) => {
      if (
        !window.confirm(
          `${level} 레벨 variant 을 삭제할까요?\n\n해당 레벨의 모든 페이지/이미지/오디오가 영구적으로 사라집니다 (되돌릴 수 없음).`
        )
      )
        return;
      deleteMutation.mutate(variantId, {
        onSuccess: () => {
          setSelectedId(baseId);
          // 다른 레벨 자동 펼침
          const others = variants.filter((v) => v.level !== level);
          if (others.length > 0) {
            setExpandedLevel(others[0].level);
          }
        },
      });
    },
    [baseId, deleteMutation, setSelectedId, variants]
  );

  const baseTitle = useMemo(() => {
    const baseV = variants.find((v) => v.isBase) ?? variants[0];
    return (baseV?.title ?? '').replace(/\s*\(L[1-4]\)\s*$/, '');
  }, [variants]);

  const toggleLevel = (lv: ReadingLevel) => {
    setExpandedLevel((cur) => (cur === lv ? null : lv));
    setMountedLevels((s) => new Set(s).add(lv));
  };

  return (
    <div>
      {/* 책 제목 헤더 — 책별 메타는 각 레벨 카드 안 "책 관리" 탭에 있음 */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-6 py-3">
        <div className="flex items-center">
          <span className="text-sm text-slate-600 dark:text-slate-300 truncate">{baseTitle}</span>
        </div>
      </div>

      <div className="p-4 space-y-3 max-w-6xl mx-auto">
        {/* 존재하는 레벨 카드들 */}
        {variants.map((v) => (
          <LevelEditCard
            key={v.id}
            storybookId={v.id}
            level={v.level}
            isBase={v.isBase}
            expanded={expandedLevel === v.level}
            onToggle={() => toggleLevel(v.level)}
            onDelete={!v.isBase ? () => handleDeleteVariant(v.id, v.level) : undefined}
            hasMounted={mountedLevels.has(v.level)}
            onMounted={() =>
              setMountedLevels((s) => {
                if (s.has(v.level)) return s;
                const next = new Set(s);
                next.add(v.level);
                return next;
              })
            }
          />
        ))}

        {/* 미존재 레벨 — placeholder 카드 (클릭 시 추가 모달) */}
        {missingLevels.map((lv) => {
          const info = LEVEL_INFO[lv];
          return (
            <button
              key={lv}
              onClick={() => handleAddLevel(lv)}
              className="w-full rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-600 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 px-5 py-3 text-left transition-colors group flex items-center gap-3"
            >
              <span className="text-2xl opacity-40 group-hover:opacity-100">{info.emoji}</span>
              <div className="flex-1">
                <div className="text-sm font-bold text-slate-400 dark:text-slate-500 group-hover:text-emerald-700 dark:group-hover:text-emerald-300">
                  ➕ {lv} {info.label} <span className="text-xs font-normal">{info.age}</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  아직 만들지 않은 레벨 — 클릭하면 새 콘텐츠 만들기 시작
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {pendingLevelAdd && (
        <AddLevelConfirmModal
          level={pendingLevelAdd}
          baseTitle={baseTitle}
          pending={createVariantMutation.isPending}
          onConfirm={confirmAddLevel}
          onCancel={() => {
            if (!createVariantMutation.isPending) setPendingLevelAdd(null);
          }}
        />
      )}
    </div>
  );
}
