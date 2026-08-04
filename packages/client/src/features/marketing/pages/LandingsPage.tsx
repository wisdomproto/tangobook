import { useState } from 'react';

/**
 * `/marketing/landings` — 광고 랜딩(상세페이지) 관리.
 *
 * 🔴 **랜딩을 이 화면에 미리보기로 띄우지 않는다 — iframe 도 안 된다**(2026-08-02 실측).
 *    iframe 으로 `/hangul` 을 띄우면 그건 **같은 앱의 두 번째 인스턴스**다. 두 인스턴스가
 *    같은 Supabase 인증 저장소를 공유해 토큰 갱신이 서로를 건드리고, 그때마다 마케팅 셸의
 *    인증 가드가 다시 마운트되고 → iframe 이 새로 만들어져 앱이 또 부팅되고 → 무한 루프.
 *    프로덕션 실측: **iframe 이 15초에 60번 다시 로드**(초당 4번), 셸 전체가 초당 두 번 교체.
 *    화면이 계속 깜빡이는 걸로 보였다. 인증 말고도 BGM·오디오·서비스워커가 전부 두 벌이 된다.
 *    → **새 탭으로 연다.** 광고 도착지는 어차피 공개 URL 이고, 진짜 조건에서 봐야 맞다.
 *
 * ## 새 랜딩을 추가하는 법
 *
 * 1. 랜딩 페이지를 만들고(`pages/…LandingPage.tsx`) 라우터에 공개 경로로 등록한다.
 * 2. 아래 `LANDINGS` 에 항목 하나를 추가한다 — **그게 전부다.** 둘 이상이 되면 상단에
 *    슬러그 칩이 저절로 뜨고 전환된다(하나뿐일 땐 칩을 숨긴다).
 * 3. `keywords` 는 눈대중으로 적지 말고 실측한다:
 *    `npx tsx packages/server/scripts/naver-volume.ts 키워드1 키워드2 …`
 * 4. `notes` 에는 **결정과 그 근거**를 쓴다. 광고를 돌리는 사람이 소재를 맞추려면
 *    「무료를 안 썼다」가 아니라 「검색량이 180이라 안 썼다」를 알아야 한다.
 */

interface Landing {
  slug: string;
  title: string;
  audience: string;
  /** 이 랜딩이 노리는 키워드 — 숫자는 네이버 검색광고 API 실측. */
  keywords: { word: string; volume: number; comp: string }[];
  /** 카피 결정과 그 근거. 광고를 돌리는 사람이 왜 이렇게 쓰였는지 알아야 소재를 맞춘다. */
  notes: string[];
}

const LANDINGS: Landing[] = [
  {
    slug: '/hangul',
    title: '한글 파닉스 71단원 + 동화책 266권',
    audience: '5~6세 자녀를 둔 부모 · 한글떼기 검색',
    keywords: [
      { word: '5세한글공부', volume: 1140, comp: 'HIGH' },
      { word: '6세한글공부', volume: 940, comp: 'HIGH' },
      { word: '한글떼는시기', volume: 500, comp: 'HIGH' },
      { word: '한글앱', volume: 440, comp: 'MEDIUM' },
      { word: '7세한글공부', volume: 290, comp: 'HIGH' },
      { word: '아이한글가르치기', volume: 250, comp: 'HIGH' },
      { word: '4세한글공부', volume: 220, comp: 'HIGH' },
      { word: '파닉스앱', volume: 100, comp: 'MEDIUM' },
    ],
    notes: [
      '헤드라인에 「무료」를 쓰지 않는다 — 무료동화책 70 · 무료한글앱 60 · 무료한글공부 50 으로 검색 수요가 사실상 없고, 이 카테고리에서 무료는 싸구려 신호로 읽힌다(경쟁사가 「서드파티 광고 없음」을 유료의 근거로 판다).',
      '「1년 무료」는 본문 끝에서 처음 꺼낸다. 이미 읽고 있는 사람에게는 결정을 뒤집는 정보다.',
      '마감 날짜를 쓰지 않는다 — 약속하면 오퍼를 접거나 미룰 때 발목이 잡힌다.',
      '앱스토어 평점이 없으므로(PWA) 후기 자리를 「직접 해보기」(실제 학습 활동)가 대신한다.',
      '경쟁사 이름을 쓰지 않는다. 대비는 가격대로만 — 앱 단품 월 3만원 이하 / 패드 묶음 월 8만~14만원.',
    ],
  },
];

