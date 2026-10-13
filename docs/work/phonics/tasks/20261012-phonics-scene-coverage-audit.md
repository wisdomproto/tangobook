# 파닉스와 동화 장면 연결 실측

- id: 20261012-phonics-scene-coverage-audit
- domain: phonics
- status: ready
- updated: 2026-10-12
- base: 71025a893
- branch: codex/library-content-audit
- integration: 로컬 조사 및 재현 도구, main 미통합
- delivery: 미푸시·미배포. 운영 데이터 수정 없음.

## 요청과 기준

사용자가 창작 공개/연결 작업 후 실제 연결 정도를 조사하라고 요청했다. 기존 shared `computeSeam` 및 운영 `/api/content-status` 수치를 공식 **어휘 목록 겹침**으로 유지하고, 실제 게임 장면의 삽화·언어 본문·음원 유무는 별도 지표로 검사했다. 나무 동화도 동화책이며 이번 전체 장면 수에 포함한다. 중국어는 요청 범위 밖이다.

공통/phonics 기억, 이전 연결 task, root CLAUDE의 이음매 집계 원칙, phonics/phonics-learner/vocabulary-unit 지침과 실제 `resolve-scene`, `phonics-word-scene`, `PhonicsGameGate`, shared 집계식을 읽었다.

2026-10-12 15:52 KST 전후 운영 참조책·71개 한영 파닉스 단원 총435권을 새로 GET했다. 읽기 실패0. 최신 내용에 로컬 게임의 실제 장면 선택/검증 함수를 실행했다. 공개 운영 코드로 보고하지 않는다: 연결 커밋71025a893은 fetch 후 origin/main(5ccddfbbc)에 포함되지 않는다.

## 실제 장면 연결 결과

**단원별 정답 사용 횟수**가 분모다. 같은 단어가 여러 단원에 있으면 각각 센다. 삽화 URL·해당 언어 본문·TTS URL이 모두 있고 공개된 다른 동화 장면을 연결로 센다. 내용 의미 검수를 전부 통과했다는 뜻은 아니다.

|항목|한글|영어|
|---|---:|---:|
|단원|32|39|
|정답 사용 횟수 / 중복 제외 단어|128 / 126|388 / 359|
|다른 동화 장면·본문·음원 연결|90/128 (70.3%)|304/388 (78.4%)|
|그중 창작동화 장면 있음|37/128 (28.9%)|107/388 (27.6%)|
|단원 자체 나무 동화로 장면 제공 가능|125/128|0/388|
|다른 동화 또는 단원 자체 장면 제공 가능|127/128 (99.2%)|304/388 (78.4%)|
|다른 동화가 없어 단원 자체만 사용|37|0|
|어느 쪽 장면도 제공하지 못함|1|84|

다른 동화 연결은 중복 제외 한글88단어·영어281단어다. 창작은 한글36단어·영어92단어, 103권/19시리즈의128검토장면이다. 이전의134장면은 창작128+기존공개6이며 이번 현재 본문·공개·삽화·언어음원 대조134/134일치했다. 850권 전체가 파닉스에 연결된 것은 아니다.

한글 빈 연결은 `kr-h1-u01`의 **오이**다. 영어84사용/78고유단어는 아래 목록에 있다. 동음이의어의 잘못된 외부 연결을 차단하면서 늘어난 항목과 원래 장면이 없던 항목을 함께 포함한다. 정답 카드/단어 음원이 없다는 뜻은 아니다.

운영 파닉스 영어39단원은 본문505쪽의 `illustrationUrl`, 기본 `ttsUrl`, 영어 번역 본문/TTS가 모두0이다. 그래서 나무 동화의 어휘 목록이 있어도 실제 영어 장면 폴백은 제공되지 않는다. 한글은256쪽 중 삽화245/음원256이며 현재125정답 사용에 단원 장면이 나온다.

## 공식 현황판과 차이

