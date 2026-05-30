# 명작동화 베트남어(vi) 자동 번역 — 설계서

작성일: 2026-05-30
상태: ✅ 구현 완료 (vi 공개 명작 18권 R2 적용). 이후 `--lang` **범용 모듈로 리팩토링** — `translate-{extract,apply,verify}.mjs` + `translation-core.mjs`, 데이터 `_data/translations/<lang>/`(언어무관 `t` 키). 본 문서는 vi 1차 설계 기록이며, 범용 모듈/새 언어 추가 절차의 최신 기준은 memory `translation-pipeline-i18n-2026-05-30.md`.

## 0. 한 줄 요약

저작도구(`/editor2`)의 **"언어 추가 + 자동 번역 버튼"이 하는 일을 그대로**, 단 **Gemini 대신 Claude 번역**으로 공개 명작 18권에 **베트남어(vi)**를 일괄 자동 적용하는 스크립트. + 부모 가이드(parentGuide)도 언어별로 확장.

## 1. 배경 — 기존 시스템은 이미 다국어 추가를 지원

- `/editor2` `LevelEditCard`의 "새로운 언어 추가" 드롭다운(`SUPPORTED_LANGUAGES`) → `storybook.languages`에 코드 push. **언어 추가 자체는 번역 안 함.**
- 번역은 각 탭 버튼이 서버 `translation.service.ts`(`generateTextWithGemini`) 호출:
  | 탭 | 버튼 | 필드 |
  |----|------|------|
  | PagesTab | 전체 번역 | `page.translations[lang].text` |
  | CoverTab | 🤖 자동 번역 | `storybook.titleTranslations[lang]` |
  | KeyObjectTab | 🤖 일괄 번역 | `key_objects[].nameTranslations[lang]` |
- 뷰어는 `getPageText(page, lang)`로 `translations[lang].text`를 읽고 없으면 한국어 폴백 → **vi도 데이터만 있으면 자동 표시.**
- **예외: parentGuide는 언어별 구조가 없음**(한국어 전용). 이번에 새 필드로 확장.

## 2. 범위

| 항목 | 결정 |
|------|------|
| 대상 | 공개(`isPublic`) 명작 18권 먼저. 스크립트는 51권 전부 지원(`--all`) |
| 번역 필드 | 페이지 본문 + 제목 + 핵심단어 이름 + **부모 가이드(overview/lessons/readingTips/faq)** |
| 출처 | 한국어 원문 기준, 기존 영어 번역 교차 참고 |
| TTS | 텍스트만. `translations[vi].ttsUrl` / `ttsUrls[vi]` 비움 (추후) |
| 표지 | vi 전용 표지 없음 → BookDetailPage 커버 lookup에 vi 없으면 en→ko 폴백 |

## 3. 메커니즘 — 3단계 (Claude 직접 번역, Gemini 미사용)

```
[1] extract-vi.mjs   →  [2] Claude(나) 직접 번역  →  [3] apply-vi.mjs
   R2에서 18권 읽어        _data/vi/{id}.json 의           채운 파일 읽어 R2 책에
   책별 번역대상 dump       vi 칸을 한국어+영어 참고         주입 후 PUT
   (vi 칸은 빈 문자열)     하며 채움
```

서버 `translation.*`(Gemini)는 **사용하지 않는다.** 스크립트가 R2에 직접 GET/PUT.

## 4. 주입 필드

대부분 기존 필드 재사용. parentGuideTranslations만 신규.

```jsonc
{
  "languages": ["ko", "en", "vi"],                         // vi push (dedupe)
  "titleTranslations": { "vi": "Bạch Tuyết" },             // 기존 Record, vi 키
  "pages": [
    { "translations": { "vi": { "text": "Ngày xửa ... **Bạch Tuyết** ..." } } } // text만
  ],
  "key_objects": [
    { "korean": "사과", "nameTranslations": { "vi": "quả táo" } }  // 기존 Record, vi 키
  ],
  "parentGuideTranslations": {                              // 신규 최상위 필드
    "vi": { "overview": "...", "lessons": ["..."], "readingTips": ["..."],
            "faq": [{ "q": "...", "a": "..." }] }
  }
}
```

- `nameTranslations`/`titleTranslations`는 이미 존재. `parentGuideTranslations`만 신규(타입 추가).
- `primaryCoverByLang.vi`는 채우지 않음(표지 폴백은 클라).

## 5. shared 변경 (`packages/shared/src`)

- `constants/index.ts` — `SUPPORTED_LANGUAGES`에 `{ code: 'vi', label: '베트남어' }` 추가. (1단계: 현재 vi가 없어 저작도구 드롭다운에서도 못 고름)
- `types/storybook.ts` — `Storybook`에 `parentGuideTranslations?: Record<string, ParentGuide>` 추가. (`ParentGuide`는 기존 타입 재사용)
- 그 외 타입 변경 불필요(`translations`/`titleTranslations`/`nameTranslations` 모두 `Record<string, ...>`).

## 6. 클라이언트 변경 (`packages/client/src`)

