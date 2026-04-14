# 자산 압축(WAV→MP3, PNG→WebP) 설계

**날짜**: 2026-04-14
**상태**: 초안
**범위**: 기존 60권 + 신규 생성분 전체

## 배경

현재 TTS는 비압축 WAV(PCM 24kHz 16bit mono), 이미지는 Gemini가 반환한 PNG 원본 그대로 R2에 저장 중. 뷰어 로딩 시 페이지당 2~4MB를 로드해 지연이 발생한다. 용량 70% 이상 절감 가능.

## 목표 / 비목표

**목표**
- TTS 전량 MP3 전환 (128kbps mono 24kHz)
- 이미지 전량 WebP 전환 (quality 85)
- 기존 동화책 60권 무손실 마이그레이션
- 원본(WAV/PNG) 사용자 검증 후 삭제

**비목표**
- 동화책 JSON 스키마 변경 없음 (필드명/타입 그대로, URL 값만 교체)
- BGM 재인코딩 (이미 MP3)
- 파닉스 라이브러리 개별 음원 일괄 재인코딩 (concat 출력은 이미 MP3)
- 압축 포맷 선택 UI (항상 MP3/WebP)

## 제약

- Storybook JSON 내 URL 필드가 80개 이상 분산 (shared types에 정의) → 타입별 개별 처리 대신 **범용 URL walker** 사용
- R2 키 규칙은 유지 (확장자만 변경)
- 기존 URL 캐시 브레이킹: 확장자가 바뀌므로 신규 URL = 신규 키
- YouTube/Remotion/롱폼 렌더링 파이프라인이 새 포맷 입력 가능해야 함 (ffmpeg, Remotion 모두 지원)

## 접근법

**드롭인 트랜스코딩 + 2단계 마이그레이션 (원본 유지 → 검증 → 삭제)**

대안 검토:
- 같은 R2 키 내용만 교체: 확장자 ↔ 실제 포맷 불일치, CDN 캐시 혼란 → 기각
- 듀얼 포맷 + fallback: 복잡도 상승, YAGNI → 기각

## 아키텍처

### 컴포넌트

**신규 코드 (생성 파이프라인)**

| 위치 | 변경 |
|------|------|
| `packages/server/src/utils/transcode.ts` (신규) | `pcmToMp3(pcm: Buffer)`, `imageToWebp(buf: Buffer, opts?)` 래퍼 |
| `packages/server/src/providers/gemini-tts.provider.ts` | WAV 래퍼 제거 → PCM을 바로 MP3로 인코딩해 반환 |
| `packages/server/src/services/tts.service.ts` | `ext='mp3'`, `mimeType='audio/mpeg'` 일원화 (Gemini/ElevenLabs/Minimax 공통) |
| `packages/server/src/services/image.service.ts` | Gemini PNG → `sharp().webp({quality:85})` → R2 업로드 (확장자 `.webp`) |

**마이그레이션 (신규 모듈)**

| 위치 | 역할 |
|------|------|
| `packages/server/src/utils/url-walker.ts` | 임의 객체 재귀 순회, 조건 매칭 문자열 수집/변환 |
| `packages/server/src/services/migration.service.ts` | `convertStorybook(id, opts)`, `cleanupOldAssets(id)`, `restoreFromManifest(id)` |
| `packages/server/src/scripts/migrate-assets.ts` | CLI 엔트리 (1권/전체/dry-run/resume) |
| `packages/server/src/scripts/cleanup-old-assets.ts` | 2단계 원본 삭제 CLI |
| `packages/server/src/scripts/restore-from-manifest.ts` | 롤백 CLI (JSON만 되돌림, 원본 살아있을 때) |
| R2 `_migrations/YYYY-MM-DD-{id}.json` | 매니페스트 (mappings + 백업 JSON 참조) |
| R2 `_backup/YYYY-MM-DD-{id}.json` | 원본 JSON 백업 |

### 변환 규칙

- **TTS**: Gemini PCM(24kHz 16bit mono) → ffmpeg → MP3 libmp3lame, 128kbps, mono, 24kHz
- **이미지**: 모든 PNG → sharp WebP, quality 85, 무손실 옵션 미사용
- **R2 키**: 확장자만 교체 (`tts/page1.wav` → `tts/page1.mp3`, `images/cover.png` → `images/cover.webp`)
- **URL 매칭**: JSON 문자열 값에 대해 정규식 `/^https?:\/\/[^\s"]*\.(wav|png)(\?|$)/i`

### 매니페스트 포맷

```json
{
  "storybookId": "abc-123",
  "migratedAt": "2026-04-14T10:30:00Z",
  "backupKey": "_backup/2026-04-14-abc-123.json",
  "mappings": [
    {
      "oldUrl": "https://.../storybooks/abc/tts/page1.wav",
      "newUrl": "https://.../storybooks/abc/tts/page1.mp3",
      "oldKey": "storybooks/abc/tts/page1.wav",
      "newKey": "storybooks/abc/tts/page1.mp3",
      "type": "audio"
    }
  ],
  "stats": {
    "files": 42,
    "oldBytes": 58000000,
    "newBytes": 8500000
  }
}
```

## 데이터 흐름

### 마이그레이션 1단계 (per storybook)

1. R2에서 `storybooks/{id}.json` 로드
2. 원본 JSON을 `_backup/YYYY-MM-DD-{id}.json`에 복사
3. `urlWalker(json)`로 `.wav`/`.png` URL 수집 (이미 `.mp3`/`.webp`면 skip → 멱등성)
4. 수집된 URL 병렬(4개씩) 다운로드
5. 타입별 변환: wav→mp3 / png→webp
6. 새 키로 업로드 (확장자만 교체)
7. `HEAD` 요청으로 업로드 검증, 실패 시 해당 storybook 중단
8. walker로 JSON 내 모든 old URL → new URL 치환
9. R2에 JSON 저장
10. 매니페스트를 `_migrations/`에 기록

