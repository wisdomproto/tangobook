#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# upscale-for-upload.sh
#   Grok 720p 자연관찰 클립 → 깨끗한 1080p/4K 업로드용 마스터
#
# ⚠️ 반드시 "원본 마스터"(Grok 출력 / 업로드 전 export)를 입력하세요.
#    YouTube에서 다시 받은 파일은 이미 이중압축이라 가공 금지.
#
# 사용법:
#   bash scripts/upscale-for-upload.sh <input.mp4> [1080|4k] [fast|ai]
#
# 모드:
#   fast (기본) : ffmpeg lanczos 업스케일 + 약한 샤픈. 설치 불필요, 즉시.
#                 → 720p→1080p는 사실 이거면 충분합니다.
#   ai          : Real-ESRGAN 프레임 업스케일(디테일 복원). 4K로 갈 때 가치.
#                 → realesrgan-ncnn-vulkan(.exe)이 PATH에 있어야 함.
#
# 출력: <input>_<target>_<mode>.mp4  (CRF16 / yuv420p / +faststart / AAC192k)
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

IN="${1:?입력 파일을 지정하세요}"
TARGET="${2:-1080}"          # 1080 | 4k
MODE="${3:-fast}"            # fast | ai

case "$TARGET" in
  1080) W=1920; H=1080 ;;
  4k|4K) W=3840; H=2160 ;;
  *) echo "TARGET은 1080 또는 4k"; exit 1 ;;
esac

BASE="${IN%.*}"
OUT="${BASE}_${TARGET}_${MODE}.mp4"
FPS="$(ffprobe -v error -select_streams v:0 -show_entries stream=r_frame_rate \
        -of default=nk=1:nw=1 "$IN" | awk -F/ '{ if($2) print $1/$2; else print $1 }')"

# 업로드 마스터 인코딩 공통 옵션 (YouTube가 다시 인코딩하므로 넉넉하게)
ENC=(-c:v libx264 -preset slow -crf 16 -pix_fmt yuv420p
     -c:a aac -b:a 192k -movflags +faststart)

echo ">> 입력: $IN  (${FPS} fps)  → 목표: ${W}x${H}  모드: ${MODE}"

if [ "$MODE" = "fast" ]; then
  # ── 즉시 경로: 고품질 lanczos 업스케일 + 약한 샤픈 ──────────────────────────
  # 샤픈이 세서 헤일로(테두리 번짐)가 보이면 0.6 → 0.3 으로 낮추세요.
  ffmpeg -nostdin -y -i "$IN" \
    -vf "scale=${W}:${H}:flags=lanczos,unsharp=5:5:0.6:5:5:0.0" \
    "${ENC[@]}" "$OUT"

elif [ "$MODE" = "ai" ]; then
  # ── AI 경로: Real-ESRGAN 4x → 목표 해상도로 다운스케일 (가장 깨끗) ──────────
  # Git Bash/Windows 에서 .exe 자동탐지. REALESRGAN_BIN 으로 직접 지정도 가능.
  RESRGAN="${REALESRGAN_BIN:-}"
  if [ -z "$RESRGAN" ]; then
    for c in realesrgan-ncnn-vulkan realesrgan-ncnn-vulkan.exe; do
      command -v "$c" >/dev/null 2>&1 && { RESRGAN="$c"; break; }
    done
  fi
  [ -n "$RESRGAN" ] || {
    echo "realesrgan-ncnn-vulkan 를 찾을 수 없습니다."
    echo "  https://github.com/xinntao/Real-ESRGAN/releases 에서 windows zip 받아 PATH 추가,"
    echo "  또는 REALESRGAN_BIN=/경로/realesrgan-ncnn-vulkan.exe 로 지정."; exit 1; }

  TMP="$(mktemp -d)"; mkdir -p "$TMP/in" "$TMP/out"
  echo ">> 1/3 프레임 추출"
  ffmpeg -nostdin -y -i "$IN" -qscale:v 1 -qmin 1 "$TMP/in/%06d.png"
  ffmpeg -nostdin -y -i "$IN" -vn -c:a copy "$TMP/audio.m4a" 2>/dev/null \
    || ffmpeg -nostdin -y -i "$IN" -vn -c:a aac -b:a 192k "$TMP/audio.m4a"

  echo ">> 2/3 Real-ESRGAN 업스케일(x4, realesrgan-x4plus)"
  # 실사 자연관찰 → x4plus(사진 모델). 깜빡임(flicker) 보이면 realesr-animevideov3 로.
  "$RESRGAN" -i "$TMP/in" -o "$TMP/out" -n realesrgan-x4plus -f png

  echo ">> 3/3 ${W}x${H} 재인코딩 + 오디오 머지"
  ffmpeg -nostdin -y -framerate "$FPS" -i "$TMP/out/%06d.png" -i "$TMP/audio.m4a" \
    -vf "scale=${W}:${H}:flags=lanczos" -shortest \
    "${ENC[@]}" "$OUT"
  rm -rf "$TMP"
else
  echo "MODE는 fast 또는 ai"; exit 1
fi

echo ""
echo "✅ 완료: $OUT"
ffprobe -v error -select_streams v:0 \
  -show_entries stream=width,height,r_frame_rate -show_entries format=bit_rate \
  -of default=nw=1 "$OUT"
echo "→ 이 파일을 YouTube에 업로드하세요."
