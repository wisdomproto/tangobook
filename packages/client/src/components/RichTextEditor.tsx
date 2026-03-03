import React, { useRef, useCallback, useEffect } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
  className?: string;
}

type FormatCmd =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'strikeThrough'
  | 'insertUnorderedList'
  | 'insertOrderedList'
  | 'formatBlock'
  | 'fontSize'
  | 'foreColor'
  | 'hiliteColor'
  | 'removeFormat';

const FONT_SIZES = [
  { label: '작게', value: '2' },
  { label: '보통', value: '3' },
  { label: '크게', value: '4' },
  { label: '매우 크게', value: '5' },
];

const TEXT_COLORS = [
  '#000000',
  '#333333',
  '#666666',
  '#dc2626',
  '#ea580c',
  '#d97706',
  '#16a34a',
  '#0284c7',
  '#7c3aed',
  '#db2777',
];

const HIGHLIGHT_COLORS = [
  'transparent',
  '#fef08a',
  '#fde68a',
  '#bbf7d0',
  '#bfdbfe',
  '#ddd6fe',
  '#fecdd3',
  '#fed7aa',
];

function ToolbarButton({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      title={title}
      className={`px-1.5 py-1 text-xs rounded hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors ${
        active
          ? 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 font-bold'
          : 'text-slate-600 dark:text-slate-300'
      }`}
    >
      {children}
    </button>
  );
}

function ToolbarSep() {
  return <div className="w-px h-5 bg-slate-200 dark:bg-slate-600 mx-0.5" />;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = '내용을 입력하세요...',
  minHeight = '120px',
  className = '',
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalChange = useRef(false);
  const showColorPicker = useRef(false);
  const showHighlightPicker = useRef(false);

  // 초기값 설정
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (!isInternalChange.current && el.innerHTML !== value) {
      el.innerHTML = value;
    }
  }, [value]);

  const exec = useCallback((cmd: FormatCmd, val?: string) => {
    document.execCommand(cmd, false, val);
    editorRef.current?.focus();
    emitChange();
  }, []);

  const emitChange = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    isInternalChange.current = true;
    onChange(el.innerHTML);
    requestAnimationFrame(() => {
      isInternalChange.current = false;
    });
  }, [onChange]);

  const handleInput = useCallback(() => {
    emitChange();
  }, [emitChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'b' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        exec('bold');
      } else if (e.key === 'i' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        exec('italic');
      } else if (e.key === 'u' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        exec('underline');
      }
    },
    [exec]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      e.preventDefault();
      const html = e.clipboardData.getData('text/html');
      const text = e.clipboardData.getData('text/plain');
      if (html) {
        document.execCommand('insertHTML', false, html);
      } else {
        document.execCommand('insertText', false, text);
      }
      emitChange();
    },
    [emitChange]
  );

  return (
    <div
      className={`border border-slate-200 dark:border-slate-600 rounded-lg overflow-hidden bg-white dark:bg-slate-700 ${className}`}
    >
      {/* 툴바 */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 flex-wrap">
        {/* 블록 서식 */}
        <select
          className="text-xs px-1.5 py-1 rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-slate-200 focus:outline-none"
          onChange={(e) => {
            if (e.target.value) exec('formatBlock', e.target.value);
            e.target.value = '';
          }}
          defaultValue=""
        >
          <option value="" disabled>
            단락
          </option>
          <option value="p">본문</option>
          <option value="h2">제목 (H2)</option>
          <option value="h3">소제목 (H3)</option>
          <option value="h4">소소제목 (H4)</option>
          <option value="blockquote">인용</option>
        </select>

        {/* 글자 크기 */}
        <select
          className="text-xs px-1.5 py-1 rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-slate-200 focus:outline-none ml-1"
          onChange={(e) => {
            if (e.target.value) exec('fontSize', e.target.value);
            e.target.value = '';
          }}
          defaultValue=""
        >
          <option value="" disabled>
            크기
          </option>
          {FONT_SIZES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        <ToolbarSep />

        {/* 텍스트 서식 */}
        <ToolbarButton onClick={() => exec('bold')} title="굵게 (Ctrl+B)">
          <strong>B</strong>
        </ToolbarButton>
        <ToolbarButton onClick={() => exec('italic')} title="기울임 (Ctrl+I)">
          <em>I</em>
        </ToolbarButton>
        <ToolbarButton onClick={() => exec('underline')} title="밑줄 (Ctrl+U)">
          <u>U</u>
        </ToolbarButton>
        <ToolbarButton onClick={() => exec('strikeThrough')} title="취소선">
          <s>S</s>
        </ToolbarButton>

        <ToolbarSep />

        {/* 리스트 */}
        <ToolbarButton onClick={() => exec('insertUnorderedList')} title="글머리 기호">
          &#8226; 목록
        </ToolbarButton>
        <ToolbarButton onClick={() => exec('insertOrderedList')} title="번호 매기기">
          1. 목록
        </ToolbarButton>

        <ToolbarSep />

        {/* 글자 색상 */}
        <div className="relative group">
          <ToolbarButton
            onClick={() => {
              showColorPicker.current = !showColorPicker.current;
            }}
            title="글자 색상"
          >
            <span className="inline-block w-3 h-3 border border-slate-300 rounded-sm bg-red-500" />{' '}
            색
          </ToolbarButton>
          <div className="absolute left-0 top-full mt-1 hidden group-hover:grid grid-cols-5 gap-1 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg shadow-lg z-10">
            {TEXT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className="w-5 h-5 rounded border border-slate-200 dark:border-slate-600 hover:scale-110 transition-transform"
                style={{ backgroundColor: c }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  exec('foreColor', c);
                }}
              />
            ))}
          </div>
        </div>

        {/* 형광펜 */}
        <div className="relative group">
          <ToolbarButton
            onClick={() => {
              showHighlightPicker.current = !showHighlightPicker.current;
            }}
            title="형광펜"
          >
            <span className="inline-block w-3 h-3 border border-slate-300 rounded-sm bg-yellow-300" />{' '}
            강조
          </ToolbarButton>
          <div className="absolute left-0 top-full mt-1 hidden group-hover:grid grid-cols-4 gap-1 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg shadow-lg z-10">
            {HIGHLIGHT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className={`w-5 h-5 rounded border border-slate-200 dark:border-slate-600 hover:scale-110 transition-transform ${
                  c === 'transparent' ? 'bg-white dark:bg-slate-700' : ''
                }`}
                style={c !== 'transparent' ? { backgroundColor: c } : undefined}
                onMouseDown={(e) => {
                  e.preventDefault();
                  exec('hiliteColor', c);
                }}
                title={c === 'transparent' ? '강조 제거' : undefined}
              >
                {c === 'transparent' && <span className="text-[10px]">X</span>}
              </button>
            ))}
          </div>
        </div>

        <ToolbarSep />

        {/* 서식 제거 */}
        <ToolbarButton onClick={() => exec('removeFormat')} title="서식 제거">
          Tx
        </ToolbarButton>
      </div>

      {/* 에디터 본문 */}
      <div
        ref={editorRef}
        contentEditable
        className="prose prose-sm prose-slate dark:prose-invert max-w-none px-4 py-3 focus:outline-none overflow-y-auto"
        style={{ minHeight }}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        data-placeholder={placeholder}
        suppressContentEditableWarning
      />
    </div>
  );
}
