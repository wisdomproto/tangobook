/**
 * 예문 텍스트 — 타겟 낱말만 코랄로 강조(대소문자 무시, 단어 경계).
 * 써보기(익히기)에서 낱말을 완성하면 그 낱말이 든 예문을 보여줄 때 쓴다. Book 2·3·4·5 공용.
 */
export function SentenceText({ sentence, word }: { sentence: string; word: string }) {
  // word 는 파닉스 낱말(알파벳)이라 정규식 특수문자 걱정 없음.
  const parts = sentence.split(new RegExp(`(\\b${word}\\b)`, 'ig'));
  return (
    <>
      {parts.map((p, i) =>
        p.toLowerCase() === word.toLowerCase() ? (
          <span key={i} className="text-coral-500">
            {p}
          </span>
        ) : (
          <span key={i}>{p}</span>
        )
      )}
    </>
  );
}
