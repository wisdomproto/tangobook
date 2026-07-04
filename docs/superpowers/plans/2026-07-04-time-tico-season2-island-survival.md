# 타임 티코 시즌2(무인도 생존편) 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (권장) 또는 superpowers:executing-plans 로 task 단위 실행. 체크박스(`- [ ]`)로 진행 추적.

**Goal:** 시즌1과 분리된 시즌2 문서 세트를 셋업하고, 무인도 생존 12화 콘티를 집필·검수해 라이브 반영한다.

**Architecture:** 콘텐츠 제작(코드 아님). "테스트" 대응물 = `comic-editor` 4축 검수(P0 사실오류·안전 위반 없음 = pass). 파이프라인 = `comic-writer` 집필 → `comic-editor` 검수 → 본 세션이 P0/P1 반영. 시즌2는 `learning-comic-s2-*` 네임스페이스로 시즌1 탭과 분리.

**Tech Stack:** 정적 HTML 콘티(시즌1 `learning-comic-ep01.html` 구조 계승), TopBar 링크, `comic-writer`/`comic-editor` 서브에이전트. SSOT = 시즌2 기획서 spec([docs/superpowers/specs/2026-07-04-time-tico-season2-island-survival-design.md](../specs/2026-07-04-time-tico-season2-island-survival-design.md)).

---

## Task 0: 시즌1→2 다리 — ep12 엔딩 수정

**Files:**
- Modify: `packages/client/public/learning-comic-ep12.html` (33쪽·시즌2 예고 인셋 — "우주/미래" 떡밥 부분)

- [ ] **Step 1: ep12 우주 떡밥 구간 확인**

Run: `grep -n "우주\|하늘 너머\|로켓\|낯선 행성" packages/client/public/learning-comic-ep12.html`
현재: "다음엔 우주로 가는 거야?!" + 로켓·낯선 행성 실루엣.

- [ ] **Step 2: "우주로 출발 → 사고 → 무인도" 다리로 문구·장면 수정**

우주로 출발하는 설렘은 남기되, 시즌2 예고를 "출발 직후 뭔가 삐끗 → 낯선 섬"으로 트는 한 컷/한 줄 추가. 예: 티코 "다음엔 우주로— 어라? 신호가 이상한데…" + 예고 인셋을 로켓이 궤도를 벗어나 바다 위 섬으로 향하는 실루엣으로. (완전체 배터리 설정과 모순 없게 — 고장은 배터리 아닌 시간코어/통신.)

- [ ] **Step 3: 반영 확인**

Run: `grep -n "무인도\|섬\|불시착\|삐끗" packages/client/public/learning-comic-ep12.html`
Expected: 시즌2 예고가 무인도 방향을 가리킴. 기존 "우주" 단정 문구 제거/완화.

---

## Task 1: 시즌2 SSOT 기획서 문서 생성

**Files:**
- Create: `packages/client/public/learning-comic-s2-plan.html`
- Reference: spec 문서(위) 전체 / 구조 템플릿 = `learning-comic-plan.html`(시즌1 기획서)

- [ ] **Step 1: 시즌1 기획서를 구조 템플릿으로 복제**

`learning-comic-plan.html`을 복제해 `learning-comic-s2-plan.html` 생성. 상단 탭 스크립트의 회차 순회를 **`learning-comic-s2-ep{NN}.html`** 로, 기획서 탭 라벨/href를 `learning-comic-s2-plan.html`로 교체. `<body data-comic-doc="s2-plan">`.

- [ ] **Step 2: 본문을 spec 내용으로 교체**

spec 문서의 2~10절(전제·멤버·네 기둥·헬스케어·부모감사·12화 라인업 표·피날레·룰 조정표)을 시즌1 기획서 포맷(세계관 룰북·캐릭터 바이블·라인업 표·제작 파이프라인)에 맞춰 옮긴다. 캐릭터 바이블은 시즌1(보리·노아·티코·봉수 박사·0호)을 계승 + 0호의 시즌2 역할(몸·힘·소속) 갱신.

- [ ] **Step 3: 탭 스크립트 검증**

Run: preview_eval 로 `learning-comic-s2-plan.html` 로드 → `#comic-tabs a` 개수 확인.
Expected: 아직 회차 파일이 없으니 탭 = [기획서]만 1개(회차는 파일 생기며 자동 증가).

- [ ] **Step 4: 커밋**

```bash
git add packages/client/public/learning-comic-s2-plan.html
git commit -m "feat(comics): 시즌2 무인도 생존편 기획서(SSOT) 셋업"
```

