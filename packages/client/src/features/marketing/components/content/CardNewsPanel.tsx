/**
 * CardNewsPanel — Instagram carousel (카드뉴스) content panel.
 *
 * Port of ContentFlow cardnews-panel.tsx (986 lines) adapted to the Tangobook
 * Vite + TanStack Query + Zustand v5 stack.
 *
 * Key adaptations vs. CF original:
 *   • useProjectStore reads → TanStack graph slice (igContent.cards) + write hooks
 *   • batch image gen → batch-image-store (O-E, survives tab switches)
 *   • Template localStorage→DB migration dropped (O-C: fresh DB, 0 CF keys)
 *   • baseArticle injected from the content graph (fidelity point #1)
 *   • Every card created/replaced carries user_id (R-9)
 *   • Canvas WebP export via renderCardToBlob (Chunk 0, O-A proxy-draw fallback)
 *   • O-D persistence: text/number inputs → 500 ms useDebouncedSave; drag/resize →
 *     persisted on pointer-up via onUpdate (CardNewsCardItem calls onUpdate at each
 *     pointer-move; CardNewsPanelInner debounces that call per card)
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Eye,
  EyeOff,
  Loader2,
  Hash,
  X,
  Download,
  Upload,
  ChevronDown,
  Save,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
} from 'lucide-react';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { KoreanInput } from '../../ui/korean-input';
import { Textarea } from '../../ui/textarea';
import {
  CardNewsCardItem,
  AddSlideButton,
  parseCanvasData,
  defaultCanvasData,
} from './CardNewsCardItem';
import { PromptEditDialog } from './PromptEditDialog';
import { ChannelModelSelector } from './ChannelModelSelector';
import { ChannelContentList } from './ChannelContentList';
import { ChannelTranslationView } from './ChannelTranslationView';
import { GenerationButton } from './GenerationButton';
import { CARD_TEMPLATES, type CardTemplate } from './cardnews-templates';
import { useAiGeneration } from '../../hooks/use-ai-generation';
import { useCardImageGeneration } from '../../hooks/use-card-image-generation';
import { useChannelModels } from '../../api/use-channel-models';
import { useContent } from '../../api/use-contents';
import {
  useStorybookRef,
  storybookIdFromMemo,
  type StorybookCharacterRef,
} from '../../api/use-storybook-ref';
import {
  useCreateInstagramContent,
  useUpdateInstagramContent,
  useDeleteInstagramContent,
  useSetInstagramCards,
  useAddInstagramCard,
  useUpdateInstagramCard,
  useDeleteInstagramCard,
} from '../../api/use-instagram-contents';
import {
  useCardTemplates,
  useHiddenBuiltins,
  useCreateCardTemplate,
  useUpdateCardTemplate,
  useDeleteCardTemplate,
  useHideBuiltin,
} from '../../api/use-card-templates';
import { useBatchImageStore, selectBatchProgress } from '../../store/batch-image-store';
import { useUIStore } from '../../store/ui-store';
import { buildCardNewsImagePromptsPrompt, NO_TEXT_IMAGE_RULE } from '../../lib/prompt-builder';
import { renderCardToBlob, effectiveFontSize } from '../../lib/canvas-export';
import { supabase } from '../../api/supabase';
import { generateId, cn } from '../../lib/utils';
import type {
  BaseArticle,
  Content,
  Project,
  InstagramContent,
  InstagramCard,
} from '../../types/database';
import type { CardCanvasData, TextBlock } from '../../types/cards';
import type { CardTemplateRow } from '../../types/database';

// ─── Helpers ───────────────────────────────────────────────────────────────────

async function getCurrentUserId(): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('인증이 필요합니다');
  return user.id;
}

/** Map a CardTemplateRow from Supabase to the CardTemplate shape used in the UI. */
function rowToTemplate(row: CardTemplateRow): CardTemplate {
  return {
    id: row.id,
    name: row.name,
    bgColor: row.bg_color,
    imageY: Number(row.image_y),
    textBlocks: row.text_blocks as Omit<TextBlock, 'text'>[],
    preview: row.preview ?? { bg: row.bg_color, textColor: '#ffffff' },
  };
}

// ─── Template Sidebar ──────────────────────────────────────────────────────────

interface TemplateSidebarProps {
  allTemplates: CardTemplate[];
  activeTemplateId: string | null;
  onSelect: (tpl: CardTemplate) => void;
  onHide: (id: string) => void;
  onNew: () => void;
  /** Whether the active template is a built-in (disallow direct rename/delete). */
  isBuiltinActive: boolean;
  /** Current working template data for the "속성" (property) panel. */
  workingTplData: CardTemplate | null;
  onUpdateWorking: (patch: Partial<CardTemplate>) => void;
  onUpdateWorkingBlock: (blockId: string, patch: Partial<TextBlock>) => void;
  onSave: () => void;
  onDelete: () => void;
  onRename: (id: string, name: string) => void;
  customTemplateIds: Set<string>;
}

