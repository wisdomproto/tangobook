# 마케팅 전문 에이전트 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 탱고북 마케팅 전략·실행을 일관되게 수행하는 재사용 서브에이전트(`marketing-specialist`)와 그 단일 소스 문서(`brand-brief.md`)를 만든다.

**Architecture:** 얇은 에이전트 정의(`.claude/agents/marketing-specialist.md`) + 에이전트가 1순위로 읽는 마케팅 단일 소스(`docs/marketing/brand-brief.md`). 지식은 brief/memory에 쌓이며 진화. 검증은 실제 에이전트 호출 스모크 테스트.

**Tech Stack:** Claude Code 서브에이전트(YAML frontmatter + markdown 시스템 프롬프트), markdown 문서. 코드 변경 없음.

**참조 spec:** `docs/superpowers/specs/2026-06-19-marketing-specialist-agent-design.md`

---

## File Structure

- **Create** `docs/marketing/brand-brief.md` — 마케팅 단일 소스 (에이전트의 1순위 읽기 대상)
- **Create** `.claude/agents/marketing-specialist.md` — 에이전트 정의 (얇은 시스템 프롬프트)
- **Create** `docs/marketing/drafts/.gitkeep` — 에이전트 콘텐츠 산출물 저장 위치 확정
- **Modify** `packages/client/src/features/marketing/CLAUDE.md` — brand-brief + 에이전트 포인터 1줄 추가

---

## Task 1: 소스 자료 수집 (brand-brief 재료)

brand-brief를 채우기 위해 흩어진 전략 자료에서 사실을 추출한다. **파일 생성 없음 — 읽기·메모만.**

- [ ] **Step 1: 포지셔닝/ICP/채널 추출**

다음 파일을 읽고 ICP·포지셔닝 한 줄·메시지 기둥·채널 전략·성장 루프(7일 체험+초대 연장) 근거를 메모:
- `packages/client/public/strategy.html` (투자자 deck 15장 — 포지셔닝·ICP·트랙션)
- `packages/client/public/operations-playbook.html` (베타→확장, 8-Pronged 알림, 듀얼 블로그, 포인트)
- `docs/strategy-deck-rules.md` (자랑 표현·금지 톤·AI 모델 표기 규칙 → 브랜드 보이스 단서)

- [ ] **Step 2: 키워드 TOP 추출**

`docs/marketing/data/consolidated-summary.md`에서 교차검증 TOP 키워드(카테고리별 골든)와 다의어 주의사항을 메모. 전체는 brief에서 링크로 처리.

- [ ] **Step 3: 콘텐츠 채널 가이드 위치 확인**

`packages/client/src/features/blog/CLAUDE.md`와 `docs/video-production-guide.md`의 존재·용도를 확인(브리프 자료 지도에 링크). 본문 정독 불필요.

**커밋 없음 (읽기 전용 태스크).**

---

## Task 2: `docs/marketing/brand-brief.md` 작성

**Files:**
- Create: `docs/marketing/brand-brief.md`

- [ ] **Step 1: brief 작성**

spec의 9개 섹션 구조로 작성한다. Task 1에서 추출한 실제 내용을 채운다. 아래 골격을 따르되 빈 칸 없이 실제 내용으로 채울 것:

```markdown
# 탱고북 마케팅 브리프 (Brand Brief)

> 마케팅 단일 소스(source of truth). `marketing-specialist` 에이전트가 작업 시작 시 가장 먼저 읽는다.
> 전략/사실이 바뀌면 여기를 갱신한다 (사용자 선호·피드백은 memory/).
> *최종 갱신: 2026-06-19*

## 1. ICP (타겟 페르소나)
(deck에서 추출한 실제 페르소나 — 유아동 자녀 부모, 연령대, 니즈, 구매 동기)

## 2. 핵심 포지셔닝
**한 줄:** AI 양산 콘텐츠 반대 · 명작 동화 플랫폼
**메시지 기둥:** (deck에서 추출한 3~4개)

## 3. 브랜드 보이스
- **해야 할 표현:** (...)
- **금지 표현:** (...)  ← `docs/strategy-deck-rules.md` 금지 톤 반영
- **톤 예시:** (...)
🚩 이 섹션 일부는 deck에서 추론한 초안 — 사용자 검수 필요 표시.

## 4. 글로벌 전략 (언어 축)
- 마케팅 축 = **국가가 아니라 언어**
- 지원 언어 6종: 한글(ko) · 영어(en) · 베트남(vi) · 태국(th) · 중국어 간체(zh-CN) · 중국어 번체(zh-TW)
- **Phase 1:** 한글+영어 먼저 출시 → 한국 시장 테스트 + 콘텐츠 확장
- **Phase 2:** vi/th/zh-CN/zh-TW 한꺼번에 글로벌 동시 출시
- 동화 콘텐츠는 다국어로 꾸준히 증가

## 5. 채널 믹스
- **오가닉** (구글/SNS/유튜브): 모든 언어 기본 수행
- **유료광고** (메타 등): 선택적 레버 — "어느 시장에 돈 쓸지"만 결정

## 6. 성장 루프
7일 무료체험 → 친구 초대 시 7일 연장 (referral). 기존 인프라: `og-invite.png`, 레퍼럴 게이팅.

## 7. 핵심 키워드 TOP
(consolidated-summary.md에서 발췌한 카테고리별 골든 키워드 표 + 다의어 주의)
전체: `docs/marketing/data/consolidated-summary.md`

## 8. 자료 지도 (깊은 자료)
| 영역 | 경로 |
|---|---|
| 키워드 데이터 | `docs/marketing/data/` (+ `README.md`) |
| 투자자 deck | `packages/client/public/strategy.html` · `strategy-detail.html` · `docs/strategy-deck-rules.md` |
| 운영 플레이북 | `packages/client/public/operations-playbook.html` |
| 바이럴 자석 | `packages/client/public/viral-magnets-wireframes.html` |
| 블로그/카드뉴스 | `packages/client/src/features/blog/CLAUDE.md` |
| 릴스/영상 | `docs/video-production-guide.md` |
| 마케팅 모듈(코드) | `packages/client/src/features/marketing/CLAUDE.md` |

## 9. 시장별 노트 (진화의 자리)
언어(시장)마다 톤·키워드·채널·유료광고 여부가 다를 수 있음. 진행하며 채운다.
- **ko:** (Phase 1)
- **en:** (Phase 1)
- **vi / th / zh-CN / zh-TW:** (Phase 2 — 미정)
```

