# ㄱ 캐릭터 — Rive 1차 시안

imagegen 내장 도구로 생성한 투명 PNG 몸통과 Rive native 도형/관절을 조합한 6초 춤 애니메이션입니다. 눈 깜빡임, 팔 흔들기, 좌우 스텝, 점프를 반복합니다. 음원 없는 움직임 시안입니다.

- `scene.rml`: 편집 가능한 Rive 제작 소스
- `giyok-body.png`: 생성된 몸통 원본, 진짜 알파 채널 포함
- `image-prompt.txt`: 최종 이미지 생성 프롬프트 전문
- `build/rive-hangul-20261012.riv`: 이미지가 내장된 독립 런타임 파일
- `../rive-hangul-20261012-review/giyok-dance.mp4`: 실제 Rive 프레임으로 만든 960×720 / 30fps / 6초 시안
- `../rive-hangul-20261012-review/giyok-dance.gif`: 반복 미리보기

공식 Rive CLI 1.5.1 사용. 계정 로그인·MCP 설정·클라우드 업로드 없이 로컬 제작했습니다. `.rev` 편집기 파일 내보내기는 Rive 로그인이 필요하며 이번 작업에서는 수행하지 않았습니다. `.riv`와 RML 소스는 별도 보존합니다.

저장소 루트에서:

```powershell
python scripts/rive-hangul/build_scene.py
rive output/rive-hangul-20261012 --verify
rive inspect output/rive-hangul-20261012 --summary
rive output/rive-hangul-20261012
```

시안 프레임/MP4/GIF 재생성:

```powershell
python scripts/rive-hangul/render_preview.py
```

생성기는 현재 Windows 환경의 `~/.codex/tools/rive-cli/rive.exe`와 PATH의 ffmpeg를 사용합니다. 전체 프레임 검수와 무결성 결과는 저장소 작업 기록을 참조합니다.

## 범위

원래 자음 형태를 유지하도록 몸통 자체는 회전/이동/아주 작은 신축만 적용합니다. 깊이 방향 회전이나 실제 3D 모델은 없습니다. 학습 문제·음원·게임 판정·운영 앱 통합은 이번 시안 범위에 포함하지 않습니다.
