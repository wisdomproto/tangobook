# 마케팅 전문 에이전트 설계 (Marketing Specialist Agent)

*작성일: 2026-06-19 · 상태: 설계 승인 대기*

## 목적

매 세션마다 마케팅 컨텍스트를 재설명하지 않아도, **탱고북 마케팅 전략·실행을 일관되게 수행하는 재사용 에이전트**를 만든다. 실행(콘텐츠 제작)과 전략/기획 두 가지를 담당한다.

### 핵심 원칙 — 에이전트는 "학습"하지 않는다

서브에이전트는 훈련/기억하지 않는다. 매 호출 시 백지에서 시작하고 **그 순간 읽는 파일에서만** 컨텍스트를 얻는다. 따라서:

- 에이전트 정의 파일 = **얇은 시스템 프롬프트** (정체성 + 규칙 + "정보가 어디 있는지 지도")
- 실제 지식 = 에이전트가 읽는 **문서(docs) + 메모리(memory)** → 이게 쌓이면서 에이전트가 "진화"한다
- 정보를 많이 넣을수록 좋은 게 아니다 (context bloat). 핵심만 brief에 두고, 깊은 자료는 그때그때 로드한다.

이는 프로젝트 CLAUDE.md를 "인덱스"로 쓰는 기존 철학과 동일하다.

## 산출물 (2개)

### ① `.claude/agents/marketing-specialist.md` — 에이전트 정의

얇은 시스템 프롬프트. 포함 항목:

- **정체성**: 탱고북 글로벌 마케팅 전문가 (실행 + 전략)
- **첫 행동 규칙**: 작업 시작 시 항상 `docs/marketing/brand-brief.md`를 먼저 읽는다 (1순위 컨텍스트)
- **자료 지도(map)**: 더 깊은 자료 위치
  - 키워드 데이터: `docs/marketing/data/` (+ `README.md`)
  - 투자자/전략 deck: `packages/client/public/strategy.html`, `strategy-detail.html`, `docs/strategy-deck-rules.md`
  - 운영 플레이북: `packages/client/public/operations-playbook.html`
  - 바이럴 자석: `packages/client/public/viral-magnets-wireframes.html`
  - 블로그/카드뉴스: `packages/client/src/features/blog/CLAUDE.md`
  - 릴스/영상: `docs/video-production-guide.md`, reels promo spec
  - 마케팅 모듈(코드): `packages/client/src/features/marketing/CLAUDE.md`
- **스킬 활용 규칙** (재발명 금지, 기존 스킬 호출):
  - 카피라이팅 → `copywriting`
  - SEO 감사 → `seo-audit` / AI 검색 최적화 → `ai-seo`
  - 소셜 콘텐츠 → `social-content`
  - 광고 카피 → `ad-creative` / 광고 전략 → `paid-ads`
  - 콘텐츠 전략 → `content-strategy` / `marketing:content-creation`
  - 이메일 시퀀스 → `email-sequence` / 레퍼럴 → `referral-program`
- **산출물 규칙**: 한국어 우선. 결과물 저장 위치 명시 (초안은 `docs/marketing/drafts/` 등 — 구현 시 확정).
- **금지/주의**:
  - "AI 양산 반대 · 명작 동화 플랫폼" 포지셔닝 위배 금지
  - 마케팅 자격증명 하드코딩 금지 (NAVER/DataForSEO 등)
  - 광고/SEO 결정 전 키워드 볼륨은 검색결과 직접 확인 (다의어 과대평가 주의)
- **사용 적합성 명시**: 서브에이전트는 격리 컨텍스트에서 실행되어 결과 요약만 반환한다. → **"맡기면 완성해 오는 작업"**(블로그 초안, 키워드 리포트, 광고 카피 세트)에 적합. 실시간 핑퐁이 필요한 작업은 메인 세션에서 스킬로 직접 수행.

### ② `docs/marketing/brand-brief.md` — 마케팅 단일 소스 (에이전트의 축)

