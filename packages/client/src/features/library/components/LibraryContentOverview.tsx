import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLibraryContentAudit } from '../hooks/useLibraryContentAudit';
import {
  completeCount,
  readingReady,
  GAME_NAMES,
  type ContentCount,
  type LibraryContentRow,
} from '../lib/content-audit';

const EMPTY_ROWS: LibraryContentRow[] = [];
const issueOptions = [
  ['all', '전체 항목'],
  ['illust', '페이지 삽화 누락'],
  ['ko', '한글 TTS 누락'],
  ['en', '영어 TTS 누락'],
  ['english', '영어 번역 누락'],
  ['words', '어휘 삽화 누락'],
  ['coloring', '단어 색칠 없음'],
  ['scene', '장면 색칠(Editor2) 없음'],
  ['hidden', '숨은그림찾기 없음'],
  ['broken', '파일 미발견'],
] as const;
function matchIssue(r: LibraryContentRow, issue: string) {
  switch (issue) {
    case 'illust':
      return !completeCount(r.illustrations);
    case 'ko':
      return !completeCount(r.ko);
    case 'en':
      return !completeCount(r.en);
    case 'english':
      return !completeCount(r.english);
    case 'words':
      return !r.vocabularyHidden && !completeCount(r.words);
    case 'coloring':
      return !r.vocabularyHidden && !r.coloring.ko;
    case 'scene':
      return !r.sceneColoring;
    case 'hidden':
      return !r.hiddenPlayable;
    case 'broken':
      return (
        [r.illustrations, r.ko, r.en, r.words].some((c) => c.broken.length) ||
        !!r.coloring.broken.length
      );
    default:
      return true;
  }
}
function Count({ value }: { value: ContentCount }) {
  return (
    <span
      title={
        [
          ...value.missing.map((v) => `${v} 미등록`),
          ...value.broken.map((v) => `${v} 파일 미발견`),
        ].join(', ') || '등록된 항목 수 / 전체 항목 수'
      }
      className={`inline-flex rounded-full px-2 py-1 text-xs font-bold tabular-nums ${completeCount(value) ? 'bg-mint-100 text-mint-800' : value.have ? 'bg-amber-100 text-amber-800' : 'bg-ink-100 text-ink-500'}`}
    >
      {value.total ? `${value.have}/${value.total}` : '없음'}
    </span>
  );
}
function exportCsv(rows: LibraryContentRow[]) {
  const quote = (value: unknown) =>
    `"${String(value)
      .replace(/^[=+@-]/, "'$&")
      .replaceAll('"', '""')}"`;
  const count = (c: ContentCount) => `${c.have}/${c.total}`;
  const lines = [
    [
      'ID',
      '제목',
      '카테고리',
      '공개',
      '삽화',
      '한글TTS',
      '영어TTS',
      '영어번역',
      '어휘삽화',
      '한글게임',
      '영어게임',
      '단어색칠KO',
      '단어색칠EN',
      '장면색칠',
      '숨은그림',
      '누락쪽',
    ],
    ...rows.map((r) => [
      r.id,
      r.title,
      r.category,
      r.public ? '공개' : '비공개',
      count(r.illustrations),
      count(r.ko),
      count(r.en),
      count(r.english),
      count(r.words),
      r.games.ko.map((g) => GAME_NAMES[g] || g).join(' · '),
      r.games.en.map((g) => GAME_NAMES[g] || g).join(' · '),
      r.coloring.ko,
      r.coloring.en,
      r.sceneColoring,
      r.hiddenPlayable ? '가능' : '없음',
      [
        ['삽화', r.illustrations],
        ['한글TTS', r.ko],
        ['영어TTS', r.en],
        ['영어번역', r.english],
        ['어휘삽화', r.words],
      ]
        .map(
          ([n, c]) =>
            `${n}: ${(c as ContentCount).missing.join(' ')} ${(c as ContentCount).broken.map((v) => `${v}(파일 없음)`).join(' ')}`
        )
        .join(' / '),
    ]),
  ];
  const url = URL.createObjectURL(
    new Blob(['\uFEFF' + lines.map((line) => line.map(quote).join(',')).join('\r\n')], {
      type: 'text/csv;charset=utf-8',
    })
  );
  const a = document.createElement('a');
  a.href = url;
  a.download = '동화책-콘텐츠-현황.csv';
  a.click();
  URL.revokeObjectURL(url);
}
export function LibraryContentOverview() {
  const audit = useLibraryContentAudit();
  const [search, setSearch] = useState(''),
    [category, setCategory] = useState('all'),
    [visibility, setVisibility] = useState('all'),
    [issue, setIssue] = useState('all'),
    [page, setPage] = useState(1),
    [expanded, setExpanded] = useState<string | null>(null);
  const rows = audit.data?.rows ?? EMPTY_ROWS;
  const categories = useMemo(
    () => [...new Set(rows.map((r) => r.category))].sort((a, b) => a.localeCompare(b, 'ko')),
    [rows]
  );
  const scope = rows.filter(
    (r) =>
      (category === 'all' || r.category === category) &&
      (visibility === 'all' || r.public === (visibility === 'public'))
  );
  const filtered = scope
    .filter(
      (r) =>
        `${r.title} ${r.id}`.toLowerCase().includes(search.toLowerCase()) && matchIssue(r, issue)
    )
    .sort(
      (a, b) => a.category.localeCompare(b.category, 'ko') || a.title.localeCompare(b.title, 'ko')
    );
  const size = 50,
    maxPage = Math.max(1, Math.ceil(filtered.length / size)),
    currentPage = Math.min(page, maxPage);
  const metrics = [
    ['동화책', scope.length],
    ['한글 읽기 완비', scope.filter(readingReady).length],
    ['삽화 완비', scope.filter((r) => completeCount(r.illustrations)).length],
    ['한글 TTS 완비', scope.filter((r) => completeCount(r.ko)).length],
    ['영어 TTS 완비', scope.filter((r) => completeCount(r.en) && completeCount(r.english)).length],
    ['어휘 삽화 완비', scope.filter((r) => !r.vocabularyHidden && completeCount(r.words)).length],
    ['단어 색칠', scope.filter((r) => !r.vocabularyHidden && r.coloring.ko > 0).length],
    ['장면 색칠(Editor2)', scope.filter((r) => r.sceneColoring > 0).length],
    ['숨은그림찾기', scope.filter((r) => r.hiddenPlayable).length],
  ] as const;
  return (
    <section
      className="max-w-[1680px] mx-auto p-4 md:p-6 space-y-5"
      aria-label="전체 동화책 콘텐츠 현황"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-ink-900">전체 콘텐츠 현황</h2>
          <p className="text-sm text-ink-500 mt-1">
            {audit.data
              ? `데이터 기준 ${new Date(audit.data.generatedAt).toLocaleString('ko-KR')} · 파닉스 ${audit.data.excludedPhonics}권 제외`
              : '현황 자료를 불러오는 중입니다.'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={audit.refreshing}
            onClick={() => void audit.refresh()}
            className="rounded-full bg-coral-500 text-white px-4 py-2 font-bold text-sm disabled:opacity-50"
          >
            {audit.refreshing
              ? `업데이트 ${audit.progress.done}/${audit.progress.total}`
              : '운영 데이터 새로고침'}
          </button>
          <button
            type="button"
            disabled={!rows.length}
            onClick={() => exportCsv(filtered)}
            className="rounded-full bg-white border border-ink-200 px-4 py-2 font-bold text-sm"
          >
            CSV 내려받기
          </button>
        </div>
      </div>
      {audit.error && (
        <p role="alert" className="bg-red-50 text-red-700 p-3 rounded-xl text-sm">
          {audit.error.message} 마지막으로 확인한 자료를 표시합니다.
        </p>
      )}
      {!!audit.data?.fetchFailed.length && (
        <p role="alert" className="bg-amber-50 text-amber-800 p-3 rounded-xl">
          {audit.data.fetchFailed.length}권을 읽지 못해 집계에서 빠졌습니다. 전체 완료 수로 판단하지
          마세요. {audit.data.fetchFailed.join(', ')}
        </p>
      )}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-9 gap-2">
        {metrics.map(([label, n]) => (
          <div key={label} className="bg-white border border-ink-100 rounded-2xl p-3">
            <div className="text-xs text-ink-500 font-bold">{label}</div>
            <div className="text-2xl font-black mt-1 tabular-nums">
              {n.toLocaleString()}
              <span className="text-xs text-ink-400 ml-1">권</span>
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-ink-500 leading-relaxed">
        한글 읽기 완비 = 표지·전체 페이지 삽화·본문이 있는 쪽의 한글 TTS. 게임은 학습 화면의 실제
        구성 규칙으로 집계하며 저장된 게임과 별도로 확인합니다. 장면 색칠은 Editor2에 연결된 도안
        수이며, 단어 색칠과 별도 콘텐츠입니다.{' '}
        {audit.data?.assetCheckedAt
          ? `R2 파일 목록 대조: ${new Date(audit.data.assetCheckedAt).toLocaleString('ko-KR')}.`
          : '현재 집계는 URL 등록 기준입니다. 파일 존재 확인은 최신 전체 조사 자료를 참고하세요.'}{' '}
        음원 청취·게임 실행·삽화 품질 검수와는 구분됩니다.
      </p>
      <details className="rounded-2xl border border-ink-100 bg-white p-4">
        <summary className="cursor-pointer font-bold text-sm">
          카테고리별 요약 ({categories.length}개)
        </summary>
        <div className="overflow-auto mt-3">
          <table className="w-full text-sm whitespace-nowrap">
            <thead>
              <tr className="text-ink-500 text-left">
                <th className="py-2">카테고리</th>
                <th>권수</th>
                <th>삽화 완비</th>
                <th>한글 TTS</th>
                <th>영어 TTS</th>
                <th>어휘 삽화</th>
                <th>단어 색칠</th>
                <th>장면 색칠(Editor2)</th>
                <th>숨은그림</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => {
                const rs = rows.filter((r) => r.category === cat);
                return (
                  <tr key={cat} className="border-t border-ink-100">
                    <td className="py-2">
                      <button
                        type="button"
                        className="text-coral-600 font-bold"
                        onClick={() => {
                          setCategory(cat);
                          setPage(1);
                        }}
                      >
                        {cat}
                      </button>
                    </td>
                    <td>{rs.length}</td>
                    {[
                      rs.filter((r) => completeCount(r.illustrations)),
                      rs.filter((r) => completeCount(r.ko)),
                      rs.filter((r) => completeCount(r.en) && completeCount(r.english)),
                      rs.filter((r) => !r.vocabularyHidden && completeCount(r.words)),
                      rs.filter((r) => !r.vocabularyHidden && r.coloring.ko),
                      rs.filter((r) => r.sceneColoring),
                      rs.filter((r) => r.hiddenPlayable),
                    ].map((a, i) => (
                      <td key={i}>
                        {a.length}/{rs.length}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </details>
      <details className="rounded-2xl border border-ink-100 bg-white p-4">
        <summary className="cursor-pointer font-bold text-sm">게임 종류별 한글·영어 현황</summary>
        <div className="overflow-auto mt-3">
          <table className="w-full text-sm whitespace-nowrap">
            <thead>
              <tr className="text-left text-ink-500">
                <th className="py-2">게임</th>
                <th>한글</th>
                <th>영어</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(GAME_NAMES)
                .filter(([id]) =>
                  scope.some((r) => r.games.ko.includes(id) || r.games.en.includes(id))
                )
                .map(([id, name]) => (
                  <tr key={id} className="border-t border-ink-100">
                    <td className="py-2">{name}</td>
                    <td>{scope.filter((r) => r.games.ko.includes(id)).length}권</td>
                    <td>{scope.filter((r) => r.games.en.includes(id)).length}권</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </details>
      <div className="bg-white border border-ink-100 rounded-2xl overflow-hidden">
        <div className="p-4 flex flex-wrap gap-2 border-b border-ink-100">
          <input
            aria-label="책 제목 또는 ID 검색"
            placeholder="책 제목 또는 ID 검색"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-ink-200 px-3 py-2 text-sm w-60"
          />
          <select
            aria-label="카테고리 필터"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-ink-200 px-3 py-2 text-sm"
          >
            <option value="all">모든 카테고리</option>
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <select
            aria-label="공개 상태 필터"
            value={visibility}
            onChange={(e) => {
              setVisibility(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-ink-200 px-3 py-2 text-sm"
          >
            <option value="all">공개·비공개 전체</option>
            <option value="public">공개</option>
            <option value="private">비공개</option>
          </select>
          <select
            aria-label="누락 항목 필터"
            value={issue}
            onChange={(e) => {
              setIssue(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-ink-200 px-3 py-2 text-sm"
          >
            {issueOptions.map(([v, n]) => (
              <option key={v} value={v}>
                {n}
              </option>
            ))}
          </select>
          <span className="ml-auto text-sm text-ink-500 self-center">
            {filtered.length.toLocaleString()}권
          </span>
        </div>
        {audit.isLoading ? (
          <p className="p-8 text-center text-ink-500">콘텐츠 현황을 불러오는 중입니다.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm whitespace-nowrap">
              <thead className="bg-cream-50 text-ink-500">
                <tr>
                  {[
                    '책 / 카테고리',
                    '공개',
                    '삽화',
                    '한글 TTS',
                    '영어 TTS',
                    '영어 번역',
                    '어휘 삽화',
                    '게임 한/영',
                    '단어 색칠 한/영',
                    '장면 색칠(Editor2)',
                    '숨은그림',
                    '상세',
                  ].map((t) => (
                    <th key={t} className="p-3 text-left text-xs">
                      {t}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.slice((currentPage - 1) * size, currentPage * size).map((r) => (
                  <BookRows
                    key={r.id}
                    row={r}
                    open={expanded === r.id}
                    toggle={() => setExpanded(expanded === r.id ? null : r.id)}
                  />
                ))}
                {!filtered.length && (
                  <tr>
                    <td colSpan={12} className="p-8 text-center text-ink-500">
                      조건에 맞는 책이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        <div className="p-3 border-t border-ink-100 flex items-center justify-between text-sm">
          <span>
            페이지 {currentPage} / {maxPage}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setPage(currentPage - 1)}
              className="px-3 py-1 border rounded-lg disabled:opacity-30"
            >
              이전
            </button>
            <button
              type="button"
              disabled={currentPage === maxPage}
              onClick={() => setPage(currentPage + 1)}
              className="px-3 py-1 border rounded-lg disabled:opacity-30"
            >
              다음
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
function BookRows({
  row: r,
  open,
  toggle,
}: {
  row: LibraryContentRow;
  open: boolean;
  toggle: () => void;
}) {
  return (
    <>
      <tr className="border-t border-ink-100 hover:bg-cream-50">
        <td className="p-3">
          <Link to={`/editor2/${r.id}`} className="font-bold text-ink-900 hover:text-coral-600">
            {r.title}
          </Link>
          <div className="text-xs text-ink-400 mt-1">{r.category}</div>
        </td>
        <td className="p-3 text-xs">{r.public ? '공개' : '비공개'}</td>
        {[r.illustrations, r.ko, r.en, r.english].map((c, i) => (
          <td key={i} className="p-3">
            <Count value={c} />
          </td>
        ))}
        <td className="p-3">
          {r.vocabularyHidden ? (
            <span className="text-xs text-ink-400">사용 안 함</span>
          ) : (
            <Count value={r.words} />
          )}
        </td>
        <td className="p-3 tabular-nums">
          {r.games.ko.length} / {r.games.en.length}
        </td>
        <td className="p-3 tabular-nums">
          {r.vocabularyHidden ? '사용 안 함' : `${r.coloring.ko} / ${r.coloring.en}`}
        </td>
        <td className="p-3 tabular-nums">{r.sceneColoring || '—'}</td>
        <td className="p-3 text-xs">{r.hiddenPlayable ? `${r.hiddenScenes}장` : '—'}</td>
        <td className="p-3">
          <button
            type="button"
            aria-expanded={open}
            onClick={toggle}
            className="text-coral-600 font-bold"
          >
            {open ? '닫기' : '상세'}
          </button>
        </td>
      </tr>
      {open && (
        <tr>
          <td colSpan={12} className="p-4 bg-cream-50 whitespace-normal">
            <div className="grid md:grid-cols-2 gap-4 text-xs leading-6">
              <div>
                <div className="font-bold">누락 및 확인 대상</div>
                {[
                  ['삽화', r.illustrations],
                  ['한글 TTS', r.ko],
                  ['영어 TTS', r.en],
                  ['영어 번역', r.english],
                  ['어휘 삽화', r.words],
                ].map(([n, c]) => (
                  <p key={n as string}>
                    {n as string}: {(c as ContentCount).missing.join(', ') || '미등록 항목 없음'}
                    {(c as ContentCount).broken.length
                      ? ` · 파일 미발견 ${(c as ContentCount).broken.join(', ')}`
                      : ''}
                  </p>
                ))}
                <p>
                  표지: {r.cover ? '등록됨' : '없음'} · 책 ID: {r.id}
                </p>
              </div>
              <div>
                <div className="font-bold">학습 화면에 구성되는 게임</div>
                <p>한글: {r.games.ko.map((g) => GAME_NAMES[g] || g).join(' · ') || '없음'}</p>
                <p>영어: {r.games.en.map((g) => GAME_NAMES[g] || g).join(' · ') || '없음'}</p>
                <p>
                  별도 저장 게임:{' '}
                  {r.games.stored.map((g) => GAME_NAMES[g] || g).join(' · ') || '없음'}
                </p>
                <p>
                  숨은그림 씬 등록 {r.hiddenScenes}장 · 학습 카드{' '}
                  {r.hiddenPlayable ? '구성됨' : '미구성'}
                </p>
                {!!r.coloring.broken.length && (
                  <p>색칠 파일 미발견: {r.coloring.broken.join(', ')}</p>
                )}
                <Link to={`/editor2/${r.id}`} className="font-bold text-coral-600">
                  Editor2에서 보완하기 →
                </Link>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
