import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { KoreanTextarea } from '../../ui/korean-input';
import { Button } from '../../ui/button';
import { TEXT_MODELS, IMAGE_MODELS } from '../../lib/ai-models';
import { ASPECT_RATIO_PRESETS, ImageStyleSelector } from './ImageStyleSelector';
import { cn } from '../../lib/utils';

interface ChannelModelSelectorProps {
  textModel: string;
  imageModel: string;
  onTextModelChange: (model: string) => void;
  onImageModelChange: (model: string) => void;
  showImageModel?: boolean;
  aspectRatio?: string;
  onAspectRatioChange?: (ratio: string) => void;
  imageStyle?: string;
  onImageStyleChange?: (style: string) => void;
  showImageSettings?: boolean;
  defaultAspectRatio?: string;
  imageInstruction?: string;
  onImageInstructionChange?: (instruction: string) => void;
}

export function ChannelModelSelector({
  textModel,
  imageModel,
  onTextModelChange,
  onImageModelChange,
  showImageModel = true,
  aspectRatio,
  onAspectRatioChange,
  imageStyle,
  onImageStyleChange,
  showImageSettings = true,
  defaultAspectRatio,
  imageInstruction,
  onImageInstructionChange,
}: ChannelModelSelectorProps) {
  const [imageSettingsOpen, setImageSettingsOpen] = useState(false);

  const effectiveAspectRatio = aspectRatio ?? defaultAspectRatio ?? '1:1';

  return (
    <div className="space-y-2">
      {/* Text model row */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground w-16 shrink-0">텍스트</span>
        <Select value={textModel} onValueChange={onTextModelChange}>
          <SelectTrigger className="h-7 flex-1 min-w-0 text-xs">
            <SelectValue placeholder="텍스트 모델" />
          </SelectTrigger>
          <SelectContent>
            {TEXT_MODELS.map((m) => (
              <SelectItem key={m.id} value={m.id} className="text-xs">
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Image model row */}
      {showImageModel && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground w-16 shrink-0">이미지</span>
          <Select value={imageModel} onValueChange={onImageModelChange}>
            <SelectTrigger className="h-7 flex-1 min-w-0 text-xs">
              <SelectValue placeholder="이미지 모델" />
            </SelectTrigger>
            <SelectContent>
              {IMAGE_MODELS.map((m) => (
                <SelectItem key={m.id} value={m.id} className="text-xs">
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Aspect ratio + style (collapsible) */}
      {showImageSettings && showImageModel && (
        <div>
          <Button
            size="xs"
            variant="ghost"
            onClick={() => setImageSettingsOpen((p) => !p)}
            className={cn('gap-1 text-xs text-muted-foreground', imageSettingsOpen && 'mb-2')}
          >
            이미지 설정
            {imageSettingsOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </Button>

          {imageSettingsOpen && (
            <div className="space-y-2 pl-2 border-l-2 border-border">
              {/* Aspect ratio */}
              {onAspectRatioChange && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-14 shrink-0">비율</span>
                  <Select value={effectiveAspectRatio} onValueChange={onAspectRatioChange}>
                    <SelectTrigger className="h-7 flex-1 text-xs">
                      <SelectValue placeholder="비율" />
                    </SelectTrigger>
                    <SelectContent>
                      {ASPECT_RATIO_PRESETS.map((p) => (
                        <SelectItem key={p.value} value={p.value} className="text-xs">
                          {p.label}
                          {p.desc ? ` — ${p.desc}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Image style */}
              {onImageStyleChange && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-14 shrink-0">스타일</span>
                  <div className="flex-1">
                    <ImageStyleSelector
                      value={imageStyle ?? ''}
                      onChange={onImageStyleChange}
                      compact
                    />
                  </div>
                </div>
              )}

              {/* Image instruction */}
              {onImageInstructionChange && (
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">이미지 지시사항</span>
                  <KoreanTextarea
                    value={imageInstruction ?? ''}
                    onCommit={onImageInstructionChange}
                    placeholder="이미지 생성 시 추가 지시사항 (선택)"
                    className="text-xs min-h-[60px] resize-none"
                    rows={3}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