const SITE = 'https://www.tangobook.co.kr';

function CopyButton({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard?.writeText(text).then(
          () => {
            setDone(true);
            window.setTimeout(() => setDone(false), 1600);
          },
          () => {} // 클립보드 거부 — 조용히 넘긴다(주소는 화면에 보인다)
        );
      }}
      className="rounded-md border border-border px-2.5 py-1 text-xs font-medium hover:bg-accent"
    >
      {done ? '복사됨' : label}
    </button>
  );
}

export function LandingsPage() {
  const [active, setActive] = useState(LANDINGS[0].slug);
  const landing = LANDINGS.find((l) => l.slug === active) ?? LANDINGS[0];
  const url = `${SITE}${landing.slug}`;

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto p-4 sm:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg font-bold break-keep">광고 랜딩</h1>
          <p className="mt-0.5 text-xs text-muted-foreground break-keep">
            광고 소재에서 보낼 도착지. 여기 URL 을 그대로 씁니다.
          </p>
        </div>
      </header>

      {LANDINGS.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {LANDINGS.map((l) => (
            <button
              key={l.slug}
              onClick={() => setActive(l.slug)}
              className={`rounded-full border px-3 py-1 text-xs ${
                l.slug === active ? 'border-primary bg-accent font-semibold' : 'border-border'
              }`}
            >
              {l.slug}
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex flex-wrap items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded bg-muted px-2 py-1.5 text-xs">
              {url}
            </code>
            <CopyButton text={url} label="URL 복사" />
          </div>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="mt-3 flex min-h-[44px] w-full items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            새 탭에서 열기 ↗
          </a>
          <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground break-keep">
            여기에 미리보기를 띄우지 않습니다 — 랜딩은 이 앱과 같은 코드라, 안에 끼워 넣으면 앱이 두
            벌 돌면서 화면이 깜빡입니다. 새 탭이 광고 도착지와 같은 조건이기도 합니다.
          </p>
        </div>

        <aside className="flex flex-col gap-4">
          <section className="rounded-xl border border-border bg-card p-4">
            <h2 className="text-sm font-bold break-keep">{landing.title}</h2>
            <p className="mt-1 text-xs text-muted-foreground break-keep">{landing.audience}</p>
          </section>

          <section className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-xs font-bold text-muted-foreground">
              노리는 키워드 · 월 검색량 (네이버 실측)
            </h3>
            <ul className="mt-2 space-y-1">
              {landing.keywords.map((k) => (
                <li key={k.word} className="flex items-center justify-between gap-2 text-xs">
                  <span className="truncate">{k.word}</span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="font-semibold">{k.volume.toLocaleString()}</span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] ${
                        k.comp === 'LOW'
                          ? 'bg-emerald-500/15 text-emerald-600'
                          : k.comp === 'MEDIUM'
                            ? 'bg-amber-500/15 text-amber-600'
                            : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {k.comp}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[11px] text-muted-foreground break-keep">
              다시 재려면{' '}
              <code className="rounded bg-muted px-1">npx tsx scripts/naver-volume.ts 키워드…</code>
            </p>
          </section>

          <section className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-xs font-bold text-muted-foreground">카피 결정 · 근거</h3>
            <ul className="mt-2 space-y-2">
              {landing.notes.map((n) => (
                <li key={n} className="text-[11px] leading-relaxed text-foreground/80 break-keep">
                  · {n}
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
