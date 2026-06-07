import { useState, useRef, useCallback } from 'react';
import {
  Upload,
  FileText,
  FileImage,
  File as FileIcon,
  Trash2,
  Sparkles,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../../../ui';
import { cn } from '../../../lib/utils';
import { generateId } from '../../../lib/utils';
import { uploadToR2 } from '../../../api/use-r2-upload';
import { TEXT_MODELS, DEFAULT_ANALYSIS_MODEL } from '../../../lib/ai-models';
import type { Project, ReferenceFile } from '../../../types/database';

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(type: string) {
  if (type.startsWith('image/')) return FileImage;
  if (type.includes('pdf') || type.includes('document') || type.includes('text')) return FileText;
  return FileIcon;
}

interface Props {
  project: Project;
  onUpdate: (updates: Partial<Project>) => void;
}

export function ReferenceFilesSection({ project, onUpdate }: Props) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showSummary, setShowSummary] = useState(true);
  const [analysisModel, setAnalysisModel] = useState(DEFAULT_ANALYSIS_MODEL);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const files: ReferenceFile[] = project.reference_files ?? [];
  const summary = project.reference_summary ?? null;

  const addFiles = useCallback(
    async (fileList: FileList) => {
      const newFiles: ReferenceFile[] = [];

      for (const f of Array.from(fileList)) {
        const id = generateId();
        let extractedText: string | null = null;
        const extractableExts = ['.pdf', '.docx', '.doc', '.txt', '.md', '.csv', '.json', '.html'];
        const canExtract = extractableExts.some((ext) => f.name.toLowerCase().endsWith(ext));

        if (canExtract && f.size < 10_000_000) {
          try {
            const formData = new FormData();
            formData.append('file', f);
            const res = await fetch('/api/mkt/ai/extract-text', { method: 'POST', body: formData });
            if (res.ok) {
              const { text } = (await res.json()) as { text?: string };
              if (text?.trim()) extractedText = text;
            }
          } catch {
            // extraction failed — continue
          }
        }

        const fileEntry: ReferenceFile = {
          id,
          name: f.name,
          size: f.size,
          type: f.type || 'application/octet-stream',
          added_at: new Date().toISOString(),
          url: null,
          r2_key: null,
          extracted_text: extractedText,
        };

        try {
          const { publicUrl, key } = await uploadToR2(f, {
            projectId: project.id,
            category: 'references',
            fileName: f.name,
            contentType: f.type || 'application/octet-stream',
            contentId: id,
          });
          fileEntry.url = publicUrl;
          fileEntry.r2_key = key;
        } catch {
          // Upload failed — file metadata saved without URL
        }

        newFiles.push(fileEntry);
      }

      onUpdate({ reference_files: [...files, ...newFiles] });
    },
    [files, onUpdate, project.id]
  );

  const removeFile = async (fileId: string) => {
    const file = files.find((f) => f.id === fileId);
    if (file?.r2_key) {
      try {
        await fetch('/api/mkt/storage/delete', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ keys: [file.r2_key] }),
        });
      } catch {
        // non-blocking
      }
    }
    const updated = files.filter((f) => f.id !== fileId);
    onUpdate({ reference_files: updated.length > 0 ? updated : null });
  };

  const handleAnalyze = async () => {
    const fileInfos = files.map((f) => ({
      name: f.name,
      content: f.extracted_text ?? undefined,
      url: f.url ?? undefined,
      r2_key: f.r2_key ?? undefined,
    }));

    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/mkt/ai/analyze-references', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files: fileInfos,
          brandName: project.brand_name,
          industry: project.industry,
          model: analysisModel,
        }),
      });
      const data = (await res.json()) as { summary?: string; error?: string };
      if (data.error) throw new Error(data.error);
      onUpdate({ reference_summary: data.summary ?? null });
      setShowSummary(true);
    } catch (err) {
      alert(`분석 오류: ${err instanceof Error ? err.message : '알 수 없는 오류'}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
        참고 자료를 모두 올린 후 <strong>AI 분석</strong> 버튼을 누르세요. 콘텐츠 생성 시 자동으로
        활용합니다.
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>참고 자료 파일</CardTitle>
            {files.length > 0 && (
              <div className="flex items-center gap-2">
                <Select
                  value={analysisModel}
                  onValueChange={(v) => {
                    if (v) setAnalysisModel(v);
                  }}
                >
                  <SelectTrigger className="h-8 w-[200px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TEXT_MODELS.map((m) => (
                      <SelectItem key={m.id} value={m.id} className="text-xs">
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  size="sm"
                  className="gap-1.5"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> 분석 중...
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} /> AI 분석 ({files.length}개)
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDragOver(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDragOver(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDragOver(false);
              if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
              isDragOver
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-muted-foreground/50'
            )}
          >
            <Upload
              size={28}
              className={cn('mx-auto mb-2', isDragOver ? 'text-primary' : 'text-muted-foreground')}
            />
            <p className="text-sm font-medium">
              {isDragOver ? '여기에 놓으세요' : '파일을 드래그하거나 클릭하여 선택'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              TXT, MD, PDF, DOCX, HWP 등 (다중 파일 가능)
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              accept=".pdf,.docx,.doc,.md,.txt,.hwp,.png,.jpg,.jpeg,.gif,.webp,.csv,.json"
              onChange={(e) => {
                if (e.target.files?.length) {
                  addFiles(e.target.files);
                  e.target.value = '';
                }
              }}
            />
          </div>

          {files.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">{files.length}개 파일</p>
              <div className="divide-y divide-border rounded-lg border">
                {files.map((file) => {
                  const Icon = getFileIcon(file.type);
                  return (
                    <div key={file.id} className="flex items-center gap-3 px-3 py-2.5">
                      <Icon size={18} className="shrink-0 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.size)}
                          {file.extracted_text && <span className="ml-2">· 읽기 가능</span>}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(file.id)}
                        className="shrink-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {files.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-2">
              등록된 참고 자료가 없습니다.
            </p>
          )}
        </CardContent>
      </Card>

      {summary && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Sparkles size={16} className="text-amber-500" /> AI 분석 요약
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setShowSummary(!showSummary)}>
                  {showSummary ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || files.length === 0}
                  className="gap-1"
                >
                  {isAnalyzing ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Sparkles size={12} />
                  )}{' '}
                  재분석
                </Button>
              </div>
            </div>
          </CardHeader>
          {showSummary && (
            <CardContent>
              <div className="text-sm leading-relaxed whitespace-pre-wrap">{summary}</div>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
}
