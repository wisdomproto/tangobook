# 한글·영어 실물 블록 카메라 인수인계

갱신: 2026-09-21. 기준: `1822d143` (origin/main push 확인).

## 구현 위치

- 인식기: [tango-reco.js](../../packages/client/public/tango-reco.js). 실험실과 앱이 함께 쓰는 유일한 원본.
- 카메라: [useBoardCamera.ts](../../packages/client/src/features/games/hooks/useBoardCamera.ts). 카메라/형판 로드, 250ms 주기, 다수결.
- UI: [BoardCameraPanel.tsx](../../packages/client/src/features/games/components/players/BoardCameraPanel.tsx).
- 게임 연결: [KoreanBlockPlayer.tsx](../../packages/client/src/features/games/components/players/KoreanBlockPlayer.tsx), [EnglishBlockPlayer.tsx](../../packages/client/src/features/games/components/players/EnglishBlockPlayer.tsx)의 「📷 실물 블록」.
- 실험실: [tango-board-3d.html](../../packages/client/public/tango-board-3d.html).
- 장기 진단 기록: [board-vision.md](../../.claude/agents/board-vision.md).
- 앱 편입 설계: [2026-09-17 설계](../superpowers/specs/2026-09-17-in-app-board-camera-block-game-design.md).

과거 메모리의 「HTML 안 인식기를 고친다」는 설명은 분리 전 이야기다. 현재 인식 로직은 JS 파일에서 고친다.

## 입력과 방향

`TangoReco.load({set:'ko'|'en'})` → `grab(video, canvas)` → `read(rgba, W, H)`.
한글과 영어 형판을 분리한다(ㅇ/o, ㅣ/i 혼동).

- `grab()`의 현재 방향은 좌우 거울 한 번, 기본 회전 0이다. 상하 뒤집힘을 수학적 추측으로 추가하지 않는다.
- `p*.jpg` 전송 이미지는 이미 좌우 반전된 사본이다. 앱 경로 재생에서는 먼저 한 번 되돌리고 `grab()`에 넣는다.
- 카메라 width와 height를 함께 강제하면 세로 영상이 잘릴 수 있다. 현재 카메라 제약과 입력 비율을 보존한다.
- 긴 변 기준 `TUNE.detW`로 처리한다. 사진 리사이즈는 실제 카메라 파이프라인과 동등한 증거가 아니다.
- 임계값 변경은 장면/카드 자체의 색·칸 크기·비율을 기준으로 검증한다. 하나의 실패 사진에 고정값을 맞추지 않는다.

## 보내기 버튼과 R2

목록: `GET /api/comic-assets/tango-frames` (호스트 `https://www.tangobook.co.kr`).
실제 저장 경로: `comic-assets/tango-frames/`.

- `p<timestamp>.jpg`: 원본 카메라 캡처.
- `s<timestamp>.jpg`: 진단 이미지.
- 보내기는 동영상 업로드가 아니다. 영상이라고 불러도 이 경로에서는 정지 프레임 두 장이다.
- 일부 자산 요청은 User-Agent가 없으면 403이 나므로 일반 UA를 보낸다. 자격증명은 문서에 넣지 않는다.

## 2026-09-21 수정과 검증

기존 `cv.RETR_EXTERNAL`은 흰 판 안쪽의 카드 윤곽을 놓쳐 회전 사각형 측정이 축 정렬 상자로 폴백했다.
`cv.RETR_LIST`로 중첩 윤곽을 받고, 연결성분별 가장 큰 윤곽을 사용하게 수정했다. 면적/비율 문턱을 느슨하게 만든 수정이 아니다.

| 입력 키 (한국 시간) | 수정 전 | 수정 후 |
|---|---|---|
| `p1789951690972` (09:48:10) | 카드 7 / 자모 7 / `댲굽` | 카드 8 / 자모 8 / `댲굽바` |
| `p1789951473662` (09:44:33) | 카드 7 / 자모 6 / 버림 1 / `댜굽` | 동일, 미해결 |

원본 대비표: 수정 전 `edb40a3c`의 JS, 수정 후 `1822d143`의 JS. 동일 형판과 JPEG를 같은 앱 경로 하네스에서 각각 실행했다.
각 버전의 한글/영어 세션을 새로 만들고, 각 이미지에서 `grab()` 후 `read()`를 3회 실행해 마지막 결과를 비교했다.
`node --check`도 통과했다.

기존 표본 13장(낱말·카드 수·자모 수·버림 수 모두 전/후 불변):

| set | 원본 키 | 낱말 |
|---|---|---|
| ko | p1789522984289 | 달비뮤쟝 |
| ko | p1789523578133 | 날비휴쟝 |
| ko | p1789528948076 | 표푸 |
| ko | p1789536308487 | 마 |
| ko | p1789536996082 | 티뷰 |
| ko | p1789537056751 | 비 |
| ko | p1789537209150 | 트뷰 |
| ko | p1789537312182 | 비 |
| ko | p1789537394358 | 빈 결과 (기존 실패) |
| ko | p1789537411873 | 훞빔걓 |
| ko | p1789558765700 | 훞빔걑 |
| en | p1789529709193 | qpaeo wsnvx rzyi |
| en | p1789533156300 | tbqjf evsik ualpr |

이 표는 정답 라벨을 새로 확정한 표가 아니라 회귀 비교 결과다. 획 블록 전체 표본과 실기기는 이번에 검증하지 않았다.

## 로컬 재현 자료

이번 하네스/로그: `C:/Users/101024/AppData/Local/Temp/tangobook-white-board-review/`.
`verify.mjs`, `check.mjs`, `verification-meta.json`, `verified-orig.txt`, `verified-fix.txt`가 있다.
임시 디렉터리이므로 없어질 수 있고, verify.mjs는 당시 작업 경로에 의존한다. 새 환경에서 그대로 실행 가능하다고 가정하지 않는다.

재현할 때는 위 R2 키로 입력을 받고, 비교할 Git 버전의 JS와 함께
`tango-lego.pieces.json`, `tango-lego.masks.json`, `tango-sticker-ko.json`, `tango-sticker-en.json`을 별도 시험 폴더에 둔다.
서버 전체/발행 스케줄러를 띄울 필요 없이 정적 테스트 페이지에서 `TangoReco.load/grab/read`를 호출하면 된다.
운영 데이터에 POST/DELETE하지 않는다. 파일 해시·커밋·형판 집합·이미지 크기를 기록한다.

## 남은 일

1. 09:44 프레임의 카드 누락/글자 거절을 각각 진단한다. 같은 흰색 판이라고 전부 같은 원인이라 단정하지 않는다.
2. 운영에 실제로 `1822d143`이 배포됐는지 확인한 뒤, 폰/태블릿 연속 인식·지연·흔들림을 확인한다.
3. 저장된 사진 비교를 카메라 실시간 검증으로 보고하지 않는다. 이전 진단 이미지의 빈 `판색`/`문턱` 표시로 낱말 조합 실패를 단정했던 설명은 이번 실행 결과로 정정했다.
