// 🔴 한글 낱말 찾기 — 조사만 허용한다.
// '다'·'네'·'지'·'라도'·'든' 은 조사가 아니라 어미다. 넣었더니 「달다!」·「달라도」가
// 전부 「달(月)」로 잡혀 6권 중 5권이 가짜였다.
export const JOSA = [
  '은','는','이','가','을','를','와','과','도','만','의','에','로','랑','야','아','님','들',
  '에서','으로','이랑','에게','한테','까지','부터','밖에','마다','조차','에는','에도','으로는',
  // 복수형 — 「오리들이」가 안 잡혀서 추가
  '들이','들을','들은','들도','들과','들의','들에','들만','들에게','에서도','에게도','으로도','와도','과도','에서는',
];

// 비유는 사물이 아니다 — 「별처럼 반짝」·「김밥 속 같아」에는 그릴 게 없다.
const SIMILE = /^(처럼|같|듯|만큼)/;

const H = /[가-힣]/;

/** 그 낱말이 실물로 쓰였나. 조사가 붙어도 잡되 다른 낱말의 일부·비유는 뺀다. */
export function has(text, w) {
  let i = -1;
  while ((i = text.indexOf(w, i + 1)) >= 0) {
    if (text[i - 1] && H.test(text[i - 1])) continue; // 앞이 한글 = 다른 낱말의 꼬리
    const rest = text.slice(i + w.length);
    if (SIMILE.test(rest.trimStart())) continue;      // 별처럼 / 김밥 같아
    if (!rest[0] || !H.test(rest[0])) return true;    // 뒤가 한글 아님 = 단독
    if (JOSA.some((j) => rest.startsWith(j) && !H.test(rest[j.length] ?? ''))) return true;
  }
  return false;
}
