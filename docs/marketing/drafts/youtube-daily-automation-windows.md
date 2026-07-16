# 유튜브 Shorts 데일리 자동 업로드 — Windows 세팅

> 매일 **2개씩** 자동 업로드. 쿼터(하루 약 6개 상한)에 여유. 멱등이라 중복 안 올라감.
> 러너 = `packages\server\scripts\run-daily-shorts.bat` (하루 2개 public 업로드 + 로그).

---

## 1단계 — 배치 파일 한 번 테스트 (수동)

먼저 손으로 한 번 돌려서 실제로 올라가는지 확인하세요. (실제 채널에 2개 공개됩니다)

명령 프롬프트(cmd)에서:
```
C:\projects\tangobook\packages\server\scripts\run-daily-shorts.bat
```
- 성공하면 `docs\marketing\drafts\shorts-upload.log`에 업로드된 영상 URL이 찍힙니다.
- 채널 스튜디오 → 콘텐츠에서 2개 올라온 것 확인.
- ⚠️ 처음엔 미리보기만 하고 싶으면 먼저:
  `cd C:\projects\tangobook\packages\server` → `npx tsx scripts\upload-shorts-youtube.mjs --dry-run --count=2`

---

## 2단계 — 작업 스케줄러 등록 (매일 자동)

### 방법 A) 명령 한 줄 (복붙, 가장 간단)

**관리자 권한 명령 프롬프트**에서 아래를 그대로 붙여넣기 (매일 19:00 KST 실행):
```
schtasks /create /tn "TangobookShortsDaily" /tr "C:\projects\tangobook\packages\server\scripts\run-daily-shorts.bat" /sc daily /st 19:00 /f
```
- `/st 19:00` = 오후 7시. 부모가 아이와 보는 시간대라 권장. 원하는 시각으로 바꿔도 됨.
- 삭제하려면: `schtasks /delete /tn "TangobookShortsDaily" /f`
- 지금 즉시 한 번 실행 테스트: `schtasks /run /tn "TangobookShortsDaily"`

> ⚠️ 이 방식은 **PC가 켜져 있고 로그인돼 있을 때** 그 시각에 실행됩니다. 그 시각에 PC가 꺼져 있으면 그날은 건너뜁니다(다음 날 정상).

### 방법 B) "꺼져 있어도 켜지면 실행" 포함 (권장, GUI 5클릭)

1. 시작 → **작업 스케줄러** 실행
2. 우측 **작업 만들기**(기본 작업 아님)
3. **일반** 탭: 이름 `TangobookShortsDaily`, "가장 높은 권한으로 실행" 체크
4. **트리거** 탭 → 새로 만들기 → 매일, 시작 19:00
5. **동작** 탭 → 새로 만들기 → 프로그램/스크립트에
   `C:\projects\tangobook\packages\server\scripts\run-daily-shorts.bat`
6. **설정** 탭 → **"예약된 시작 시간을 놓친 경우 가능한 한 빨리 작업 시작" 체크** ← 이게 PC 껐다 켜도 그날 치 올라가게 함
7. 확인

---

## 조절 옵션 (배치 파일 안 `--count` 숫자만 바꾸면 됨)

- 하루 개수 늘리기: `--count=3` (쿼터 6/일이라 최대 3~4 권장)
- 공룡만 먼저 소진: `--count=2 --category=nature-dino`
- 특정 시각 예약공개(즉시 아님): `--count=2 --publish-at=19:00`

## 진행 상황 확인

- 로그: `docs\marketing\drafts\shorts-upload.log`
- 누적/잔여 상태: `docs\marketing\drafts\shorts-upload-state.json` (업로드된 bookId·영상URL 기록)
- 145개 다 올라가면 자동으로 "올릴 것이 없습니다" 뜨고 멈춤.
