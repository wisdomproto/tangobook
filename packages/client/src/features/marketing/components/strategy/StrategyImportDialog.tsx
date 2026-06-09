import { useMemo, useRef, useState, type ChangeEvent } from 'react';
import { Upload, FileText, Check, Tag, FolderOpen, ListChecks } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Button } from '../../ui/button';
import { useStrategyTemplates } from '../../api/use-strategy-templates';
import { useUpdateProject } from '../../api/use-projects';
import { parseStrategyHtml, type ParseResult } from '../../lib/strategy-html-parser';
import type { ImportedStrategy } from '../../types/analytics';

interface StrategyImportDialogProps {
  projectId: string;
  open: boolean;
  onClose: () => void;
}

/**
 * 마케팅 전략 HTML 임포트 다이얼로그.
 * 두 모드(템플릿 선택 / 파일 업로드)로 HTML을 받아 **클라이언트에서** `parseStrategyHtml`로
 * 파싱하고, 미리보기 후 `imported_strategy`로 프로젝트에 적용한다.
 * ContentFlow `strategy-import-dialog.tsx` 충실 이식 — 단, 서버 `/api/strategy/import-html`
 * 대신 클라이언트 파서를 사용(탱고북 포트는 서버 파싱 엔드포인트 없음).
 */
export function StrategyImportDialog({ projectId, open, onClose }: StrategyImportDialogProps) {
  const { data: templates = [], isLoading: templatesLoading } = useStrategyTemplates();
  const updateProject = useUpdateProject();

  const [mode, setMode] = useState<'template' | 'upload'>('template');
  const [file, setFile] = useState<File | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ParseResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // 파싱 결과 카운트 (CF의 keywordCount/categoryCount/topicCount 대응)
  const counts = useMemo(() => {
    if (!result) return { keyword: 0, category: 0, topic: 0 };
    return {
      keyword: result.keywords.length,
      category: result.categories.length,
      topic: result.categories.reduce((sum, c) => sum + c.topics.length, 0),
    };
  }, [result]);

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f && f.name.endsWith('.html')) {
      setFile(f);
      setResult(null);
      setError(null);
    }
  };

  const handleParse = async () => {
    setLoading(true);
    setError(null);

    try {
      let html: string;
      if (mode === 'template') {
        const tpl = templates.find((t) => t.filename === selectedTemplate);
        if (!tpl) throw new Error('템플릿을 선택하세요');
        const htmlRes = await fetch(tpl.url);
        if (!htmlRes.ok) throw new Error('템플릿 파일을 불러올 수 없습니다');
        html = await htmlRes.text();
      } else {
        if (!file) throw new Error('파일을 선택하세요');
        html = await file.text();
      }

      // 클라이언트 사이드 파싱 (지원하지 않는 HTML이면 throw)
      setResult(parseStrategyHtml(html));
    } catch (err) {
      setError(err instanceof Error ? err.message : '파싱 실패');
    } finally {
      setLoading(false);
    }
  };

  const canParse = mode === 'template' ? !!selectedTemplate : !!file;
  const sourceName =
    mode === 'template'
      ? templates.find((t) => t.filename === selectedTemplate)?.filename
      : file?.name;

  const handleImport = () => {
    if (!result) return;
    const imported: ImportedStrategy = {
      importedAt: new Date().toISOString(),
      sourceFileName: sourceName ?? 'imported-strategy.html',
      keywords: result.keywords,
      categories: result.categories,
    };

    updateProject.mutate(
      { id: projectId, updates: { imported_strategy: imported } },
      { onSuccess: () => onClose() }
    );
  };

  const goldenKeywords = result?.keywords.filter((k) => k.isGolden) ?? [];

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="break-keep">마케팅 전략 HTML 임포트</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 모드 탭 */}
          <div className="flex gap-1 border-b">
            <button
              type="button"
              onClick={() => {
                setMode('template');
                setResult(null);
                setError(null);
              }}
              className={`-mb-px border-b-2 px-3 py-1.5 text-sm font-medium transition-colors ${
                mode === 'template'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <ListChecks size={14} className="mr-1.5 inline" />
              템플릿 선택
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('upload');
                setResult(null);
                setError(null);
              }}
              className={`-mb-px border-b-2 px-3 py-1.5 text-sm font-medium transition-colors ${
                mode === 'upload'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Upload size={14} className="mr-1.5 inline" />
              파일 업로드
            </button>
          </div>

          {/* 템플릿 드롭다운 */}
          {mode === 'template' && (
            <div className="space-y-2">
              {templatesLoading ? (
                <p className="py-3 text-center text-sm text-muted-foreground break-keep">
                  템플릿 목록 불러오는 중...
                </p>
              ) : templates.length === 0 ? (
                <p className="py-3 text-center text-sm text-muted-foreground break-keep">
                  저장된 템플릿이 없습니다 (public/marketing-strategy-templates/)
                </p>
              ) : (
                <>
                  <label className="text-xs font-semibold text-muted-foreground break-keep">
                    템플릿 선택
                  </label>
                  <select
                    value={selectedTemplate}
                    onChange={(e) => {
                      setSelectedTemplate(e.target.value);
                      setResult(null);
                      setError(null);
                    }}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">— 선택하세요 —</option>
                    {templates.map((t) => (
                      <option key={t.filename} value={t.filename}>
                        {t.title}
                      </option>
                    ))}
                  </select>
                  {selectedTemplate &&
                    (() => {
                      const tpl = templates.find((t) => t.filename === selectedTemplate);
                      if (!tpl) return null;
                      return (
                        <div className="space-y-1 rounded-md bg-muted/40 p-2.5 text-xs text-muted-foreground">
                          <div className="font-medium text-foreground break-keep">
                            {tpl.filename}
                          </div>
                          {tpl.description && <div className="break-keep">{tpl.description}</div>}
                          <div className="flex gap-3 text-[11px] opacity-70">
                            <span>{(tpl.size / 1024).toFixed(0)} KB</span>
                            <span>수정 {new Date(tpl.modifiedAt).toLocaleDateString('ko-KR')}</span>
                          </div>
                        </div>
                      );
                    })()}
                </>
              )}
            </div>
          )}

          {/* 파일 업로드 */}
          {mode === 'upload' && (
            <div
              className="cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors hover:border-primary/50"
              onClick={() => fileRef.current?.click()}
            >
              <input
                ref={fileRef}
                type="file"
                accept=".html"
                onChange={handleFileSelect}
                className="hidden"
              />
              {file ? (
                <div className="flex items-center justify-center gap-2">
                  <FileText size={20} className="text-primary" />
                  <span className="font-semibold break-keep">{file.name}</span>
                  <span className="text-xs text-muted-foreground">
                    ({(file.size / 1024).toFixed(0)} KB)
                  </span>
                </div>
              ) : (
                <>
                  <Upload size={32} className="mx-auto mb-2 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground break-keep">
                    마케팅 전략 HTML 파일을 선택하세요
                  </p>
                </>
              )}
            </div>
          )}

          {canParse && !result && (
            <Button onClick={handleParse} disabled={loading} className="w-full">
              {loading ? '분석 중...' : mode === 'template' ? '템플릿 분석' : '파일 분석'}
            </Button>
          )}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 break-keep">
              {error}
            </div>
          )}

          {/* 파싱 결과 미리보기 */}
          {result && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-emerald-50 p-3 text-center dark:bg-emerald-950/30">
                  <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400">
                    {counts.keyword}
                  </div>
                  <div className="text-xs text-emerald-600 dark:text-emerald-500 break-keep">
                    키워드
                  </div>
                </div>
                <div className="rounded-lg bg-purple-50 p-3 text-center dark:bg-purple-950/30">
                  <div className="text-2xl font-black text-purple-700 dark:text-purple-400">
                    {counts.category}
                  </div>
                  <div className="text-xs text-purple-600 dark:text-purple-500 break-keep">
                    카테고리
                  </div>
                </div>
                <div className="rounded-lg bg-amber-50 p-3 text-center dark:bg-amber-950/30">
                  <div className="text-2xl font-black text-amber-700 dark:text-amber-400">
                    {counts.topic}
                  </div>
                  <div className="text-xs text-amber-600 dark:text-amber-500 break-keep">주제</div>
                </div>
              </div>

              {/* 황금키워드 미리보기 */}
              {goldenKeywords.length > 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30">
                  <div className="mb-1 flex items-center gap-1 text-xs font-bold text-amber-700 dark:text-amber-400">
                    <Tag size={12} /> 황금 키워드
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {goldenKeywords.map((k) => (
                      <span
                        key={k.keyword}
                        className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-900 dark:text-amber-300 break-keep"
                      >
                        {k.keyword} ({k.totalSearch.toLocaleString()})
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 카테고리 미리보기 */}
              {result.categories.map((cat) => (
                <div key={cat.code} className="rounded-lg border p-3">
                  <div className="mb-1 flex items-center gap-1 text-xs font-bold break-keep">
                    <FolderOpen size={12} />
                    <span className="text-primary">{cat.code}</span> {cat.name}
                    <span className="ml-1 text-muted-foreground">({cat.topics.length}개 주제)</span>
                  </div>
                  {cat.description && (
                    <div className="text-xs text-muted-foreground break-keep">
                      {cat.description}
                    </div>
                  )}
                </div>
              ))}

              <Button onClick={handleImport} disabled={updateProject.isPending} className="w-full">
                <Check size={14} className="mr-1.5" /> 프로젝트에 적용
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
