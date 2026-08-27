import { Link, useLocation, useParams } from 'react-router-dom';
import {
  PHONICS_TRACK_META,
  flattenPhonicsUnits,
  isPhonicsTrack,
  type FlatPhonicsUnit,
} from '@tangobook/shared';
import { useSeo } from '@/lib/useSeo';

/**
 * 파닉스 커리큘럼 소개 — 서버 SSR(`seo-phonics.service`)의 **짝 페이지**.
 *
 * 🔴 SSR 만 두면 사람은 빈 화면을 본다. 서버가 `#root` 에 본문을 넣어도 React 가 마운트하면서
 *    통째로 교체하는데, 그 주소에 라우트가 없으면 교체 결과가 404 다. 책 `/library/:id/about`
 *    (`BookSeoPage`)이 같은 이유로 짝을 이룬다.
 * 🔴 **단원을 펴는 규칙은 `@tangobook/shared` 하나뿐이다** — 서버와 여기가 각자 세면
 *    같은 URL 이 서로 다른 단원을 가리키게 된다.
 * ⚠️ 아이 화면이 아니라 **부모·크롤러가 읽는 화면**이다. 게임 톤을 쓰지 않는다.
 */
export default function PhonicsCurriculumPage() {
  const { unitId } = useParams<{ unitId?: string }>();
  // 🔴 트랙은 파라미터가 아니라 **경로에서** 읽는다 — 라우트가 `library/phonics/korean/...` 처럼
  //    정적으로 등록돼 있기 때문이다(그래야 학습 라우트의 `:activityKey` 가 `about` 을 안 집어간다).
  const { pathname } = useLocation();
  const rawTrack = /\/library\/phonics\/([^/]+)/.exec(pathname)?.[1] ?? '';
  const track = isPhonicsTrack(rawTrack) ? rawTrack : null;
  const units = track ? flattenPhonicsUnits(track) : [];
  const meta = track ? PHONICS_TRACK_META[track] : null;
  const unit = unitId ? (units.find((u) => u.id === unitId) ?? null) : null;
  const notFound = !track || (unitId ? !unit : false);

  const title = notFound
    ? '파닉스 커리큘럼 | 탱고북'
    : unit
      ? `${unit.name} — ${meta!.label} ${unit.position}단원 | 탱고북`
      : `${meta!.label} ${units.length}단원 — 4~7세 커리큘럼 | 탱고북`;

  useSeo({
    title,
    description: unit
      ? `${meta!.label} ${unit.position}단원 「${unit.name}」 — ${unit.sampleWords.slice(0, 6).join(' · ')}`
      : meta
        ? `${meta.label} ${units.length}단원 전체 목록. 단원마다 새 소리를 하나씩 익히고 그 소리로 낱말을 읽습니다.`
        : '탱고북 파닉스 커리큘럼',
  });

  if (notFound) {
    return (
      <div className="px-4 sm:px-6 py-10 max-w-[900px] mx-auto text-center">
        <p className="text-ink-700 font-bold">찾는 단원이 없어요.</p>
        <Link className="mt-4 inline-block underline text-coral-500" to="/library/phonics/korean">
          파닉스로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 py-6 max-w-[900px] mx-auto">
      {/* PageHeader 는 onBack 콜백을 요구하는 학습용 헤더다 — 여기는 부모·크롤러가 읽는
          정적 문서라 단순한 breadcrumb 이 맞다. */}
      <nav className="text-sm text-ink-500">
        <Link className="underline" to="/library/phonics/korean">
          파닉스
        </Link>
        {' · '}
        <Link className="underline" to={`/library/phonics/${track}/about`}>
          {meta!.label}
        </Link>
      </nav>
      {unit ? (
        <UnitView track={track!} unit={unit} units={units} />
      ) : (
        <TrackView track={track!} units={units} />
      )}
    </div>
  );
}

function Chips({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-wrap gap-2 mt-2">
      {items.map((s) => (
        <li
          key={s}
          className="px-3 py-1.5 rounded-xl bg-cream-100 text-ink-900 font-display font-extrabold text-base sm:text-lg"
        >
          {s}
        </li>
      ))}
    </ul>
  );
}

function UnitView({
  track,
  unit,
  units,
}: {
  track: 'korean' | 'english';
  unit: FlatPhonicsUnit;
  units: FlatPhonicsUnit[];
}) {
  const meta = PHONICS_TRACK_META[track];
  const i = units.findIndex((u) => u.id === unit.id);
  const prev = units[i - 1];
  const next = units[i + 1];
  const combosLabel = unit.syllables.length ? '만드는 글자' : '낱말 패턴';
  const combos = unit.syllables.length ? unit.syllables : unit.patterns;

  return (
    <article className="mt-2">
      <h1 className="text-2xl sm:text-3xl font-display font-black text-ink-900 break-keep">
        {unit.name}
      </h1>
      <p className="mt-2 text-ink-600 break-keep">
        {unit.levelName} · {unit.levelDescription}
      </p>

      {unit.phonemes.length > 0 && (
        <section className="mt-6">
          <h2 className="font-display font-extrabold text-ink-900">배우는 소리</h2>
          <Chips items={unit.phonemes} />
        </section>
      )}

      {combos.length > 0 && (
        <section className="mt-6">
          <h2 className="font-display font-extrabold text-ink-900">
            {combosLabel} ({combos.length})
          </h2>
          <Chips items={combos} />
        </section>
      )}

      {unit.sampleWords.length > 0 && (
        <section className="mt-6">
          <h2 className="font-display font-extrabold text-ink-900">
            읽는 낱말 ({unit.sampleWords.length})
          </h2>
          <Chips items={unit.sampleWords} />
        </section>
      )}

      <section className="mt-6">
        <h2 className="font-display font-extrabold text-ink-900">이 단원에서 하는 것</h2>
        <p className="mt-2 text-ink-700 break-keep leading-relaxed">
          소리를 듣고 고르기, 글자를 손가락으로 따라 쓰기, 낱말과 그림 짝 맞추기를 합니다. 맞힌
          낱말은 그 낱말이 나오는 동화책 한 쪽으로 이어집니다.
        </p>
      </section>

      <Link
        to={`${meta.learnBase}/${unit.id}`}
        className="mt-7 inline-flex min-h-[44px] items-center rounded-2xl bg-coral-500 px-6 font-display font-extrabold text-white shadow-soft"
      >
        이 단원 학습하기 →
      </Link>

      <nav className="mt-8 flex flex-wrap gap-x-3 gap-y-2 text-sm text-ink-600">
        {prev && (
          <Link className="underline" to={`/library/phonics/${track}/${prev.id}/about`}>
            ← {prev.name}
          </Link>
        )}
        <Link className="underline" to={`/library/phonics/${track}/about`}>
          {meta.label} 전체 단원
        </Link>
        {next && (
          <Link className="underline" to={`/library/phonics/${track}/${next.id}/about`}>
            {next.name} →
          </Link>
        )}
      </nav>
    </article>
  );
}

function TrackView({ track, units }: { track: 'korean' | 'english'; units: FlatPhonicsUnit[] }) {
  const meta = PHONICS_TRACK_META[track];
  const byLevel = new Map<string, FlatPhonicsUnit[]>();
  for (const u of units) {
    if (!byLevel.has(u.levelName)) byLevel.set(u.levelName, []);
    byLevel.get(u.levelName)!.push(u);
  }

  return (
    <article className="mt-2">
      <h1 className="text-2xl sm:text-3xl font-display font-black text-ink-900 break-keep">
        {meta.label} {units.length}단원
      </h1>
      <p className="mt-3 text-ink-700 break-keep leading-relaxed">
        {meta.soundNoun}부터 시작해 단원마다 새 소리를 하나씩 익히고, 그 소리로 낱말을 읽습니다.
        배운 낱말은 탱고북 동화책에 그대로 나오기 때문에, 글자 공부가 곧 그날의 읽기가 됩니다.
      </p>

      {[...byLevel.entries()].map(([levelName, list]) => (
        <section key={levelName} className="mt-7">
          <h2 className="font-display font-extrabold text-ink-900">
            {levelName} ({list.length}단원)
          </h2>
          <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {list.map((u) => (
              <li key={u.id}>
                <Link
                  to={`/library/phonics/${track}/${u.id}/about`}
                  className="flex min-h-[44px] items-center gap-2 rounded-xl bg-cream-100 px-4 py-2 text-ink-900 hover:bg-cream-200"
                >
                  <span className="font-display font-extrabold text-ink-500 shrink-0">
                    {u.position}
                  </span>
                  <span className="break-keep">{u.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <Link
        to={meta.learnBase}
        className="mt-8 inline-flex min-h-[44px] items-center rounded-2xl bg-coral-500 px-6 font-display font-extrabold text-white shadow-soft"
      >
        {meta.label} 시작하기 →
      </Link>
    </article>
  );
}
