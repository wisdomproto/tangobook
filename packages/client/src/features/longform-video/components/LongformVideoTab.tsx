import type { Storybook, LongformProject } from '@tangobook/shared';
import { useState, useMemo, useEffect, useRef } from 'react';
import { useEditorLang } from '@/contexts/EditorLangContext';
import { groupLongformByStyle } from '../lib/group-by-style';
import { liftSubMasters } from '../lib/migrate-longform';
import { LongformProjectGroup } from './LongformProjectGroup';

interface Props {
  storybook: Storybook;
  onUpdate: (updater: (draft: Storybook) => void) => void;
  onSave: () => void;
}

function makeProject(name: string, lang: string, artStyle?: string): Omit<LongformProject, 'id'> {
  return {
    name,
    aspectRatio: '16:9',
    language: lang,
    artStyle,
    scenes: [],
    bgmVolume: 30,
    subtitleStyle: {
      fontSize: 44,
      position: 'bottom',
      textColor: '#ffffff',
      outlineColor: '#000000',
      bgColor: '#00000080',
    },
  };
}

/**
 * 같은 그림체 다른 언어 master 의 비디오 클립/SFX/타이밍 share.
 * 언어 바뀌면 ttsUrl/자막 비우는 대신 storybook.pages[].translations[lang] 에서 자동 매핑 —
 * 사용자가 /editor2 에서 번역/TTS 를 미리 채워두면 cell 생성 즉시 타임라인이 사용 가능.
 * 번역 데이터 없으면 빈 채로 두고 Step 1 의 "수동 제작/AI 분석" 을 안내 (langDataStatus 배너).
 */
function cloneScenesForNewLang(
  src: LongformProject['scenes'],
  langChanged: boolean,
  storybook: Storybook,
  targetLang: string
): LongformProject['scenes'] {
  if (!langChanged) {
    return (src ?? []).map((s) => ({
      ...s,
      id: crypto.randomUUID(),
      trimStart: undefined,
      trimEnd: undefined,
      sfxOffset: undefined,
      ttsOffset: undefined,
      subtitles: s.subtitles.map((sub) => ({ ...sub, id: crypto.randomUUID() })),
    }));
  }

  const isKo = targetLang === 'ko';
  const pageByNum = new Map(storybook.pages.map((p) => [p.pageNumber, p]));

  return (src ?? []).map((s) => {
    const page = typeof s.pageNumber === 'number' ? pageByNum.get(s.pageNumber) : undefined;
    const text = isKo ? page?.text : page?.translations?.[targetLang]?.text;
    const ttsUrl = isKo ? page?.ttsUrl : page?.translations?.[targetLang]?.ttsUrl;

    const sentences = (text ?? '')
      .split(/(?<=[.!?。！？])\s*/)
      .map((t) => t.trim())
      .filter(Boolean);
    const dur = s.clipDuration;
    let subtitles: LongformProject['scenes'][number]['subtitles'] = [];
    if (sentences.length === 1) {
      subtitles = [{ id: crypto.randomUUID(), text: sentences[0], startTime: 0, endTime: dur }];
    } else if (sentences.length > 1) {
      const sliceDur = dur / sentences.length;
      subtitles = sentences.map((sent, i) => ({
        id: crypto.randomUUID(),
        text: sent,
        startTime: Math.round(i * sliceDur * 100) / 100,
        endTime: Math.round((i + 1) * sliceDur * 100) / 100,
      }));
    }

    return {
      ...s,
      id: crypto.randomUUID(),
      trimStart: undefined,
      trimEnd: undefined,
      sfxOffset: undefined,
      ttsOffset: undefined,
      ttsUrl,
      ttsDuration: undefined,
      subtitles,
    };
  });
}

