# Editor2 영상 자산 관리와 마케팅 등록

- 상태: 로컬 구현·검증 완료. 브랜치 `codex/editor2-video-library`. main push/운영 배포 미요청.
- 요청: Editor2 오디오북 탭 제거, 동영상 제작을 영상 탭으로 교체. 롱폼/숏폼 원본 업로드와 언어별 영상용 자막·나레이션 관리, 마케팅 콘텐츠 등록 버튼.
- 결정: 책 본문/TTS와 별개 영상 제작 자료. R2 원본 파일 한 번 저장, 별도 책 영상 manifest로 관리해 오래 열린 책 저장과 충돌하지 않는다. 언어별 완성 영상도 연결 가능. 수정은 새 버전 보존, 마케팅은 등록 시점의 완성본 링크를 참조한다.
- `/editor` 기존 화면은 보존하고 Editor2에만 새 화면 적용. 사용자의 후속 지시로 기존 오디오북/롱폼 프로젝트와 마케팅 영상 등록은 실제 정리했다. 책 본문·삽화·페이지 TTS, 외부 채널 게시 이력, 새 로컬 완성본은 보존.
- 등록은 동일 제작 버전 재시도에 멱등이며 새 제작 버전은 새 마케팅 기획으로 등록해 과거 발행/예약에 영향 주지 않는다. 등록 자체는 소셜 게시/예약이 아니다.
- Git 확인: 최신 fetch의 origin/main과 로컬 main은 27/14 커밋 갈라짐. 일괄 merge/reset 없이 로컬 작업 이력을 보존한 브랜치에서 구현. 앱 worktree 생성은 ignored 지침 탐색 중 오래 대기해 현재 checkout의 독립 브랜치에서 작업한다.
- 완료: Editor2 영상 관리와 마케팅 등록 구현. 앱 managed worktree는 생성 후 사용하지 않아 보관 처리했고, 실제 변경은 기존 checkout의 작업 브랜치에만 있다.

## 기존 영상 정리 — 사용자 결정 및 실행

사용자가 “기존에 등록되어있는 동영상은 다 지우자”라고 지시했다. 삭제 범위를 반복 확인한 질문에는 “뭔소리야.”라고 답했으므로 기존 영상 자료·마케팅 연결·해당 R2 영상 파일 정리로 처리하고 새 로컬 완성본 보존을 알렸다. 이어 “ㅇ”으로 확인했다.

2026-10-02 실행 및 사후 검증 완료: 책 300권의 `audiobookProjects`/`longformProjects` 제거, 마케팅 롱폼 383행 삭제, 인스타그램 227행의 영상 연결만 제거, 미발행 예약/오래 멈춘 발행 5건을 draft로 전환, 참조된 R2 MP4 1,099개 삭제. 책 300권은 두 영상 필드 외 모든 값을 정리 전 데이터와 deep compare하여 동일함을 확인했다. 인스타그램도 영상 연결·갱신 시각 외 모든 값을 비교하여 동일함을 확인했고, R2 대상 파일 잔존 0개를 확인했다.

명시적 일회성 스크립트 `packages/server/scripts/cleanup-registered-book-videos.ts`: 기본 dry-run으로 스냅샷/계획 저장 → `--apply` 원본 hash/ETag와 DB 갱신 시각 재확인 → `--verify` 정리 결과/나머지 자료 보존 확인. `.env` 값은 출력하거나 기록하지 않는다. 백업과 실행/검증 결과는 `D:/tangobook-video/legacy-video-cleanup-20261002/{plan,result,verification}.json`. 스크립트가 앱/예약 스케줄러를 부팅하지 않는다.

## 구현 및 검증