function TemplateSidebar({
  allTemplates,
  activeTemplateId,
  onSelect,
  onHide,
  onNew,
  workingTplData,
  onUpdateWorking,
  onUpdateWorkingBlock,
  onSave,
  onDelete,
  onRename,
  isBuiltinActive,
  customTemplateIds,
}: TemplateSidebarProps) {
  const [showProps, setShowProps] = useState(false);

  return (
    <div className="flex flex-col gap-2 h-full overflow-y-auto">
      <div className="flex items-center justify-between shrink-0">
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
          템플릿
        </span>
        <Button variant="outline" size="sm" onClick={onNew} className="h-6 text-[10px] gap-1 px-2">
          <Plus size={10} /> 새 템플릿
        </Button>
      </div>

      {/* Template list */}
      <div className="flex flex-col gap-1.5">
        {allTemplates.map((tpl) => {
          const isActive = tpl.id === activeTemplateId;
          const isCustom = customTemplateIds.has(tpl.id);
          return (
            <div
              key={tpl.id}
              className={cn(
                'group relative flex items-center gap-2 rounded-md px-2 py-1.5 cursor-pointer hover:bg-muted/50 transition-colors',
                isActive && 'bg-primary/10 ring-1 ring-primary/30'
              )}
              onClick={() => onSelect(tpl)}
            >
              {/* Color swatch */}
              <div
                className="w-5 h-5 rounded-sm shrink-0 border border-border/50"
                style={{ backgroundColor: tpl.preview.bg }}
              />
              <span className="text-[11px] flex-1 truncate">{tpl.name}</span>
              {/* Hide / delete */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onHide(tpl.id);
                }}
                className="opacity-0 group-hover:opacity-100 text-[9px] text-muted-foreground hover:text-destructive transition-opacity"
                title={isCustom ? '삭제' : '숨기기'}
              >
                {isCustom ? <Trash2 size={10} /> : <EyeOff size={10} />}
              </button>
            </div>
          );
        })}
      </div>

      {/* Property panel for active template */}
      {workingTplData && (
        <div className="border-t border-border pt-2 mt-1 space-y-2">
          <button
            className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground w-full"
            onClick={() => setShowProps(!showProps)}
          >
            <ChevronDown
              size={10}
              className={cn('transition-transform', !showProps && '-rotate-90')}
            />
            템플릿 속성
          </button>
          {showProps && (
            <div className="space-y-2 text-[10px]">
              {/* Name (custom only) */}
              {!isBuiltinActive && (
                <div className="flex items-center gap-1.5">
                  <span className="text-muted-foreground w-10 shrink-0">이름</span>
                  <KoreanInput
                    value={workingTplData.name}
                    onCommit={(v) => {
                      onUpdateWorking({ name: v });
                      onRename(workingTplData.id, v);
                    }}
                    className="flex-1 h-6 text-[10px]"
                  />
                </div>
              )}
              {/* Background color */}
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground w-10 shrink-0">배경</span>
                <input
                  type="color"
                  value={workingTplData.bgColor}
                  onChange={(e) => onUpdateWorking({ bgColor: e.target.value })}
                  className="w-6 h-6 rounded border border-border cursor-pointer p-0"
                />
              </div>
              {/* imageY */}
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground w-10 shrink-0">이미지Y</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={workingTplData.imageY}
                  onChange={(e) => onUpdateWorking({ imageY: Number(e.target.value) })}
                  className="flex-1"
                />
                <span className="w-6 text-right">{workingTplData.imageY}%</span>
              </div>
              {/* Text blocks */}
              {workingTplData.textBlocks.map((b) => (
                <div key={b.id} className="border border-border rounded p-1 space-y-1">
                  <span className="font-medium uppercase">{b.id}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground w-8">색</span>
                    <input
                      type="color"
                      value={b.color}
                      onChange={(e) => onUpdateWorkingBlock(b.id, { color: e.target.value })}
                      className="w-5 h-5 rounded border border-border cursor-pointer p-0"
                    />
                    <span className="text-muted-foreground w-8">크기</span>
                    <input
                      type="number"
                      min={8}
                      max={72}
                      value={b.fontSize}
                      onChange={(e) =>
                        onUpdateWorkingBlock(b.id, { fontSize: Number(e.target.value) || 14 })
                      }
                      className="w-10 h-5 text-center bg-transparent border border-border rounded"
                    />
                  </div>
                </div>
              ))}
              {/* Save / Delete actions */}
              <div className="flex gap-1.5 pt-1">
                <Button size="sm" onClick={onSave} className="flex-1 h-6 text-[10px] gap-1">
                  <Save size={10} /> {isBuiltinActive ? '복사본 저장' : '저장'}
                </Button>
                {!isBuiltinActive && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onDelete}
                    className="h-6 text-[10px] text-destructive border-destructive/30"
                  >
                    <Trash2 size={10} />
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Character reference bar (classic storybooks only) ──────────────────────────

/** Copy an R2 image to the clipboard as PNG (via same-origin proxy → canvas). */
async function copyImageToClipboard(url: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/mkt/storage/proxy?url=${encodeURIComponent(url)}`);
    const blob = await res.blob();
    const bitmap = await createImageBitmap(blob);
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0);
    const png = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob null'))), 'image/png')
    );
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': png })]);
    return true;
  } catch {
    return false;
  }
}

/**
 * 명작 동화의 캐릭터 레퍼런스 썸네일 바. 각 캐릭터 클릭 시 이미지를 클립보드로 복사
 * (실패 시 새 탭) → AI 이미지 생성 툴에 붙여넣어 캐릭터 일관성을 유지한다.
 */
function CharacterRefBar({ storybookId }: { storybookId: string }) {
  const { data } = useStorybookRef(storybookId, true);
  const [copied, setCopied] = useState<string | null>(null);
  const chars = data?.characters ?? [];
  if (!chars.length) return null;

  const handleCopy = async (c: StorybookCharacterRef) => {
    if (!c.referenceImage) return;
    const ok = await copyImageToClipboard(c.referenceImage);
    if (ok) {
      setCopied(c.name);
      setTimeout(() => setCopied((v) => (v === c.name ? null : v)), 1500);
    } else {
      window.open(c.referenceImage, '_blank');
    }
  };

  return (
    <div className="px-3 py-2 border-b border-border shrink-0">
      <div className="text-[10px] text-muted-foreground mb-1.5">
        🎭 캐릭터 레퍼런스 — 썸네일 클릭 시 이미지 복사, AI 이미지 생성 시 붙여넣어 캐릭터를
        일관되게 유지하세요
      </div>
      <div className="flex items-start gap-2 flex-wrap">
        {chars.map((c) => (
          <div key={c.name} className="flex flex-col items-center gap-1 w-16">
            <button
              type="button"
              onClick={() => handleCopy(c)}
              title={`${c.name}${c.role ? ` (${c.role})` : ''} — 레퍼런스 이미지 복사`}
              className="relative w-16 h-16 rounded-lg overflow-hidden border border-border bg-muted hover:ring-2 hover:ring-primary/40 transition-shadow"
            >
              {c.referenceImage ? (
                <img src={c.referenceImage} alt={c.name} className="w-full h-full object-cover" />
              ) : (
                <span className="flex items-center justify-center w-full h-full text-[9px] text-muted-foreground text-center">
                  이미지 없음
                </span>
              )}
              <span className="absolute bottom-0.5 right-0.5 rounded bg-black/55 text-white p-0.5">
                {copied === c.name ? <Check size={10} /> : <Copy size={10} />}
              </span>
            </button>
            <span className="text-[9px] text-center leading-tight w-full truncate" title={c.name}>
              {c.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Preview Modal ─────────────────────────────────────────────────────────────

interface PreviewModalProps {
  cards: InstagramCard[];
  initialIndex: number;
  onClose: () => void;
}

function PreviewModal({ cards, initialIndex, onClose }: PreviewModalProps) {
  const [idx, setIdx] = useState(initialIndex);
  const card = cards[idx];
  const data = card ? parseCanvasData(card.text_style, card.background_image_url) : null;
  const total = cards.length;

  const prev = () => setIdx((i) => Math.max(0, i - 1));
  const next = () => setIdx((i) => Math.min(total - 1, i + 1));

  // Keyboard nav
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col items-center gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Slide preview — mirrors CardNewsCardItem + canvas-export (box image / divider / pill). */}
        <div
          className="relative rounded-xl overflow-hidden"
          style={{
            width: 270,
            height: 337.5,
            backgroundColor: data?.bgColor ?? '#000',
          }}
        >
          {data?.imageUrl &&
            (data.imageRect ? (
              <div
                className="absolute overflow-hidden"
                style={{
                  left: `${data.imageRect.x}%`,
                  top: `${data.imageRect.y}%`,
                  width: `${data.imageRect.w}%`,
                  height: `${data.imageRect.h}%`,
                  borderRadius: '5%',
                }}
              >
                <img
                  src={data.imageUrl}
                  alt=""
                  className="w-full h-full object-cover pointer-events-none"
                />
              </div>
            ) : (
              <img
                src={data.imageUrl}
                alt=""
                className="absolute inset-x-0 object-cover pointer-events-none"
                style={{
                  top: `${data.imageY}%`,
                  transform: 'translateY(-50%)',
                  width: '100%',
                }}
              />
            ))}
          {data?.divider && (
            <div
              className="absolute"
              style={{
                left: `${data.divider.x ?? 8}%`,
                top: `${data.divider.y}%`,
                width: `${data.divider.w ?? 18}%`,
                height: 3,
                borderRadius: 999,
                backgroundColor: data.divider.color,
              }}
            />
          )}
          {data?.textBlocks
            .filter((b) => !b.hidden && b.text)
            .map((b) => (
              <div
                key={b.id}
                className="absolute"
                style={{
                  left: `${b.x}%`,
                  top: `${b.y}%`,
                  width: b.pill ? 'auto' : `${b.width}%`,
                  fontSize: effectiveFontSize(b) * 0.9,
                  color: b.color,
                  fontFamily: b.fontFamily ? `"${b.fontFamily}", sans-serif` : undefined,
                  fontWeight: b.fontWeight,
                  textAlign: b.textAlign,
                  lineHeight: b.lineHeight ?? 1.4,
                  whiteSpace: b.pill ? 'nowrap' : 'pre-line',
                  wordBreak: 'break-word',
                  ...(b.pill
                    ? {
                        backgroundColor: b.pillColor ?? 'rgba(0,0,0,0.06)',
                        borderRadius: '999px',
                        padding: '0.28em 0.7em',
                      }
                    : {}),
                }}
              >
                {b.text}
              </div>
            ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={prev}
            disabled={idx === 0}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft size={16} />
          </Button>
          <span className="text-sm text-white">
            {idx + 1} / {total}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={next}
            disabled={idx === total - 1}
            className="h-8 w-8 p-0"
          >
            <ChevronRight size={16} />
          </Button>
        </div>

        <Button variant="ghost" onClick={onClose} className="text-white">
          닫기
        </Button>
      </div>
    </div>
  );
}

// ─── CardNewsPanelInner ────────────────────────────────────────────────────────

interface CardNewsPanelInnerProps {
  igContent: InstagramContent & { cards: InstagramCard[] };
  content: Content;
  project: Project;
  baseArticle: BaseArticle | null;
  channelModels: ReturnType<typeof useChannelModels>['models'];
}

function CardNewsPanelInner({
  igContent,
  content,
  project,
  baseArticle,
  channelModels,
}: CardNewsPanelInnerProps) {
  const contentId = content.id;
  const igContentId = igContent.id;
  // 명작 동화(classic)만 캐릭터 레퍼런스를 노출. 자연관찰은 캐릭터 없음.
  const storybookId = storybookIdFromMemo(content.memo);
  const showCharacterRefs = content.category === 'classic' && !!storybookId;

  // ── Server-side cards → local mirror ──────────────────────────────────────
  const [localCards, setLocalCards] = useState<InstagramCard[]>(() =>
    [...(igContent.cards ?? [])].sort((a, b) => a.sort_order - b.sort_order)
  );

  // Sync when the graph refetches (keyed to igContentId so we don't stomp live edits)
  const prevIgIdRef = useRef<string | null>(null);
  if (prevIgIdRef.current !== igContentId) {
    prevIgIdRef.current = igContentId;
    setLocalCards([...(igContent.cards ?? [])].sort((a, b) => a.sort_order - b.sort_order));
  }

  // ── Per-card debounced saves (O-D) — one hook per card is too many instances;
  //    instead we use a single Map-based debounce pattern below. ────────────
  const cardSaveTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // ── Caption / hashtags ────────────────────────────────────────────────────
  const [caption, setCaption] = useState(igContent.caption ?? '');
  const [hashtagInput, setHashtagInput] = useState('');
  const [hashtags, setHashtags] = useState<string[]>(igContent.hashtags ?? []);

  // ── Template state ────────────────────────────────────────────────────────
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
  const [workingTplData, setWorkingTplData] = useState<CardTemplate | null>(null);
  const [showTemplatesSidebar, setShowTemplatesSidebar] = useState(false);

  // ── Preview modal ─────────────────────────────────────────────────────────
  const [showPreview, setShowPreview] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [allPromptsCopied, setAllPromptsCopied] = useState(false);

  // ── Prompt dialog ─────────────────────────────────────────────────────────
  const [showPromptDialog, setShowPromptDialog] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState('');

  // ── Reference image for per-card generation ───────────────────────────────
  const [referenceImageData, setReferenceImageData] = useState<{
    base64: string;
    mimeType: string;
  } | null>(null);

  // ── Mutation hooks ────────────────────────────────────────────────────────
  const setInstagramCards = useSetInstagramCards();
  const addInstagramCard = useAddInstagramCard();
  const updateInstagramCard = useUpdateInstagramCard();
  const deleteInstagramCard = useDeleteInstagramCard();
  const updateInstagramContent = useUpdateInstagramContent();

  // Template hooks
  const { data: customTemplateRows = [] } = useCardTemplates(project.id);
  const { data: hiddenBuiltinIds = [] } = useHiddenBuiltins(project.id);
  const createCardTemplate = useCreateCardTemplate();
  const updateCardTemplate = useUpdateCardTemplate();
  const deleteCardTemplate = useDeleteCardTemplate();
  const hideBuiltin = useHideBuiltin();

  // ── Batch image store ─────────────────────────────────────────────────────
  const batchJob = useBatchImageStore(selectBatchProgress(igContentId));
  const startBatchJob = useBatchImageStore((s) => s.startJob);
  const abortBatchJob = useBatchImageStore((s) => s.abortJob);

  // ── Compute allTemplates (built-ins + custom, minus hidden) ──────────────
  const savedTemplates = (customTemplateRows ?? []).map(rowToTemplate);
  const customTemplateIdSet = new Set(savedTemplates.map((t) => t.id));
  const allTemplates = [...CARD_TEMPLATES, ...savedTemplates].filter(
    (t) => !hiddenBuiltinIds.includes(t.id)
  );

  // Sync workingTplData when activeTemplateId changes.
  // allTemplates is intentionally excluded from deps — we only want to re-run
  // when the selected template id changes, not on every template list refresh.
  useEffect(() => {
    if (!activeTemplateId) return;
    const found = allTemplates.find((t) => t.id === activeTemplateId);
    if (found) setWorkingTplData({ ...found });
  }, [activeTemplateId]); // allTemplates intentionally omitted (stable built-ins)

  // Auto-hashtags from content tags (once per igContent).
  // igContentId is the dependency that scopes the one-time effect per content.
  const autoHashtagDoneRef = useRef(false);
  useEffect(() => {
    if (autoHashtagDoneRef.current || hashtags.length > 0) return;
    if (!content.tags?.length) return;
    autoHashtagDoneRef.current = true;
    const fromTags = content.tags.map((t) => (t.startsWith('#') ? t : `#${t}`));
    setHashtags(fromTags);
    updateInstagramContent.mutate({ id: igContentId, contentId, updates: { hashtags: fromTags } });
  }, [igContentId]); // intentional one-shot per igContentId

  // ── O-D high-frequency persistence: per-card debounce (500 ms) ───────────
  const scheduleCardSave = useCallback(
    (cardId: string, updates: Partial<InstagramCard>) => {
      // Clear existing timer
      const existing = cardSaveTimers.current.get(cardId);
      if (existing) clearTimeout(existing);

      // Schedule new save
      // O-D: text_style/canvas changes → 500 ms debounce
      const t = setTimeout(() => {
        cardSaveTimers.current.delete(cardId);
        updateInstagramCard.mutate({ cardId, contentId, updates });
      }, 500);
      cardSaveTimers.current.set(cardId, t);
    },
    [contentId, updateInstagramCard]
  );

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      cardSaveTimers.current.forEach(clearTimeout);
    };
  }, []);

  // ── Card update handler (local + debounced persist) ───────────────────────
  const handleCardUpdate = useCallback(
    (cardId: string, updates: Partial<InstagramCard>) => {
      setLocalCards((prev) => prev.map((c) => (c.id === cardId ? { ...c, ...updates } : c)));
      // O-D: schedule debounced DB write for canvas/text_style changes
      scheduleCardSave(cardId, updates);
    },
    [scheduleCardSave]
  );

  // ── Apply template to all cards ───────────────────────────────────────────
  // Preserves existing text in each matching block (by id), only updates layout/style.
  const applyTemplate = useCallback(
    async (tpl: CardTemplate) => {
      setActiveTemplateId(tpl.id);
      setWorkingTplData({ ...tpl });

      const updatedCards = localCards.map((card) => {
        const existing = parseCanvasData(card.text_style, card.background_image_url);
        // Map template blocks → keep existing text by block id
        const newBlocks: TextBlock[] = tpl.textBlocks.map((tplBlock) => {
          const existingBlock = existing.textBlocks.find((b) => b.id === tplBlock.id);
          return {
            ...tplBlock,
            text: existingBlock?.text ?? '',
          };
        });
        const newCanvasData: CardCanvasData = {
          bgColor: tpl.bgColor,
          imageUrl: existing.imageUrl,
          imageY: tpl.imageY,
          textBlocks: newBlocks,
        };
        return {
          ...card,
          background_color: tpl.bgColor,
          text_style: newCanvasData as unknown as Record<string, unknown>,
        };
      });

      setLocalCards(updatedCards);

      // Persist all via setInstagramCards (bulk replace)
      await setInstagramCards.mutateAsync({
        igContentId,
        contentId,
        cards: updatedCards,
      });
    },
    [localCards, igContentId, contentId, setInstagramCards]
  );

  // ── Template working-data updates (live-apply to all cards) ──────────────
  const handleUpdateWorking = useCallback(
    (patch: Partial<CardTemplate>) => {
      if (!workingTplData) return;
      const updated = { ...workingTplData, ...patch };
      setWorkingTplData(updated);
      // Live-apply layout changes to all local cards
      setLocalCards((prev) =>
        prev.map((card) => {
          const existing = parseCanvasData(card.text_style, card.background_image_url);
          const newCanvasData: CardCanvasData = {
            ...existing,
            bgColor: 'bgColor' in patch ? (patch.bgColor ?? existing.bgColor) : existing.bgColor,
            imageY: 'imageY' in patch ? (patch.imageY ?? existing.imageY) : existing.imageY,
          };
          return {
            ...card,
            text_style: newCanvasData as unknown as Record<string, unknown>,
          };
        })
      );
    },
    [workingTplData]
  );

  const handleUpdateWorkingBlock = useCallback(
    (blockId: string, blockPatch: Partial<TextBlock>) => {
      if (!workingTplData) return;
      const updatedBlocks = workingTplData.textBlocks.map((b) =>
        b.id === blockId ? { ...b, ...blockPatch } : b
      );
      const updated = { ...workingTplData, textBlocks: updatedBlocks };
      setWorkingTplData(updated);
      // Live-apply to local cards
      setLocalCards((prev) =>
        prev.map((card) => {
          const existing = parseCanvasData(card.text_style, card.background_image_url);
          const newBlocks = existing.textBlocks.map((b) =>
            b.id === blockId ? { ...b, ...blockPatch } : b
          );
          const newCanvasData = { ...existing, textBlocks: newBlocks };
          return {
            ...card,
            text_style: newCanvasData as unknown as Record<string, unknown>,
          };
        })
      );
    },
    [workingTplData]
  );

  // ── Template save (custom or "built-in copy") ─────────────────────────────
  const handleSaveTemplate = useCallback(async () => {
    if (!workingTplData) return;
    const isBuiltin = !customTemplateIdSet.has(workingTplData.id);

    if (isBuiltin) {
      // O-B: save as a new "(수정)" custom copy, set it as active (R-10)
      const newId = await createCardTemplate.mutateAsync({
        projectId: project.id,
        data: {
          name: `${workingTplData.name} (수정)`,
          bg_color: workingTplData.bgColor,
          image_y: workingTplData.imageY,
          text_blocks: workingTplData.textBlocks as unknown as Record<string, unknown>[],
          preview: { bg: workingTplData.bgColor, textColor: '#ffffff' },
        },
      });
      setActiveTemplateId(newId);
    } else {
      // Update existing custom template
      await updateCardTemplate.mutateAsync({
        id: workingTplData.id,
        projectId: project.id,
        updates: {
          name: workingTplData.name,
          bg_color: workingTplData.bgColor,
          image_y: workingTplData.imageY,
          text_blocks: workingTplData.textBlocks as unknown as Record<string, unknown>[],
        },
      });
    }
  }, [workingTplData, project.id, createCardTemplate, updateCardTemplate, customTemplateIdSet]);

  // ── Template delete ───────────────────────────────────────────────────────
  const handleDeleteTemplate = useCallback(async () => {
    if (!workingTplData) return;
    const isBuiltin = !customTemplateIdSet.has(workingTplData.id);

    if (isBuiltin) {
      await hideBuiltin.mutateAsync({ projectId: project.id, builtinId: workingTplData.id });
    } else {
      await deleteCardTemplate.mutateAsync({ id: workingTplData.id, projectId: project.id });
    }
    setActiveTemplateId(null);
    setWorkingTplData(null);
  }, [workingTplData, project.id, hideBuiltin, deleteCardTemplate, customTemplateIdSet]);

  // ── Template rename (custom only) ─────────────────────────────────────────
  const handleRenameTemplate = useCallback(
    async (id: string, name: string) => {
      if (!customTemplateIdSet.has(id)) return;
      await updateCardTemplate.mutateAsync({ id, projectId: project.id, updates: { name } });
    },
    [customTemplateIdSet, project.id, updateCardTemplate]
  );

  // ── New template ──────────────────────────────────────────────────────────
  const handleNewTemplate = useCallback(async () => {
    const newId = await createCardTemplate.mutateAsync({
      projectId: project.id,
      data: {
        name: '새 템플릿',
        bg_color: '#18181b',
        image_y: 50,
        text_blocks: defaultCanvasData().textBlocks as unknown as Record<string, unknown>[],
        preview: { bg: '#18181b', textColor: '#ffffff' },
      },
    });
    setActiveTemplateId(newId);
  }, [project.id, createCardTemplate]);

  // ── AI text generation ────────────────────────────────────────────────────
  const { isGenerating, generate, abort } = useAiGeneration({
    onComplete: useCallback(
      async (fullText: string) => {
        try {
          const match = fullText.match(/\{[\s\S]*\}/);
          if (!match) throw new Error('JSON not found');
          const parsed = JSON.parse(match[0]) as {
            caption?: string;
            hashtags?: string[];
            slides?: Array<{
              header?: string;
              title?: string;
              body?: string;
              footer?: string;
              image_prompt?: string;
            }>;
          };
          if (!parsed.slides?.length) throw new Error('slides empty');

          // Update caption + hashtags
          const newCaption = parsed.caption ?? '';
          const newHashtags = parsed.hashtags ?? [];
          setCaption(newCaption);
          setHashtags(newHashtags);
          await updateInstagramContent.mutateAsync({
            id: igContentId,
            contentId,
            updates: { caption: newCaption, hashtags: newHashtags },
          });

          // Stamp user_id (R-9, mirrors BlogPanel.tsx:196-217)
          const userId = await getCurrentUserId();
          const now = new Date().toISOString();

          const newCards: InstagramCard[] = parsed.slides.map((slide, i) => {
            // Body truncation to ~80 chars (CF :262-287)
            const bodyRaw = slide.body ?? '';
            const body = bodyRaw.length > 80 ? bodyRaw.substring(0, 80).trimEnd() + '…' : bodyRaw;

            const canvasData: CardCanvasData = {
              ...defaultCanvasData(),
              textBlocks: defaultCanvasData().textBlocks.map((b) => {
                if (b.id === 'header') return { ...b, text: slide.header ?? '' };
                if (b.id === 'title') return { ...b, text: slide.title ?? '' };
                if (b.id === 'body') return { ...b, text: body };
                if (b.id === 'footer') return { ...b, text: slide.footer ?? '' };
                return b;
              }),
            };

            return {
              id: generateId(),
              user_id: userId,
              instagram_content_id: igContentId,
              text_content:
                [slide.header, slide.title, body, slide.footer].filter(Boolean).join('\n') || null,
              background_color: canvasData.bgColor,
              background_image_url: null,
              text_style: canvasData as unknown as Record<string, unknown>,
              image_prompt: slide.image_prompt ?? null,
              reference_image_url: null,
              sort_order: i,
              created_at: now,
              updated_at: now,
            };
          });

          setLocalCards(newCards);
          await setInstagramCards.mutateAsync({ igContentId, contentId, cards: newCards });
        } catch {
          alert('카드뉴스 프롬프트 파싱 실패. 다시 시도해 주세요.');
        }
      },
      [igContentId, contentId, updateInstagramContent, setInstagramCards]
    ),
    onError: useCallback((msg: string) => {
      alert(`생성 오류: ${msg}`);
    }, []),
  });

  // ── Build and open prompt dialog ──────────────────────────────────────────
  const handleGenerate = useCallback(() => {
    // Read blog cards from the cache (CF :329-351)
    // blogSections come from content graph blogContents[0].cards
    // We don't have direct access here; use baseArticle as the primary source.
    const prompt = buildCardNewsImagePromptsPrompt({
      project,
      content,
      baseArticle: baseArticle ?? undefined,
    });
    setGeneratedPrompt(prompt);
    setShowPromptDialog(true);
  }, [project, content, baseArticle]);

  // ── Per-card image generation (§7 adaptation) ────────────────────────────
  const imageStyle =
    channelModels.imageStyle ||
    'Photorealistic, high quality photography, natural lighting, detailed';

  const { isGenerating: isGeneratingImage, generateForCard } = useCardImageGeneration({
    projectId: project.id,
    category: 'images',
    getPrompt: (cardId: string) => {
      const c = localCards.find((x) => x.id === cardId);
      const base = c?.image_prompt
        ? `${imageStyle}. ${c.image_prompt}`
        : `Create an illustration for social media card: "${c?.text_content || 'Slide'}". ${imageStyle}`;
      return `${base}\n${NO_TEXT_IMAGE_RULE}`;
    },
    getModel: () => channelModels.imageModel,
    getAspectRatio: () => channelModels.aspectRatio || '4:5',
    getReferenceImages: referenceImageData ? (_cardId: string) => [referenceImageData] : undefined,
    onSave: async (cardId: string, url: string, prompt: string) => {
      setLocalCards((prev) =>
        prev.map((c) =>
          c.id === cardId ? { ...c, background_image_url: url, image_prompt: prompt } : c
        )
      );
      await updateInstagramCard.mutateAsync({
        cardId,
        contentId,
        updates: { background_image_url: url, image_prompt: prompt },
      });
    },
  });

  // ── Batch image generation (§5.5 store bridge) ────────────────────────────
  const handleGenerateAllImages = useCallback(async () => {
    const prompts = localCards.map((card, i) => {
      const base = card.image_prompt
        ? `${imageStyle}. ${card.image_prompt}`
        : `Create an illustration for social media card: "${card.text_content || `Slide ${i + 1}`}". ${imageStyle}`;
      return {
        prompt: `${base}\n${NO_TEXT_IMAGE_RULE}`,
        aspectRatio: channelModels.aspectRatio || '4:5',
        slideIndex: i,
      };
    });

    // cardIdsByIndex = snapshot of card ids in sort order (O-E bridge)
    const cardIdsByIndex = localCards.map((c) => c.id);

    // onSaved bridge: persists to DB and updates local state
    // Note: useUpdateInstagramCard() is a hook — we capture the mutateAsync via a stable ref
    await startBatchJob({
      igContentId,
      prompts,
      cardIdsByIndex,
      imageModel: channelModels.imageModel,
      projectId: project.id,
      onSaved: async (cardId: string, url: string) => {
        setLocalCards((prev) =>
          prev.map((c) => (c.id === cardId ? { ...c, background_image_url: url } : c))
        );
        await updateInstagramCard.mutateAsync({
          cardId,
          contentId,
          updates: { background_image_url: url },
        });
      },
    });
  }, [
    localCards,
    imageStyle,
    channelModels.aspectRatio,
    channelModels.imageModel,
    igContentId,
    project.id,
    startBatchJob,
    contentId,
    updateInstagramCard,
  ]);

  // ── Canvas WebP download (Chunk 0 renderCardToBlob, O-G fonts) ────────────
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadAllImages = useCallback(async () => {
    setIsDownloading(true);
    try {
      // O-G: wait for fonts before rasterizing
      await document.fonts.ready;

      for (let i = 0; i < localCards.length; i++) {
        const card = localCards[i];
        try {
          const data = parseCanvasData(card.text_style, card.background_image_url);
          const blob = await renderCardToBlob(data);
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `cardnews_${String(i + 1).padStart(2, '0')}.webp`;
          a.click();
          URL.revokeObjectURL(url);
          // 500 ms gap between downloads (CF :462-471)
          if (i < localCards.length - 1) {
            await new Promise<void>((r) => setTimeout(r, 500));
          }
        } catch (err) {
          console.warn(`[download] Slide ${i + 1} failed:`, (err as Error).message);
        }
      }
    } finally {
      setIsDownloading(false);
    }
  }, [localCards]);

  // ── Add slide ─────────────────────────────────────────────────────────────
  const handleAddSlide = useCallback(async () => {
    await addInstagramCard.mutateAsync({
      igContentId,
      contentId,
      sortOrder: localCards.length,
    });
  }, [addInstagramCard, igContentId, contentId, localCards.length]);

  // ── Delete slide ──────────────────────────────────────────────────────────
  const handleDeleteSlide = useCallback(
    (cardId: string) => {
      setLocalCards((prev) => prev.filter((c) => c.id !== cardId));
      deleteInstagramCard.mutate({ cardId, contentId });
    },
    [deleteInstagramCard, contentId]
  );

  // ── Reference image upload ─────────────────────────────────────────────────
  const handleReferenceUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      setReferenceImageData({ base64, mimeType: file.type });
    };
    reader.readAsDataURL(file);
  }, []);

  const hasImages = localCards.some((c) => c.background_image_url);
  const isBuiltinActive = activeTemplateId !== null && !customTemplateIdSet.has(activeTemplateId);

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── Templates sidebar ── */}
      {showTemplatesSidebar && (
        <div className="w-44 border-r border-border p-2 shrink-0 overflow-y-auto">
          <TemplateSidebar
            allTemplates={allTemplates}
            activeTemplateId={activeTemplateId}
            onSelect={applyTemplate}
            onHide={(id) => {
              const isCustom = customTemplateIdSet.has(id);
              if (isCustom) {
                deleteCardTemplate.mutate({ id, projectId: project.id });
              } else {
                hideBuiltin.mutate({ projectId: project.id, builtinId: id });
              }
            }}
            onNew={handleNewTemplate}
            isBuiltinActive={isBuiltinActive}
            workingTplData={workingTplData}
            onUpdateWorking={handleUpdateWorking}
            onUpdateWorkingBlock={handleUpdateWorkingBlock}
            onSave={handleSaveTemplate}
            onDelete={handleDeleteTemplate}
            onRename={handleRenameTemplate}
            customTemplateIds={customTemplateIdSet}
          />
        </div>
      )}

      {/* ── Main panel ── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Header toolbar */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border shrink-0 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTemplatesSidebar(!showTemplatesSidebar)}
            className={cn('h-7 text-[11px] gap-1', showTemplatesSidebar && 'bg-muted')}
          >
            {showTemplatesSidebar ? <EyeOff size={11} /> : <Eye size={11} />}
            템플릿
          </Button>

          <Badge variant="outline" className="text-[10px] px-1.5">
            4:5
          </Badge>

          <GenerationButton
            isGenerating={isGenerating}
            onClick={handleGenerate}
            onAbort={abort}
            label="AI 텍스트"
            loadingLabel="생성 중..."
            size="sm"
          />

          <GenerationButton
            variant="batch-image"
            isGenerating={batchJob.isRunning}
            onClick={handleGenerateAllImages}
            onAbort={() => abortBatchJob(igContentId)}
            label="전체 이미지"
            loadingLabel="이미지 생성 중..."
            progress={{ current: batchJob.current, total: batchJob.total }}
            size="sm"
            disabled={localCards.length === 0}
          />

          {hasImages && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadAllImages}
              disabled={isDownloading}
              className="h-7 text-[11px] gap-1"
            >
              {isDownloading ? (
                <Loader2 size={11} className="animate-spin" />
              ) : (
                <Download size={11} />
              )}
              다운로드
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setPreviewIndex(0);
              setShowPreview(true);
            }}
            disabled={localCards.length === 0}
            className="h-7 text-[11px] gap-1"
          >
            <Eye size={11} /> 미리보기
          </Button>

          {/* Copy all card prompts at once */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const text = localCards
                .map((c, i) => `[${i + 1}/${localCards.length}] ${(c.image_prompt ?? '').trim()}`)
                .join('\n\n');
              navigator.clipboard.writeText(text);
              setAllPromptsCopied(true);
              setTimeout(() => setAllPromptsCopied(false), 1500);
            }}
            disabled={!localCards.some((c) => c.image_prompt)}
            className="h-7 text-[11px] gap-1"
          >
            {allPromptsCopied ? <Check size={11} /> : <Copy size={11} />}
            {allPromptsCopied ? '복사됨' : '전체 프롬프트'}
          </Button>

          {/* Reference image upload */}
          <label className="inline-flex items-center gap-1 h-7 px-2 text-[11px] rounded-md border border-border hover:bg-accent cursor-pointer transition-colors">
            <Upload size={11} />
            {referenceImageData ? '참조 변경' : '참조 이미지'}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleReferenceUpload(f);
                e.target.value = '';
              }}
            />
          </label>
          {referenceImageData && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReferenceImageData(null)}
              className="h-7 w-7 p-0 text-muted-foreground"
            >
              <X size={11} />
            </Button>
          )}
        </div>

        {/* Caption + hashtags */}
        <div className="px-3 py-2 border-b border-border shrink-0 space-y-2">
          <div>
            <div className="text-[10px] text-muted-foreground mb-1">캡션</div>
            <Textarea
              value={caption}
              onChange={(e) => {
                setCaption(e.target.value);
                updateInstagramContent.mutate({
                  id: igContentId,
                  contentId,
                  updates: { caption: e.target.value },
                });
              }}
              placeholder="인스타그램 캡션을 입력하세요..."
              className="resize-none text-[11px] h-16"
            />
          </div>

          {/* Hashtags */}
          <div>
            <div className="text-[10px] text-muted-foreground mb-1">해시태그</div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {hashtags.map((tag, i) => (
                <Badge key={i} variant="secondary" className="gap-1 text-[10px] cursor-pointer">
                  <Hash size={9} />
                  {tag.replace(/^#/, '')}
                  <button
                    onClick={() => {
                      const next = hashtags.filter((_, j) => j !== i);
                      setHashtags(next);
                      updateInstagramContent.mutate({
                        id: igContentId,
                        contentId,
                        updates: { hashtags: next },
                      });
                    }}
                    className="hover:text-destructive"
                  >
                    <X size={9} />
                  </button>
                </Badge>
              ))}
              <input
                value={hashtagInput}
                onChange={(e) => setHashtagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && hashtagInput.trim()) {
                    const tag = hashtagInput.trim().startsWith('#')
                      ? hashtagInput.trim()
                      : `#${hashtagInput.trim()}`;
                    const next = [...hashtags, tag];
                    setHashtags(next);
                    setHashtagInput('');
                    updateInstagramContent.mutate({
                      id: igContentId,
                      contentId,
                      updates: { hashtags: next },
                    });
                  }
                }}
                placeholder="태그 입력 후 Enter"
                className="text-[10px] bg-transparent border-none outline-none flex-1 min-w-20"
              />
            </div>
          </div>
        </div>

        {/* Character reference bar — classic storybooks only */}
        {showCharacterRefs && storybookId && <CharacterRefBar storybookId={storybookId} />}

        {/* Slide grid (compact, responsive) */}
        <div className="flex-1 overflow-y-auto p-3">
          <div
            className="grid gap-2"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(185px, 1fr))' }}
          >
            {localCards.map((card, i) => (
              <CardNewsCardItem
                key={card.id}
                card={card}
                index={i}
                onUpdate={handleCardUpdate}
                onDelete={handleDeleteSlide}
                onGenerateImage={() => {
                  if (!isGeneratingImage) generateForCard(card.id);
                }}
                isGeneratingImage={
                  batchJob.isRunning && batchJob.currentSlideIndex === card.sort_order
                }
                onSelect={() => {
                  setPreviewIndex(i);
                }}
              />
            ))}
            <AddSlideButton onAdd={handleAddSlide} />
          </div>
        </div>
      </div>

      {/* Prompt dialog */}
      <PromptEditDialog
        open={showPromptDialog}
        onOpenChange={setShowPromptDialog}
        initialPrompt={generatedPrompt}
        onConfirm={(prompt) => {
          setShowPromptDialog(false);
          generate(prompt, channelModels.textModel);
        }}
        title="카드뉴스 AI 텍스트 프롬프트"
      />

      {/* Preview modal */}
      {showPreview && localCards.length > 0 && (
        <PreviewModal
          cards={localCards}
          initialIndex={previewIndex}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}

// ─── CardNewsPanel (outer) ─────────────────────────────────────────────────────

interface CardNewsPanelProps {
  content: Content;
  project: Project;
}

export function CardNewsPanel({ content, project }: CardNewsPanelProps) {
  const { selectedContentId } = useUIStore();

  // Fidelity point #1: read baseArticle from the content graph
  const { data: contentGraph, isLoading } = useContent(selectedContentId);
  const { models: channelModels, setChannelModels } = useChannelModels(project.id, 'cardnews');

  const createInstagramContent = useCreateInstagramContent();
  const deleteInstagramContent = useDeleteInstagramContent();
  const updateInstagramContent = useUpdateInstagramContent();

  const igContents = (contentGraph?.instagramContents ?? []) as Array<
    InstagramContent & { cards: InstagramCard[] }
  >;

  // baseArticle — forwarded into the inner panel (fidelity point #1)
  const baseArticle = contentGraph?.baseArticle ?? null;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 size={20} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Channel model selector */}
      <div className="p-3 border-b border-border shrink-0">
        <ChannelModelSelector
          textModel={channelModels.textModel}
          imageModel={channelModels.imageModel}
          onTextModelChange={(m) => setChannelModels({ textModel: m })}
          onImageModelChange={(m) => setChannelModels({ imageModel: m })}
          aspectRatio={channelModels.aspectRatio || '4:5'}
          onAspectRatioChange={(r) => setChannelModels({ aspectRatio: r })}
          imageStyle={channelModels.imageStyle}
          onImageStyleChange={(s) => setChannelModels({ imageStyle: s })}
          defaultAspectRatio="4:5"
        />
      </div>

      {/* Content list */}
      <div className="flex-1 overflow-y-auto p-3">
        <ChannelTranslationView contentId={content.id} channel="instagram" />
        <ChannelContentList
          items={igContents}
          getId={(ig) => ig.id}
          getTitle={(ig) => ig.title || '카드뉴스'}
          onTitleChange={(id, title) =>
            updateInstagramContent.mutate({ id, contentId: content.id, updates: { title } })
          }
          onAdd={async () => {
            const id = await createInstagramContent.mutateAsync({ contentId: content.id });
            return id;
          }}
          onDelete={(id) => deleteInstagramContent.mutate({ id, contentId: content.id })}
          accentColor="border-l-4 border-l-indigo-600"
          addLabel="새 카드뉴스 추가"
          renderContent={(ig) => (
            <CardNewsPanelInner
              key={ig.id}
              igContent={ig}
              content={content}
              project={project}
              baseArticle={baseArticle}
              channelModels={channelModels}
            />
          )}
        />
      </div>
    </div>
  );
}