export function LongformVideoTab({ storybook, onUpdate, onSave }: Props) {
  const externalLang = useEditorLang();
  const externalStyle = storybook.artStyle;

  const allProjects = storybook.longformProjects ?? [];
  const groups = useMemo(() => groupLongformByStyle(storybook), [storybook]);

  // 활성 cell (외부 chip 으로부터 derive)
  const activeStyle = externalStyle ?? groups.find((g) => !g.isEmpty)?.artStyle ?? null;
  const activeLang = externalLang ?? 'ko';
  const activeProject =
    activeStyle != null
      ? (groups.find((g) => g.artStyle === activeStyle)?.byLanguage[activeLang] ?? null)
      : null;

  // 펼친 그림체 그룹들 — 사용자 헤더 클릭으로 toggle. 외부 chip 변경 시 그 그림체만 펼침으로 reset.
  const [expandedStyles, setExpandedStyles] = useState<Set<string>>(() =>
    activeStyle ? new Set([activeStyle]) : new Set()
  );
  useEffect(() => {
    setExpandedStyles(activeStyle ? new Set([activeStyle]) : new Set());
  }, [activeStyle]);
  const toggleExpanded = (style: string) => {
    setExpandedStyles((prev) => {
      const next = new Set(prev);
      if (next.has(style)) next.delete(style);
      else next.add(style);
      return next;
    });
  };

  // 디바운스된 onSave — 슬라이더 드래그 등 빠른 연속 update 시 R2 PUT race 방지.
  // 응답이 out-of-order 도착하면 AppLayout 이 localRef 를 옛 값으로 리셋해 슬라이더가
  // "지맘대로 움직이는" 증상이 나옴. 마지막 변경 후 250ms 정적이면 1회만 save.
  // unmount 시 pending 변경 누락 방지 위해 flush.
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;
  useEffect(
    () => () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
        onSaveRef.current();
      }
    },
    []
  );
  const scheduleSave = () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveTimerRef.current = null;
      onSave();
    }, 250);
  };

  const updateProject = (
    id: string,
    updates: Partial<Omit<LongformProject, 'id'>> | ((proj: LongformProject) => void)
  ) => {
    onUpdate((d) => {
      liftSubMasters(d);
      const p = d.longformProjects?.find((x) => x.id === id);
      if (!p) return;
      if (typeof updates === 'function') {
        updates(p);
      } else {
        for (const [k, v] of Object.entries(updates)) {
          if (v === undefined) delete (p as unknown as Record<string, unknown>)[k];
          else (p as unknown as Record<string, unknown>)[k] = v;
        }
      }
    });
    scheduleSave();
  };

  const deleteProject = (id: string) => {
    const target = allProjects.find((p) => p.id === id);
    if (!target) return;
    if (!window.confirm(`"${target.name}" 영상을 삭제하시겠습니까?`)) return;
    onUpdate((d) => {
      liftSubMasters(d);
      d.longformProjects = d.longformProjects?.filter((p) => p.id !== id);
    });
    onSave();
  };

  /**
   * (style, lang) cell 자동 생성 — 같은 그림체에 다른 언어 cell 있으면 clipUrl/SFX/BGM 공유,
   * storybook.pages[].translations[lang] 에서 ttsUrl/자막 자동 매핑.
   * 같은 그림체 cell 이 없으면 빈 cell — 사용자는 Step 1 에서 분석/생성.
   */
  const addLanguageCell = (style: string, lang: string) => {
    const id = `lf-${Date.now()}`;
    onUpdate((d) => {
      liftSubMasters(d);
      if (!d.longformProjects) d.longformProjects = [];
      const sameStyle = d.longformProjects.find((p) => p.artStyle === style);
      const baseName = sameStyle?.name?.replace(/\s*\([^)]+\)\s*$/, '') ?? '새 동영상';
      const proj: LongformProject = {
        ...makeProject(`${baseName} (${lang})`, lang, style),
        id,
      };
      if (sameStyle) {
        const langChanged = (sameStyle.language ?? 'ko') !== lang;
        proj.scenes = cloneScenesForNewLang(sameStyle.scenes, langChanged, storybook, lang);
        proj.bgmUrl = sameStyle.bgmUrl;
        proj.bgmVolume = sameStyle.bgmVolume;
        proj.subtitleStyle = sameStyle.subtitleStyle;
      }
      d.longformProjects.push(proj);
    });
    onSave();
  };

  // 외부 (style, lang) chip 변경 시 cell 없으면 자동 생성.
  // ref 가드: StrictMode dev 의 effect 더블 실행 + storybook update propagate 전 ref 가 stale 한 동안 중복 create 방지.
  // cell 존재 확인되면 ref 해제 → 추후 삭제 시 재생성 가능.
  const lastAutoCreateKeyRef = useRef<string | null>(null);
  useEffect(() => {
    if (!activeStyle) return;
    const group = groups.find((g) => g.artStyle === activeStyle);
    if (!group) return;
    if (group.byLanguage[activeLang]) {
      lastAutoCreateKeyRef.current = null;
      return;
    }
    const key = `${activeStyle}::${activeLang}`;
    if (lastAutoCreateKeyRef.current === key) return;
    lastAutoCreateKeyRef.current = key;
    addLanguageCell(activeStyle, activeLang);
  }, [activeStyle, activeLang, groups]);

  if (groups.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400 dark:text-slate-500">
        <p className="text-sm">먼저 그림체를 등록한 뒤 영상을 만들 수 있어요.</p>
        <p className="text-xs mt-1">/editor2 에서 그림체를 추가하세요.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">동영상</h2>
        <span className="text-sm text-slate-400 dark:text-slate-500">({allProjects.length}개)</span>
      </div>

      {groups.map((g) => (
        <LongformProjectGroup
          key={g.artStyle}
          storybook={storybook}
          storybookId={storybook.id}
          group={g}
          expanded={expandedStyles.has(g.artStyle)}
          onToggle={() => toggleExpanded(g.artStyle)}
          activeLang={activeLang}
          activeProject={g.byLanguage[activeLang] ?? null}
          otherStylesWithVideos={groups
            .filter((other) => other.artStyle !== g.artStyle && !other.isEmpty)
            .map((other) => ({ style: other.label, langs: Object.keys(other.byLanguage) }))}
          onUpdateProject={updateProject}
          onDeleteProject={deleteProject}
        />
      ))}
    </div>
  );
}
