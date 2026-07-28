import { Link } from 'react-router-dom';
import type { Lang, LearningEvent, StorybookSummary } from '@tangobook/shared';
import { KOREAN_PHONICS_CURRICULUM, ENGLISH_PHONICS_CURRICULUM } from '@tangobook/shared';
import { readPhonicsUnitIds } from '../lib/phonics-progress';

interface Props {
  events: LearningEvent[];
  storybooks: StorybookSummary[];
  lang: Lang;
}

/**
 * 파닉스 탭 첫 화면 — **문장 두 줄 + 버튼 하나**.
 *
 * 🔴 히트맵(자음×모음 8×10 격자)·스킬트리는 만드는 데 제일 오래 걸렸지만 부모가 제일 안 읽는다.
 *    `a_e` 가 뭔지 모르고, 회색과 연한 코랄의 차이를 읽어내는 건 데이터 담당자의 일이다.
 *    부모가 묻는 건 "어디까지 갔나 / 지금 뭘 하나 / 이어서 하려면 어디로" 셋뿐이라 그것만 문장으로 낸다.
 *    격자는 아래 접이식으로 내려간다(지우지 않는다 — 궁금한 부모는 열어본다).
 */
export function PhonicsSummaryCard({ events, storybooks, lang }: Props) {
  const read = readPhonicsUnitIds(events, storybooks);
  /**
   * 🔴 **"아직 시작하지 않았어요" 를 단원 방문만으로 판단하면 거짓말이 된다** — 음절·낱말 기록은
   *    쌓여 있는데(아래 표에 색이 있는데) 위에서는 시작 안 했다고 말하는 화면이 실제로 나왔다.
   *    파닉스에서 나온 기록이 **하나라도** 있으면 시작한 것으로 본다.
   */
  const hasAnyPhonics = read.size > 0 || events.some((e) => e.metadata?.source === 'phonics');
  const isKo = lang === 'ko';
  const levels = isKo ? KOREAN_PHONICS_CURRICULUM : ENGLISH_PHONICS_CURRICULUM;

  const units = levels.flatMap((l) => l.units.map((u) => ({ ...u, levelName: l.name })));
  const doneCount = units.filter((u) => read.has(u.id)).length;
  // 지금 하고 있는 자리 = 아직 안 한 첫 단원(커리큘럼 순서가 곧 학습 순서다).
  const next = units.find((u) => !read.has(u.id));
  const to = `/library/phonics/${isKo ? 'korean' : 'english'}${next ? `/${next.id}` : ''}`;

  // 🔴 아무 기록도 없으면 **카드를 아예 그리지 않는다** — 아래 표가 이미 "아직 아무것도 없음" 을
  //    보여주는데 위에서 한 번 더 선언하면 잔소리이고, 틀렸을 때는 거짓말이 된다(사용자 지적).
  if (!hasAnyPhonics) return null;

  return (
    <div className="rounded-3xl bg-gradient-to-br from-mint-100 to-cream-50 p-5 shadow-soft">
      <p className="text-lg font-black text-ink-900 break-keep">
        {doneCount > 0
          ? `${units.length}단원 중 ${doneCount}단원을 마쳤어요.`
          : '파닉스를 하고 있어요.'}
      </p>
      {next && (
        <p className="mt-1 text-sm font-bold text-ink-600 break-keep">
          {doneCount > 0 ? '지금은 ' : '다음은 '}
          <span className="text-coral-600">「{next.title}」</span>
          {doneCount > 0 ? ' 를 하고 있어요.' : ' 예요.'}
        </p>
      )}
      <Link
        to={to}
        className="mt-3 inline-flex rounded-full bg-coral-500 px-5 py-2.5 text-sm font-black text-white shadow-pop transition hover:-translate-y-0.5"
      >
        {doneCount > 0 ? '이어서 하기' : '하러 가기'}
      </Link>
    </div>
  );
}
