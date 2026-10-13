# 한글·영어 동화 독후활동 보완

- id: 20261013-all-book-activity-completion
- status: complete
- domain: games
- branch: codex/library-content-audit
- delivery: 운영 콘텐츠 등록 완료, 코드·카탈로그 로컬 커밋. 이번 main push 미요청.

사용자 요청: 보완 전체, 어휘 삽화 색칠공부·동화 장면 색칠공부·숨은그림찾기를 각각 제공한다. 12지신 제외, 파닉스95권 별도, 일반 동화1215권(창작850권 포함)을 검사했다.

## 결과

- 창작850권3957어휘 영어 이름을 문맥별 검토·등록하고 어휘 DB sync. 나비(고양이 Nabi), 잠자리(bed/dragonfly), 집게(clothespin/claw), 방울(drop/bubble/bell)을 구분했다. 붕23의 목재와 메이06 가위바위보 손모양은 승인 본문 참조 native GPT 생성으로 어휘 그림·영문 이름·색칠3종 교체.
- 어휘 색칠 신규41연결38도안: 백로/앵무새23연결20종 + 추가 자연/동물/구둣방18종. 실제 어휘 이미지 참조 native GPT 생성, 분할500px, 육안 검수·폐영역 검사38종 최소2영역·흑백 검사 통과. 구둣방 분리 사본2권도 parent 연결로 해결. 기존 공유 도안을 다른 뜻으로 덮지 않았다.
- 숨은그림 누락930권 모두 검수·등록·저장 후 보호 필드 대조. 승인 본문 재사용923장, native GPT 새 장면7장. 기존285권 보존. 실제 대상·정규화 좌표 오버레이를 육안 검토하고 잘못된 위치/개체 수정. [등록 manifest](20261013-hidden-object-manifest.json)는 책 ID·공개 URL·좌표·검수 상태만 저장한다.
- 장면 색칠 기존1215권2430장은 유지했다. 독자 학습 화면 ‘동화 내용 놀이’에 별도 장면 색칠 버튼을 연결했다. 가벼운 책/언어 색인만 먼저 받고 전체 도안 catalog는 게임을 열 때 받는다. editor2와 동일 ColoringPlayer·현재 본문/번역/음원을 사용한다.
- 실제 페이지의 legacy page_number 때문에 영어 장면이 비던 문제, 공개 이미지의 CORS 때문에 canvas가 비던 문제를 해결했다. 도안/색 출처는 버전을 유지한 R2 프록시를 사용한다.
- hotspot.labels {ko,en}으로 장면 전용 대상 지원. 어휘 한 개 책에도 원래 어휘 목록을 늘리지 않고 두 대상 이상 제공. 영어 게임에는 한국어 기본 음원을 연결하지 않는다.

## 최종 검사와 한계

D:/tangobook-inventory/20261013-activities-complete: R2 전수 수집1310권 실패0, 뒤이어 등록한 두 의미 수정 책을 fresh GET하고24자산은 업로드 SHA·CDN SHA로 보충했다. library-content-audit.json 재생성. 일반1215권 한글/영어 본문 TTS·삽화 파일 누락/깨진 경로0, 숨은그림 KO/EN1215/1215. 단어 숨김 생활동화45권 제외1170권 어휘별 도안 누락0. 장면 색칠 KO/EN1215권2430장 연결.

Puppeteer 실제 개발 브라우저: 영어 밤이01 및 장면 전용 대상 브루노15 숨은그림 정답2/2·결과 유지·재시작 초기화 확인. 백로 신규 단어 색칠, 영어 브루노15 장면 색칠의 실제 붓질로 canvas 변경·초기화 복원 확인. 이는 대표 플레이 검증이며2430장 전체 색감/자연 완료 검수나 음성 청취 증거가 아니다. 기존 장면 색칠의 색감 검수 상태는 별도 20261001 task에 따른다.

퐁이29 기존 본문10장에는 다른 책 토끼/곰이 등장하는 품질 문제가 남아 있다. 이번에는 숨은그림용 올바른 퐁이 새 장면을 생성·등록했으며 본문 전체와 그 본문에서 만든 기존 장면 색칠은 교체하지 않았다. 파일 완비 집계는 그림 내용까지 올바르다는 뜻이 아니다.

타입 검사 shared/server/client 통과, 클라이언트29·서버6테스트 통과, 변경 TS/TSX ESLint 통과. pnpm build 전체 성공(기존 번들 크기·i18n 동적 import·Browserslist 경고 존재). 최종 새 도안41종(신규38+의미수정3) 폐영역/흑백 검사 통과. 카탈로그·UI 변경은 main 배포 전 운영 화면에 반영되지 않는다. main push 요청은 이번 작업에 아직 없다.

## 재현

- collect-library-content.mjs + build-library-content-audit.ts: 기존 전수 검사 경로.
- scripts/build-scene-coloring-book-index.mjs <inventory-directory>: 현재 번역과 legacy 쪽 번호 기준 가벼운 장면 색인 생성.
- scripts/check-activity-word-coloring.mts: 공유 flood-fill 기준 폐영역/흑백 검사.
- scripts/check-activity-browser.mjs, check-scene-only-hidden-browser.mjs, check-new-coloring-browser.mjs, check-scene-coloring-browser.mjs: localhost5198 개발 대표 게임 검증.
- raw 원본/생성물·전체 책 스냅샷은 generated-images/activity-completion-20261013에만 보관, Git 제외. API 등록은 등록 ledger로 재실행 보호하며 기존 숨은그림 덮기 금지.
