# 동화책 표지 전용 폰트

사용자 결정(2026-10-05): 새 표지 제목은 **TangoBook Story Hand** 손글씨체를 우선 사용한다. 명작·전래·자연관찰·생활동화의 기본 조형을 공유하고, 책의 그림/색에 맞춰 글자 안쪽 색·테두리색/두께를 조절한다. 색·배경은 폰트에 고정하지 않는다.

## 적용 순서

2026-10-06 사용자 정정으로 **일부 제목용 시험판을 완성 목표로 삼지 않는다**. 새 라이브러리 구현은 `TangoBook Story Hand Global 0.4.0`의 전체 지원 범위를 사용한다. 한글 현대 음절11,172자와 자모는 자체 둥근 획 조합으로 확장했고, 기존 전용 라틴 글자를 보존했다. 부족한 라틴/중국어/일본어/태국어 글리프는 공식 Noto OFL 원본을 출처·SHA·라이선스와 함께 통합했다. 모든 문자권을 독점적으로 새 디자인한 서체라는 뜻은 아니다.

0.4.0 로컬 웹자산은 `packages/client/public/fonts/tangobook-story-hand/0.4.0/`에 있고, `manifest.json`에 정확한 전체 codepoints/93개 WOFF2 SHA/원본 출처가 있다. 한국어·영어·일본어·중국어·스페인어·프랑스어·독일어·베트남어·태국어·말레이어·인도네시아어의 일반 문자 범위, 실제1215권2415개 제목의 누락0 및 HarfBuzz notdef0을 검증했다. 고대 문자/모든 희귀 Unicode/이모지의 보편 지원을 주장하지 않는다. 전체 지원을 유지하면서 자주 쓰는 제목 shard와 나머지 Unicode shard를 나눠 필요한 파일만 받는다.

11언어 실제 웹폰트 큰/작은 크기 화면과 라이브러리 언어 전환 검수는 [최신 작업 기록](work/authoring/tasks/20261006-library-cover-titles.md)에 있다. 앱에서 제공하지 않는 제목 번역은 한국어로 돌아가며, 글꼴 지원 확대를 새 번역 생성으로 보고하지 않는다. 현재 일반 학습자 언어 선택 UI는5언어이고 등록 글꼴 범위11언어와 구분한다. 기존0.1/0.2 및 운영 등록 기록은 아래에 보존한다. 0.4.0 코드 main push/운영 배포는 아직 하지 않았다.

1. 새 라이브러리는 **TangoBook Story Hand Global 0.4.0**을 사용한다. 제목을 NFC로 정규화하고 manifest의 codepoints와 대조한다. 기존0.2는 보존된 시험 기록이다.
2. 제목의 모든 글자가 있으면 전용 폰트를 사용한다. 없는 글자가 있으면 해당 글리프를 제작/검수해 지원 범위를 늘린 뒤 사용한다. 누락 글자를 시스템 fallback으로 자동 섞어 완성본으로 취급하지 않는다. 명시적으로 출처를 기록한0.4.0 호환 글리프 통합과 누락 fallback은 구분한다.
3. 클린 표지 위에 별도 텍스트 레이어로 배치한다. 기존 제목을 가리려고 단색 제목 띠를 추가하지 않는다. 클린 원본이 없으면 제목 제거/클린 표지 확보를 먼저 한다.
4. 전체 제목을 실제 출력해 자간·작은 화면 가독성·겹침을 확인한다. 베트남어 성조와 태국어 위 기호는 HarfBuzz 등 OpenType shaping을 지원하는 렌더러로 배치한다.

## 파일과 지원 범위

- [원본·빌드·검증·사용법](../assets/fonts/tangobook-story-hand/README.md)
- [v0.2 정확한 지원 글자](../assets/fonts/tangobook-story-hand/dist-asian/coverage.json): Unicode 299개. 한국어 24음절, 일본어·중국어·태국어는 시험 제목 일부 글자. 베트남어 성조 대소문자와 영문/말레이어/인도네시아어 라틴 글자를 포함한다. **전체 문자권 완성본이 아니다.**
- [v0.2 입력 미리보기](../assets/fonts/tangobook-story-hand/preview-asian.html)
- v0.1/0.2는 기존 시험 기록으로 보존한다. 새 작업은0.4.0 manifest의 전체 지원 범위를 확인한다.

폰트 파일은 R2 `fonts/tangobook-story-hand/{version}/`에 버전별로 저장한다. 운영 DB `public.cover_font_assets`에는 가족/버전·다운로드 주소·SHA256·coverage·제한 사항을 기록한다. CDN 파일과 DB 정보가 일치하는지 확인하고 사용한다. 등록 스크립트는 [publish-cover-fonts.mjs](../scripts/publish-cover-fonts.mjs), 테이블 정의는 [마이그레이션](../supabase/migrations/2026-10-05-cover-font-assets.sql).

2026-10-05 운영 등록 완료: v0.1.0/v0.2.0 두 행, v0.2.0 preferred=true. [CDN 등록 목록](https://assets.tangobook.co.kr/fonts/tangobook-story-hand/registry-20261005.json)과 [v0.2 TTF](https://assets.tangobook.co.kr/fonts/tangobook-story-hand/0.2.0/TangoBookStoryHand-AsianTrial-Regular.ttf)/[WOFF2](https://assets.tangobook.co.kr/fonts/tangobook-story-hand/0.2.0/TangoBookStoryHand-AsianTrial-Regular.woff2)를 사용한다. 9개 CDN 파일을 로컬 SHA256과 대조했다. 테이블은 RLS/관리자 접근만 허용하며 일반 학습자 계정에서 직접 조회하는 UI는 구현하지 않았다.

이 지침은 새 표지 제작의 기본 서체 선택이다. 기존 운영 표지를 일괄 교체하거나 제품 편집기의 폰트 선택 UI를 구현한 것은 아니다. 샘플 밖 문자, 네이티브 조형 검수·추가 범위 제작은 [작업 기록](work/authoring/tasks/20261005-cover-font.md)에 남긴다.
