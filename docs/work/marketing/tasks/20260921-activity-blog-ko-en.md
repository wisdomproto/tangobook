# 자체 블로그 활동 글 한글·영문 작성

- id: 20260921-marketing-activity-blog-ko-en
- domain: marketing
- status: complete
- updated: 2026-09-21
- branch: main
- worktree: C:/projects/tangobook
- delivery: 자체 블로그 한글·영문 6편 동시 공개

## 요청

색칠공부, 숨은그림찾기, 한글·영어 블록 활동을 소개하는 자체 블로그 글을 한국어와 영어로 작성한다.

## 범위와 근거

- 색칠공부: 온라인·인쇄 활동과 완성 뒤 낱말 소리 및 이야기 장면으로 이어지는 실제 흐름을 기준으로 쓴다.
- 숨은그림찾기: 모든 책이 아니라 준비된 장면이 있는 지원 도서에서만 제공된다는 점을 명시한다.
- 블록 놀이: 한글·영어 화면 블록과 실물 블록 카메라 모드를 실제 경로에 맞춰 소개한다.
- 각 주제는 한국어·영어 한 편씩, 총 6편이다. 언어 쌍은 같은 slug를 사용한다.
- `activity:*` 메모를 사용하여 숫자 storybook CTA나 존재하지 않는 책 링크가 생기지 않게 한다.

## 완료 내용

- 색칠공부, 숨은그림찾기, 블록 놀이 각각 한국어·영어 원고를 작성했다. 각 원고는 7카드이며 첫 이미지, 실천 방법, FAQ, 활동 CTA를 포함한다.
- 활동 원고 전용 멱등 시더 `seed-marketing-activity-blogs.mjs`를 추가했다. `activity:*` 메모로 콘텐츠와 기본글을 만들고 한영 자체 블로그를 함께 갱신한다.
- 2026-09-21 운영 DB에 콘텐츠 3건과 자체 블로그 6편을 시딩했다. 저작 행은 기존 규칙대로 `draft`를 유지하고 블로그별 카드는 7개다.
- 사용자 확인에 따라 순차 예약 없이 한국어 3편·영어 3편의 `self_hosted` 발행 기록 6건을 `2026-09-21T03:21:22.299Z`에 동시에 만들었다.

## 검증

- `node --check packages/server/scripts/seed-marketing-activity-blogs.mjs`
- `node packages/server/scripts/seed-marketing-activity-blogs.mjs --all --dry-run`
- 이미지 8개와 CTA 3개를 HTTP HEAD로 확인했다. 최초 숨은그림 공 이미지의 영문 파일명이 404여서 실제 한글 파일명 URL로 수정했고 재검사 200을 확인했다.
- DB 역조회: `activity:*` 콘텐츠 3건, ko/en 블로그 6건, 각 7카드, `self_hosted` published record 6건.
- 공개 API 목록에서 ko/en 각각 새 글 3편을 확인했다. 6개 상세 API 모두 HTTP 200, 카드 7개, `category=activity`, `storybookId=null`이다.
- 실제 한국어·영어 공개 URL 6개도 HTTP 200을 확인했다.

## 공개 URL

- 한국어: `/blog/hidden-object-reading-activity`, `/blog/kids-coloring-vocabulary-activity`, `/blog/korean-english-block-phonics`
- 영어: `/en/blog/hidden-object-reading-activity`, `/en/blog/kids-coloring-vocabulary-activity`, `/en/blog/korean-english-block-phonics`

활동 카테고리 전용 필터·배지는 아직 없지만 전체 목록과 상세 글 노출에는 영향이 없다. 필요하면 별도 제품 변경으로 추가한다.
