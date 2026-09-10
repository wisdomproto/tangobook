# lego-synth — 탱고블록(레고판) 합성 테스트 판

실물 프레임(폰 📤 업로드)에서 **조각을 잘라** 깨끗한 판 배경 위에 **원하는 배치로 붙여** 낱말을 만들고,
배포본 `tango-board-3d.html?board=lego` 를 headless 로 돌려 자동 채점한다. 픽셀이 실물이라 3D 시뮬의
사실감 문제가 없고, 정답은 놓은 사람이 안다. 사용자 사진은 최종 확인용으로만.

데이터 루트 = `SYNTH_DIR`(기본 `./data`): `frames/p*.jpg`(업로드 원본) · `pieces/` · `bg/` · `boxes.json` · `pieces.json` · `bg.json`

```bash
# 0) 정적 서버 (packages/client/public 에서)   python -m http.server 8765
# 1) 프레임마다 후보 상자 덤프 (인식기 실행)      node extract_boxes.mjs [p123.jpg ...]   # 인자 없으면 frames/ 전부, 결과는 boxes.json 에 병합
# 2) 조각·배경 자르기                             python build_library.py                  # pieces/ bg/ sheet.png — sheet 를 눈으로 보고 pieces.json 의 bad 를 손으로 표시
# 3) 배경 깨끗한지                                 (bg 를 run_cases 로 돌려 후보 0 인 것만 bg.json clean:true)
# 4) 합성                                          python compose.py cases_x --n 80 --seed 1 --gaps 0   # gaps: 0=붙임 1=한 칸 2=두 칸
# 5) 채점                                          node run_cases.mjs cases_x                # 배치 유형(vert/horz ± jong × gap)별 정답률
```

🔴 좌표 규약(실측): 업로드 jpg 는 페이지가 보는 그대로(하네스가 좌우 되돌리고 입구가 다시 뒤집는다) —
읽기 방향과 같다(모음은 오른쪽, 받침은 아래). `reco.boxes` 의 y 만 화면용으로 뒤집혀 있다(`H - y - h`).
`legoCellSweep` 직선의 y 는 검출 버퍼 행(위가 0)이고 검출 버퍼는 긴 변 1440 이다.
🔴 배경은 inpaint 하지 말 것 — 노란 얼룩이 남아 조각으로 읽힌다. 같은 줄에서 돌기 주기의 정수배만큼 옮긴
깨끗한 띠를 복사한다(`build_library.py`). 제일 좋은 배경은 **빈 판을 찍은 프레임**이다.
