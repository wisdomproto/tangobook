#!/usr/bin/env node
// 791 unique KeyObject 단어 → 6 카테고리 매핑.
// LLM (Claude) 직접 분류. extraction (docs/key-object-dex-extraction.json) 과 cross-check.
// 출력: docs/key-object-dex-mapping.json (key → category | null).
//
// 미분류 단어는 명시적으로 SKIP 배열에 넣을 것 (조용히 누락 X).
// extraction 에 있는데 분류표에 없는 키는 unknown 으로 reported.
//
// 사용:
//   node packages/server/scripts/build-key-object-dex-mapping.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const docsDir = path.join(__dirname, '..', '..', '..', 'docs');

// ── 카테고리별 분류 ─────────────────────────────────────────────────────────────

// 동물 + 동물 부산물 (꼬리/날개/깃털/알 등) + 공룡
const ANIMAL = [
  // 포유류
  'ko:사자', 'ko:호랑이', 'ko:곰', 'ko:늑대', 'ko:여우', 'ko:코끼리', 'ko:기린', 'ko:얼룩말',
  'ko:표범', 'ko:흑표범', 'ko:치타', 'ko:사슴', 'ko:순록', 'ko:코뿔소', 'ko:하마', 'ko:돼지',
  'ko:양', 'ko:염소', 'ko:당나귀', 'ko:말', 'ko:소', 'ko:암소', 'ko:젖소', 'ko:토끼',
  'ko:다람쥐', 'ko:두더지', 'ko:고슴도치', 'ko:쥐', 'ko:들쥐', 'ko:물쥐', 'ko:생쥐', 'ko:고양이',
  'ko:아기고양이', 'ko:강아지', 'ko:개', 'ko:원숭이',
  // 새
  'ko:새', 'ko:참새', 'ko:까마귀', 'ko:독수리', 'ko:올빼미', 'ko:딱따구리', 'ko:타조',
  'ko:백로', 'ko:앵무새', 'ko:제비', 'ko:백조', 'ko:오리', 'ko:거위', 'ko:암탉', 'ko:수탉',
  // 곤충
  'ko:나비', 'ko:꿀벌', 'ko:개미', 'ko:무당벌레', 'ko:풍뎅이', 'ko:베짱이', 'ko:잠자리',
  'ko:사슴벌레', 'ko:거미', 'ko:파리', 'ko:곤충', 'ko:벌레', 'ko:지렁이',
  // 양서/파충류
  'ko:개구리', 'ko:두꺼비', 'ko:도마뱀', 'ko:카멜레온', 'ko:악어', 'ko:뱀', 'ko:거북이',
  // 해양 동물
  'ko:물고기', 'ko:고래', 'ko:상어', 'ko:문어', 'ko:오징어', 'ko:게', 'ko:물개', 'ko:해마',
  'ko:말미잘', 'ko:흰동가리', 'ko:집게', 'ko:조개',
  // 공룡
  'ko:공룡', 'ko:바리오닉스', 'ko:트리케라톱스', 'ko:스테고사우루스',
  // 동물 부산물 (몸의 일부)
  'ko:꼬리', 'ko:날개', 'ko:부리', 'ko:갈기', 'ko:발톱', 'ko:뿔', 'ko:깃털', 'ko:이빨',
  'ko:촉수', 'ko:지느러미', 'ko:알', 'ko:새끼', 'ko:알주머니', 'ko:앞발', 'ko:갈고리발톱',
  'ko:지느러미 발', 'ko:발바닥 (동물의 발)', 'ko:코 (코끼리의 코)', 'ko:점무늬', 'ko:줄무늬',
  // 동물 거주지
  'ko:벌집', 'ko:벌집 방', 'ko:개미굴', 'ko:둥지', 'ko:새장',
  'ko:먹이', 'ko:꽃가루 바구니', 'ko:털실', // 털실=동물 털, 양/고양이 책에서 등장
  // 영문 키
  'en:panda', 'en:kangaroo', 'en:pouch',
  // 추가 (unknown 정리)
  'ko:달팽이', 'ko:목줄',
];

