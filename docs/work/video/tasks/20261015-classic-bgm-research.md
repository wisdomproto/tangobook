# 명작동화 Suno 배경음악 조사

- id: 20261015-video-classic-bgm-research
- domain: video
- status: ready
- updated: 2026-10-15
- base: b14e8dc12
- branch: codex/video-classic-bgm-plan
- worktree: C:/Users/101024/.codex/worktrees/classic-bgm-plan/tangobook
- integration: main 미통합
- delivery: 조사·제작 설계 완료, 음원 미생성·미푸시·미배포

## 요청과 범위

사용자는 동화책 읽기의 공용 BGM을 개선해 Suno로 명작부터 한 작품씩 만들고 싶다고 했다. 시작·위기·클라이맥스·해소를 구분하되 모든 장면·모든 작품을 개별 음악으로 만들 필요는 없으며, 먼저 명작 조사를 요청했다. 이번 결과는 조사와 음악 제작 설계다. 한글 3샘플 효과음 작업과 다른 작업으로 분리했다.

## 읽은 근거

공통 인수인계·영역 지도, PLATFORM, video/reading/content BRIEF와 MEMORY, viewer CLAUDE 및 실제 ViewerContainer/useAudioPlayer/shared 타입, 기존 콘텐츠 현황판, video PRODUCTION-QUEUE를 읽었다. 최신 fetch origin/main b14e8dc12에서 별도 worktree를 만들고 기존 미커밋·다른 영상 작업을 보존했다. 제품 원칙 변경이 아닌 제안이므로 PLATFORM/STRATEGY를 확정안으로 고치지 않는다.

agent-reach 스킬의 doctor로 Exa 미설정/Jina 사용 가능 확인. Jina Reader와 웹 도구로 Suno 공식 Custom/Instrumental·Song Editor·상업 이용 안내를 확인했다. agent-reach 1.5.0 최신 확인. 로그인·계정 플랜·크레딧 확인이나 음악 생성은 수행하지 않았다.

## 조사와 결정

2026-10-12 보유 목록의 세계 명작 144개 책을 2026-10-15 R2 GetObject로 다시 읽음, 실패 0. 48작품×3그림체·작품별 본문 SHA 일치. BGM은 12개 URL·최다 18작품/54레코드 공유. URL 수이며 바이너리 동등성·기존 음악 청취는 미검증이다. 새 전체 목록을 발견한 조사는 아니다.

8분위기군×4역할=32채택곡 제안, 48작품 쪽수·본문 근거·예외·우선순위·32개 Suno 프롬프트 준비. 첫 후보는 아기 돼지 삼형제의 B 4곡이다. 음악군/순서/수량은 사용자 확정 전 제안이며 대량 생성하지 않는다. 인어 공주·피리 부는 사나이 마지막은 H를 빌린다. 플란다스/성냥갑 병정의 밝은 각색, 인어/성냥팔이/행복한 왕자의 이별을 확인했다.

## 결과물·검증

[보고서와 재개 안내](../../../audio/classic-bgm-20261015/README.md), [HTML](../../../audio/classic-bgm-20261015/index.html), survey.json/suno-prompts.json, 조사·HTML 생성 스크립트. 144→48→8×4 집계·본문 일치·모든 페이지 배정 중복/누락 검사. JS 구문·브라우저 검색(인어1)·필터(B7)·H 정점 프롬프트의 비승리 내용 확인. 모바일 390×844 요청 뷰포트·기본 데스크톱에서 페이지 가로 넘침 없음 확인. 모바일 첫 제작 카드의 밝은 배경/밝은 글자 충돌을 수정하고 다시 육안 검수했다. 프롬프트 초기 B/시작으로 복원, preview.png 저장.

원격 쓰기/게시/앱 구현/승인 영상 음악 수정 없음. 로컬 증거 D:/tangobook-video/classic-bgm-20261015. 음악 생성·사람 청취·앱의 cue 재생은 미수행이다. 현재 플레이어는 단일곡 loop라 음원만 만들면 장면별 전환이 되지 않는다.

## 다음 행동

사용자 후속 지시에 맞춰 Suno의 실제 사용 가능한 계정·생성 경로를 확인하고 아기 돼지 삼형제 4역할을 한 작품 단위로 제작·낭독 혼합 검수한다. 사용자가 첫 작품을 바꾸면 그 지시가 우선이다. 이후 확정한 음원을 페이지 cue·크로스페이드에 연결하는 구현은 별도 진행한다. 기존 한글 3샘플/다른 작품 승인본을 덮어쓰지 않는다.
