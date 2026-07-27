# 🎵 파닉스 유닛송 (한글 · 영어)

유닛마다 붙는 **짧은 암기용 노래**. 한 곡 24초 안쪽, 같은 멜로디에 음절만 갈아끼우는 구조.

> 🔴 **이 문서가 원본이다.** 프롬프트·가사가 세션 대화에만 있다가 사라질 뻔했다(2026-07-22 세션에서
> 만들었는데 저장소·메모리 어디에도 없어 세션 기록 `7634acf2-08c7-43fb-86ac-c56870a84012.jsonl`
> 을 뒤져 복구). 곡을 새로 뽑거나 문구를 고치면 **여기부터** 고친다.

**진행 상태**: ㄱ송 프롬프트·가사 확정 / **음원 미생성** · 나머지 19유닛 가사 미작성 · 영어 포맷 미확정.

---

## 1. 근거 — EBS 음절송 실측

「한글이 야호 2」(EBS) 음절송을 사용자가 제공 → ffmpeg + numpy/scipy 로 직접 분석.

| 항목 | 값 | 근거 |
| --- | --- | --- |
| 곡 길이 | **~24초** (+무음꼬리 4s) | RMS |
| 템포 | **≈136 BPM** (beat 0.441s) | 자기상관 + 격자적합 |
| 키 | **C major** | 크로마 상관 0.848 |
| 음절 배치 | **8분음표** (한 박 2음절, 초당 4.4음절) | 온셋 81개를 220ms 격자에 맞춘 평균 오차 **16.4ms** |
| 인트로 음량 | 본편의 **61%** | RMS 0.1415 vs 0.2304 |

**인트로가 다이나믹한 건 음량이 아니라** ①음가 가속(♩→♪→♬ 16분 롤→착지) ②음색 극단 스윙
(첫 0.25초 고역 0.810·중심 5331Hz → 0.5초 저역 0.409로 급락). 조용히 긴장을 만들고 본편에서 터뜨린다.

🔴 **저작권** — EBS 곡에서 가져오는 건 **파라미터(템포·키·8분음표·인트로 대비)뿐**이다.
멜로디·가사는 전부 오리지널. 애니 OST(Catch You Catch Me)는 톤 레퍼런스일 뿐이며
목적(암기 vs 서사)·길이·타겟이 달라 **구조를 가져오면 안 된다**.

### 분석 도구의 한계 (같은 실수 반복 금지)

- 🔴 **whisper 는 노래 가사를 못 딴다.** faster-whisper medium 이 "Wow Wow"·"eiaoio euio" 같은
  모음 덩어리만 뱉었고, **못 알아들으면 같은 토큰열을 반복 출력**하는데 이걸 "훅 3회 반복"
  근거로 오독했다가 리듬 대조로 반증됐다(세 구간 온셋 13/10/8개, 패턴 전부 다름).
  자막 없는 노래 = **사용자에게 가사를 물어보는 게 정답**.
- **온셋 ≠ 음절.** 핸드퍼커션·실로폰 타격도 온셋을 만들어 `5+5`냐 `8+2`냐를 오디오만으로 판별 불가.
- 자기상관 템포 분해능이 이 대역에서 **±3.6 BPM** — "정확히 일치"라고 말하면 안 된다.
- 콘솔이 cp949 라 한글이 깨진다 → 결과는 **UTF-8 파일로 쓰고 Read** 할 것.

---

## 2. 한글 유닛송

### 2.1 Style of Music (Suno 등 생성 프롬프트)

```
Korean children's nursery rhyme for ages 4-5, bright bouncy chant-like singalong,
lead vocal sung by a young boy (around 6-8 years old), clear bright boyish voice,
with a small children's chorus joining in,
xylophone, ukulele, glockenspiel, light hand percussion,
136 BPM, C major, 4/4, upbeat anime-opening energy but scaled down for toddlers.
Intro: about 3 seconds, instrumental only, NO bass — sparse and airy, just a bright
sparkling glockenspiel chime over light percussion, then a quick sixteenth-note
drum flam, one beat of silence, then the full band drops in.
Main part: syllables sung rapidly on eighth notes, full and bright,
first half steady with the last two syllables held, second half continuous and faster.
Short — music ends under 25 seconds. Clear crisp diction, no heavy bass, no adult voice.
```

### 2.2 가사 구조 (ㄱ송 기준 — 모든 유닛 공통)

```
1행  가갸거겨고교구규  그-  기-      ← 8음절 달리고 마지막 2개 늘여 착지
2행  가갸거겨고교구규  그-  기-      ← 반복 (각인)
3행  가갸거겨고교구규그기 (빠르게)    ← 늘임 제거, 10개 논스톱
4행  가갸거겨고교구규그기 (빠르게)    ← 한 번 더
예~!                                ← 환호로 종료
```

