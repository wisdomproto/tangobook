import { SUPPORTED_LANGUAGES } from '@tangobook/shared';

interface PlaylistCardProps {
  name: string;
  /** 세트에 담긴 책 수. */
  bookCount: number;
  language: string;
  /** 커버 썸네일 URL (앞쪽 몇 장). */
  coverUrls: string[];
  /** 카드 탭 → 재생 시작. */
  onPlay: () => void;
  /** 삭제. */
  onDelete: () => void;
  /** 편집 (책/순서/이름 수정). 없으면 편집 버튼 숨김. */
  onEdit?: () => void;
}

/** 저장된 연속재생 세트 카드 — 이름 + 책 수 + 커버 썸네일 + 삭제 버튼. 순수 표현 컴포넌트. */
export function PlaylistCard({
  name,
  bookCount,
  language,
  coverUrls,
  onPlay,
  onDelete,
  onEdit,
}: PlaylistCardProps) {
  const lang = SUPPORTED_LANGUAGES.find((l) => l.code === language);
  const thumbs = coverUrls.slice(0, 4);

  return (
    <div className="relative bg-white rounded-3xl shadow-soft hover:shadow-pop transition-shadow overflow-hidden">
      <button
        type="button"
        onClick={onPlay}
        className="w-full text-left active:scale-[0.98] transition-transform"
      >
        {/* 커버 썸네일 스트립 */}
        <div className="flex gap-0.5 aspect-[16/7] bg-peach-100">
          {thumbs.length > 0 ? (
            thumbs.map((url, i) => (
              <div key={i} className="flex-1 overflow-hidden">
                <img
                  src={url}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            ))
          ) : (
            <div className="flex-1 flex items-center justify-center text-4xl">📚</div>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-black text-lg text-ink-900 font-display truncate">{name}</h3>
          <p className="mt-0.5 text-sm font-bold text-ink-500">
            {lang ? `${lang.flag} ` : ''}책 {bookCount}권
          </p>
          <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-coral-500 text-white font-black text-sm px-4 py-2 shadow-soft">
            ▶ 재생
          </span>
        </div>
      </button>
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          aria-label={`${name} 세트 편집`}
          className="absolute top-2.5 right-12 h-9 w-9 rounded-full bg-white/90 text-ink-600 shadow-soft backdrop-blur transition hover:bg-white hover:text-coral-500 flex items-center justify-center font-black"
        >
          ✏️
        </button>
      )}
      <button
        type="button"
        onClick={onDelete}
        aria-label={`${name} 세트 삭제`}
        className="absolute top-2.5 right-2.5 w-9 h-9 rounded-full bg-white/90 backdrop-blur text-ink-500 hover:text-red-500 hover:bg-white shadow-soft flex items-center justify-center font-black transition"
      >
        ✕
      </button>
    </div>
  );
}