// 음식 (먹는 것)
const FOOD = [
  // 과일
  'ko:사과', 'ko:포도', 'ko:딸기', 'ko:수박', 'ko:바나나', 'ko:과일', 'ko:베리(열매)',
  // 견과/곡물
  'ko:밤', 'ko:밤송이', 'ko:도토리', 'ko:옥수수', 'ko:보리알', 'ko:콩',
  'ko:곡식', 'ko:알곡', 'ko:밀가루', 'ko:가루',
  // 채소
  'ko:채소', 'ko:상추', 'ko:순무', 'ko:호박', 'ko:버섯',
  // 가공식품
  'ko:빵', 'ko:우유', 'ko:사탕', 'ko:꿀', 'ko:생강빵', 'ko:떡', 'ko:죽', 'ko:국',
  'ko:수프', 'ko:밥', 'ko:고기', 'ko:음식', 'ko:식량', 'ko:열매', 'ko:부스러기',
];

// 마법 사물 (= 모든 사물 — Phase 1 §5.2 광의 해석. 도구/옷/장난감/보석/책 등 portable item)
const MAGIC_OBJECT = [
  // 마법 도구
  'ko:지팡이', 'ko:거울', 'ko:빗자루', 'ko:물약', 'ko:마법',
  // 보석/금속/돈
  'ko:왕관', 'ko:금관', 'ko:보석', 'ko:보석)', 'ko:다이아몬드', 'ko:사파이어', 'ko:루비',
  'ko:에메랄드', 'ko:보물', 'ko:황금', 'ko:금', 'ko:은', 'ko:동전', 'ko:금화', 'ko:돈',
  'ko:동전, 금화', 'ko:구슬', 'ko:팔찌', 'ko:진주',
  // 무기/도구
  'ko:칼', 'ko:검', 'ko:단검', 'ko:도끼', 'ko:쇠도끼', 'ko:금도끼', 'ko:은도끼',
  'ko:톱', 'ko:망치', 'ko:가위', 'ko:바늘', 'ko:붓', 'ko:페인트', 'ko:빗',
  'ko:활', 'ko:화살', 'ko:방패', 'ko:갑옷', 'ko:총', 'ko:곤봉', 'ko:방망이', 'ko:삽',
  'ko:지게', 'ko:갈고리', 'ko:물레', 'ko:물레바늘', 'ko:베틀', 'ko:비단실', 'ko:실',
  'ko:옷감', 'ko:기름통', 'ko:물뿌리개', 'ko:짚', 'ko:짚단', 'ko:땔감', 'ko:덫', 'ko:판',
  // 그릇/조리 도구
  'ko:솥', 'ko:가마솥', 'ko:냄비', 'ko:오븐', 'ko:난로', 'ko:벽난로', 'ko:컵', 'ko:찻잔',
  'ko:찻주전자', 'ko:그릇', 'ko:통', 'ko:병', 'ko:항아리', 'ko:숟가락', 'ko:찻자리',
  // 조명/불
  'ko:양초', 'ko:횃불', 'ko:등불', 'ko:램프', 'ko:성냥', 'ko:성냥갑', 'ko:불', 'ko:불꽃',
  // 책/문구
  'ko:펜', 'ko:연필', 'ko:분필', 'ko:책', 'ko:책/종이', 'ko:사진첩', 'ko:그림',
  'ko:편지', 'ko:초대장', 'ko:포스터', 'ko:지도', 'ko:표지판', 'ko:상장', 'ko:금메달',
  // 직물/가리개
  'ko:이불', 'ko:담요', 'ko:양탄자', 'ko:천막', 'ko:이글루', 'ko:덮개', 'ko:호두껍질',
  // 옷/장신구
  'ko:옷', 'ko:외투', 'ko:가죽', 'ko:신발', 'ko:신발(구두)', 'ko:구두', 'ko:은구두',
  'ko:꽃신', 'ko:장화', 'ko:장갑', 'ko:부츠', 'ko:앞치마', 'ko:잠옷', 'ko:드레스',
  'ko:망토', 'ko:반바지', 'ko:목도리', 'ko:리본', 'ko:스카프', 'ko:조끼', 'ko:비단옷',
  'ko:모자', 'ko:중절모', 'ko:나비넥타이', 'ko:안경', 'ko:가방', 'ko:짐가방', 'ko:봇짐',
  'ko:배낭', 'ko:주머니', 'ko:외투, 코트', 'ko:바늘꽃', // 바늘꽃 = 일러스트에서 나온 사물
  // 시계
  'ko:시계', 'ko:회중시계',
  // 장난감/놀이
  'ko:인형', 'ko:장난감', 'ko:공', 'ko:블록',
  // 운송
  'ko:자동차', 'ko:비행기', 'ko:기차', 'ko:배', 'ko:마차', 'ko:수레', 'ko:썰매',
  'ko:해적선', 'ko:범선', 'ko:우주선',
  // 악기
  'ko:기타', 'ko:바이올린', 'ko:하프', 'ko:피리', 'ko:북', 'ko:호루라기', 'ko:나팔',
  'ko:음악', 'ko:음표',
  // 기타 사물
  'ko:열쇠', 'ko:상자', 'ko:가시덩굴', 'ko:가시덤불', // 덩굴/덤불 — 잭과콩나무 등에서 마법 vs nature, 컨텍스트는 nature 가 강함 → 옮길지 결정
  'ko:동상', 'ko:조각', 'ko:조각상', 'ko:장식', 'ko:크리스마스트리', 'ko:트리', 'ko:선물',
  'ko:박', 'en:tiara', // 박 = 흥부전 박 (마법 사물), tiara = 왕관
  'ko:크리스마스트리', 'ko:천사', // 천사 = 캐릭터 → people 로 옮길지 — 장식 천사 라면 magic-object
  'ko:하트', 'ko:장식', 'ko:가시',
  'ko:밧줄', 'ko:동아줄', 'ko:고리', 'ko:끈', 'ko:사다리', 'ko:그물',
  'ko:자루', 'ko:바구니', 'ko:화분', // 화분 = 사물
  // 무기 의류 추가
  'ko:갑옷',
  // 미분류성 매핑(어디 카테고리든 사물성)
  'ko:물쥐', // 동물이지만 already in ANIMAL — 중복 점검 필요. 빼자
  // 광물
  'ko:쇠',
  // 의료기기
  'ko:현미경', 'ko:청진기',
  // 추상 — 넓게 해석. 사물처럼 등장: 우주(?), 바이러스→ skip, 세포→ skip
  // 옷 추가
  'ko:잔치', // 잔치 = 행사 → skip 이 더 자연스럽지만 magic-object?  실제로 카드 부적합 → skip
  // 깃발/장식 — 없음
  // 식기 추가
  'ko:과일', // 과일은 food 에 있음 — 중복
  // 12시) 류 — typo, skip
];