- [ ] **Step 2: 검증 — 빈 칸/placeholder 없음 확인**

brief를 다시 읽고 `(...)`·`(미정)` 같은 미완성 표시가 Phase 2 시장별 노트 외에는 없는지 확인. ICP·포지셔닝·키워드·채널은 실제 내용으로 채워졌는지 확인.

- [ ] **Step 3: Commit**

```bash
git add docs/marketing/brand-brief.md
git commit -m "docs(marketing): 마케팅 단일 소스 brand-brief 추가 (ICP·포지셔닝·언어전략·채널·성장루프)"
```

---

## Task 3: `.claude/agents/marketing-specialist.md` 작성

**Files:**
- Create: `.claude/agents/marketing-specialist.md`

- [ ] **Step 1: 에이전트 정의 작성**

YAML frontmatter + 시스템 프롬프트. 아래 전체 내용:

```markdown
---
name: marketing-specialist
description: >
  탱고북 글로벌 마케팅 전문가. 블로그·카드뉴스·SEO·광고 카피·릴스 기획 등 마케팅
  콘텐츠 제작(실행)과 키워드 리서치·채널 전략·캠페인 기획(전략)을 담당한다.
  "맡기면 완성해 오는" 마케팅 산출물 작업에 사용. 호출 시 항상 brand-brief를 먼저 읽어
  포지셔닝·언어전략·브랜드 보이스를 일관되게 반영한다.
tools: Read, Glob, Grep, Write, Edit, Bash, WebSearch, WebFetch, Skill
---

너는 탱고북(AI 기반 유아동 명작 동화 플랫폼)의 마케팅 전문가다.

## 첫 행동 (반드시)
작업을 시작하기 전에 **항상 `docs/marketing/brand-brief.md`를 먼저 읽는다.** 이게 마케팅
단일 소스다 — 포지셔닝, ICP, 브랜드 보이스, 언어 전략, 채널 믹스, 성장 루프가 여기 있다.
brief에 없는 깊은 자료가 필요하면 brief의 "자료 지도"를 따라 해당 파일을 읽는다.

## 핵심 전략 (brief가 단일 소스 — 충돌 시 brief 우선)
- 포지셔닝: AI 양산 콘텐츠 반대 · 명작 동화 플랫폼. 이 포지셔닝을 위배하는 카피 금지.
- 마케팅 축 = 국가가 아니라 **언어** (ko·en·vi·th·zh-CN·zh-TW).
- Phase 1 = 한글+영어(한국 시장 테스트), Phase 2 = 나머지 4종 글로벌 동시 출시.
- 오가닉(구글/SNS/유튜브)은 모든 언어 기본. 유료광고(메타 등)는 시장별 선택 레버.
- 성장 루프: 7일 무료체험 → 친구 초대 시 7일 연장.

## 스킬 활용 (재발명 금지)
적합한 기존 스킬을 Skill 도구로 호출한다:
- 카피라이팅 → copywriting / 카피 편집 → copy-editing
- SEO 감사 → seo-audit / AI 검색 최적화 → ai-seo / 구조화데이터 → schema-markup
- 소셜 콘텐츠 → social-content
- 광고 카피 → ad-creative / 광고 전략 → paid-ads
- 콘텐츠 전략 → content-strategy / 콘텐츠 제작 → marketing:content-creation
- 이메일/시퀀스 → email-sequence / 레퍼럴 → referral-program
- 캠페인 기획 → marketing:campaign-plan / 경쟁 분석 → marketing:competitive-brief

## 산출물 규칙
- 한국어로 응답·작성 (콘텐츠 자체는 대상 언어로).
- 콘텐츠 초안(블로그·카드뉴스·광고 카피 세트 등)은 `docs/marketing/drafts/`에 파일로 저장하고 경로를 보고한다.
- 키워드/광고 결정 전, 검색 볼륨은 다의어 과대평가에 주의하고 필요 시 검색결과를 직접 확인.

## 금지/주의
- "AI 양산 반대" 포지셔닝·브랜드 보이스(brief §3) 위배 금지.
- 마케팅 자격증명(NAVER/DataForSEO/메타 등) 하드코딩 금지.

## 진화 (지식 갱신 제안)
작업 중 새로 확정된 전략·톤·잘 먹힌 카피·시장별 학습이 생기면, 작업 결과 끝에
"이건 brand-brief(§해당 섹션) 또는 memory에 기록하길 권장합니다"라고 **제안**한다.
(직접 brief를 고치지는 않는다 — 사용자 확인 후 반영.)
```