운영 `content-status.seam.byTrack`: 한글126/128(98%), 영어379/388(98%). 이는 key_objects의 korean/name/nameEn에 같은 낱말 표기가 있는지와 단원 자체 어휘 목록을 합산한다. 공개 여부·실제 쪽 삽화/TTS·본문 의미·게임 인덱스를 검증한 값이 아니다. 이번 장면 지표와 분모는 같지만 정의가 달라 숫자를 덮어쓰지 않는다. 과거 CLAUDE의380은 당시 수치이며 현재 운영379를 사용한다.

## 의미/실행 품질 문제

- 기존 `watch` 연결에 손목시계 대신 watched/watching(지켜보다)이 포함되어 있다. `en-b1-u08`의 실제 카드 localWord=시계·imageDescription=손목시계와 불일치한다.
- 기존 `fork`가 뱀(1773363971764)3쪽의 forked tongue에 걸려 있다. 식기 포크와 갈라진 혀를 혼동했다.
- 기존 `hat` 연결 중1784529062415(소가 된 게으름뱅이)1쪽은 현재 영어 본문에 hat이 없다. 검토되지 않은 기존 후보는 본문 수정 후 연결이 낡아도 런타임에서 걸러지지 않는다.
- 보수적인 낱말 경계 검사 불일치 후보는 중복 제거 한글55장면/23단어, 영어150장면/34단어다. 이 전체를 잘못된 장면으로 단정하지 않는다: 아이들/조사 결합, 동사의 과거형 등 정상 형태 변화도 포함한다. 의미를 재검토할 후보 목록이다.
- PhonicsGameGate는 외부 장면 preload를 기다리지 않는다. 느린 네트워크에서 첫 정답은 단원 폴백 또는 낱말만 재생할 수 있다. 위 수치는 preload가 완료됐을 때의 제공 가능 수다.
- 창작 자체 영어 어휘 nameEn가0인 점은 그대로다. 영어 본문/TTS 연결과 영어 어휘 게임 지원을 구분한다.

## 영어 장면 미연결 단어 (78개)

bat, elbow, fan, gorilla, jam, kiwi, melon, net, ox, panda, pen, piano, ring, robot, up, violin, yacht, yo-yo, zebra, zero, can, pan, dam, hit, sit, bib, wig, pin, vet, mop, mug, rug, pup, bun, run, cut, bake, rake, tape, wave, case, date, bike, hike, lime, hose, pose, vote, mole, cube, mute, June, mule, brake, crane, crib, globe, glue, plum, print, truck, snore, bank, rank, dunk, junk, brush, phone, dolphin, peanut, seal, mail, rail, foil, gown, blouse, letter, purse.

## 검증/재현과 한계

증거 root: `D:/tangobook-inventory/20261012-phonics-coverage/`. `books.json`435권, `collection.json`시각/실패, 운영`content-status.json`, 상세`runtime-report.json`, `missing-scenes.csv`85행(한글1+영어84)이 있다.

`PHONICS_AUDIT_ROOT`를 이 디렉터리로 지정하고 `pnpm --filter @tangobook/client exec vitest run --config vitest.phonics-audit.config.ts` 실행. 실제 함수를 import해516정답과 후보 장면을 검사하며 운영 쓰기는 없다. 난수는 마지막 후보를 택하도록 고정해 preload→선택 결과도 검사한다. 매번 모든 난수 선택·느린 네트워크·브라우저 플레이·음원 청취·이미지 육안 검수를 한 것은 아니다. URL이 존재하는지 검사했으며 이번에 모든 URL의 CDN 파일을 다시 다운로드하지 않았다.

## 다음 행동

1. 기존 외부 인덱스의 fork/watch/낡은 페이지부터 카드 의미와 현재 본문을 재검토하고 source-bound 연결로 전환한다.
2. 오이 및 영어78단어의 정확한 장면 후보를 추가한다. 영어 나무 동화의 삽화/TTS는 별도 콘텐츠 제작 범위로 다룬다.
3. 창작 영어 어휘 이름을 의미에 맞게 보완한다.
4. 본문 수정 후 검토 연결을 재생성하고, 준비 가능률과 어휘 겹침을 UI에서도 구분하는 후속 개선을 검토한다.

이번 요청은 조사이므로 새 연결/운영 데이터/제품 동작은 변경하지 않았다. 보고서·읽기 전용 조사 도구만 로컬 커밋한다.