// 사람·캐릭터 + 신체 부위
const PEOPLE = [
  // 동화 주인공
  'ko:신데렐라', 'ko:콩쥐', 'ko:팥쥐', 'ko:흥부', 'ko:놀부', 'ko:피터팬', 'ko:앨리스',
  'ko:새어머니', 'ko:원님',
  // 왕족
  'ko:왕', 'ko:왕비', 'ko:여왕', 'ko:왕자', 'ko:공주', 'ko:임금님', 'ko:왕자님',
  // 마법 캐릭터
  'ko:마녀', 'ko:마법사', 'ko:요정', 'ko:선녀', 'ko:거인', 'ko:트롤', 'ko:도깨비', 'ko:지니',
  // 직업
  'ko:사냥꾼', 'ko:도둑', 'ko:도적', 'ko:해적', 'ko:재단사', 'ko:목수', 'ko:구두장이',
  'ko:병정', 'ko:조종사', 'ko:신사', 'ko:우승자',
  // 가족/친구
  'ko:친구', 'ko:친구들', 'ko:형제', 'ko:가족', 'ko:엄마', 'ko:할머니', 'ko:아기',
  'ko:소녀', 'ko:소년', 'ko:아이',
  // 종교/추상 캐릭터
  'ko:천사',
  // 신체 부위
  'ko:손', 'ko:발', 'ko:다리', 'ko:목', 'ko:머리카락', 'ko:수염', 'ko:머리', 'ko:입',
  'ko:볼', 'ko:코', 'ko:귀', 'ko:혀', 'ko:심장', 'ko:몸', 'ko:발자국', 'ko:발바닥',
  'ko:엄지손가락', 'ko:뇌', 'ko:대장', 'ko:몸속에', 'ko:뼈', 'ko:키다리',
  'ko:땀방울', 'ko:눈물',
  // 기타 신체 관련
  'en:belly', 'en:face',
];

