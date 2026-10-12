# ㄱ과 ㅏ의 만남 — Rive 시안

기존 ㄱ 캐릭터에 민트색 ㅏ 친구를 추가한9초 반복 무음 시안입니다. 인사→걸어오기→하이파이브→손잡고 가 만들기→함께 뛰기 순서입니다. 아래 native 도형에도 `ㄱ + ㅏ = 가`가 나타납니다.

몸통 두 장은 imagegen 스킬의 내장 도구로 생성한 RGBA 원본입니다. ㄱ은 이전 승인 시안과 동일하며, ㅏ 생성에 스타일 참조로만 사용했습니다. 얼굴·팔다리·관절·학습 식·애니메이션은 실제 Rive 객체입니다. `image-prompt.txt`에 ㅏ 프롬프트 전문이 있습니다.

원본 `scene.rml`과 `rive.yaml`을 Rive CLI1.5.1로 빌드합니다. 로그인 없이 `.riv`를 만들었으며 계정 업로드는 하지 않았습니다. 최초 ㄱ 춤 프로젝트는 `../rive-hangul-20261012`에 보존했습니다.

```powershell
python scripts/rive-hangul/build_meeting.py
rive output/rive-hangul-meet-20261012 --verify
rive inspect output/rive-hangul-meet-20261012 --summary
rive output/rive-hangul-meet-20261012
python scripts/rive-hangul/render_preview.py --project output/rive-hangul-meet-20261012 --review output/rive-hangul-meet-20261012-review --seconds 9 --fps 20 --name giyok-meets-a
python scripts/rive-hangul/verify_meeting.py
```

명령은 저장소 루트에서 실행합니다. 이 환경 CLI는 `C:/Users/kil21/.codex/tools/rive-cli/rive.exe`에 있습니다. Python/Pillow와 FFmpeg는 프리뷰 제작·검수에 필요하며 Rive 런타임 재생에는 필요하지 않습니다.

빌드 결과: `build/rive-hangul-meet-20261012.riv`. MP4·GIF·180프레임·검수 JSON은 `../rive-hangul-meet-20261012-review`에 로컬 보존합니다. 이미지의 전면 입체감은 고정된 래스터 표현이며 실제3D 모델은 아닙니다. 클릭 게임·음원·운영 앱 연결은 이 시안에 포함하지 않았습니다.