- `pages/BookDetailPage.tsx`
  - `LANG_LABEL`에 `vi: { flag: '🇻🇳', name: 'Tiếng Việt' }`.
  - 커버 lookup(157–162행) 폴백 보강: 비-ko 언어 선택 시 자기 언어 커버 없으면 `en`→`ko` fall through(styleAssets tier·top-level tier 각각). 기존 ko-only `coverImage` 폴백·`isActiveStyle` 가드 보존.
  - 부모 가이드 섹션(현 ~368–467행): 렌더 직전 `const guide = (lang !== 'ko' && storybook.parentGuideTranslations?.[lang]) || storybook.parentGuide` 한 줄 계산 후, 기존 `storybook.parentGuide.*` 참조를 `guide.*`로 교체. 데이터 없으면 한국어로 자연 폴백.
- 언어 토글(287–311행)·뷰어 본문(`getPageText`)·`LangCode`/`lang` 타입은 **변경 불필요**(자동 수용).
- `LanguageTabs`는 **건드리지 않음**(학습리포트 전용, 무관).

## 7. 스크립트 상세 (`packages/server/scripts`)

`dump-books-by-category.mjs`/`backfill-overview-from-map.mjs`의 R2 직접 GET/PUT 패턴(.env 수동 파싱 → S3Client).

### 7.1 `extract-vi.mjs`
- R2 `storybook-*.json` 나열 → `category === '세계 명작'` && variant(`__L\d+$`) 아님 && (기본) `isPublic` 필터. `--all`/`--id=<id>` 옵션.
- 책별 `_data/vi/{id}.json`:
  ```jsonc
  {
    "id": "...", "title": "백설공주", "titleVi": "",
    "pages": [{ "n": 1, "ko": "...", "en": "...", "vi": "" }],
    "keyObjects": [{ "i": 0, "korean": "사과", "en": "apple", "vi": "" }],
    "parentGuide": {
      "overview": { "ko": "...", "vi": "" },
      "lessons":     [{ "ko": "...", "vi": "" }],
      "readingTips": [{ "ko": "...", "vi": "" }],
      "faq":         [{ "q_ko": "...", "a_ko": "...", "q_vi": "", "a_vi": "" }]
    }
  }
  ```
- keyObject 읽기 `sb.key_objects ?? sb.keyObjects`; `en` = `k.nameEn || k.nameTranslations?.en || ''`(없으면 빈칸, 행 유지), 인덱스 `i` 기록.
- parentGuide 없는 책은 `parentGuide: null`로 표기(번역 대상에서 제외).
- 기존 파일 보존(`--force`로만 덮음).

### 7.2 `apply-vi.mjs`
- `_data/vi/{id}.json` 읽어 빈 `vi` 검증(누락 시 책 skip + 경고; 책 단위 원자성). parentGuide가 `null`이면 가이드만 skip하고 본문/제목/단어는 적용.
- R2 GET → 주입:
  - `languages`에 vi push(dedupe).
  - `titleTranslations.vi`, `pages[n-1].translations.vi = { text }`(pageNumber 매칭).
  - `key_objects[i].nameTranslations.vi`(**인덱스 매칭** — 중복 korean 안전).
  - `parentGuideTranslations.vi = { overview, lessons[], readingTips[], faq[{q,a}] }`.
  - `updatedAt` 갱신.
- `--dry-run`: 요약만. 쓰기 대상은 `key_objects`(camelCase는 읽기 별칭).

## 8. 번역 품질 원칙 (Claude 수행)

- 한국어 원문 기준, 영어 번역 교차 참고.
- `**볼드**` 마커·`\n` 줄바꿈 그대로 보존.
- 만 4~7세 유아 눈높이의 자연스러운 베트남어 구어체.
- 명작 고유명사는 베트남 통용 표기(백설공주→Bạch Tuyết, 신데렐라→Lọ Lem 등), 불명확하면 음차.

## 9. 검증

- `apply-vi --dry-run --id=1778555233699`(백설공주)로 주입 요약 먼저 확인.
- 실제 적용 후 R2 재조회로 `languages`/`translations.vi`/`titleTranslations.vi`/`nameTranslations.vi`/`parentGuideTranslations.vi` 확인.
- `pnpm typecheck` 통과.
- 로컬 `pnpm dev`에서 BookDetailPage vi 선택 → 표지(en/ko 폴백)·제목·본문·가이드 표시, `/viewer/:id?lang=vi` 본문 베트남어 육안 확인.

## 10. 공개 명작 18권 (1차 대상)

개구리 왕자 · 개미와 베짱이 · 거인의 정원 · 걸리버 여행기 · 구둣방 할아버지와 꼬마 요정 · 눈의 여왕 · 늑대와 일곱 마리 아기 염소 · 미운 아기 오리 · 백설공주 · 백조의 호수 · 보물섬 · 북풍과 태양 · 브레멘 음악대 · 빨간모자 · 아기 돼지 삼형제 · 잠자는 숲속의 공주 · 잭과 콩나무 · 토끼와 거북이
(실제 선정은 `category === '세계 명작' && isPublic` 필터로 자동)

## 11. 비목표 (이번 범위 아님)

- 베트남어 TTS 오디오(`translations[vi].ttsUrl`, `ttsUrls[vi]`) — 구조만 비움, 추후.
- 단어 학습 화면(`VocabularyStudyContent`) 다국어 UI — 기존에도 미완. 데이터(`nameTranslations.vi`)는 들어가므로 추후 활용.
- 비공개 33권 — 스크립트 지원, 실행은 추후.
- keyObject `description`/`definition`/`example` 번역(저작도구도 언어별 아님).
