# 운영 페이지 로딩·이미지·캐시·게이트 점검

- id: 20261017-platform-loading-assets-audit
- domain: platform
- status: complete
- updated: 2026-10-17
- base: de7a674ef (로컬 main), 운영11c10b489
- branch: main
- worktree: C:/project/tangobook
- integration: 검수 기록만 로컬 main 커밋
- delivery: 새 제품 변경·push·배포 없음

## 요청과 완료 조건

한영 주요 페이지 로딩 속도와 최근 만든 이미지의 WebP 여부를 확인한다. 사용자 후속 강조: 페이지마다 이미지를 새로 받는다고 가정하지 않는다. 기존 캐시와 사전 로딩 게이트를 전제로 첫 준비/재진입/뒤에서 준비하는 장면 자산을 구분한다. 캐시·학습 기록을 지우거나 게이트를 제거하는 요청이 아니다.

## 읽은 기억과 변경 범위

handoff/phonics/platform 기억, phonics-all-performance·모드 그림·상호작용 점검 기록, 루트 CLAUDE의 lazy 번들/캐시, design-system, 게임·학습자 CLAUDE를 참조했다. sw.js/asset-cache.ts, useGamePrefetch/useGameAssetPreload/PhonicsGameGate/GameLoadingGate와 서버 app.ts 정적 헤더를 읽었다. 제품 코드/운영 자산을 수정하지 않았다.

## 이미지 검사

- Git의2026-10-12 이후 추가/수정된 tracked public/src-assets 래스터 **51장 모두 실제 WebP**다. 확장자뿐 아니라 RIFF/WEBP 매직과 Sharp metadata를 확인했다. 합3,559,560B(3.39MiB), 최대282,052B(지도 배경1440×960). 이 합계를 매 페이지 전송량으로 해석하지 않는다.
- 현재 tracked 이미지 전체327파일을 metadata로 열었고 실패0. 새 이미지의 PNG/JPEG 위장·형식 불일치0. 모드 그림은96,040/107,068B, 주요 아이콘 atlas193,346B다. SVG/코드 벡터는 래스터 변환 대상이 아니다.
- 기존 library-hero-1.png3,749,937B, library-banner/nature.webp930,058B 등 큰 옛 파일도 있지만 현재 frontend src/index의 참조 검색 결과 없고 점검 화면 자산 목록에서도 사용되지 않았다. 저장소에 존재한다는 이유로 현재 로딩 병목이라고 단정하거나 삭제하지 않았다.
- 실제 한글 지도 자산 inventory에는 현재3권의 story-bridge.webp만 관측됐다. 다섯 배경/신규51장을 한 번에 받는 구조로 관찰되지 않았다. 홈 표지는 assets 도메인의512px WebP 썸네일을 쓴다.

## 캐시·사전 준비 계약

- 운영 같은 출처 `/images/...` 응답: `public, max-age=604800`(7일), image/webp. 해시 `/assets/index-CKwMAARV.js`:1년 immutable. 운영 표지 `assets.tangobook.co.kr/thumbs/512/...webp`:1년 immutable.
- 동일 ETag로 curl 조건부 GET을 했을 때 모드 이미지/표지/JS **모두304·본문0B**였다. Node fetch에 조건부 헤더를 넣으면 no-cache 재검증 동작 때문에200이 나오는 도구 차이를 배제했다. 이 진단 HTTP 요청은 브라우저 캐시를 사용하지 않는 별도 실험이다.
- sw.js는 운영 같은 출처 이미지/아이콘/효과음에 cache-first, HIT면 네트워크 fetch하지 않는다. 외부 opaque 응답은 실패 응답 영구 보존을 막기 위해 SW에 넣지 않고 HTTP/CDN 캐시에 맡긴다. HTML/API는 갱신이 필요하고 JS/CSS는 해시 HTTP 캐시를 쓴다. Range 미디어 요청도 SW가 가로채지 않는다. **모든 요청 행=이미지 원본 재다운로드가 아니다.**
- 게임 게이트는 이번 판 이미지·정답 음원·필요한 음절을 준비한다.250ms보다 짧으면 진행 UI를 숨기고6초는 상한이지 고정 대기가 아니다. 동화 장면 그림/낭독은 게이트를 막지 않는 background 워밍이다.
- warmed 플래그만 보고 준비됐다고 건너뛰지 않는 현재 동작을 유지한다. 실제 캐시는 퇴거될 수 있으므로 실제 media load 준비를 확인하고, 이미 받은 바이트는 HTTP 캐시를 재사용한다. 새 Image/Audio 객체 생성이나 onload 대기가 곧 바이트 재다운로드는 아니다.

## 실제 브라우저 관측

