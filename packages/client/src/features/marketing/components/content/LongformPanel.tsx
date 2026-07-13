/**
 * LongformPanel — 롱폼(오디오북) 채널 패널.
 *
 * 서버 렌더 파이프라인이 storybook × (artStyle × language) 조합마다 영상을 렌더하고
 * 제목/설명/태그 + 다국어 SRT 캡션 + 썸네일을 자동 생성해 `mkt_youtube_contents` 행으로
 * upsert 한다(행 discriminator = `video_settings.artStyle` / `.language`). 이 패널은
 * 그 결과물을 보여주고 메타(제목/설명/태그)만 편집한다 — AI 대본/씬/타임라인 없음.
 */

import { useEffect, useMemo, useState } from 'react';
import { Copy, Check, Film, Download, Loader2 } from 'lucide-react';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { useContent } from '../../api/use-contents';
import { useDebouncedSave } from '../../api/use-debounced-save';
import { useUIStore } from '../../store/ui-store';
import { cn } from '../../lib/utils';
import type { Content, Project, YoutubeContent } from '../../types/database';

interface LongformVideoSettings {
  bookId?: string;
  artStyle?: string;
  language?: string;
  aspectRatio?: string;
  captions?: Record<string, string>;
}

function getSettings(yc: YoutubeContent): LongformVideoSettings {
  return (yc.video_settings ?? {}) as LongformVideoSettings;
}

const LANG_LABELS: Record<string, string> = {
  ko: '🇰🇷 한국어',
  en: '🇺🇸 영어',
  vi: '🇻🇳 베트남어',
  zh: '🇨🇳 중국어',
  th: '🇹🇭 태국어',
  ja: '🇯🇵 일본어',
};

function langLabel(lang: string): string {
  return LANG_LABELS[lang] ?? lang.toUpperCase();
}

interface LongformPanelProps {
  content: Content;
  project: Project;
}