에이전트의 1순위 읽기 대상. 구조:

1. **ICP (타겟 페르소나)** — 유아동(미취학~초등 저학년) 자녀를 둔 부모. deck에서 추출.
2. **핵심 포지셔닝** — "AI 양산 반대, 명작 동화 플랫폼" 한 줄 + 메시지 기둥.
3. **브랜드 보이스** — 해야 할 표현 / 금지 표현 / 톤 예시. 🚩 deck에 명시 없으면 추론 초안 + 사용자 검수 표시.
4. **글로벌 전략 (언어 축)**:
   - 마케팅 축 = **국가가 아니라 언어**
   - 지원 언어 6종: 한글(ko) · 영어(en) · 베트남(vi) · 태국(th) · 중국어 간체(zh-CN) · 중국어 번체(zh-TW)
   - **Phase 1**: 한글+영어 먼저 출시 → 한국 시장 테스트 + 콘텐츠 확장
   - **Phase 2**: 나머지 4종(vi/th/zh-CN/zh-TW) 한꺼번에 글로벌 동시 출시
   - 콘텐츠(동화)는 다국어로 꾸준히 증가
5. **채널 믹스**:
   - **오가닉** (구글/SNS/유튜브): 모든 언어에 기본 수행 — "그냥 하는 것"
   - **유료광고** (메타 등): **선택적 레버** — "어느 시장에서 돈 쓸지"만 결정
6. **성장 루프**: 7일 무료체험 → 친구 초대 시 7일 연장 (referral 바이럴). 기존 인프라: `og-invite.png`, 레퍼럴 게이팅.
7. **핵심 키워드 TOP** — `docs/marketing/data/consolidated-summary.md`에서 발췌 (전체는 링크).
8. **🔗 자료 지도** — 위 ①의 map과 동일한 깊은 자료 링크.
9. **시장별 노트** — 언어(시장)마다 톤·키워드·채널·유료광고 여부가 다를 수 있음. **시간이 지나며 채워지는 구조** (= 진화의 자리).

## 데이터 흐름 / 진화 루프

```
에이전트 호출 → brand-brief.md 읽기 (+ 필요 시 깊은 자료) → 작업 수행
   ↓
새 전략/톤/잘 먹힌 카피/시장별 학습 발생
   ↓
brand-brief (전략·사실) 또는 memory (사용자 선호·피드백) 갱신
   ↓
다음 호출 때 반영 → 진화
```

- **docs/marketing/** = 마케팅 사실·전략 (ICP, 포지셔닝, 보이스, 채널, 키워드 맵, 시장별 노트)
- **memory/** = 사용자 선호·피드백 (금지 표현, 카드뉴스 톤 등)

> B안 범위: 자가 갱신은 **수동/안내 수준**(에이전트가 "이건 brief에 기록해두면 좋겠다"고 제안). 완전 자동 자가 갱신 규칙(C안)은 후속.

## brand-brief 초안 작성 방법

`strategy.html` + `operations-playbook.html` + `consolidated-summary.md`에서 ICP·포지셔닝·채널·키워드를 추출해 초안 작성. **브랜드 보이스**는 deck에 명시 없을 가능성 높으므로 추론 초안에 🚩 표시 → 사용자가 그 부분만 검수.

## 범위 밖 (YAGNI)

- C안 완전 자동 자가 갱신 루프 (B 검증 후 후속)
- 시장별 노트 사전 작성 (진행하며 채움)
- 마케팅 모듈(/marketing) 코드 기능 개발 (이 에이전트는 전략·실행 담당, 코딩은 메인 세션)

## 검증 기준

- 에이전트 호출 시 brand-brief를 먼저 읽고, 추가 설명 없이 포지셔닝·언어 전략·채널 믹스를 정확히 반영
- 카피/콘텐츠 작업 시 기존 스킬을 호출 (재발명 안 함)
- 산출물이 "AI 양산 반대" 포지셔닝과 브랜드 보이스에 부합