// 자연 (식물 + 자연 현상 + 지형 + 천체)
const NATURE = [
  // 식물 — 나무
  'ko:나무', 'ko:참나무', 'ko:소나무', 'ko:사과나무', 'ko:밤나무', 'ko:포도나무',
  'ko:야자수', 'ko:대나무', 'ko:콩나무',
  // 식물 — 꽃/잎/풀
  'ko:꽃', 'ko:잎', 'ko:풀', 'ko:나뭇잎', 'ko:나뭇가지', 'ko:잎사귀', 'ko:풀잎',
  'ko:잎(낙엽)', 'ko:이파리', 'ko:단풍잎', 'ko:낙엽', 'ko:가지', 'ko:줄기', 'ko:껍질',
  'ko:들꽃', 'ko:꽃밭', 'ko:꽃잎', 'ko:풀숲', 'ko:풀밭', 'ko:장미', 'ko:튤립',
  'ko:민들레', 'ko:해바라기', 'ko:강아지풀', 'ko:나팔꽃', 'ko:연꽃', 'ko:연잎',
  'ko:선인장', 'ko:고사리', 'ko:식물', 'ko:포도밭', 'ko:싹', 'ko:새싹', 'ko:씨앗',
  'ko:덩굴', 'ko:덤불', 'ko:파리지옥',
  // 천체
  'ko:해', 'ko:햇살', 'ko:햇볕', 'ko:태양', 'ko:해님', 'ko:달', 'ko:달님', 'ko:별',
  'ko:별똥별', 'ko:지구', 'ko:행성', 'ko:태양계', 'ko:우주', 'ko:해/햇살', 'ko:태양, 해',
  'en:sun', 'en:sky',
  // 하늘/날씨
  'ko:하늘', 'ko:구름', 'ko:바람', 'ko:비', 'ko:눈', 'ko:눈송이', 'ko:얼음', 'ko:폭풍',
  'ko:번개', 'ko:무지개', 'ko:회오리바람', 'ko:이슬', 'ko:이슬방울', 'ko:물방울',
  'ko:안개(?)', 'ko:빛', 'ko:그림자',
  // 물
  'ko:물', 'ko:바다', 'ko:강', 'ko:강물', 'ko:호수', 'ko:연못', 'ko:파도', 'ko:물결',
  'ko:거품', 'ko:물거품', 'ko:해변', 'ko:웅덩이', 'ko:갯벌', 'ko:산호', 'ko:해초',
  'ko:해조류', 'ko:수초',
  // 지형/돌
  'ko:숲', 'ko:숲속', 'ko:산', 'ko:언덕', 'ko:바위', 'ko:돌', 'ko:돌멩이', 'ko:조약돌',
  'ko:흙', 'ko:땅', 'ko:땅속', 'ko:모래', 'ko:진흙', 'ko:동굴', 'ko:굴', 'ko:구멍',
  'ko:사막', 'ko:정글', 'ko:들판', 'ko:초원', 'ko:사바나', 'ko:아프리카', 'ko:섬',
  'ko:밭', 'ko:화산', 'ko:지진', 'ko:빙산', 'ko:성터', 'ko:바위벽',
  // 영문 자연 키워드
  'en:forest', 'en:leaf', 'en:branch', 'en:grass', 'en:bamboo',
];

