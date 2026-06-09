import { useState } from 'react';
import { Button } from '../../../ui/button';
import { Input } from '../../../ui/input';

interface AuditFormProps {
  /** Called when the user submits a URL to audit. */
  onSubmit: (url: string) => void;
  loading: boolean;
}

/**
 * URL input + submit button for the SEO site audit.
 * Port of CF seo/audit-form.tsx — rewired to accept `onSubmit` prop
 * (instead of CF's `onAudit`). No 'use client'.
 */
export function AuditForm({ onSubmit, loading }: AuditFormProps) {
  const [url, setUrl] = useState('');

  function handleSubmit() {
    const trimmed = url.trim();
    if (trimmed) onSubmit(trimmed);
  }

  return (
    <div className="flex gap-2">
      <Input
        placeholder="https://example.com"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        className="flex-1"
      />
      <Button onClick={handleSubmit} disabled={loading || !url.trim()}>
        {loading ? '검사 중...' : '사이트 검사'}
      </Button>
    </div>
  );
}
