interface DownloadButtonProps {
  href: string;
  filename: string;
  size?: 'sm' | 'md';
}

export function DownloadButton({ href, filename, size = 'sm' }: DownloadButtonProps) {
  const isSm = size === 'sm';
  const iconSize = isSm ? 14 : 16;

  return (
    <a
      href={href}
      download={filename}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center ${
        isSm ? 'px-2 py-1 text-xs' : 'px-3 py-2 text-sm'
      } font-medium border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition`}
      title="다운로드"
    >
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
    </a>
  );
}