- [ ] **Step 2: frontmatter 유효성 확인**

`name`이 파일명과 일치(`marketing-specialist`), `description`이 자동 위임 트리거로 충분히 구체적인지, `tools` 목록에 오타 없는지 확인.

- [ ] **Step 3: Commit**

```bash
git add .claude/agents/marketing-specialist.md
git commit -m "feat(agent): 마케팅 전문 에이전트 marketing-specialist 추가"
```

---

## Task 4: drafts 디렉토리 + 포인터 연결

**Files:**
- Create: `docs/marketing/drafts/.gitkeep`
- Modify: `packages/client/src/features/marketing/CLAUDE.md`

- [ ] **Step 1: drafts 디렉토리 생성**

```bash
mkdir -p docs/marketing/drafts
```

`docs/marketing/drafts/.gitkeep` 파일 생성, 내용:

```
# 마케팅 에이전트(marketing-specialist) 콘텐츠 초안 산출물 위치
```

- [ ] **Step 2: marketing CLAUDE.md에 포인터 추가**

`packages/client/src/features/marketing/CLAUDE.md` 상단 또는 적절한 섹션에 1~2줄 추가:

```markdown
> **마케팅 에이전트**: `.claude/agents/marketing-specialist.md` (전략·실행 담당). 단일 소스 = `docs/marketing/brand-brief.md`. 코드 기능 개발은 메인 세션, 콘텐츠/전략은 이 에이전트.
```

- [ ] **Step 3: Commit**

```bash
git add docs/marketing/drafts/.gitkeep packages/client/src/features/marketing/CLAUDE.md
git commit -m "docs(marketing): 에이전트 산출물 drafts 위치 + 모듈 가이드 포인터"
```

---

## Task 5: 스모크 테스트 (실제 에이전트 호출 검증)

코드 테스트 대신, 실제로 에이전트를 호출해 의도대로 동작하는지 확인한다.

- [ ] **Step 1: 에이전트에 작은 작업 위임**

Agent 도구로 `marketing-specialist`(또는 subagent_type)를 호출, 예시 프롬프트:
> "탱고북 한국 시장(ko) 인스타그램 카드뉴스 1세트(5장)의 카피 초안을 만들어줘. 주제는 '공룡' 카테고리 동화."

- [ ] **Step 2: 검증 체크리스트**

에이전트 결과가 다음을 만족하는지 확인:
- brand-brief를 읽은 흔적 (포지셔닝/언어전략 반영)
- "AI 양산 반대" 포지셔닝과 충돌하지 않음
- 적합한 스킬(social-content/copywriting) 호출 또는 그 산출물 형식
- 초안을 `docs/marketing/drafts/`에 저장하고 경로 보고
- 한국어 응답

- [ ] **Step 3: 미흡 시 보정**

체크리스트 중 실패 항목이 있으면 원인을 진단해 에이전트 정의(Task 3) 또는 brief(Task 2)를 수정하고 재호출. 통과할 때까지 반복.

- [ ] **Step 4: 스모크 테스트 산출물 정리**

테스트로 생성된 drafts 파일은 유지할지/삭제할지 사용자에게 확인. (불필요하면 삭제.)

---

## Self-Review (작성자 체크)

- **Spec coverage:** 산출물 2개(에이전트+brief) ✅ Task 2·3 / 9개 brief 섹션 ✅ Task 2 / 스킬 활용 ✅ Task 3 / 진화 루프(B안 수동 제안) ✅ Task 3 Step1 / 사용 적합성 명시 ✅ description+brief / drafts 위치 확정 ✅ Task 4.
- **Placeholder scan:** brief의 Phase 2 시장별 노트만 의도적 미정. 그 외 실제 내용 채움 규칙 명시.
- **Type consistency:** 파일 경로·`name: marketing-specialist`·`docs/marketing/brand-brief.md`·`docs/marketing/drafts/` 전 태스크 일관.

> 커밋: 사용자 글로벌 규칙상 "명시 지시 없이 commit 금지"이나, 이 plan은 실행 단계에서 사용자가 실행을 승인하면 진행되는 것이므로 각 태스크에 commit 단계를 포함했다. 실행 시 사용자가 commit 보류를 원하면 해당 단계만 건너뛴다.
