import { useSeo } from '@/lib/useSeo';
import { PublicNav } from '@/components/PublicNav';
import { WORKSHEET_TRACKS, type WorksheetTrack } from './WorksheetPage';

/**
 * 인쇄 자료 허브 — 사람이 기억할 한 군데. 검색은 하위 둘이 각각 받는다.
 *
 * 🔴 제목을 낱말 하나로 짓지 않는다. 「도안」(색칠)과 「학습지」(한글)는 부모가 쓰는 말이 갈려서
 *    둘을 아우르는 낱말이 없다 — 서술형으로 둔다.
 */
export default function WorksheetHubPage() {
  useSeo({
    title: '집에서 뽑아 쓰는 학습지 — 한글·영어 파닉스',
    description: '한글 32단원 120쪽, 영어 파닉스 39단원 164쪽. 가입 없이 A4 로 인쇄하세요.',
    path: '/worksheet',
    keywords: '한글 학습지, 영어 파닉스 학습지, 유아 학습지 무료, 한글 워크북',
  });

  const tracks = Object.entries(WORKSHEET_TRACKS) as [
    WorksheetTrack,
    (typeof WORKSHEET_TRACKS)[WorksheetTrack],
  ][];

  return (
    <>
      <PublicNav />
      <main className="min-h-screen bg-gradient-to-b from-cream-50 to-peach-100 px-4 py-10 sm:px-6 sm:py-14">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-center font-display text-[28px] font-extrabold text-ink-900 break-keep sm:text-[38px]">
            집에서 뽑아 쓰는 학습지
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-center text-[16px] leading-relaxed text-ink-700 break-keep sm:text-[19px]">
            가입도 결제도 없이 A4 로 인쇄해 쓰세요.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {tracks.map(([key, t]) => (
              /* 🔴 **인쇄물로 바로 보낸다**(2026-08-18 사용자). 「무료 한글 학습지」라고 적힌 카드를
                 눌렀는데 학습지가 아니라 학습지 소개가 나오면 한 번 더 눌러야 한다 — 여기 온 사람은
                 이미 뽑기로 마음먹은 사람이다.
                 ⚠️ `/worksheet/{track}` 착지 페이지는 그대로 남는다: 검색어가 갈려 있어
                 (한글 학습지 950 vs 영어 파닉스 2,020) 각자 받아야 하고 이 허브가 그 자리를 대신 못 한다. */
              <a
                key={key}
                href={t.file}
                target="_blank"
                rel="noreferrer"
                className="rounded-3xl border-2 border-peach-200 bg-white/80 p-6 text-center transition hover:border-coral-300 sm:p-8"
              >
                <p className="font-display text-[20px] font-extrabold text-ink-900 break-keep sm:text-[24px]">
                  {t.title}
                </p>
                <p className="mt-2 text-[15px] font-bold text-coral-700">
                  {t.units}단원 · {t.pages}쪽
                </p>
                <p className="mt-3 text-[14px] leading-relaxed text-ink-600 break-keep">{t.lead}</p>
                <p className="mt-4 inline-flex min-h-[44px] items-center rounded-full bg-coral-700 px-6 text-[15px] font-extrabold text-white">
                  🖨 인쇄용으로 열기
                </p>
              </a>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
