import { Languages, GripVertical, X } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../../../ui';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Project } from '../../../types/database';
import { SUPPORTED_LANGUAGES } from '@tangobook/shared';

// 마케팅 타겟 언어 후보 = 전역 지원 언어 단일 소스(nativeName 표기). zh 간체·th 등 자동 반영.
const AVAILABLE_LANGUAGES = SUPPORTED_LANGUAGES.map((l) => ({
  code: l.code,
  label: l.nativeName,
  flag: l.flag,
}));

function SortableLangItem({
  code,
  label,
  flag,
  onRemove,
}: {
  code: string;
  label: string;
  flag: string;
  onRemove: (code: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: code,
  });
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
      className="flex items-center gap-2 px-3 py-2 rounded-md border border-border bg-background hover:bg-muted/50 transition-colors"
    >
      <button
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
        {...attributes}
        {...listeners}
        aria-label="드래그하여 순서 변경"
      >
        <GripVertical size={14} />
      </button>
      <span className="text-base">{flag}</span>
      <span className="text-sm flex-1">{label}</span>
      <button
        onClick={() => onRemove(code)}
        className="text-muted-foreground hover:text-destructive transition-colors"
        aria-label={`${label} 제거`}
      >
        <X size={14} />
      </button>
    </div>
  );
}

interface Props {
  project: Project;
  onUpdate: (updates: Partial<Project>) => void;
}

export function TargetLanguagesSection({ project, onUpdate }: Props) {
  const rawLanguages: string[] = project.target_languages ?? [];
  // ko is always pinned first
  const targetLanguages = rawLanguages.includes('ko')
    ? ['ko', ...rawLanguages.filter((l) => l !== 'ko')]
    : ['ko', ...rawLanguages];

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const addLanguage = (code: string | undefined) => {
    if (!code || targetLanguages.includes(code)) return;
    onUpdate({ target_languages: [...targetLanguages, code] });
  };

  const removeLanguage = (code: string) => {
    if (code === 'ko') return; // ko cannot be removed
    onUpdate({ target_languages: targetLanguages.filter((l) => l !== code) });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const nonKo = targetLanguages.filter((l) => l !== 'ko');
    const oldIdx = nonKo.indexOf(active.id as string);
    const newIdx = nonKo.indexOf(over.id as string);
    if (oldIdx === -1 || newIdx === -1) return;
    const reordered = arrayMove(nonKo, oldIdx, newIdx);
    onUpdate({ target_languages: ['ko', ...reordered] });
  };

  const nonKoLanguages = targetLanguages.filter((l) => l !== 'ko');
  const availableToAdd = AVAILABLE_LANGUAGES.filter((lang) => !targetLanguages.includes(lang.code));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Languages size={16} /> 타겟 언어
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          콘텐츠를 생성할 타겟 언어를 선택하세요. AI가 해당 언어에 맞게 콘텐츠를 최적화합니다.
        </p>

        <div className="space-y-1.5">
          {/* Korean — pinned, non-removable */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-border bg-muted/30">
            <div className="w-[14px]" />
            <span className="text-base">🇰🇷</span>
            <span className="text-sm flex-1">한국어</span>
            <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
              기본
            </Badge>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={nonKoLanguages} strategy={verticalListSortingStrategy}>
              {nonKoLanguages.map((code) => {
                const lang = AVAILABLE_LANGUAGES.find((l) => l.code === code);
                if (!lang) return null;
                return (
                  <SortableLangItem
                    key={code}
                    code={code}
                    label={lang.label}
                    flag={lang.flag}
                    onRemove={removeLanguage}
                  />
                );
              })}
            </SortableContext>
          </DndContext>
        </div>

        {availableToAdd.length > 0 && (
          <Select onValueChange={addLanguage} value="">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="+ 언어 추가" />
            </SelectTrigger>
            <SelectContent>
              {availableToAdd.map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  <span className="flex items-center gap-2">
                    <span>{lang.flag}</span>
                    <span>{lang.label}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {nonKoLanguages.length > 0 && (
          <p className="text-xs text-muted-foreground">
            드래그하여 순서를 변경하거나 × 버튼으로 언어를 제거할 수 있습니다.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