---

## Task 2: TopBar 자료실 진입점 + 에이전트 시즌 인식

**Files:**
- Modify: `packages/client/src/components/TopBar.tsx` (자료실 드롭다운 — 시즌1 학습만화 항목 근처)
- Modify: `.claude/agents/comic-writer.md`
- Modify: `.claude/agents/comic-editor.md`

- [ ] **Step 1: TopBar 에 시즌2 기획서 링크 추가**

시즌1 항목(`/learning-comic-plan.html`, 🕰️) 아래에 `{ href: '/learning-comic-s2-plan.html', icon: '🏝️', label: '학습만화 시즌2 「무인도 생존편」 기획서', desc: '무인도 12화 · 조상 생존술+현대과학+헬스케어' }` 추가.

- [ ] **Step 2: 두 에이전트에 "시즌 인식" 첫 행동 추가**

comic-writer.md·comic-editor.md 의 "첫 행동" 항목을 시즌 인식으로 확장: "**프롬프트에 지정된 시즌의 기획서를 SSOT로 읽는다** — 시즌1 = `learning-comic-plan.html`, 시즌2(무인도 생존) = `learning-comic-s2-plan.html`. 시즌2는 시간여행 없음·룰 조정판(spec 10절)이므로 시즌1 룰4(인형 위장) 등 무관 항목 적용 금지."

- [ ] **Step 3: 커밋**

```bash
git add packages/client/src/components/TopBar.tsx .claude/agents/comic-writer.md .claude/agents/comic-editor.md
git commit -m "feat(comics): 시즌2 자료실 진입점 + 에이전트 시즌 인식"
```

---

## Task 3: 1화 파일럿 집필·검수 (포맷 확정)

파일럿은 시즌2 회차의 **구조 템플릿**이 된다(EP_COSTUME=무인도 위장복, 게스트 섹션=생존 소재/섬 동식물, 헬스케어 게이지 연출). 여기서 포맷을 확정한 뒤 2~12화가 이를 복제한다.

**Files:**
- Create: `packages/client/public/learning-comic-s2-ep01.html`

- [ ] **Step 1: comic-writer 로 1화 집필 (background)**

디스패치 프롬프트 핵심:
- "시즌2다. SSOT = `learning-comic-s2-plan.html` + spec. 구조 템플릿 = `learning-comic-ep01.html`(HTML 골격만 복제). 산출 = `learning-comic-s2-ep01.html`, `<body data-comic-doc="s2-ep01">`."
- 1화 = **첫 밤·체온/은신처**. 조상=움집·솔가지 쉼터 / 과학=저체온증·단열(공기층). 자연시계=해 지기 전. 정서=재워주던 엄마 감사 비트. 헬스케어=티코 "헬스케어 스캔" 첫 등장(아이들 컨디션 게이지 도입).
- 룰: 자연의 시계=제한시간 / 해결=아이들 관찰·추리 / 안전·환경 존중(위험 행동 교정) / 조상+과학 한 쌍. 시간여행·인형위장 없음.
- 불시착 오프닝(우주 출발→사고→섬)으로 시즌 도입 겸함. 봉수 박사 통신 지직 개그 계승.
- 36쪽 + 티코피디아 부록(지식카드 2 + 퀴즈 1). 장면 5라벨 규격.

- [ ] **Step 2: comic-editor 로 1화 검수 (background)**

검수 4축(시즌2판): ① 생존 기술 고증(실제 재현 가능·안전 — 저체온증/단열 사실, 위험한 불·칼 등 모방 위험 관리) ② 저학년 적합성 ③ 시즌2 룰 정합(자연시계·안전존중·조상+과학쌍·시간여행 잔재 없나) ④ 스토리·헬스케어·부모감사·0호 정서 완성도. P0=사실오류/안전위반/치명모순.

- [ ] **Step 3: P0/P1 반영**

검수 결과의 P0(필수)·P1 을 본 세션이 Edit 로 반영. P0 있으면 재검수.

- [ ] **Step 4: 커밋**

```bash
git add packages/client/public/learning-comic-s2-ep01.html
git commit -m "feat(comics): 시즌2 1화 「첫 밤」 콘티 + 검수 반영 (포맷 확정)"
```

---

## Task 4: 파일럿 리뷰 게이트 (사용자)

- [ ] **Step 1: 브라우저에서 1화 확인**

preview 로 `learning-comic-s2-ep01.html` 로드 → 탭에 "1화" 자동 등장·렌더·콘솔 에러 없음 확인. 스크린샷/스냅샷으로 사용자에게 제시.

