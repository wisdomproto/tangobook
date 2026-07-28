// 롱폼 컴필레이션(여러 편 묶음) 순수 로직.
//
// 왜 묶는가(2026-07-24 벤치마크 실측):
//  - 「엄마의 인형동화」 150편 = 단편 97편 중앙값 1,794 / 묶음 53편 중앙값 3,253 → **묶음이 1.8배**.
//    단편과 묶음은 검색 진입로가 다르다(단편=`양치 동화` / 묶음=`잠자리 동화 연속듣기`)라 둘 다 올린다.
//  - 🔴 단, 하루 업로드는 149일 중 148일이 **1개**였다. 묶음은 단편에 얹는 게 아니라
//    같은 "하루 1개" 슬롯을 나눠 쓴다(우리 실측 자기잠식: 하루 4개 → 223/203/192/27).
//
// 🔴 길이에 대한 기대치 보정: 채널 내부 스피어만 ρ(길이,조회수)는 채널마다 제각각이다
// (냠냠 0.08 = 무상관 · 엄마의인형동화 0.59 = 연속듣기 니치라 길이가 곧 상품 · Awnie 0.23).
// 따라서 묶음의 목적은 "길이 교정"이 아니라 **연속듣기라는 새 검색 진입로 확보**다.
//
// 제목 공식(같은 벤치마크 34편 분석): 주제 라벨 있음 중앙값 12,883 vs 없음 2,226.
// 반대로 **"Ep.N + 개별 작품 나열"이 최하위**(1,665~1,855)였다 → 순번·나열 금지, 테마를 앞세운다.
// ※ 이 요소들은 서로 붙어 다녀 개별 독립효과는 분리되지 않는다(상위=다 가짐/하위=다 없음).

/** 컴필레이션 1편에 넣을 원본 조각. */
export interface CompilationPart {
  bookId: string;
  title: string;
  videoUrl: string;
  durationSec: number;
}

/** 커리큘럼 트랙 정의 — 회차 번호 구간이 곧 주제 묶음이다. */
export interface TrackDef {
  key: string;
  label: string; // 제목 앞 [라벨]
  hook: string; // 부모가 검색할 말 / 혜택
  emoji: string;
  from?: number; // 회차 시작(포함) — 번호로 묶는 라인
  to?: number; // 회차 끝(포함)
  /**
   * 회차 번호가 없는 라인(자연·공룡)은 제목 키워드로 묶는다.
   * `match` 가 있으면 from/to 대신 이걸 쓴다.
   */
  match?: RegExp;
  /** 제목 가운데 문구. 기본값은 잠자리 동화용이라 공룡엔 안 맞는다. */
  subtitle?: string;
}

const DEFAULT_SUBTITLE = '중간광고 없는 잠자리 동화';

/**
 * 공룡 묶음 트랙.
 * 🔴 「공룡모음」·「연속듣기」는 네이버 월 30·20회로 **검색 수요가 없다**(2026-07-28 실측).
 *    묶음은 검색이 아니라 추천으로 배달되므로 제목엔 **종명**을 앞세운다
 *    (티라노사우루스 31,960 · 공룡 26,010 · 공룡종류 12,870).
 * 🔴 공룡을 고른 이유 = 우리 채널에 실제로 배달되는 시청자군이 공룡 시청자다
 *    (추천 유입 출처 = EBS 한반도의 공룡·넷플릭스 「공룡들」, 검색 유입 전량 공룡 종명,
 *    공룡 롱폼 CTR 6~7% vs 명작 1.7~2.4%).
 */
export const DINO_TRACKS: TrackDef[] = [
  {
    key: 'carnivore',
    label: '육식 공룡 모음',
    hook: '티라노사우루스와 사냥꾼들',
    emoji: '🦖',
    match: /티라노|스피노|기가노토|타르보|바리오닉스|벨로키랍토르|알로사우루스/,
    subtitle: '어린이 공룡 백과',
  },
  {
    key: 'giant',
    label: '거대 초식 공룡 모음',
    hook: '목이 제일 긴 공룡은 누구일까',
    emoji: '🦕',
    match: /브라키오|디플로도쿠스|아파토|마이아사우라|이구아나돈|파라사우롤로푸스/,
    subtitle: '어린이 공룡 백과',
  },
  {
    key: 'armored',
    label: '뿔·갑옷 공룡 모음',
    hook: '몸을 지키는 공룡들',
    emoji: '🛡️',
    match: /트리케라톱스|안킬로|스테고|프로토케라톱스|파키케팔로|스티라코/,
    subtitle: '어린이 공룡 백과',
  },
  {
    key: 'sky',
    label: '하늘을 나는 공룡 모음',
    hook: '하늘의 지배자들',
    emoji: '🪽',
    match: /프테라노돈|케찰코아틀루스|람포린쿠스/,
    subtitle: '어린이 공룡 백과',
  },
];