**같은 음절을 4번 반복하는데 안 질리는 이유** = 3행에서 `그- 기-` 늘임을 없애 **체감 속도가 급상승**
하는 점층 구조다. 앞 2행은 "따라 할 수 있게" 천천히, 뒤 2행은 "해냈다" 성취감, 마지막 환호가 보상.

🔴 **후렴은 `5+5` 로 끊는다**(`가갸거겨고` / `교구규그기`) — 4/4 두 마디에 딱 떨어져서
**음절만 갈아끼우면 같은 멜로디를 20유닛에 재사용**할 수 있다. 이게 이 구조를 택한 이유다.

🔴 **음절은 반드시 10개**(반절표). 8개로 줄이면 3·4행 논스톱 리듬이 깨지고 멜로디 재사용이 무너진다.
(사용자가 처음 제시한 ㄴ송 `나냐너녀노뇨누니`는 8개라 `뉴`·`느`가 빠져 있었다.)

⚠️ Verse 에 타겟 단어를 넣지 않는다 — 처음엔 넣었다가 **"verse 에 타겟단어가 너무 많다"** 는
피드백으로 뺐다. 음절만 반복하고 짧게 끝내는 게 이 곡의 목적이다.

### 2.3 유닛별 음절 (20유닛)

자음 × `ㅏㅑㅓㅕㅗㅛㅜㅠㅡㅣ` 반절표. 아래 표는 손으로 적지 말고 **생성해서 검증**할 것.

| 유닛 | 글자 | 음절 10개 | 비고 |
| --- | --- | --- | --- |
| kr-h1-u01 | 모음 | 아야어여오요우유으이 | 🔴 u09(ㅇ)과 동일 — 인트로 문구로 구분 |
| kr-h1-u02 | ㄱ | 가갸거겨고교구규그기 | ✅ 가사 확정 |
| kr-h1-u03 | ㄴ | 나냐너녀노뇨누뉴느니 | |
| kr-h1-u04 | ㄷ | 다댜더뎌도됴두듀드디 | |
| kr-h1-u05 | ㄹ | 라랴러려로료루류르리 | |
| kr-h1-u06 | ㅁ | 마먀머며모묘무뮤므미 | |
| kr-h1-u07 | ㅂ | 바뱌버벼보뵤부뷰브비 | |
| kr-h1-u08 | ㅅ | 사샤서셔소쇼수슈스시 | |
| kr-h1-u09 | ㅇ | 아야어여오요우유으이 | 🔴 u01(모음)과 동일 |
| kr-h1-u10 | ㅈ | 자쟈저져조죠주쥬즈지 | |
| kr-h1-u11 | ㅊ | 차챠처쳐초쵸추츄츠치 | |
| kr-h1-u12 | ㅋ | 카캬커켜코쿄쿠큐크키 | |
| kr-h1-u13 | ㅌ | 타탸터텨토툐투튜트티 | |
| kr-h1-u14 | ㅍ | 파퍄퍼펴포표푸퓨프피 | |
| kr-h1-u15 | ㅎ | 하햐허혀호효후휴흐히 | |
| kr-h3-u01 | ㄲ | 까꺄꺼껴꼬꾜꾸뀨끄끼 | |
| kr-h3-u02 | ㄸ | 따땨떠뗘또뚀뚜뜌뜨띠 | |
| kr-h3-u03 | ㅃ | 빠뺘뻐뼈뽀뾰뿌쀼쁘삐 | |
| kr-h3-u04 | ㅆ | 싸쌰써쎠쏘쑈쑤쓔쓰씨 | |
| kr-h3-u05 | ㅉ | 짜쨔쩌쪄쪼쬬쭈쮸쯔찌 | |

### 2.4 🔴 나머지 12유닛은 이 포맷이 안 맞는다

**받침 7**(한글2) + **복잡한 모음 5**(한글4) = 12유닛은 "자음 × 모음10" 이 성립하지 않는다.
별도 포맷이 필요하고 **아직 정하지 않았다**:

- **받침** — 종성 교체형이 자연스럽다(`강 낭 당 랑 망 방 상…` = 초성을 바꾸며 같은 받침 반복).
  앱의 받침 익히기 활동이 이미 초성 14개를 쓰므로 그 목록을 그대로 노래로 옮길 수 있다.
- **복잡한 모음** — 음절 나열이 아니라 **단어 나열형**(그 모음이 든 낱말 4개)이 맞을 것으로 보인다.

⚠️ 위 두 줄은 **제안이지 결정이 아니다.** 실제 포맷은 정해지지 않았다.

---

## 3. 영어 유닛송 — 🔴 미확정

**아직 아무것도 정해지지 않았다.** 한글 포맷을 그대로 옮길 수 없다:

- 한글은 `자음 × 모음10` 이 기계적으로 떨어지지만, 영어 Book 1 은 **글자 이름·음가·단어**가
  따로 놀고 Book 2~5 는 **패턴(-an, -ake)** 이 단위다.
