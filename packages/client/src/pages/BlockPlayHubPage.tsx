import { Link } from 'react-router-dom';
import { PublicNav } from '@/components/PublicNav';
import { useSeo } from '@/lib/useSeo';

const TRACKS = [
  {
    lang: 'hangul',
    badge: '한글',
    title: '한글 블록 놀이',
    description: '자음과 모음을 놓아 음절과 낱말을 만들어요.',
    example: ['ㄱ', 'ㅏ', '가'],
    screenPath: '/blocks/hangul?mode=screen',
    cameraPath: '/blocks/hangul?mode=camera',
    phonicsPath: '/library/phonics/korean',
    tone: 'from-coral-50 to-amber-50 border-coral-200',
    block: 'bg-coral-500',
  },
  {
    lang: 'english',
    badge: 'English',
    title: '영어 파닉스 블록 놀이',
    description: '알파벳 소리를 이어 영어 낱말을 완성해요.',
    example: ['c', 'a', 't'],
    screenPath: '/blocks/english?mode=screen',
    cameraPath: '/blocks/english?mode=camera',
    phonicsPath: '/library/phonics/english',
    tone: 'from-sky-50 to-indigo-50 border-sky-200',
    block: 'bg-indigo-500',
  },
] as const;

export default function BlockPlayHubPage() {
  useSeo({
    title: '한글·영어 파닉스 블록 게임 — 온라인·실물 블록 카메라 연결 | 탱고북',
    description:
      '화면 블록으로 먼저 해 보고, 한글·영어 실물 블록이 있으면 카메라로 연결해 같은 파닉스 낱말 게임을 해 보세요.',
    path: '/blocks',
    keywords: '한글 블록 게임, 영어 파닉스 게임, 알파벳 블록, 한글 놀이, 파닉스 놀이',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: '탱고북 한글·영어 파닉스 블록 놀이',
      url: 'https://www.tangobook.co.kr/blocks',
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream-50 via-white to-peach-100">
      <PublicNav />
      <main>
        <section className="px-4 pb-12 pt-12 sm:px-6 sm:pb-16 sm:pt-16">
          <div className="mx-auto max-w-5xl text-center">
            <p className="mx-auto inline-flex rounded-full bg-coral-100 px-4 py-2 text-sm font-extrabold text-coral-800">
              화면에서 시작하고 · 손으로 이어서
            </p>
            <h1 className="mt-5 font-display text-4xl font-black leading-tight text-ink-900 break-keep sm:text-6xl">
              한글·영어 파닉스를
              <br />
              <span className="text-coral-700">블록으로 만들어요</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-ink-700 break-keep sm:text-xl">
              블록이 없어도 화면에서 바로 놀 수 있어요. 실물 블록이 있다면 카메라를 켜고, 아이가
              손으로 만든 글자와 낱말을 그대로 읽어 봅니다.
            </p>

            <div
              className="mx-auto mt-9 flex max-w-xl items-center justify-center gap-3"
              aria-hidden
            >
              <div className="grid h-20 w-20 place-items-center rounded-3xl bg-white text-4xl font-black text-coral-700 shadow-pop ring-2 ring-coral-100 sm:h-24 sm:w-24 sm:text-5xl">
                ㄱ
              </div>
              <span className="text-3xl font-black text-ink-300">+</span>
              <div className="grid h-20 w-20 place-items-center rounded-3xl bg-white text-4xl font-black text-amber-600 shadow-pop ring-2 ring-amber-100 sm:h-24 sm:w-24 sm:text-5xl">
                ㅏ
              </div>
              <span className="text-3xl font-black text-ink-300">→</span>
              <div className="grid h-20 w-20 place-items-center rounded-3xl bg-coral-600 text-4xl font-black text-white shadow-pop sm:h-24 sm:w-24 sm:text-5xl">
                가
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 pb-16 sm:px-6" aria-labelledby="block-tracks-title">
          <div className="mx-auto max-w-5xl">
            <h2
              id="block-tracks-title"
              className="text-center font-display text-2xl font-black text-ink-900 sm:text-3xl"
            >
              어떤 블록으로 놀까요?
            </h2>
            <div className="mt-7 grid gap-5 md:grid-cols-2">
              {TRACKS.map((track) => (
                <article
                  key={track.lang}
                  className={`rounded-[2rem] border bg-gradient-to-br ${track.tone} p-6 shadow-sm sm:p-8`}
                >
                  <span className="inline-flex rounded-full bg-white/80 px-3 py-1 text-xs font-black text-ink-600">
                    {track.badge}
                  </span>
                  <h3 className="mt-4 font-display text-2xl font-black text-ink-900 sm:text-3xl">
                    {track.title}
                  </h3>
                  <p className="mt-2 text-base text-ink-700 break-keep">{track.description}</p>
                  <div className="mt-5 flex gap-2" aria-hidden>
                    {track.example.map((letter, index) => (
                      <span
                        key={`${track.lang}-${letter}-${index}`}
                        className={`grid h-14 min-w-14 place-items-center rounded-2xl px-3 text-2xl font-black text-white shadow-soft ${track.block}`}
                      >
                        {letter}
                      </span>
                    ))}
                  </div>
                  <div className="mt-7 grid gap-3 sm:grid-cols-2">
                    <Link
                      to={track.screenPath}
                      className="flex min-h-[56px] items-center justify-center rounded-2xl bg-ink-900 px-4 text-center font-extrabold text-white transition hover:bg-ink-800"
                    >
                      🧩 화면 블록으로 시작
                    </Link>
                    <Link
                      to={track.cameraPath}
                      className="flex min-h-[56px] items-center justify-center rounded-2xl border-2 border-ink-200 bg-white px-4 text-center font-extrabold text-ink-800 transition hover:border-coral-300 hover:bg-coral-50"
                    >
                      📷 실물 블록 연결
                    </Link>
                  </div>
                  <Link
                    to={track.phonicsPath}
                    className="mt-4 inline-flex min-h-[44px] items-center font-bold text-coral-800 underline-offset-4 hover:underline"
                  >
                    파닉스 단원도 같이 배우기 →
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white/80 px-4 py-14 sm:px-6">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center font-display text-2xl font-black text-ink-900 sm:text-3xl">
              디지털에서 익히고, 손으로 확인해요
            </h2>
            <ol className="mt-8 grid gap-4 md:grid-cols-3">
              {[
                ['1', '화면에서 먼저', '블록을 끌어 놓으며 글자와 소리가 합쳐지는 규칙을 익혀요.'],
                [
                  '2',
                  '실물 블록으로',
                  '자음·모음이나 알파벳 블록을 손으로 놓고 카메라로 연결해요.',
                ],
                ['3', '파닉스로 이어서', '게임에서 만난 소리를 단원 학습과 낱말 읽기로 이어가요.'],
              ].map(([n, title, body]) => (
                <li key={n} className="rounded-3xl bg-cream-50 p-6">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-coral-600 font-black text-white">
                    {n}
                  </span>
                  <h3 className="mt-4 font-display text-xl font-black text-ink-900">{title}</h3>
                  <p className="mt-2 leading-relaxed text-ink-600 break-keep">{body}</p>
                </li>
              ))}
            </ol>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <Link
                to="/activity"
                className="inline-flex min-h-[48px] items-center rounded-full border-2 border-coral-300 bg-white px-6 font-extrabold text-coral-800 hover:bg-coral-50"
              >
                활동지도 온라인·인쇄로 해보기
              </Link>
              <Link
                to="/library/phonics"
                className="inline-flex min-h-[48px] items-center rounded-full bg-coral-700 px-6 font-extrabold text-white hover:bg-coral-800"
              >
                한글·영어 파닉스 전체 보기
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
