# 호리네 생활동화 — 라인 문서 인덱스

호리(아기 호랑이) 마스코트 앙상블 기반 **생활동화 45권 라인**. 대발이·콩순이·페파 3사 분석에서 도출한 "대박 공식"으로 제작.

## 문서
- [cast-bible-and-pilot.md](cast-bible-and-pilot.md) — 호리네 캐스트 바이블(8인) + 초기 파일럿
- [character-prompts.md](character-prompts.md) — 캐릭터 레퍼런스 생성 프롬프트(모델시트 v2)
- [topic-master-list.md](topic-master-list.md) — 7트랙 30+주제 마스터 리스트(연령·캐릭터·장치·우선순위)
- [curriculum-45.md](curriculum-45.md) — **45편 완성 커리큘럼**(대발이 34편 실측 분석 기반 "결점=배역" 매핑, ★=근거편). topic-master-list 확장판.
- [pilot-golgoru-v2.md](pilot-golgoru-v2.md) — 파일럿 「골고루 먹기」 완성본(3사 공식 적용)
- [book-p1-hospital.md](book-p1-hospital.md) — P1 「주사 콕, 병균 뿅!」 병원 대본(상상역할극=몸속 병사)
- [art-style-bakeoff.md](art-style-bakeoff.md) — 그림체 bake-off. **✅ B 니들펠트(양모 인형) 확정**(2026-07-05). STYLE SSOT 2곳 = `saenghwal-core.js` STYLE_PROMPT + `saenghwal-plan.html` 캐릭터 시트 리드.

## 저작도구 HTML (TopBar 자료실 "🐯 호리네 생활동화 기획서" — 자료실 최상단)
`packages/client/public/` — 공용 스크립트 `saenghwal-core.js`(탭·프롬프트 합성·붙여넣기 엔진):
- `saenghwal-plan.html`(기획서+캐스트8 레퍼런스) · `saenghwal-golgoru.html`(편식) · `saenghwal-hospital.html`(병원).
- **배치 이미지 프롬프트**: 스타일(니들펠트) 1회 + `@image1~8` 고정 캐스트 + `@image9~` 화별 단역(`window.SH_GUESTS`) + 쪽별 `[등장]`(SCENE 영문 토큰 자동감지) → **[전체 프롬프트 복사]** 1버튼 + 쪽별 복사. 단역은 "🎭 이 화 새 캐릭터 레퍼런스" 섹션 자동 생성.
- **이미지 저장** = `/api/comic-assets/{docId}` 범용(R2). 새 회차 = 기존 HTML 복제 + core `items` 탭목록 등록. SCENE엔 그림체 문구 금지·캐릭터 인식 토큰 필수.

## 작가/편집장 에이전트 (학습만화와 공용)
`comic-writer`(집필)·`comic-editor`(검수)가 **생활동화+학습만화 두 라인 공용**. 워크플로 = **"○○ 편 써줘" → comic-writer 집필 → comic-editor 검수 → 수정 → 재검수**. (편식·병원 파일럿 소급검수 = 둘 다 승인; 병원 P1=주사 은유 "약 배달" 보정·안전편 번호규칙 추가.)

## 상태 (2026-07-01)
- ✅ **45권 제작 완료** — 에디터 R2, `folder='생활동화'` + `category='생활동화'`
- ✅ 호리네 캐스트 8인 → 전역 캐릭터 라이브러리(`character-library.json`) 등록 + referenceImage 연결(다른 책에서 재사용)
- ✅ 각 책 = 무표지 10페이지 + 교육콘텐츠 + 부모가이드 + 한/영 장면 프롬프트, artStyle='animation'
- ⏳ 전부 **비공개 초안 + 이미지·TTS 미생성** → 다음: 전체 삽화 생성 / TTS / 검수 후 공개 / 커리큘럼 마스터 반영

## 공식 요약
5비트 아크(작은 부정감정→조력자→장치→**시그니처 무지개 부릉꼬리 + 후렴 3회**→따뜻한 마무리) · 8대 장치(리프레이밍/인과/거울효과/점진수용/상상역할극/반복후렴/명시교훈/조력자속정).

상세 분석·현황 → memory `hori-saenghwal-donghwa-2026-07-01` · `debari-benchmark-analysis-2026-07-05`(벤치마크 실측·저작도구·에이전트).
