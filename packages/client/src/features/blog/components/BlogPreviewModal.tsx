import type { BlogPost } from '@tangobook/shared';

interface BlogPreviewModalProps {
  post: BlogPost;
  onClose: () => void;
}

function blogToHtml(post: BlogPost): string {
  let html = `<h1 style="text-align:center;">${post.title}</h1>\n<p style="text-align:center;color:#666;"><em>${post.summary}</em></p>\n<hr/>\n`;

  for (const section of post.sections) {
    html += `<h2>${section.header}</h2>\n`;
    if (section.imageUrl) {
      html += `<div style="text-align:center;margin-bottom:12px;">`;
      html += `<img src="${section.imageUrl}" alt="${section.imageCaption ?? ''}" style="max-width:100%;border-radius:8px;" />`;
      if (section.imageCaption) {
        html += `<p style="font-size:12px;color:#888;margin-top:4px;">${section.imageCaption}</p>`;
      }
      html += `</div>\n`;
    }
    // section.text는 HTML일 수 있으므로 적절히 처리
    const text = section.text;
    if (text.includes('<') && text.includes('>')) {
      html += `<div>${text}</div>\n`;
    } else {
      html += `<p>${text}</p>\n`;
    }
  }

  if (post.tags.length > 0) {
    html += `<p style="color:#5a67d8;">${post.tags.map((t) => `#${t}`).join(' ')}</p>\n`;
  }

  return html;
}

export function BlogPreviewModal({ post, onClose }: BlogPreviewModalProps) {
  const html = blogToHtml(post);

  const copyHtml = async () => {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([html], { type: 'text/plain' }),
        }),
      ]);
      alert('HTML이 클립보드에 복사되었습니다.');
    } catch {
      // fallback
      await navigator.clipboard.writeText(html);
      alert('텍스트로 복사되었습니다.');
    }
  };

  const copyPlainText = async () => {
    const div = document.createElement('div');
    div.innerHTML = html;
    const text = div.innerText || div.textContent || '';
    await navigator.clipboard.writeText(text);
    alert('텍스트가 클립보드에 복사되었습니다.');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">블로그 미리보기</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={copyPlainText}
              className="text-sm px-3 py-1.5 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-white rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500"
            >
              텍스트 복사
            </button>
            <button
              onClick={copyHtml}
              className="text-sm px-3 py-1.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700"
            >
              HTML 복사
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl"
            >
              ✕
            </button>
          </div>
        </div>

        <div
          className="flex-1 overflow-y-auto p-6 prose prose-slate dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  );
}
