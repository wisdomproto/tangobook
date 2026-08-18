import { Link, Navigate, useParams } from 'react-router-dom';
import { useSeo } from '@/lib/useSeo';
import { PublicNav } from '@/components/PublicNav';

/**
 * 인쇄용 학습지 착지 페이지 — 「무료 한글 학습지」로 검색해 온 사람이 떨어지는 자리.
 *
 * 🔴 **한글·영어를 한 페이지에 몰지 않는다.** 검색어가 아예 다른 낱말이다 —
 *    한글 학습지 950 · 한글 워크북 510 · 한글 활동지 240 vs 영어 파닉스 2,020(네이버 실측).
 *    한 페이지에 몰면 제목을 뭘로 달지 못 정하고 둘 다 놓친다.
 * 🔴 **제목에 「파닉스 활동지」를 쓰지 않는다** — 월 30회다. 사이트 안 라벨로만 쓴다.
 * 🔴 **인쇄물 자체를 여기서 그리지 않는다.** 산출물이 3.5MB·6.1MB 짜리 단일 HTML 이라
 *    착지 페이지에 얹으면 검색으로 온 사람이 첫 화면을 몇 초씩 기다린다. 누른 사람만 연다.
 */
const TRACKS = {
  hangul: {
    title: '무료 한글 학습지',
    lead: '자음·모음부터 받침까지, 집에서 A4 로 뽑아 쓰는 한글 학습지입니다.',
    units: 32,
    pages: 120,
    file: '/worksheet/ko_phonics.html',
    app: '/library/phonics/korean',
    appLabel: '한글 파닉스 앱에서 해보기',
    keywords: '한글 학습지, 한글 워크북, 한글 활동지, 한글 떼기, 유아 한글',
  },
  english: {
    title: '영어 파닉스 학습지',
    lead: '알파벳 소리부터 매직 e 까지, 집에서 A4 로 뽑아 쓰는 파닉스 학습지입니다.',
    units: 39,
    pages: 164,
    file: '/worksheet/en_phonics.html',
    app: '/library/phonics/english',
    appLabel: '영어 파닉스 앱에서 해보기',
    keywords: '영어 파닉스, 파닉스 학습지, 알파벳 학습지, 유아 영어',
  },
} as const;

export type WorksheetTrack = keyof typeof TRACKS;
export const WORKSHEET_TRACKS = TRACKS;

export default function WorksheetPage() {
  const { track } = useParams<{ track: string }>();
  const t = TRACKS[track as WorksheetTrack];

  useSeo({
    title: t ? `${t.title} — ${t.units}단원 ${t.pages}쪽 무료 인쇄` : undefined,
    description: t
      ? `${t.lead} ${t.units}단원 ${t.pages}쪽, 가입 없이 바로 인쇄하세요.`
      : undefined,
    path: `/worksheet/${track}`,
    keywords: t?.keywords,
  });

  if (!t) return <Navigate to="/worksheet" replace />;

  return (
    <>
      <PublicNav />
      <main className="min-h-screen bg-gradient-to-b from-cream-50 to-peach-100 px-4 py-10 sm:px-6 sm:py-14">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="font-display text-[28px] font-extrabold text-ink-900 break-keep sm:text-[38px]">
            {t.title}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-[16px] leading-relaxed text-ink-700 break-keep sm:text-[19px]">
            {t.lead}
          </p>
          <p className="mt-3 text-[15px] font-extrabold text-coral-700 sm:text-lg">
            {t.units}단원 · {t.pages}쪽 · 가입 없이 인쇄
          </p>

          {/* 🔴 새 탭으로 연다 — 인쇄용 문서는 그 자체로 한 벌이라, 같은 탭에서 열면
            돌아올 길이 뒤로가기뿐이고 그 사이 이 페이지가 통째로 버려진다. */}
          <a
            href={t.file}
            target="_blank"
            rel="noreferrer"
            className="mt-8 inline-flex min-h-[64px] w-full max-w-[22rem] items-center justify-center rounded-full bg-coral-700 px-8 text-lg font-extrabold text-white shadow-lg transition hover:bg-coral-800 sm:w-auto sm:text-xl"
          >
            🖨 인쇄용으로 열기
          </a>
          <p className="mt-3 text-[13px] text-ink-500 break-keep">
            브라우저에서 열린 뒤 <strong>Ctrl+P</strong>(맥은 ⌘+P)로 인쇄하세요.
          </p>

          {/* 미리보기 = **인쇄물 그 자체**.
            🔴 스크린샷을 따로 찍지 않는다 — 실물 HTML 이 이미 그 그림이고, 사본을 만들면 학습지를
               고칠 때마다 미리보기가 낡는다(`/intro` 의 「스크린샷 아닌 진짜 컴포넌트」와 같은 이유).
            🔴 `loading="lazy"` 필수 — 이 파일이 3.5~6.1MB 라 즉시 받으면 검색으로 온 사람이
               첫 화면을 몇 초씩 기다린다. 화면에 들어올 때만 받는다.
            🔴 `pointer-events-none` — 미리보기 안에서 스크롤하다 갇히면 페이지를 못 벗어난다. */}
          <figure className="mt-10">
            <div className="mx-auto aspect-[210/297] w-[17rem] overflow-hidden rounded-2xl border-2 border-peach-200 bg-white shadow-soft sm:w-[22rem]">
              <iframe
                src={t.file}
                title={`${t.title} 미리보기`}
                loading="lazy"
                tabIndex={-1}
                scrolling="no"
                /* 🔴 첫 쪽(1123px = A4 한 장)은 인쇄물의 **표지·목차**다 — 그대로 보여주면
                 학습지가 아니라 안내문이 미리보기가 된다. 한 장만큼 올려 실제 익힘 쪽을 보인다. */
                className="pointer-events-none h-[2246px] w-[794px] origin-top-left border-0"
                style={{ transform: 'scale(0.342) translateY(-1123px)' }}
              />
            </div>
            <figcaption className="mt-3 text-[13px] text-ink-500 break-keep">
              첫 쪽 미리보기 — 실제 인쇄물입니다
            </figcaption>
          </figure>

          <div className="mt-10 rounded-3xl border-2 border-peach-200 bg-white/70 p-6 sm:p-8">
            <p className="text-[16px] font-bold text-ink-900 break-keep sm:text-lg">
              종이 말고 화면으로도 할 수 있어요
            </p>
            <Link
              to={t.app}
              className="mt-4 inline-flex min-h-[52px] items-center justify-center rounded-full border-2 border-coral-500 px-7 text-base font-extrabold text-coral-700 transition hover:bg-coral-50"
            >
              {t.appLabel} →
            </Link>
          </div>

          <Link
            to="/worksheet"
            className="mt-8 inline-block text-sm font-bold text-ink-500 underline"
          >
            다른 학습지 보기
          </Link>
        </div>
      </main>
    </>
  );
}