export function LongformPanel({ content }: LongformPanelProps) {
  const { selectedLanguage } = useUIStore();
  const activeLang = selectedLanguage || 'ko';

  const { data: graph, isLoading } = useContent(content.id);
  const youtubeContents = useMemo(
    () => (graph?.youtubeContents ?? []) as YoutubeContent[],
    [graph?.youtubeContents]
  );

  // 그림체(artStyle) 목록 — 등장 순서 유지, 중복 제거.
  const styles = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const yc of youtubeContents) {
      const s = getSettings(yc).artStyle;
      if (s && !seen.has(s)) {
        seen.add(s);
        out.push(s);
      }
    }
    return out;
  }, [youtubeContents]);

  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  useEffect(() => {
    if (selectedStyle && styles.includes(selectedStyle)) return;
    setSelectedStyle(styles[0] ?? null);
  }, [styles, selectedStyle]);

  const selectedRow = useMemo(() => {
    if (!selectedStyle) return null;
    return (
      youtubeContents.find((yc) => {
        const s = getSettings(yc);
        return s.artStyle === selectedStyle && s.language === activeLang;
      }) ?? null
    );
  }, [youtubeContents, selectedStyle, activeLang]);

  const debouncedSave = useDebouncedSave('mkt_youtube_contents', selectedRow?.id ?? '');

  // 로컬 draft — 선택된 행이 바뀔 때만 재시딩.
  const [titleDraft, setTitleDraft] = useState('');
  const [descDraft, setDescDraft] = useState('');
  const [tagsDraft, setTagsDraft] = useState('');

  useEffect(() => {
    setTitleDraft(selectedRow?.video_title ?? '');
    setDescDraft(selectedRow?.video_description ?? '');
    setTagsDraft((selectedRow?.video_tags ?? []).join(', '));
  }, [selectedRow?.id]);

  const [copiedLang, setCopiedLang] = useState<string | null>(null);

  const captions = getSettings(selectedRow ?? ({} as YoutubeContent)).captions ?? {};
  const captionLangs = Object.keys(captions);

  function handleTitleChange(v: string) {
    setTitleDraft(v);
    if (!selectedRow) return;
    debouncedSave({ video_title: v });
  }

  function handleDescChange(v: string) {
    setDescDraft(v);
    if (!selectedRow) return;
    debouncedSave({ video_description: v });
  }

  function handleTagsChange(v: string) {
    setTagsDraft(v);
    if (!selectedRow) return;
    const tags = v
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    debouncedSave({ video_tags: tags });
  }

  async function copyCaption(lang: string) {
    const srt = captions[lang];
    if (!srt) return;
    try {
      await navigator.clipboard.writeText(srt);
      setCopiedLang(lang);
      setTimeout(() => setCopiedLang((cur) => (cur === lang ? null : cur)), 1500);
    } catch {
      // clipboard unavailable — ignore
    }
  }

  function downloadCaption(lang: string) {
    const srt = captions[lang];
    if (!srt) return;
    const blob = new Blob([srt], { type: 'application/x-subrip' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${content.title || 'longform'}-${lang}.srt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 size={20} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* 그림체 서브탭 */}
      {styles.length > 0 && (
        <div className="flex shrink-0 flex-wrap items-center gap-1 border-b border-border p-3">
          <span className="mr-1 text-xs font-semibold text-muted-foreground">그림체</span>
          {styles.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSelectedStyle(s)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-semibold transition-colors',
                s === selectedStyle
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground ring-1 ring-border hover:bg-muted'
              )}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4">
        {!selectedRow ? (
          <div className="flex h-60 flex-col items-center justify-center rounded-lg border-2 border-dashed border-border text-center text-muted-foreground">
            <Film size={28} />
            <p className="mt-2 text-sm font-semibold">아직 영상이 없어요</p>
            <p className="mt-1 max-w-xs text-xs">
              롱폼 오디오북 영상은 서버 렌더 파이프라인이 그림체·언어 조합마다 자동으로 생성합니다.
              생성되면 여기에 표시됩니다.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* 영상 + 썸네일 */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="md:col-span-2">
                {selectedRow.video_url ? (
                  <video
                    key={selectedRow.video_url}
                    src={selectedRow.video_url}
                    controls
                    playsInline
                    preload="metadata"
                    poster={selectedRow.thumbnail_url ?? undefined}
                    className="w-full rounded-lg bg-black"
                    style={{ aspectRatio: '16 / 9' }}
                  >
                    <track kind="captions" />
                  </video>
                ) : (
                  <div className="flex h-48 flex-col items-center justify-center rounded-lg border-2 border-dashed border-border text-center text-muted-foreground">
                    <Film size={28} />
                    <p className="mt-2 text-sm font-semibold">아직 영상이 없어요</p>
                    <p className="mt-1 max-w-xs text-xs">
                      이 그림체·언어 조합의 영상은 렌더 파이프라인이 완료되면 표시됩니다.
                    </p>
                  </div>
                )}
              </div>
              <div>
                <div className="mb-1 text-xs font-semibold text-muted-foreground">
                  썸네일 ({langLabel(activeLang)})
                </div>
                {selectedRow.thumbnail_url ? (
                  <img
                    src={selectedRow.thumbnail_url}
                    alt="썸네일"
                    className="w-full rounded-lg border border-border bg-black object-cover"
                    style={{ aspectRatio: '16 / 9' }}
                  />
                ) : (
                  <div className="flex h-24 items-center justify-center rounded-lg border-2 border-dashed border-border text-xs text-muted-foreground">
                    썸네일 없음
                  </div>
                )}
              </div>
            </div>

            {/* 메타 편집 */}
            <div className="rounded-lg border border-border p-3 space-y-3">
              <div className="text-xs font-semibold text-muted-foreground">
                자동 생성 메타 · 필요 시 수정 가능
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  영상 제목
                </label>
                <Input
                  value={titleDraft}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="영상 제목"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  설명 (캡션)
                </label>
                <Textarea
                  value={descDraft}
                  onChange={(e) => handleDescChange(e.target.value)}
                  placeholder="영상 설명"
                  rows={4}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  태그 (쉼표 구분)
                </label>
                <Input
                  value={tagsDraft}
                  onChange={(e) => handleTagsChange(e.target.value)}
                  placeholder="태그1, 태그2, 태그3"
                />
              </div>
            </div>

            {/* 다국어 캡션 */}
            <div className="rounded-lg border border-border bg-muted/40 p-3">
              <div className="mb-2 text-xs font-semibold text-muted-foreground">
                다국어 캡션 (SRT)
              </div>
              {captionLangs.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {captionLangs.map((lang) => (
                    <div
                      key={lang}
                      className="flex items-center gap-1 rounded-full border border-border bg-background px-2 py-1"
                    >
                      <Badge variant="secondary" className="text-[11px]">
                        {langLabel(lang)}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 gap-1 px-1.5 text-[11px]"
                        onClick={() => void copyCaption(lang)}
                      >
                        {copiedLang === lang ? <Check size={11} /> : <Copy size={11} />}
                        복사
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 gap-1 px-1.5 text-[11px]"
                        onClick={() => downloadCaption(lang)}
                      >
                        <Download size={11} />
                        다운로드
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-muted-foreground">
                  아직 생성된 캡션이 없어요. 렌더 파이프라인이 완료되면 언어별 SRT가 표시됩니다.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