/** 호리네 생활동화 45편 = docs/saenghwal-donghwa/curriculum-45.md 의 7트랙. */
export const LIFE_TRACKS: TrackDef[] = [
  {
    key: 'A',
    label: '건강·위생 동화 모음',
    hook: '잘 먹고 잘 씻는 습관',
    emoji: '🪥',
    from: 1,
    to: 8,
  },
  {
    key: 'B',
    label: '자립 습관 동화 모음',
    hook: '혼자서도 척척 해내요',
    emoji: '🌈',
    from: 9,
    to: 14,
  },
  {
    key: 'C',
    label: '안전 동화 모음',
    hook: '우리 아이 지키는 습관',
    emoji: '🚸',
    from: 15,
    to: 22,
  },
  {
    key: 'D',
    label: '감정 동화 모음',
    hook: '화나고 무서운 마음 다스리기',
    emoji: '💛',
    from: 23,
    to: 30,
  },
  {
    key: 'E',
    label: '사회성 동화 모음',
    hook: '친구와 사이좋게 지내요',
    emoji: '🤝',
    from: 31,
    to: 38,
  },
  { key: 'F', label: '가족 동화 모음', hook: '동생이 생겼어요', emoji: '👶', from: 39, to: 42 },
  {
    key: 'G',
    label: '일상 예절 동화 모음',
    hook: '공공장소·반려동물·자연',
    emoji: '🌳',
    from: 43,
    to: 45,
  },
];

/** "01. 골고루 먹으면 무지개 힘!" → 1. 번호가 없으면 null. */
export function episodeNumber(title: string): number | null {
  const m = /^\s*(\d+)\.\s/.exec(title);
  return m ? Number(m[1]) : null;
}

/** "01. 골고루 먹으면 무지개 힘!" → "골고루 먹으면 무지개 힘!" (내부 정렬용 번호 제거) */
export function stripEpisodeNumber(title: string): string {
  return title.replace(/^\s*\d+\.\s*/, '').trim() || title;
}

export interface TrackGroup {
  track: TrackDef;
  parts: CompilationPart[];
  totalSec: number;
}

/**
 * 회차 번호로 트랙에 배정해 묶는다. 번호 없는 편은 어느 트랙에도 안 들어간다(호출부가 경고).
 * 트랙에 조각이 하나도 없으면 그 트랙은 결과에서 빠진다.
 */
/** 이 조각이 트랙에 속하나 — 번호 구간(생활동화) 또는 제목 키워드(자연·공룡). */
function inTrackDef(track: TrackDef, title: string): boolean {
  if (track.match) return track.match.test(title);
  if (track.from === undefined || track.to === undefined) return false;
  const n = episodeNumber(title);
  return n !== null && n >= track.from && n <= track.to;
}

export function groupByTrack(parts: CompilationPart[], tracks: TrackDef[]): TrackGroup[] {
  const out: TrackGroup[] = [];
  for (const track of tracks) {
    const inTrack = parts
      .filter((p) => inTrackDef(track, p.title))
      // 번호가 있으면 번호순, 없으면 제목순(결정적이어야 재실행이 같은 결과를 낸다).
      .sort((a, b) => {
        const na = episodeNumber(a.title);
        const nb = episodeNumber(b.title);
        if (na !== null && nb !== null) return na - nb;
        return a.title.localeCompare(b.title, 'ko');
      });
    if (!inTrack.length) continue;
    out.push({
      track,
      parts: inTrack,
      totalSec: inTrack.reduce((s, p) => s + p.durationSec, 0),
    });
  }
  return out;
}

/** 트랙에 못 들어간(번호 없는) 조각 — 호출부에서 경고용. */
export function unassignedParts(parts: CompilationPart[], tracks: TrackDef[]): CompilationPart[] {
  return parts.filter((p) => !tracks.some((t) => inTrackDef(t, p.title)));
}

/**
 * 컴필레이션 제목·설명·태그.
 * 🔴 제목에 순번("모음 1편")·"Ep.N"·개별 작품 나열을 넣지 않는다 — 벤치마크 최하위 포맷이다.
 * 형식: [테마 라벨] 부모 검색어 훅 이모지 N분 연속듣기 | 중간광고 없는 잠자리 동화 | 시리즈
 */
export function buildTrackCompilationMeta(input: {
  seriesLabel: string;
  track: TrackDef;
  parts: CompilationPart[];
  totalSec: number;
}): { title: string; description: string; tags: string[] } {
  const mins = Math.max(1, Math.round(input.totalSec / 60));
  const { track } = input;
  const title =
    `[${track.label}] ${track.hook} ${track.emoji} ${mins}분 연속듣기 | ${track.subtitle ?? DEFAULT_SUBTITLE} | ${input.seriesLabel}`.slice(
      0,
      100
    );

  // 수록 목록은 설명에만(제목엔 넣지 않는다).
  const description = [
    `${input.seriesLabel} 중 '${track.label.replace(' 동화 모음', '')}' 이야기 ${input.parts.length}편을 이어서 들려드려요.`,
    `중간광고 없이 ${mins}분 연속 재생됩니다. 잠자리에서 그대로 틀어 두세요.`,
    '',
    '📖 수록 이야기',
    ...input.parts.map((p, i) => `${i + 1}. ${stripEpisodeNumber(p.title)}`),
    '',
    '👉 전체 그림책으로 보기: https://www.tangobook.co.kr',
    '탱고북 — 광고 없는 명작·자연관찰·생활 동화',
  ].join('\n');

  const tags = [
    '잠자리동화',
    '연속듣기',
    '동화모음',
    '어린이동화',
    '동화책읽어주기',
    '유아동화',
    '생활습관동화',
    track.label.replace(/\s/g, ''),
    input.seriesLabel.replace(/\s/g, ''),
    '탱고북',
  ];
  return { title, description, tags };
}
