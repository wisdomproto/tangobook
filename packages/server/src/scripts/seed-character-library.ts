/**
 * 12지신 한글 파닉스 캐릭터를 캐릭터 라이브러리에 시드하는 스크립트
 * 실행: npx tsx src/scripts/seed-character-library.ts
 */
import { uploadJsonToR2 } from '../providers/r2.provider.js';
import type { SavedCharacter } from '@tangobook/shared';

const characters: SavedCharacter[] = [
  {
    id: String(Date.now()),
    createdAt: new Date().toISOString(),
    name: '호돌이',
    role: '주인공',
    height: 120,
    description:
      '호랑이. 용감하고 친절하며 모두를 잘 이끄는 리더형. 새로운 것을 배우는 걸 좋아하고 친구들을 도와주는 것을 좋아함. 파란 배낭을 메고, 항상 한글 카드를 지참. 주황 줄무늬, 반짝이는 눈.',
    descriptionEn:
      'Tiger. Brave, kind leader who loves learning new things and helping friends. Wears a blue backpack, always carries Korean alphabet cards. Orange stripes, sparkling eyes.',
  },
  {
    id: String(Date.now() + 1),
    createdAt: new Date().toISOString(),
    name: '찍찍이',
    role: '조연',
    height: 60,
    description:
      '쥐. 재빠르고 똑똑하며 문제 해결을 잘함. 조금 소심하지만 머리가 매우 좋음. 작은 안경 착용. 치즈를 항상 들고 다님.',
    descriptionEn:
      'Mouse. Quick-witted and smart, great at problem solving. A bit shy but very clever. Wears small glasses. Always carries cheese.',
  },
  {
    id: String(Date.now() + 2),
    createdAt: new Date().toISOString(),
    name: '음메',
    role: '조연',
    height: 130,
    description:
      '소. 느긋하고 착하며 힘이 세고 끈기가 있음. 천천히 하지만 확실하게 배움. 넓은 어깨, 항상 미소. 작은 풀에 꽃 장식.',
    descriptionEn:
      'Cow. Easy-going, kind, strong and persistent. Learns slowly but surely. Broad shoulders, always smiling. Small flower decoration on grass.',
  },
  {
    id: String(Date.now() + 3),
    createdAt: new Date().toISOString(),
    name: '깡충이',
    role: '조연',
    height: 80,
    description:
      '토끼. 발랄하고 활동적이며 점프를 잘함. 에너지가 넘치고 항상 긍정적. 긴 귀가 매력 포인트. 당근을 항상 들고 다님.',
    descriptionEn:
      'Rabbit. Lively, active, great at jumping. Full of energy and always positive. Long ears are the charm point. Always carries a carrot.',
  },
  {
    id: String(Date.now() + 4),
    createdAt: new Date().toISOString(),
    name: '용용이',
    role: '조연',
    height: 110,
    description:
      '용. 상상력이 풍부하고 창의적이며 마법 같은 학습법을 알려줌. 약간 으스대지만 마음은 따뜻함. 작은 날개로 둥둥 떠다님. 반짝이는 비늘.',
    descriptionEn:
      'Dragon. Imaginative and creative, teaches with magical methods. A bit boastful but warm-hearted. Floats around with small wings. Shiny scales.',
  },
  {
    id: String(Date.now() + 5),
    createdAt: new Date().toISOString(),
    name: '스르르',
    role: '조연',
    height: 50,
    description:
      '뱀. 조용하고 차분하며 집중력이 좋음. 말을 천천히 하고 신중함. 긴 몸으로 한글 모양을 직접 만들 수 있음. 초록 빛 비늘.',
    descriptionEn:
      'Snake. Quiet, calm, with great focus. Speaks slowly and carefully. Can shape Korean letters with its long body. Green shiny scales.',
  },
  {
    id: String(Date.now() + 6),
    createdAt: new Date().toISOString(),
    name: '달달이',
    role: '조연',
    height: 130,
    description:
      '말. 자유롭고 활발하며 빠른 학습을 좋아함. 경쟁심이 있고 활동적. 알록달록한 갈기. 빨리 달리기를 좋아함.',
    descriptionEn:
      'Horse. Free-spirited, lively, loves fast learning. Competitive and active. Colorful mane. Loves running fast.',
  },
  {
    id: String(Date.now() + 7),
    createdAt: new Date().toISOString(),
    name: '몽실이',
    role: '조연',
    height: 90,
    description:
      '양. 순하고 부드러우며 느긋함. 평화롭고 친구들을 편안하게 해줌. 구름 같은 솜털. 항상 조금 졸려 함.',
    descriptionEn:
      'Sheep. Gentle, soft, and easy-going. Peaceful and makes friends comfortable. Cloud-like fluffy wool. Always a bit sleepy.',
  },
  {
    id: String(Date.now() + 8),
    createdAt: new Date().toISOString(),
    name: '재재이',
    role: '조연',
    height: 90,
    description:
      '원숭이. 장난꾸러기지만 영리하고 재주가 많음. 호기심이 많고 활발함. 긴 꼬리로 거꾸로 매달리기. 바나나를 항상 들고 다님.',
    descriptionEn:
      'Monkey. Mischievous but clever and talented. Very curious and active. Hangs upside down with long tail. Always carries a banana.',
  },
  {
    id: String(Date.now() + 9),
    createdAt: new Date().toISOString(),
    name: '꼬꼬',
    role: '조연',
    height: 70,
    description:
      '닭. 부지런하고 성실하며 아침형 인간. 시간을 잘 지키고 책임감이 강함. 빨간 벼슬이 자랑. 일찍 일어나는 것을 좋아함.',
    descriptionEn:
      'Chicken. Diligent, sincere, early bird. Great at keeping time, strong sense of responsibility. Proud red comb. Loves waking up early.',
  },
  {
    id: String(Date.now() + 10),
    createdAt: new Date().toISOString(),
    name: '멍멍이',
    role: '조연',
    height: 100,
    description:
      '개. 충직하고 따뜻하며 친구들에게 헌신적. 응원과 격려를 잘해줌. 펄럭이는 귀. 꼬리를 흔들며 좋아함.',
    descriptionEn:
      'Dog. Loyal, warm, and devoted to friends. Great at cheering and encouraging. Floppy ears. Wags tail happily.',
  },
  {
    id: String(Date.now() + 11),
    createdAt: new Date().toISOString(),
    name: '꿀꿀이',
    role: '조연',
    height: 90,
    description:
      '돼지. 낙천적이고 먹는 것에는 열정이 넘침. 즐겁게 배우는 것을 중요하게 생각함. 동그란 배. 도넛과 간식을 항상 들고 다님.',
    descriptionEn:
      'Pig. Optimistic with great passion for food. Values learning with joy. Round belly. Always carries donuts and snacks.',
  },
];

async function main() {
  console.warn(`12지신 캐릭터 ${characters.length}개를 라이브러리에 저장합니다...`);
  await uploadJsonToR2(characters, 'character-library.json');
  console.warn('완료!');
}

main().catch(console.error);