- 한 곡에 무엇을 넣을지(알파벳 음가? 단어가족? 둘 다?)가 곧 곡 구조를 정한다.
- 🔴 **Book 1 은 글자가 목표라 단어 철자를 읽히지 않는다**는 기존 정책과 충돌하지 않게 짜야 한다
  (→ `features/phonics-learner/CLAUDE.md`).

착수할 때 결정할 것: ①곡 단위(유닛? 책?) ②가사 재료 ③한글과 멜로디를 공유할지.

---

## 4. 참고 — 같은 세션의 시리즈 테마곡 2곡

유닛송과 **별개**다(암기용 아님, 80~90초 브랜드 테마). 역시 어디에도 저장돼 있지 않아 함께 옮겨 둔다.

<details>
<summary><b>「책장을 넘기면」</b> — 시리즈 공용(특정 라인에 안 묶임)</summary>

```
Bright uplifting anime-opening style theme song for a children's storybook series,
sweet clear female lead vocal with a small children's chorus joining the chorus,
sparkling glockenspiel and piano, bright clean electric guitar, warm bass,
energetic drums, strings swelling on the chorus,
136 BPM, F major, 4/4, hopeful and adventurous, cinematic but warm.
Intro: airy and quiet with no bass — just glockenspiel sparkle and light percussion,
a short sixteenth-note fill, then the full band drops in.
Big singalong chorus. About 90 seconds.
```

```
[Verse 1]
작은 손으로 살짝 펼치면
반짝, 하고 문이 열려
어제는 바다 오늘은 숲길
어디로 갈까 두근두근

[Pre-Chorus]
하나 둘 셋 눈을 떠 보면
우린 벌써 그곳에 서 있어

[Chorus]
책장을 넘기면 시작이야
별이 뜨는 곳까지 달려가
혼자가 아니야 손 잡으면
오늘의 이야기는 우리 거야
라라라 라라라 같이 가자

[Verse 2]
바람이 불면 돛을 올리고
비가 오면 우산을 써
넘어져도 괜찮아 툭툭 털고
다시 한 장 넘기면 돼

[Bridge]
마지막 장을 덮어도
이야기는 여기 남아
내일 또 만나자 약속해

[Chorus] (반복)

[Outro]
라라라 라라라 같이 가자
```

</details>

<details>
<summary><b>「호리네 마을」</b> — 호리 앙상블 전용(생활동화·유치원동화·세상 탐험 공용)</summary>

```
Bright cheerful anime-opening style theme song for a preschool storybook series,
Korean lyrics, warm and cozy handmade feel (needle-felt wool plush world),
sweet clear female lead vocal with a small children's chorus shouting the names,
ukulele, glockenspiel, marimba, bright acoustic guitar, warm upright bass,
light playful percussion, hand claps, cheerful whistling,
134 BPM, C major, 4/4, sunny and bouncy, gentle but energetic.
Intro: airy and quiet with no bass — glockenspiel sparkle and soft claps,
a quick sixteenth-note fill, then the full band drops in.
Big singalong chorus where kids shout the character names. About 80 seconds.
```

```
[Verse 1]
해가 뜨면 기지개 쭉
호리가 문을 활짝 열어요
오늘은 뭘 하고 놀까
발끝이 벌써 콩콩콩

[Pre-Chorus]
언덕 너머 저기 저기
친구들이 손을 흔드네

[Chorus]
호리! 토토! 보리! 콩이! 두부!
다 같이 모이면 신나는 하루
넘어져도 웃고 툭툭 털고
호리네 마을엔 걱정이 없어
랄랄라 랄랄라 놀러 가자

[Verse 2]
토토는 폴짝 앞장서고
보리는 뒤에서 지켜줘요
콩이 주머니엔 도토리 가득
두부는 벌써 배가 고파

[Bridge]
아기 호야 손을 잡고
엄마 아빠 기다리는 저녁
오늘도 참 좋은 하루였어

[Chorus] (반복)

[Outro]
랄랄라 랄랄라 또 만나
```

- **이름 5연호가 훅** — 유아 테마곡에서 가장 강력한 장치는 자기가 아는 이름 부르기. 마디에 맞게 5음절씩.
- **캐스트 성격 = 가사** — 2절이 고정 설정 그대로(토토=폴짝, 보리=맏이, 콩이=도토리, 두부=배고픔).
- **니들펠트 감성 = 편곡** — 우쿨렐레·마림바·글로켄슈필·손뼉. 일렉기타·강한 드럼은 뺀다.

</details>

---

## 5. 남은 일

- [ ] ㄱ송 **음원 생성** 후 실측 검증(24초 이내·136 BPM·인트로 대비)
- [ ] 나머지 19유닛 가사 (음절표는 §2.3 에 있음 — 구조에 끼우기만)
- [ ] 받침 7 · 복잡모음 5 포맷 결정 (§2.4)
- [ ] 영어 유닛송 설계 (§3)
- [ ] 앱 연동 지점 결정 — 유닛 진입? 익히기 첫 활동? 별도 카드?