// 집·장소 (건물/공간/가구/구조)
const HOME = [
  // 건물
  'ko:집', 'ko:오두막', 'ko:오두막집', 'ko:성', 'ko:궁전', 'ko:탑', 'ko:학교', 'ko:사원',
  'ko:성당', 'ko:시장', 'ko:마을', 'ko:도시', 'ko:농장', 'ko:방앗간', 'ko:풍차', 'ko:네버랜드',
  // 가구/실내 사물
  'ko:침대', 'ko:의자', 'ko:책상', 'ko:식탁', 'ko:소파', 'ko:요람', 'ko:아기 식탁', 'ko:주방',
  // 집 부속/구조
  'ko:문', 'ko:창문', 'ko:굴뚝', 'ko:벽돌', 'ko:벽돌길', 'ko:계단', 'ko:다락방', 'ko:방',
  'ko:바닥', 'ko:울타리', 'ko:담장', 'ko:우리', 'ko:지붕(?)',
  // 야외 공간 (사람 만든)
  'ko:정원', 'ko:마당', 'ko:뜰', 'ko:우물',
  // 길/통로
  'ko:길', 'ko:다리', 'ko:터널', 'ko:돔',
  // 가스/유틸 — 없음
  'ko:가스',
  // 박 — 박씨/흥부전 박. 컨텍스트상 식물·가옥 — food 보다는 home (지붕에 박이 자라남) 라기보다 nature. 결정: nature 로 옮기지말고 magic-object — 박이 갈라져 보물 나옴. 결국 magic-object.
  // (박은 MAGIC_OBJECT 에 미포함 — 누락 처리 후 수정)
];

