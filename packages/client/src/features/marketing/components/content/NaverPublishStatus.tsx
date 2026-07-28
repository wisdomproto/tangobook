import { Badge } from '../../ui/badge';
import { useNaverPublication } from '../../api/use-naver-publication';
import volumes from '../../data/naver-volumes.json';

/** 책 제목 → 월간 검색량. 🔴 부분문자열이 아니라 **긴 제목부터** 대조한다 — 「강아지풀」이 「강아지」로 잡힌 적이 있다. */
const BOOKS = volumes.books as Record<string, { v: number; c: string | null }>;
const KEYS = Object.keys(BOOKS).sort((a, b) => b.length - a.length);
export function volumeOf(title: string) {
  const k = KEYS.find((book) => title.startsWith(book));
  return k ? { book: k, ...BOOKS[k] } : null;
}

const STATUS: Record<string, { label: string; cls: string }> = {
  published: { label: '발행됨', cls: 'bg-green-100 text-green-700' },
  draft: { label: '임시저장', cls: 'bg-amber-100 text-amber-700' },
  failed: { label: '실패', cls: 'bg-red-100 text-red-700' },
};

const COMP: Record<string, string> = {
  높음: 'text-red-600',
  중간: 'text-amber-600',
  낮음: 'text-green-600',
};

/**
 * 네이버 블로그 발행 현황 — 「N 블로그」 탭 상단.
 *
 * 저작 패널은 글을 만드는 곳이고, 이건 **그 글이 네이버에서 지금 어떤 상태인지**를 보여준다.
 * 발행 자체는 로컬 발행기(`.worktrees/naver-blog`)가 한다 — 여기서 발행 버튼은 두지 않는다.
 */
export function NaverPublishStatus({ contentId, title }: { contentId: string; title: string }) {
  const { data: pub, isLoading } = useNaverPublication(contentId);
  const vol = volumeOf(title);

  if (isLoading) return null;
  if (!pub && !vol) return null;

  const st = pub
    ? (STATUS[pub.status] ?? { label: pub.status, cls: 'bg-gray-100 text-gray-600' })
    : null;

  return (
    <div className="rounded-lg border border-green-200 bg-green-50/40 p-3 text-sm">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="font-medium text-green-800">네이버 블로그</span>
        {st ? (
          <Badge className={st.cls}>{st.label}</Badge>
        ) : (
          <Badge className="bg-gray-100 text-gray-600">미발행</Badge>
        )}
        {pub?.naver_post_url && (
          <a
            href={pub.naver_post_url}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-green-700 underline"
          >
            글 보기
          </a>
        )}
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600 sm:grid-cols-3">
        {vol && (
          <>
            <div>
              <dt className="text-gray-400">월간 검색량</dt>
              <dd className="font-medium text-gray-800">{vol.v.toLocaleString()}회</dd>
            </div>
            <div>
              <dt className="text-gray-400">광고 경쟁도</dt>
              <dd className={`font-medium ${COMP[vol.c ?? ''] ?? 'text-gray-700'}`}>
                {vol.c ?? '—'}
              </dd>
            </div>
          </>
        )}
        {pub?.published_at && (
          <div>
            <dt className="text-gray-400">발행</dt>
            <dd className="font-medium text-gray-800">
              {new Date(pub.published_at).toLocaleDateString('ko-KR')}
            </dd>
          </div>
        )}
        {!pub?.published_at && pub?.updated_at && (
          <div>
            <dt className="text-gray-400">최근 처리</dt>
            <dd className="font-medium text-gray-800">
              {new Date(pub.updated_at).toLocaleDateString('ko-KR')}
            </dd>
          </div>
        )}
      </dl>

      {pub?.error_message && (
        <p className="mt-2 rounded bg-red-50 px-2 py-1 text-xs text-red-700">{pub.error_message}</p>
      )}

      {vol && (
        <p className="mt-2 text-[11px] text-gray-400">
          검색량은 {volumes.measuredAt} 실측(네이버 검색광고). 발행 순서는 이 값이 정한다.
        </p>
      )}
    </div>
  );
}
