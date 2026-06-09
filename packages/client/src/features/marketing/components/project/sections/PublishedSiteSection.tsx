import { useState, useEffect } from 'react';
import { Button, Input, Switch, Checkbox, Label } from '../../../ui';
import type { Project, PublishedSite } from '../../../types/database';

const ALL_LANGS = [
  { code: 'ko', label: '한국어' },
  { code: 'en', label: 'English' },
  { code: 'th', label: 'ไทย' },
  { code: 'vi', label: 'Tiếng Việt' },
  { code: 'ja', label: '日本語' },
  { code: 'zh', label: '中文' },
  { code: 'ms', label: 'Melayu' },
  { code: 'id', label: 'Indonesia' },
];

const EMPTY_SITE: PublishedSite = {
  name: '',
  domain: '',
  domain_prefix: '',
  active_languages: ['ko'],
  language_paths: { ko: '/blog' },
  deploy_webhook_url: '',
  enabled: false,
};

interface Props {
  project: Project;
  onUpdate: (updates: Partial<Project>) => void;
}

export function PublishedSiteSection({ project, onUpdate }: Props) {
  const [site, setSite] = useState<PublishedSite>(project.published_site ?? EMPTY_SITE);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSite(project.published_site ?? EMPTY_SITE);
  }, [project.id]);

  const toggleLang = (code: string) => {
    const active = site.active_languages.includes(code);
    const nextActive = active
      ? site.active_languages.filter((l) => l !== code)
      : [...site.active_languages, code];
    const nextPaths = { ...site.language_paths };
    if (!active && !nextPaths[code]) {
      nextPaths[code] = code === 'ko' ? '/blog' : `/${code}/blog`;
    }
    setSite({ ...site, active_languages: nextActive, language_paths: nextPaths });
  };

  const updatePath = (code: string, path: string) => {
    setSite({ ...site, language_paths: { ...site.language_paths, [code]: path } });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      onUpdate({ published_site: site });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="border border-border rounded-lg p-6 space-y-4">
      <header className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">발행 사이트</h3>
        <Switch checked={site.enabled} onCheckedChange={(v) => setSite({ ...site, enabled: v })} />
      </header>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-muted-foreground">사이트 이름</Label>
          <Input
            value={site.name}
            onChange={(e) => setSite({ ...site, name: e.target.value })}
            placeholder="예: 내 블로그"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">도메인 (프로토콜 포함)</Label>
          <Input
            value={site.domain}
            onChange={(e) => setSite({ ...site, domain: e.target.value })}
            placeholder="https://www.example.com"
          />
        </div>
      </div>

      <div>
        <Label className="text-xs text-muted-foreground">개발용 path prefix (옵션)</Label>
        <Input
          value={site.domain_prefix ?? ''}
          onChange={(e) => setSite({ ...site, domain_prefix: e.target.value })}
          placeholder="/test"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">활성 언어 + 언어별 path</Label>
        {ALL_LANGS.map((l) => {
          const active = site.active_languages.includes(l.code);
          return (
            <div key={l.code} className="flex items-center gap-2">
              <Checkbox checked={active} onCheckedChange={() => toggleLang(l.code)} />
              <span className="w-28 text-sm">
                {l.label} ({l.code})
              </span>
              <Input
                disabled={!active}
                className="flex-1"
                value={site.language_paths[l.code] ?? ''}
                onChange={(e) => updatePath(l.code, e.target.value)}
                placeholder={l.code === 'ko' ? '/blog' : `/${l.code}/blog`}
              />
            </div>
          );
        })}
      </div>

      <div>
        <Label className="text-xs text-muted-foreground">Deploy Webhook URL (옵션)</Label>
        <Input
          value={site.deploy_webhook_url ?? ''}
          onChange={(e) => setSite({ ...site, deploy_webhook_url: e.target.value })}
          placeholder="https://backboard.railway.app/..."
        />
      </div>

      {/* Read-only fetch URLs — /api/mkt/blog/by-project/... endpoint is a later phase */}
      <div className="bg-muted/30 p-3 rounded text-xs space-y-1 font-mono">
        <p className="text-muted-foreground mb-1">본진 사이트 fetch URL (읽기 전용):</p>
        {site.active_languages.map((code) => (
          <p key={code}>
            /api/mkt/blog/by-project/{project.id}/posts?lang={code}
          </p>
        ))}
        {site.active_languages.length === 0 && (
          <p className="text-muted-foreground">활성 언어를 선택하면 URL이 표시됩니다.</p>
        )}
      </div>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? '저장 중…' : '저장'}
      </Button>
    </section>
  );
}