- R2 `book-videos/{bookId}/index.json` 별도 manifest, UUID 파일 키와 사전 서명 PUT. 최대 2GB, 지원 MIME 확인, 저장 전 R2 HEAD로 크기/형식 및 책 소유 파일 키 확인.
- revision + R2 조건부 PUT(ETag)로 동시 수정 방지. 이전 제작 버전 보존. 충돌 시 현재 초안을 보존하며 사용자가 명시적으로 최신 자료를 다시 불러올 수 있다.
- 마케팅은 버전 기준 결정적 UUID로 콘텐츠/롱폼/숏폼 행 생성. `ignoreDuplicates`로 재시도 시 사용자가 수정한 제목/자막/기획을 덮지 않는다. 언어별 완성본 URL·SRT·나레이션 URL을 연결하며 원본 파일 복사와 외부 게시/예약은 없다.
- `pnpm typecheck`, `pnpm build` 통과. 관련 코드 ESLint 오류/경고 0개. 기존 build의 Browserslist·lottie eval·큰 번들·정적/동적 locale import 경고는 남아 있다.
- 실제 빌드 경로 `packages/server/dist/server/src/services/book-video.service.js`의 Node ESM import도 성공했다. 처음 `dist/services`로 지정한 확인은 경로 오류로 실패했고 실제 컴파일 경로를 확인해 재실행했다.
- 서버 대상 테스트 9개(영상 라이브러리 7개 + 기존 마케팅 원본 2개), 클라이언트 5개 통과. 동시 저장 거절/기존 버전 보존, 외부 파일/메타 불일치 거절, 원본 등록 방지, 멱등 마케팅 링크, 모든 SRT cue 검증, 형식·언어별 초안 보존/저장 게이트/충돌 복구, ASS 자막 스케일/숏폼 안전 여백/스타일 명령 주입 방지 확인.
- 브라우저는 Vite의 임시 QA harness에서 실제 `BookVideoTab`/`TabBar`를 렌더링하고 저장·등록 API만 메모리 데이터로 대체했다. 실제 신데렐라 파일의 업로드 선택·미리보기, 언어/형식 전환·저장·등록 안내 확인. 이 증거는 운영 R2 업로드/신규 마케팅 행 생성 검증과 다르다. 새 완성본은 이번 작업에서 운영 등록하지 않았다. 임시 harness는 검수 후 제거.
- 화면 증거: `D:/tangobook-video/editor2-video-library-qa-20261002/desktop.png`, `short.png`. 새 화면 코드의 운영 배포는 하지 않았다.

## 후속 요청 — 로컬 FFmpeg 합성

사용자가 기존 “영상에 자막·MP3 연동, 로컬 컴퓨터 리소스 사용, FFmpeg 구현” 기능을 상기시켰다. 코드에서 `longform-video/utils/{ffmpeg-loader,client-renderer,subtitle-canvas}.ts`를 확인했다. 기존 클라이언트 렌더러는 미사용 fallback이고 현재 `RenderStep`은 서버 렌더 API만 호출한다. 오래된 loader는 SharedArrayBuffer/격리 헤더를 요구하는 multi-thread core라 현재 Vite의 헤더 구성과 맞지 않는다.

새 탭에서 원본 + 언어별 음원/SRT를 실제 브라우저 FFmpeg.wasm 단일 스레드로 합성한다. 서버는 R2 파일 bytes만 제공하고 encoding은 브라우저 Worker에서 수행한다. 첫 사용 시 공식 CDN에서 core를 읽고, 기존 repo Pretendard OTF를 public으로 재사용하며 OFL 라이선스를 포함했다. 자막 크기/원본 소리 혼합 여부, 진행률/취소, 로컬 결과 미리보기·다운로드, 완성본 적용→업로드→영상 자료 저장 흐름을 제공한다. 합성 원본은 최대 512MB, 업로드 허용은 기존 2GB. 단일 스레드/Vite esm core 선택은 [FFmpeg.wasm 공식 사용 문서](https://ffmpegwasm.netlify.app/docs/getting-started/usage/)로 대조했다.

실제 브라우저 합성 증거: 3초 640×360 영상(330Hz 원본 소리) + 1초 MP3(880Hz) + 한글 SRT를 합성. `composed-replace.mp4`는 H.264/AAC 3초로 원본 길이를 유지했고, 추출 프레임에서 한글 자막을 육안 확인했다. FFmpeg 자체는 실제 실행하고 결과 적용·마케팅 등록은 메모리 API로 확인했다. `composition.png`, `composed-frame.png` 및 결과 파일은 위 QA 폴더에 있다. 브라우저 드라이버의 download 이벤트 대기는 시간 초과했지만 실제 파일은 사용자 Downloads에 생성되어 이를 복사해 ffprobe/프레임을 확인했다.

교체 결과 FFT 주파수 peak 880Hz, 원본 330Hz/나레이션 880Hz 크기 비율 0.0000264. `composed-mix.mp4`에서는 330Hz·880Hz 크기가 각각 1,921.7/1,829.6으로 원본 소리 혼합을 실제 확인했다. 합성 중 취소 후 편집 버튼이 복구되고 기존 저장 버전이 유지되는 것도 브라우저에서 확인했다. 후속 변경의 client typecheck·production build/ESLint와 5개 테스트 통과. 전체 2~3분 1080p 영상의 브라우저 합성 성능은 이번 3초 기능 검증과 별개이며 측정하지 않았다.
