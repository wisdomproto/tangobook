# 동화책 표지 전용 폰트

사용자 결정(2026-10-05): 새 표지 제목은 **TangoBook Story Hand** 손글씨체를 우선 사용한다. 명작·전래·자연관찰·생활동화의 기본 조형을 공유하고, 책의 그림/색에 맞춰 글자 안쪽 색·테두리색/두께를 조절한다. 색·배경은 폰트에 고정하지 않는다.

## 적용 순서

1. 현재 권장 버전은 **TangoBook Story Hand Asian Trial 0.2**. 제목을 NFC로 정규화하고 `coverage.json`의 codepoints와 대조한다.
2. 제목의 모든 글자가 있으면 전용 폰트를 사용한다. 없는 글자가 있으면 해당 글리프를 제작/검수해 지원 범위를 늘린 뒤 사용한다. 누락 글자를 다른 서체로 자동 섞어 완성본으로 취급하지 않는다.
3. 클린 표지 위에 별도 텍스트 레이어로 배치한다. 기존 제목을 가리려고 단색 제목 띠를 추가하지 않는다. 클린 원본이 없으면 제목 제거/클린 표지 확보를 먼저 한다.
4. 전체 제목을 실제 출력해 자간·작은 화면 가독성·겹침을 확인한다. 베트남어 성조와 태국어 위 기호는 HarfBuzz 등 OpenType shaping을 지원하는 렌더러로 배치한다.

## 파일과 지원 범위

- [원본·빌드·검증·사용법](../assets/fonts/tangobook-story-hand/README.md)
- [v0.2 정확한 지원 글자](../assets/fonts/tangobook-story-hand/dist-asian/coverage.json): Unicode 299개. 한국어 24음절, 일본어·중국어·태국어는 시험 제목 일부 글자. 베트남어 성조 대소문자와 영문/말레이어/인도네시아어 라틴 글자를 포함한다. **전체 문자권 완성본이 아니다.**
- [v0.2 입력 미리보기](../assets/fonts/tangobook-story-hand/preview-asian.html)
- v0.1은 기존 한국어/영어 시험판으로 보존한다. 새 작업은 v0.2 지원 범위를 우선 확인한다.

폰트 파일은 R2 `fonts/tangobook-story-hand/{version}/`에 버전별로 저장한다. 운영 DB `public.cover_font_assets`에는 가족/버전·다운로드 주소·SHA256·coverage·제한 사항을 기록한다. CDN 파일과 DB 정보가 일치하는지 확인하고 사용한다. 등록 스크립트는 [publish-cover-fonts.mjs](../scripts/publish-cover-fonts.mjs), 테이블 정의는 [마이그레이션](../supabase/migrations/2026-10-05-cover-font-assets.sql).

2026-10-05 운영 등록 완료: v0.1.0/v0.2.0 두 행, v0.2.0 preferred=true. [CDN 등록 목록](https://assets.tangobook.co.kr/fonts/tangobook-story-hand/registry-20261005.json)과 [v0.2 TTF](https://assets.tangobook.co.kr/fonts/tangobook-story-hand/0.2.0/TangoBookStoryHand-AsianTrial-Regular.ttf)/[WOFF2](https://assets.tangobook.co.kr/fonts/tangobook-story-hand/0.2.0/TangoBookStoryHand-AsianTrial-Regular.woff2)를 사용한다. 9개 CDN 파일을 로컬 SHA256과 대조했다. 테이블은 RLS/관리자 접근만 허용하며 일반 학습자 계정에서 직접 조회하는 UI는 구현하지 않았다.

이 지침은 새 표지 제작의 기본 서체 선택이다. 기존 운영 표지를 일괄 교체하거나 제품 편집기의 폰트 선택 UI를 구현한 것은 아니다. 샘플 밖 문자, 네이티브 조형 검수·추가 범위 제작은 [작업 기록](work/authoring/tasks/20261005-cover-font.md)에 남긴다.