// SKIP — 형용사/동사/추상명사/색깔/시간/모호
const SKIPPED = [
  // 형용사
  'ko:행복한', 'ko:용감한', 'ko:따뜻한', 'ko:작은', 'ko:큰', 'ko:긴', 'ko:키 큰',
  'ko:파란', 'ko:파란색', 'ko:초록', 'ko:초록색', 'ko:빨간', 'ko:빨간색', 'ko:노란색',
  'ko:푸른', 'ko:보라색', 'ko:보랏빛', 'ko:알록달록한', 'ko:예쁜', 'ko:튼튼한',
  'ko:빠른', 'ko:느린', 'ko:깊은', 'ko:추운', 'ko:차가운', 'ko:뜨거운', 'ko:뜨거운, 더운',
  'ko:시원한', 'ko:환한', 'ko:어두운', 'ko:조용한', 'ko:바쁜', 'ko:고요한',
  'ko:깨끗한', 'ko:부드러운', 'ko:단단한', 'ko:거대한', 'ko:커다란', 'ko:뾰족한',
  'ko:슬픈', 'ko:기쁜', 'ko:졸린', 'ko:외로운', 'ko:못생긴', 'ko:아름다운', 'ko:우아한',
  'ko:평화로운', 'ko:안전한', 'ko:신비로운', 'ko:신비', 'ko:안녕', 'ko:맛있는', 'ko:달콤한',
  'ko:새콤한', 'ko:새콤달콤한', 'ko:정직한', 'ko:친절한', 'ko:용감한', 'ko:용기',
  'ko:부지런한', 'ko:게으른', 'ko:성실한', 'ko:어리석은', 'ko:똑똑한', 'ko:욕심 많은',
  'ko:호기심이 많은', 'ko:자랑스러운', 'ko:배고픈', 'ko:힘센', 'ko:강한', 'ko:듬직한',
  'ko:겁먹은', 'ko:놀란, 겁먹은', 'ko:기술자 (능숙한)', 'ko:반짝',
  'ko:많은', 'ko:옛날의', 'ko:고대', 'ko:미안한', 'ko:협동',
  // 동사
  'ko:웃다', 'ko:걷다', 'ko:날다', 'ko:헤엄치다', 'ko:먹다', 'ko:춤추다', 'ko:달리다',
  'ko:수영하다', 'ko:나누다', 'ko:안다', 'ko:빛나다', 'ko:찾다', 'ko:일하다', 'ko:듣다',
  'ko:속삭이다', 'ko:상상하다', 'ko:잠자다', 'ko:오르다', 'ko:자다', 'ko:기다리다',
  'ko:지저귀다', 'ko:두드리다', 'ko:말하다', 'ko:변하다', 'ko:숨다', 'ko:숨다/웅크리다',
  'ko:바꾸다', 'ko:흔들다', 'ko:놀다', 'ko:탐험하다', 'ko:쿵쾅거리다', 'ko:크다',
  'ko:잡다', 'ko:울다', 'ko:행진하다', 'ko:쫓다', 'ko:용서하다', 'ko:짓다', 'ko:심다',
  'ko:당기다', 'ko:돌진하다', 'ko:빠지다', 'ko:파다', 'ko:믿다', 'ko:깨어나다',
  'ko:잠에서 깨어나다', 'ko:잠들다', 'ko:하품', 'ko:으르렁 소리, 포효하다',
  'ko:울부짖다', 'ko:서다', 'ko:깨다/부화하다', 'ko:피어나다', 'ko:노래하다', 'ko:구경하다',
  'ko:열리다', 'ko:닫히다', 'ko:꿈틀거리다', 'ko:움직이다', 'ko:윙크하다', 'ko:지키다',
  'ko:그리다', 'ko:박수 치다', 'ko:뛰다', 'ko:이기다', 'ko:고마워', 'ko:냄새 맡다/냄새',
  'ko:냄새', 'ko:반짝이다', 'ko:보다', 'ko:활짝 피다', 'ko:팔랑팔랑 (날다)',
  'ko:폴짝폴짝 뛰다', 'ko:스르륵 기어가다', 'ko:자라다', 'ko:돕다', 'ko:쉬다',
  'ko:일', 'ko:조용히', 'ko:옆으로', 'ko:안다', 'ko:작다', 'ko:큰',
  // 추상명사
  'ko:사랑', 'ko:친절', 'ko:정직', 'ko:용기', 'ko:꿈', 'ko:희망', 'ko:우정', 'ko:비밀',
  'ko:약속', 'ko:모험', 'ko:파티', 'ko:잔치', 'ko:잠', 'ko:달리기', 'ko:춤', 'ko:노래',
  'ko:소리', 'ko:목소리', 'ko:마음', 'ko:위험', 'ko:미소', 'ko:호기심', 'ko:색깔',
  'ko:상상하다', 'ko:음식(? FOOD)', // 음식은 FOOD 에 포함 — 여기 X
  'ko:여정', 'ko:영원히', 'ko:세상', 'ko:함께', 'ko:안녕',
  'ko:표시', 'ko:표지판(? object)', // 표지판은 magic-object 인지 skip 인지. magic-object.
  'ko:가스(? object)', // 이미 home 에 들어감
  // 색
  // 시간 (계절/시간)
  'ko:봄', 'ko:여름', 'ko:가을', 'ko:겨울', 'ko:아침', 'ko:밤',
  // 모호/typo/이상한 키
  'ko:12시)', 'ko:않는', 'ko:그림자(? nature)', // 그림자는 nature 로 갔음
  'ko:굴(? animal/home/nature)', // 굴 = 동굴? 굴 (동물 거주지) → home? 명확하지 않음 — skip
  'ko:장(? container)', // 장 = 항아리 비슷, magic-object 일 수도 있지만 모호 → skip
  'ko:박(? gourd/typo)', // 박 = 호박과 동의어 또는 흥부전 박 → magic-object 와 food 사이. skip 으로 두고 사용자 review.
  'ko:바이러스', 'ko:세포', 'ko:영양소', 'ko:유산균', // 과학 단어 — 카드 부적합
  'ko:대나무(? nature)', // 이미 nature 에 있음
  // 빠진 것 모음 — 확실히 빼자
  'ko:열쇠(? object)', // 이미 magic-object
  // 추가 (stray 정리 — extraction 정확한 키)
  'ko:뜨거운, 더운', 'ko:놀란, 겁먹은',
  // 추가 (unknown 중 모호한 단일 글자)
  'ko:장', // 단독으로 의미 모호 (간장/장롱)
];

