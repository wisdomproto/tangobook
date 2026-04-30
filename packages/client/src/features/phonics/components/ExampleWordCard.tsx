import type { Storybook, TracingPoint } from '@tangobook/shared';
import { Button } from '@/design-system';
import { ImageDropZone } from '@/components/ImageDropZone';
import { ImagePreview } from '@/components/ImagePreview';
import { DownloadButton } from '@/components/DownloadButton';
import { UploadMenu } from '@/components/UploadMenu';
import { TtsRow } from './TtsRow';
import { ImageDescriptionInput } from './ImageDescriptionInput';
import { ImageHistory } from './ImageHistory';

type StorybookUpdater = (draft: Storybook, url: string) => void;

interface ExampleWordCardProps {
  word: string;
  onset: string;
  blend: string;
  placeholder?: string;
  // Image
  imageUrl?: string;
  imageDescription?: string;
  imageHistory?: string[];
  // TTS
  wordTtsUrl?: string;
  onsetTtsUrl?: string;
  // Keys
  imgKey: string;
  wordTtsKey: string;
  onsetTtsKey: string;
  // Updaters
  imageUpdater: StorybookUpdater;
  wordTtsUpdater: StorybookUpdater;
  onsetTtsUpdater: StorybookUpdater;
  // Callbacks
  onWordChange: (value: string) => void;
  onImageDelete: () => void;
  onImageDescChange: (value: string) => void;
  onImageDescDraft: (value: string | undefined) => void;
  onHistoryRestore: (historyIdx: number) => void;
  // Tracing
  tracingPoints?: TracingPoint[];
  onTracingEdit: () => void;
  onTracingPreview?: () => void;
  // Shared state & actions
  isBusy: boolean;
  generatingImage: boolean;
  uploading: boolean;
  generatingWordTts: boolean;
  generatingOnsetTts: boolean;
  imageMutate: (params: {
    word: string;
    description?: string;
    key: string;
    updater: StorybookUpdater;
    isolatedObject?: boolean;
  }) => void;
  handleUpload: (file: File, key: string, updater: StorybookUpdater) => void;
  generateTts: (word: string, key: string, updater: StorybookUpdater) => void;
  handleTtsUpload: (file: File, key: string, updater: StorybookUpdater) => void;
  getTtsText: (key: string, defaultText: string) => string;
  setTtsText: (key: string, text: string) => void;
  setLightboxUrl: (url: string | null) => void;
  /** false이면 헤더(onset+blend→word) 생략, 이미지/TTS만 렌더 */
  showHeader?: boolean;
}

