# 퐁이29 본문·장면 색칠 교체

- id: 20261013-pongi29-character-repair
- status: ready
- domain: content
- branch: codex/library-content-audit
- delivery: 운영 삽화·도안 교체 완료, 코드·카탈로그 로컬 커밋. 이번 main push 미요청

사용자: 퐁이29 기존 본문 캐릭터 오류와 그 기반 장면 색칠 수정. 운영 10쪽 실제 본문/scene를 읽고, pongi-plan의 실제 캐스트 시트(Pongi/Dad/Baby)와 기존 승인 삽화를 참조한다. Pongi 붉은 목끈·Dad 흙색 멜빵바지·Baby 조개/무목끈 규격. 이전 숨은그림 native 후보에도 성인 목끈 오류가 보이므로 올바른 새 본문 그림으로 함께 갱신한다. 본문/번역/TTS/어휘/공개 상태 보존. 장면 색칠4·8쪽 두 장 교체, 버전URL과 색 출처를 동기화한다. raw 원본은 generated-images/pongi29-repair-20261013에 보존하며 비밀값/전체책 원본은 커밋하지 않는다.

## 진행

- 본문10쪽 native GPT 생성·쪽별 육안 검수·1024x576 WebP 운영 등록. 본문/영문 번역/TTS/표지/어휘 등 보호 필드 저장 후 대조. pongi-29 작업판 canonical p1~p10도 동일 이미지로 교체/CDN SHA 검증.
- 숨은그림 이전 별도 이미지의 성인 붉은 목끈 오류를 새 본문5쪽으로 교체. 물고기/조개 새 좌표 검수, 영어 실제 게임2/2·결과 유지·재시작 초기화 확인.
- 색칠4/8쪽 첫 도안은 가는 목끈과 Baby 배 일부가 최소 칸 면적/열린 경계 때문에 빠짐. 두 번째8쪽 후보는 Pongi에 멜빵을 추가하여 기각. 최종 단순 배경·넓은 목끈·Baby 배 폐영역 도안과 정렬 색 답안을 생성·검수·게시 완료. 실제 본문 삽화와 색 출처를 분리하여 완료 리빌은 운영 원본을 사용한다.
- 운영 원고와 기존 plan HTML의 과거 안전 먹기 수정 문구는 서로 다름. 이번 작업은 운영 본문/SCENE 기준 이미지 교체만 하며 어느 쪽 텍스트도 덮지 않음.

## 최종 결과/검증

- 본문10장: 1024x576 WebP, Pongi/Dad/Baby 실제 cast3장 첨부하여 native GPT 생성·전쪽 육안 대조. 붉은 목끈은 Pongi만, Dad 흙색 멜빵, Baby 조개/무목끈, 수달 종/비율 유지. 운영 및 plan canonical URL 총20업로드 CDN SHA 일치.
- 장면 도안2장+색 답안2장: 800x450 PNG, 흑백 coloredPixels0. 기존 도안 좌표에 색을 읽으면 작은 목끈/발/배 일부가 빠져 해당 두 장면만 minRegionAreaRatio=0.001로 검수 지정. 기존 나머지 장면/낱말의 기본0.003 변경 없음.4쪽 주둥이 경계가 머리와 연결되던 후보도 재생성하여 퐁이/동생 얼굴의 흙색과 짙은 녹색 몸을 분리.
- 동일 ColoringPlayer 실제 붓질4회(p4-ko,p4-en,p8-ko,p8-en), 각 required칸90% 기준 전체 완료/물감7색/초기화/실제 해당 새본문 원본 리빌/해당 KO/EN TTS native ended 확인. 저장 픽셀 검사와 실제 플레이를 구분한다. p4 93칸, p8 85칸, 원본 음성은 생성하지 않고 기존 음원 보존.
- R2 published manifest/gallery/index, 로컬 D: collection/gallery/업로드 ledger, 앱 catalog 두 항목을 동기화. 신규 버전 파일로 게시, 다른2428도안 행과 다른1214책 앱 catalog 동일. 기존 다른 원본 리빌은 변경하지 않도록 revealOriginalUrl 명시 opt-in만 앱으로 전달.
- 숨은그림 p5 fish/shell 정확한 좌표 및 영어2/2·완료·초기화 검증. 별도 숨은그림7장 생성 이력 중 퐁이29는 이번에 본문 재사용으로 교체, 과거 숫자는 당시 기록.
- client typecheck와 장면 연결/영역12개 테스트 통과. 변경 TS/TSX ESLint 통과. client build 통과(기존 Browserslist/i18n 동적 import/lottie eval/큰 번들 경고 유지).
- 본문/번역/모든 TTS/표지/어휘/공개 상태 보호 필드 저장 후 대조. 새로운 번역/TTS 생성 없음. 다른 미추적 작업 파일 보존.

[공개 자산/해시/좌표](20261013-pongi29-assets.json). 생성 프롬프트 및 선정10장/도안·색 답안은 generated-images/pongi29-repair-20261013에 있다. raw API 책 스냅샷/native 후보/브라우저 private 증거는 커밋 제외.

재현: scripts/repair-pongi29-pages.mjs(guarded/resumable), repair-pongi29-coloring.mjs(정확히 두 쪽/다른 manifest 행 보존), check-pongi29-coloring-browser.mjs(임시 로컬 harness 생성/정리, 기존 코드와 동일 Player), check-pongi29-hidden-browser.mjs. 로컬 Vite5198 API_TARGET 운영 연결만 사용했고 Express 서버/발행 스케줄러는 시작하지 않았다.

운영 본문/자산은 반영되었으며, 새 도안 catalog·리빌/작은칸 옵션 코드의 운영 앱 반영에는 추후 main push가 필요하다. 현재 요청에는 main push가 없으므로 로컬 커밋만 한다.

최종 독자 경로 확인: 실제 어휘→동화 내용 놀이→장면 색칠 메뉴에서 새 R2 도안/색 답안을 프록시로 읽고 7물감(붉은 목끈 포함) 표시·실제 붓질/다시 초기화 확인. 프리뷰 갤러리의 원본 칸도 정렬 답안 대신 명시 승인 본문을 표시하도록 해당2장만 opt-in.
