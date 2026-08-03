import { useState } from 'react';

/**
 * `/marketing/landings` — 광고 랜딩(상세페이지) 관리.
 *
 * 🔴 랜딩 자체를 이 셸 안에 그리지 않는다. 마케팅 셸은 다크 지원 운영 대시보드이고
 *    랜딩은 cream 고정에 자체 헤더·푸터·하단 고정 CTA 를 갖는 **독립 문서**다.
 *    같은 트리에 넣으면 배경·폰트·스크롤이 서로를 밟는다 → **iframe 으로 미리보기**만 한다.
 *    (광고 도착지는 어차피 공개 URL 이라 그 URL 을 그대로 띄우는 게 실제와 가장 가깝다.)
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
  const [device, setDevice] = useState<'mobile' | 'desktop'>('mobile');
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
        <div className="flex items-center gap-1 rounded-lg border border-border p-0.5">
          {(['mobile', 'desktop'] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDevice(d)}
              className={`rounded-md px-3 py-1 text-xs font-medium ${
                device === d ? 'bg-accent' : 'text-muted-foreground hover:bg-accent/50'
              }`}
            >
              {d === 'mobile' ? '📱 모바일' : '🖥 데스크탑'}
            </button>
          ))}
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
        {/* 미리보기 — 배포본이 아니라 **지금 이 서버**를 띄운다(로컬에서 고치면 바로 보인다). */}
        <div className="rounded-xl border border-border bg-card p-3">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded bg-muted px-2 py-1 text-xs">
              {url}
            </code>
            <CopyButton text={url} label="URL 복사" />
            <a
              href={landing.slug}
              target="_blank"
              rel="noreferrer"
              className="rounded-md border border-border px-2.5 py-1 text-xs font-medium hover:bg-accent"
            >
              새 탭 ↗
            </a>
          </div>
          <div className="flex justify-center overflow-hidden rounded-lg bg-muted/40 p-3">
            <iframe
              key={device}
              src={landing.slug}
              title={`${landing.slug} 미리보기`}
              className="rounded-md border border-border bg-white"
              style={
                device === 'mobile' ? { width: 390, height: 780 } : { width: '100%', height: 780 }
              }
            />
          </div>
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