export function ExampleWordCard({
  word,
  onset,
  blend,
  placeholder,
  imageUrl,
  imageDescription,
  imageHistory,
  wordTtsUrl,
  onsetTtsUrl,
  imgKey,
  wordTtsKey,
  onsetTtsKey,
  imageUpdater,
  wordTtsUpdater,
  onsetTtsUpdater,
  tracingPoints,
  onTracingEdit,
  onTracingPreview,
  onWordChange,
  onImageDelete,
  onImageDescChange,
  onImageDescDraft,
  onHistoryRestore,
  isBusy,
  generatingImage,
  uploading,
  generatingWordTts,
  generatingOnsetTts,
  imageMutate,
  handleUpload,
  generateTts,
  handleTtsUpload,
  getTtsText,
  setTtsText,
  setLightboxUrl,
  showHeader = true,
}: ExampleWordCardProps) {
  return (
    <div className={showHeader ? 'p-5' : ''}>
      {showHeader && (
        <div className="flex items-center gap-2 mb-3">
          <span className="px-3 py-1 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-sm font-bold">
            {onset}
          </span>
          <span className="text-xs text-slate-400 font-bold">+</span>
          <span className="px-3 py-1 rounded-lg bg-sky-100 dark:bg-sky-900/40 text-red-500 dark:text-red-400 text-sm font-bold">
            {blend}
          </span>
          <span className="text-xs text-slate-400 font-bold">&rarr;</span>
          <input
            value={word}
            onChange={(e) => onWordChange(e.target.value)}
            placeholder={placeholder}
            className="w-28 text-lg font-bold text-slate-800 dark:text-slate-100 bg-transparent border-b border-dashed border-slate-300 dark:border-slate-600 focus:outline-none focus:border-violet-500"
          />
        </div>
      )}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-shrink-0 w-full sm:w-40">
          <ImageDropZone
            onFile={(f) => handleUpload(f, imgKey, imageUpdater)}
            disabled={isBusy}
            enablePaste={false}
          >
            {(openFilePicker) => (
              <div className="space-y-2">
                <ImagePreview
                  src={imageUrl}
                  alt={word}
                  loading={generatingImage || uploading}
                  size="sm"
                  aspectRatio="1/1"
                  emptyText={word}
                  onClick={() => imageUrl && setLightboxUrl(imageUrl)}
                  onDelete={imageUrl ? () => onImageDelete() : undefined}
                />
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="flex-1"
                    onClick={() =>
                      imageMutate({
                        word,
                        description: imageDescription,
                        key: imgKey,
                        updater: imageUpdater,
                        isolatedObject: true,
                      })
                    }
                    loading={generatingImage}
                    disabled={isBusy}
                  >
                    {imageUrl ? '재생성' : '생성'}
                  </Button>
                  {imageUrl && <DownloadButton href={imageUrl} filename={`${word}.png`} />}
                  <UploadMenu
                    onFile={(f) => handleUpload(f, imgKey, imageUpdater)}
                    openFilePicker={openFilePicker}
                    disabled={isBusy}
                  />
                </div>
                <ImageDescriptionInput
                  value={imageDescription}
                  onChange={onImageDescChange}
                  onDraftChange={onImageDescDraft}
                />
                <ImageHistory history={imageHistory} onRestore={onHistoryRestore} />
                {/* 점선 따라그리기 */}
                {imageUrl && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="w-full"
                    onClick={onTracingEdit}
                    disabled={isBusy}
                  >
                    {tracingPoints?.length ? `점선 편집 (${tracingPoints.length})` : '점선 그리기'}
                  </Button>
                )}
                {imageUrl && onTracingPreview && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-full"
                    onClick={onTracingPreview}
                    disabled={(tracingPoints?.length ?? 0) < 2}
                  >
                    따라그리기 미리보기
                  </Button>
                )}
              </div>
            )}
          </ImageDropZone>
        </div>
        <div className="flex-1 min-w-0 space-y-1.5">
          <TtsRow
            label={word}
            tag="단어"
            color="red"
            url={wordTtsUrl}
            generating={generatingWordTts}
            disabled={isBusy}
            downloadFilename={`${word}.wav`}
            editableText={getTtsText(wordTtsKey, word)}
            onTextChange={(t) => setTtsText(wordTtsKey, t)}
            onGenerate={() => generateTts(getTtsText(wordTtsKey, word), wordTtsKey, wordTtsUpdater)}
            onUpload={(f) => handleTtsUpload(f, wordTtsKey, wordTtsUpdater)}
          />
          <TtsRow
            label={onset}
            tag="onset"
            color="amber"
            url={onsetTtsUrl}
            generating={generatingOnsetTts}
            disabled={isBusy}
            downloadFilename={`${onset}.wav`}
            editableText={getTtsText(onsetTtsKey, onset)}
            onTextChange={(t) => setTtsText(onsetTtsKey, t)}
            onGenerate={() =>
              generateTts(getTtsText(onsetTtsKey, onset), onsetTtsKey, onsetTtsUpdater)
            }
            onUpload={(f) => handleTtsUpload(f, onsetTtsKey, onsetTtsUpdater)}
          />
        </div>
      </div>
    </div>
  );
}