운영 IAB1280×720·현재 네트워크·기존 로그인/테스트 프로필·캐시 유지. 별도 탭에서 navigation/reload 시작→화면별 주요 DOM(지도 목록/쓰기 canvas/낱말 개요/블록 트레이/추천 도서)이 보일 때까지의 외부 시계 관측30표본이다. 도구 비용이 포함되며 LCP/INP/TTI나 완전 콜드/4G 수치가 아니다. 일반 페이지와 게임의 준비 게이트 이후 플레이어 표시를 분리했다. 학습 완료/정답 입력은 하지 않았다.

| 화면 | 관측 준비 시간 | 표본 |
| --- | --- | --- |
| 홈(추천 도서 포함) | 0.54~0.72초 | 3 |
| 한영 모드 선택 | 0.38~0.52초 | 각2 |
| 한영 지도 | 0.33~0.56초 | 한3/영2 |
| 한영 자유놀이 입구 | 0.36~0.60초 | 각2 |
| ㄱ/G 쓰기 canvas | 0.50/0.77초 | 각1 |
| 한영 낱말 만나기 | 0.67/0.72초 | 각1 |
| 홈 한글 블록 플레이어 | 0.92초 | 1 |
| 한글 자유 블록(버튼→판) | 1.47초 | 1 |
| 한글 자유 블록 재진입 | 2.08~2.44초 | 2 |
| 영어 자유 블록 재진입 | 1.07~1.30초 | 2 |
| 동화책 목록 | 1.10~1.31초 | 2 |
| 신데렐라 상세 | 0.47~1.03초 | 2 |

- 노출 중인 img의 깨진 이미지0. 홈 블록 첫 표시 시 이미지1개는 아직 pending이었고 이후 실제 호수 삽화 표시를 확인했다. CSS 배경 디코드/모든 화면 밖 이미지 완료까지를 위 준비 시간이라고 주장하지 않는다.
- 별도 홈→한글 모드 SPA 클릭 관측334ms. 표의 nav/reload와 같은 표본으로 섞지 않았다. 영어 블록 최초 클릭 뒤 profile/내용 준비 중 disabled 상태를 보았지만 두 도구 호출 사이 공백이 있어 최초 정확한 시간 표본으로 포함하지 않았다.
- 목록은 첫 표지 준비 후 관측시 img21개/자산 이미지26개였다. 화면에 선언된 자산, resource로 관측된 자산, 실제 전송 바이트를 구분한다. 최종 탭 warn/error 로그0.

## HTTP·자동 검증

- 운영13개 엔드포인트×3회, 동시 최대3의 소량 진단. 모두200. 새 브라우저 HTTP 캐시/부하 시험이 아니며 curl은 매 요청 독립적으로 전송한다.
- HTML `/library` 중간 전체256ms, `/api/storybooks`401ms/전송115,952B, 단원 JSON394~419ms/5~8KB, stroke 라이브러리366~418ms. 새 모드 이미지361~374ms, 지도 배경440ms. 단원/라이브러리 최초1회가752ms까지 간 표본도 있다.
- 운영 entry JS는 디코드1,084,797B, 별도 압축 HTTP 전송321,324B/568ms. 실제 첫 방문 네트워크·저사양 CPU 최적화 여지는 있으나 이번 캐시 유지 관측만으로 chunk를 무조건 변경하지 않는다.
- `useGameAssetPreload.test.ts`·`collect-game-assets.test.ts`:2파일21검사 통과. 제품 변경 없으므로 전체 build/typecheck를 반복하지 않았다. 문서 경로/diff check 확인.
- 로컬 `output/loading-audit-20261017/`: image-audit.json(327메타), http-probes.json(39요청), cache-probes.json, browser-ready.json(30표본), home/map/books 자산 inventory, home-final.png와 재실행용 진단 스크립트. 미추적·커밋 제외, 비밀/세션 토큰을 저장하지 않았다.

## 판단·다음 행동

새 UI 이미지의 WebP 변환 누락·캐시 헤더 누락·매번6초 게이트 대기는 발견하지 않았다. 현재 조건에서 긴 재다운로드를 전제로 자산/게이트를 바꿀 근거는 없다. 추가 최적화를 한다면 한글 블록의1.5~2.4초 준비를 음원 URL 해석/실제 media 준비/API 단계로 계측하는 것이 우선이다(현재 병목 위치 확정은 아님).

브라우저 HTTP cache 전송 바이트/SW HIT를 DevTools로 직접 계측하거나 캐시 없는 새 프로필·저속망·실기기 시험은 하지 않았다. 기존 사용자 캐시/프로필 데이터를 삭제하지 않았다. 코드/정책과 HTTP 조건부 실험을 실제 브라우저 네트워크0B 증거라고 보고하지 않는다. 새 이미지나 기존 게이트를 바꾸지 않고 기록만 로컬 main에 남긴다.
