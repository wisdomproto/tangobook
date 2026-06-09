import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Upload } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Label,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../../../ui';
import { KoreanInput, KoreanTextarea } from '../../../ui/korean-input';
import { cn } from '../../../lib/utils';
import { uploadToR2 } from '../../../api/use-r2-upload';
import type { Project } from '../../../types/database';

const INDUSTRIES = ['뷰티', '식품', 'IT', '교육', '패션', '건강', '금융', '여행', '부동산', '기타'];
const BRAND_TONES = ['공식적', '캐주얼', '유머러스', '전문적', '감성적', '커스텀'];

interface Props {
  project: Project;
  onUpdate: (updates: Partial<Project>) => void;
}

export function BrandInfoSection({ project, onUpdate }: Props) {
  const [brandName, setBrandName] = useState(project.brand_name ?? '');
  const [brandDescription, setBrandDescription] = useState(project.brand_description ?? '');
  const [industry, setIndustry] = useState(project.industry ?? '');
  const [usp, setUsp] = useState(project.usp ?? '');
  const [brandTone, setBrandTone] = useState(project.brand_tone ?? '');
  const [bannedKeywords, setBannedKeywords] = useState<string[]>(project.banned_keywords ?? []);
  const [keywordInput, setKeywordInput] = useState('');
  const [targetAge, setTargetAge] = useState(
    (project.target_audience as Record<string, string> | null)?.age ?? ''
  );
  const [targetGender, setTargetGender] = useState(
    (project.target_audience as Record<string, string> | null)?.gender ?? '전체'
  );
  const [targetInterests, setTargetInterests] = useState(
    (project.target_audience as Record<string, string> | null)?.interests ?? ''
  );
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setBrandName(project.brand_name ?? '');
    setBrandDescription(project.brand_description ?? '');
    setIndustry(project.industry ?? '');
    setUsp(project.usp ?? '');
    setBrandTone(project.brand_tone ?? '');
    setBannedKeywords(project.banned_keywords ?? []);
    const ta = project.target_audience as Record<string, string> | null;
    setTargetAge(ta?.age ?? '');
    setTargetGender(ta?.gender ?? '전체');
    setTargetInterests(ta?.interests ?? '');
  }, [project.id]);

  const handleSave = () => {
    onUpdate({
      brand_name: brandName || null,
      brand_description: brandDescription || null,
      industry: industry || null,
      usp: usp || null,
      brand_tone: brandTone || null,
      banned_keywords: bannedKeywords.length > 0 ? bannedKeywords : null,
      target_audience: { age: targetAge, gender: targetGender, interests: targetInterests },
    });
  };

  const addKeyword = () => {
    const kw = keywordInput.trim();
    if (kw && !bannedKeywords.includes(kw)) {
      setBannedKeywords([...bannedKeywords, kw]);
      setKeywordInput('');
    }
  };

  const handleLogoUpload = useCallback(
    async (file: File) => {
      setIsUploadingLogo(true);
      try {
        const { publicUrl } = await uploadToR2(file, {
          projectId: project.id,
          category: 'brand-logo',
          fileName: file.name,
          contentType: file.type || 'image/png',
        });
        onUpdate({ brand_logo_url: publicUrl });
      } catch {
        // non-blocking — logo upload failure shouldn't block UX
      } finally {
        setIsUploadingLogo(false);
      }
    },
    [project.id, onUpdate]
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>브랜드 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="brand-name">브랜드/서비스명</Label>
            <KoreanInput
              id="brand-name"
              value={brandName}
              onCommit={setBrandName}
              placeholder="예: 헬시라이프"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="brand-desc">브랜드 설명</Label>
            <KoreanTextarea
              id="brand-desc"
              value={brandDescription}
              onCommit={setBrandDescription}
              placeholder="브랜드 소개, 미션, 핵심 가치"
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>업종/산업</Label>
            <Select
              value={industry}
              onValueChange={(v) => {
                if (v) setIndustry(v);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="업종 선택" />
              </SelectTrigger>
              <SelectContent>
                {INDUSTRIES.map((ind) => (
                  <SelectItem key={ind} value={ind}>
                    {ind}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="usp">핵심 차별점 (USP)</Label>
            <KoreanTextarea
              id="usp"
              value={usp}
              onCommit={setUsp}
              placeholder="경쟁사 대비 차별화 포인트"
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label>브랜드 톤앤매너</Label>
            <Select
              value={brandTone}
              onValueChange={(v) => {
                if (v) setBrandTone(v);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="톤 선택" />
              </SelectTrigger>
              <SelectContent>
                {BRAND_TONES.map((tone) => (
                  <SelectItem key={tone} value={tone}>
                    {tone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>타겟 고객</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="target-age">연령대</Label>
              <KoreanInput
                id="target-age"
                value={targetAge}
                onCommit={setTargetAge}
                placeholder="예: 25-45세"
              />
            </div>
            <div className="space-y-2">
              <Label>성별</Label>
              <Select
                value={targetGender}
                onValueChange={(v) => {
                  if (v) setTargetGender(v);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="전체">전체</SelectItem>
                  <SelectItem value="남성">남성</SelectItem>
                  <SelectItem value="여성">여성</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="target-interests">관심사</Label>
            <KoreanInput
              id="target-interests"
              value={targetInterests}
              onCommit={setTargetInterests}
              placeholder="쉼표로 구분 (예: 건강, 다이어트, 운동)"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>금지 키워드</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {bannedKeywords.map((kw) => (
              <Badge key={kw} variant="secondary" className="gap-1">
                {kw}
                <button
                  onClick={() => setBannedKeywords(bannedKeywords.filter((k) => k !== kw))}
                  className="hover:text-destructive"
                  aria-label={`${kw} 제거`}
                >
                  <X size={12} />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <KoreanInput
              value={keywordInput}
              onCommit={(v) => setKeywordInput(v)}
              placeholder="금지 키워드 입력 후 Enter"
              commitOnEnter
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addKeyword();
                }
              }}
            />
            <Button variant="outline" size="sm" onClick={addKeyword}>
              추가
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>브랜드 로고</CardTitle>
        </CardHeader>
        <CardContent>
          {project.brand_logo_url && (
            <div className="mb-3 flex items-center gap-3">
              <img
                src={project.brand_logo_url}
                alt="brand logo"
                className="h-12 w-12 rounded object-contain border border-border"
              />
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => onUpdate({ brand_logo_url: null })}
              >
                <X size={14} className="mr-1" /> 제거
              </Button>
            </div>
          )}
          <div
            onClick={() => logoInputRef.current?.click()}
            className={cn(
              'border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors',
              isUploadingLogo && 'opacity-50 pointer-events-none'
            )}
          >
            <Upload size={24} className="mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              {isUploadingLogo ? '업로드 중…' : '카드뉴스 워터마크 등에 사용할 로고 이미지'}
            </p>
            <Button variant="outline" size="sm" className="mt-2" type="button">
              파일 선택
            </Button>
            <input
              ref={logoInputRef}
              type="file"
              className="hidden"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleLogoUpload(f);
                e.target.value = '';
              }}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave}>저장</Button>
      </div>
    </div>
  );
}