### 마이그레이션 2단계 (cleanup)

1. `_migrations/` 디렉토리에서 매니페스트 읽음
2. 각 mapping의 `oldKey` 존재 확인 → 삭제
3. 삭제 결과 로그

### 복구 (restore-from-manifest)

1. 매니페스트 로드
2. `_backup/`의 원본 JSON을 `storybooks/{id}.json` 위치로 복사
3. (필요 시) 신규 업로드된 파일들도 삭제 가능 — CLI 옵션

## CLI 인터페이스

```bash
# dry-run (URL 개수, 예상 용량만 계산)
pnpm tsx packages/server/src/scripts/migrate-assets.ts --id <id> --dry-run

# 1권 실제 변환
pnpm tsx packages/server/src/scripts/migrate-assets.ts --id <id>

# 전체 (이미 매니페스트 있으면 skip)
pnpm tsx packages/server/src/scripts/migrate-assets.ts --all --resume

# 원본 삭제 (1권 / 전체)
pnpm tsx packages/server/src/scripts/cleanup-old-assets.ts --id <id>
pnpm tsx packages/server/src/scripts/cleanup-old-assets.ts --all

# 롤백
pnpm tsx packages/server/src/scripts/restore-from-manifest.ts --id <id>
```

## 오류 처리

| 상황 | 처리 |
|------|------|
| 단일 URL 다운로드 실패 | 재시도 3회 → 실패 시 해당 storybook 전체 skip (부분 적용 금지) |
| 변환 실패 | 위와 동일 |
| 업로드 HEAD 검증 실패 | JSON 업데이트 전이므로 안전, skip |
| JSON 업데이트 중 에러 | R2에 부분 JSON 저장 금지 (메모리에서 완성 후 1회 PUT) |
| 여러 권 배치 중 일부 실패 | 계속 진행, 실패 리스트 요약 출력 |
| 이미 `.mp3`/`.webp`로 치환된 URL | 해당 URL skip (멱등) |

## 롤백 시나리오

| 시점 | 복구 |
|------|------|
| 1단계 중 실패 | 해당 storybook 스킵됨 → 재실행 시 매니페스트 없으므로 처음부터 |
| 1단계 완료 후 뷰어에서 문제 발견 (cleanup 전) | `restore-from-manifest.ts` 실행 → JSON 복구 (원본 자산 그대로 살아있음) |
| 2단계(cleanup) 실행 후 문제 발견 | 복구 불가. 2단계는 반드시 사용자 스팟체크 OK 이후 |

## 테스트 전략

**단위 테스트**
- `transcode.pcmToMp3`: 24kHz PCM 입력 → MP3 시그니처·길이 검증 (ffprobe)
- `transcode.imageToWebp`: PNG 입력 → WebP 시그니처·치수 보존
- `url-walker.walkUrls`: 중첩 객체/배열, 빈 값, 이미 변환된 URL, 외부 URL 케이스

**통합 검증 (수동)**
1. 샘플 1권 dry-run → URL 개수/예상 용량 리포트 확인
2. 샘플 1권 실제 변환 → R2에 새 파일 존재, JSON 교체 확인, 매니페스트 저장 확인
3. 뷰어 체크리스트:
   - 표지 이미지 표시
   - 각 페이지 이미지 + TTS 자동재생
   - 파닉스 카드 이미지 + 블렌딩 TTS
   - BGM 재생 (이미 MP3, 회귀만 확인)
   - 게임 탭 이미지/TTS
   - 오디오북 렌더링 (Remotion에서 WebP 입력 OK)
   - 롱폼 렌더링 (ffmpeg에서 MP3 TTS 입력 OK)
   - YouTube 업로드 썸네일/영상

**회귀 방지**
- `pnpm typecheck` 통과
- 생성 E2E: 새 storybook 1권 만들어 MP3/WebP로 업로드되는지 확인

## 성공 기준

- 60권 전체 매니페스트 생성 (각 권별 `_migrations/` 파일)
- 사용자 스팟체크 OK 선언
- cleanup 후 R2에 `.wav`/`.png` 잔여 0건 (`listObjects` 검증 스크립트 포함)
- 뷰어 로딩 시간 유의미한 단축 (페이지당 다운로드 용량 70% ↓ 예상)

## 위험 및 대응

| 위험 | 대응 |
|------|------|
| WebP가 Remotion/Gemini 참조이미지에서 문제 발생 | 통합 검증에서 확인, 문제 시 해당 유스케이스만 JPG로 예외 처리 |
| sharp/ffmpeg 네이티브 바이너리 OS 불일치 | 로컬 Windows 개발 환경에서 정상. Railway Linux Dockerfile은 기존에 sharp/ffmpeg 설치됨 |
| JSON 내 URL이 아닌 위치에 확장자 문자열 존재 (설명 텍스트 등) | 매칭 정규식을 `^https?://` prefix 필수로 제한 → false positive 차단 |
| 마이그레이션 중 신규 동화책 생성되면 혼재 | 신규 코드 배포 후 마이그레이션 실행 → 신규는 처음부터 MP3/WebP |

## 구현 순서 (개략)

1. `utils/transcode.ts` + 단위 테스트
2. `utils/url-walker.ts` + 단위 테스트
3. 생성 파이프라인 변경 (TTS provider, image service)
4. 신규 생성으로 E2E 확인 (1권)
5. `services/migration.service.ts` 및 CLI 스크립트
6. 샘플 1권 마이그레이션 → 사용자 검증
7. 전체 60권 실행
8. 사용자 최종 OK 후 cleanup CLI 실행