- [ ] **Step 2: 사용자 승인 대기**

포맷(헬스케어 게이지 연출·부모감사 비트·생존 장면 밀도·톤)이 시즌 표준으로 적절한지 사용자 확인. 수정 요청 시 반영 후 재확인. **승인 전 2~12화 대량 집필 착수 금지.**

---

## Task 5: 2~12화 롤아웃 (반복 템플릿)

각 화는 아래 4스텝을 따른다(파일럿과 동일 사이클). spec 7절 라인업 표를 화별 과제·조상지혜·현대과학·자연시계·정서비트의 근거로 삼는다.

**화별 배정:**
- s2-ep02 물 확보·정수 / s2-ep03 불 피우기 / s2-ep04 식용 식물 채집 / s2-ep05 바다 식량 / s2-ep06 위생·응급처치(부모감사 최고조) / s2-ep07 도구·토기 / s2-ep08 방향·시간(별자리 모드 콜백·일찍 자기) / s2-ep09 폭풍 대비(자연시계 최고조) / s2-ep10 식량 저장 / s2-ep11 신호(좌절 비트) / s2-ep12 무선기+티코 통신 수리→구조·귀환(피날레).

**각 화 공통 스텝:**

- [ ] **Step A: comic-writer 집필** — SSOT=`learning-comic-s2-plan.html`, 구조 템플릿=`learning-comic-s2-ep01.html`(파일럿), 산출=`learning-comic-s2-ep{NN}.html`·`data-comic-doc="s2-ep{NN}"`. 해당 화 과제/조상+과학 쌍/자연시계/부모감사 비트/헬스케어 누적/0호 활약을 명시. 이전 화 참조 필요 시(연속성·건강 게이지 누적·0호 아크) 해당 파일 정독 지시.
- [ ] **Step B: comic-editor 검수** — 시즌2 4축(Task 3 Step 2).
- [ ] **Step C: P0/P1 반영** — 본 세션 Edit. P0 있으면 재검수. **후반부(11·12화)는 0호 아크·구조 로직·부모 재회 연속성 중점.**
- [ ] **Step D: 커밋** — `git add packages/client/public/learning-comic-s2-ep{NN}.html && git commit -m "feat(comics): 시즌2 {NN}화 「제목」 콘티 + 검수 반영"`

> 파일럿 승인 후, 독립적인 화들(2~9)은 병렬 집필 가능. 10~12는 구조·정서 연속성 때문에 앞 화 참조가 필요하니 순차/후순위.

---

## Task 6: 시즌2 문서 상태 + 인덱스 갱신

**Files:**
- Modify: `packages/client/public/learning-comic-s2-plan.html` (라인업 표 ✅ 상태)
- Modify: `CLAUDE.md` (학습만화 인덱스 항목 — 시즌2 추가)
- Modify: memory `time-tiko-comic-2026-07-03.md` (시즌2 상태 추가)

- [ ] **Step 1: 12화 완료 후 시즌2 기획서 라인업 표에 ✅ 반영, 로드맵 상태 갱신.**
- [ ] **Step 2: CLAUDE.md 학습만화 항목에 "시즌2 무인도 생존편(12화·SSOT=learning-comic-s2-plan.html)" 추가.**
- [ ] **Step 3: memory 에 시즌2 전편 완료 상태·다음 단계(이미지) 기록.**
- [ ] **Step 4: 커밋 + "업데이트"(main 푸시)는 사용자 지시 시.**

---

## Self-Review (작성자 체크)

- **Spec 커버리지:** 전제·다리(Task 0) / 문서·룰(Task 1) / 진입점·에이전트(Task 2) / 헬스케어·부모감사·0호(각 화 Step A 프롬프트에 명시) / 12화 라인업(Task 3·5) / 피날레 구조 단일화(Task 5 ep11·12) / 인덱스(Task 6) — 모두 태스크 존재. ✅
- **플레이스홀더:** 각 화 "제목"은 집필 시 확정(라인업 과제는 spec 7절에 확정돼 있음) — 의도적 열림, 나머지 구체 경로·프롬프트 명시. ✅
- **일관성:** 파일명 `learning-comic-s2-ep{NN}.html` / 마커 `data-comic-doc="s2-ep{NN}"` / SSOT `learning-comic-s2-plan.html` 전 태스크 통일. ✅
- **주의(코드 도메인 아님):** "테스트"는 comic-editor 검수로 대체. TDD 스텝 대신 집필→검수→반영 사이클.