// ── 빌드 ────────────────────────────────────────────────────────────────────────

function build() {
  const map = {}; // key → category
  const conflicts = [];

  function addArray(arr, category) {
    for (const k of arr) {
      // (? ...) 표기 정리 — '?' 가 들어간 키는 무시 (자체 메모용 마커)
      const cleanKey = k.includes('(?') ? null : k;
      if (!cleanKey) continue;
      if (cleanKey in map && map[cleanKey] !== category) {
        conflicts.push({ key: cleanKey, prev: map[cleanKey], next: category });
      }
      map[cleanKey] = category;
    }
  }

  addArray(ANIMAL, 'animal');
  addArray(FOOD, 'food');
  addArray(MAGIC_OBJECT, 'magic-object');
  addArray(PEOPLE, 'people');
  addArray(NATURE, 'nature');
  addArray(HOME, 'home');

  // SKIPPED → null
  for (const k of SKIPPED) {
    const cleanKey = k.includes('(?') ? null : k;
    if (!cleanKey) continue;
    if (cleanKey in map) {
      conflicts.push({ key: cleanKey, prev: map[cleanKey], next: 'SKIP' });
    }
    map[cleanKey] = null;
  }

  return { map, conflicts };
}

const extractionPath = path.join(docsDir, 'key-object-dex-extraction.json');
const extraction = JSON.parse(fs.readFileSync(extractionPath, 'utf-8'));
const allKeys = extraction.unique.map((u) => u.key);

const { map, conflicts } = build();

// extraction 에 있는데 map 에 없는 키 = unknown
const unknown = allKeys.filter((k) => !(k in map));
// map 에 있는데 extraction 에 없는 키 = stray (오타 가능)
const stray = Object.keys(map).filter((k) => !allKeys.includes(k));

// 카테고리별 카운트
const byCategory = {};
for (const [k, v] of Object.entries(map)) {
  const cat = v ?? 'SKIPPED';
  byCategory[cat] = (byCategory[cat] ?? 0) + 1;
}

const outPath = path.join(docsDir, 'key-object-dex-mapping.json');
fs.writeFileSync(
  outPath,
  JSON.stringify(
    {
      version: 1,
      generatedAt: new Date().toISOString(),
      stats: {
        totalUniqueInExtraction: allKeys.length,
        classified: allKeys.length - unknown.length,
        unknownInExtraction: unknown.length,
        strayInMapping: stray.length,
        byCategory,
        conflicts: conflicts.length,
      },
      map,
    },
    null,
    2
  ),
  'utf-8'
);

console.log('카테고리별 카운트:');
for (const [cat, n] of Object.entries(byCategory)) console.log(`  ${cat}: ${n}`);
console.log(`\nextraction 791 중 분류됨: ${allKeys.length - unknown.length}`);
console.log(`extraction 에 있는데 매핑에 없음 (unknown): ${unknown.length}`);
if (unknown.length > 0) {
  console.log('  unknown 샘플:');
  for (const k of unknown.slice(0, 30)) console.log(`    ${k}`);
}
console.log(`매핑에 있는데 extraction 에 없음 (stray, 오타 가능): ${stray.length}`);
if (stray.length > 0) {
  console.log('  stray 샘플:');
  for (const k of stray.slice(0, 30)) console.log(`    ${k}`);
}
console.log(`\n중복 매핑 (한 키 여러 카테고리): ${conflicts.length}`);
if (conflicts.length > 0) {
  for (const c of conflicts.slice(0, 10)) console.log(`  ${c.key}: ${c.prev} vs ${c.next}`);
}
console.log(`\n출력: ${outPath}`);
