interface Props {
  word: string;
  /** 낱말 전체에 걸리는 클래스(색·굵기 등). 크기는 이 컴포넌트가 정한다. */
  className?: string;
}

/**
 * 첫 글자만 크게, 나머지는 작게 — **알파벳을 배우는 화면**의 낱말 표기.
 *
 * 🔴 영어 Book 1 의 목표는 **글자**다(`alligator` 를 읽히는 게 아니다). 그런데 낱말을 한 크기로
 *    쓰면 아이 눈엔 긴 글자 덩어리 하나일 뿐이라, 그 낱말이 왜 `A` 카드에 붙어 있는지가 안 보인다.
 *    첫 글자를 키우면 낱말이 **"A 로 시작하는 것"** 으로 읽힌다.
 * 🔴 Book 2 부터는 쓰지 않는다 — 거긴 패턴이 `_am`(뒤쪽)이라 첫 글자를 키우면 **틀린 곳을 가리킨다**.
 */
export function FirstLetterWord({ word, className }: Props) {
  const head = word.slice(0, 1);
  const tail = word.slice(1);
  if (!head) return null;
  return (
    <span className={className}>
      <span className="text-[1.8em] leading-none align-baseline">{head}</span>
      {tail && <span className="text-[0.85em] leading-none align-baseline opacity-80">{tail}</span>}
    </span>
  );
}
