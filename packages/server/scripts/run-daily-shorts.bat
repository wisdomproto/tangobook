@echo off
REM 유튜브 Shorts 데일리 자동 업로드 (하루 1개, 카테고리 로테이션 = 공룡→자연→명작 순환).
REM 같은 주제 몰아올리면 자기잠식(YouTube가 1개만 밀어줌) → 매일 1개씩 주제 번갈아.
REM (호리 생활동화 쇼츠는 schedule-saenghwal-reels 로 별도 하루 1개 → 총 하루 2개.)
REM Windows 작업 스케줄러가 매일 이 파일을 실행하도록 등록한다.
REM 로그는 docs\marketing\drafts\shorts-upload.log 에 누적된다.
REM ── 저장소 위치가 바뀌면 아래 REPO 경로만 수정 ──
set REPO=C:\projects\tangobook
cd /d "%REPO%\packages\server"
echo. >> "%REPO%\docs\marketing\drafts\shorts-upload.log"
echo ===== %date% %time% ===== >> "%REPO%\docs\marketing\drafts\shorts-upload.log"
call npx tsx scripts\upload-shorts-youtube.mjs --count=1 >> "%REPO%\docs\marketing\drafts\shorts-upload.log" 2>&1
call npx tsx scripts\comment-shorts.mjs >> "%REPO%\docs\marketing\drafts\shorts-upload.log" 2>&1
