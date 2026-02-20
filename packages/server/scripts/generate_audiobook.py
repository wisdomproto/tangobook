"""
동화책 오디오북 생성 스크립트.

Node.js에서 child_process.spawn으로 호출.
- stdin: JSON (AudiobookOptions)
- stdout: JSON { "outputPath": "..." }
- stderr: 진행 상황 JSON lines { "progress": 0-100, "step": "..." }
"""

import json
import sys
import os
import re
import tempfile
import requests
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

from moviepy import (
    ImageClip,
    AudioFileClip,
    CompositeVideoClip,
    CompositeAudioClip,
    concatenate_videoclips,
    concatenate_audioclips,
)

RESOLUTIONS = {
    "16:9": (1920, 1080),
    "9:16": (1080, 1920),
    "3:4": (1080, 1440),
    "4:3": (1440, 1080),
    "1:1": (1080, 1080),
}

SUBTITLE_SIZES = {"sm": 28, "md": 36, "lg": 48}

FONT_PATHS = [
    "C:/Windows/Fonts/malgun.ttf",
    "C:/Windows/Fonts/NanumGothic.ttf",
    "/usr/share/fonts/truetype/nanum/NanumGothic.ttf",
    "/System/Library/Fonts/AppleSDGothicNeo.ttc",
]


def report_progress(progress: int, step: str):
    """stderr로 진행률 JSON 전송."""
    msg = json.dumps({"progress": progress, "step": step}, ensure_ascii=False)
    print(msg, file=sys.stderr, flush=True)


def find_font():
    for fp in FONT_PATHS:
        if os.path.exists(fp):
            return fp
    return None


def download_file(url: str, dest: str) -> str:
    resp = requests.get(url, timeout=60)
    resp.raise_for_status()
    with open(dest, "wb") as f:
        f.write(resp.content)
    return dest


def hex_to_rgb(hex_color: str):
    h = hex_color.lstrip("#")
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))[:3]


def hex_to_rgba(hex_color: str):
    h = hex_color.lstrip("#")
    if len(h) == 8:
        return tuple(int(h[i:i+2], 16) for i in (0, 2, 4, 6))
    return (*hex_to_rgb(hex_color), 255)


def resize_image_to_fit(img_path: str, target_w: int, target_h: int, output_path: str) -> str:
    img = Image.open(img_path).convert("RGB")
    iw, ih = img.size
    scale = min(target_w / iw, target_h / ih)
    new_w = int(iw * scale)
    new_h = int(ih * scale)
    resized = img.resize((new_w, new_h), Image.LANCZOS)
    canvas = Image.new("RGB", (target_w, target_h), (0, 0, 0))
    x = (target_w - new_w) // 2
    y = (target_h - new_h) // 2
    canvas.paste(resized, (x, y))
    canvas.save(output_path, "PNG")
    return output_path


def split_sentences(text: str) -> list[str]:
    """텍스트를 문장 단위로 분리."""
    parts = re.split(r'(?<=[.!?。])\s*', text.strip())
    sentences = [s.strip() for s in parts if s.strip()]
    if not sentences:
        return [text.strip()]
    return sentences


def create_subtitle_image(text: str, width: int, font_size: int,
                          text_color: str, bg_color: str, font_path):
    if not text.strip():
        return None

    rgba_bg = hex_to_rgba(bg_color)
    rgb_text = hex_to_rgb(text_color)

    try:
        font = ImageFont.truetype(font_path, font_size) if font_path else ImageFont.load_default()
    except Exception:
        font = ImageFont.load_default()

    dummy = Image.new("RGBA", (1, 1))
    draw = ImageDraw.Draw(dummy)
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]

    pad_x, pad_y = 24, 16
    img_w = min(tw + pad_x * 2, width - 40)
    img_h = th + pad_y * 2

    img = Image.new("RGBA", (img_w, img_h), rgba_bg)
    draw = ImageDraw.Draw(img)
    draw.text(((img_w - tw) // 2, pad_y), text, fill=(*rgb_text, 255), font=font)

    tmp = tempfile.NamedTemporaryFile(suffix=".png", delete=False)
    img.save(tmp.name, "PNG")
    return tmp.name


def get_subtitle_y(position: str, h: int, sub_h: int = 60) -> int:
    """자막 위치 Y좌표 계산 (화면 안쪽으로 충분한 마진)."""
    if position == "top":
        return 60
    elif position == "center":
        return (h - sub_h) // 2
    else:  # bottom
        return h - sub_h - 60


def create_page_clip(image_path, audio_path, text, resolution, options, font_path, work_dir, page_idx):
    """문장별로 자막이 순차 표시되는 페이지 클립 생성."""
    w, h = resolution

    resized_path = os.path.join(work_dir, f"page_{page_idx}_resized.png")
    resize_image_to_fit(image_path, w, h, resized_path)

    audio_clip = None
    duration = 5.0
    if audio_path and os.path.exists(audio_path):
        try:
            audio_clip = AudioFileClip(audio_path)
            duration = audio_clip.duration + 0.5
        except Exception:
            pass

    img_clip = ImageClip(resized_path, duration=duration)
    layers = [img_clip]

    if options.get("includeSubtitles") and text.strip():
        font_size = SUBTITLE_SIZES.get(options.get("subtitleSize", "md"), 36)
        sub_color = options.get("subtitleColor", "#ffffff")
        sub_bg = options.get("subtitleBg", "#00000080")
        sub_pos = options.get("subtitlePosition", "bottom")

        sentences = split_sentences(text)
        total_chars = sum(len(s) for s in sentences)
        # TTS가 있으면 TTS 길이 기준, 없으면 전체 duration 기준 (마지막 0.5초 빼기)
        subtitle_duration = (audio_clip.duration if audio_clip else duration) - 0.3

        current_time = 0.2  # 0.2초 뒤에 시작

        for sentence in sentences:
            # 문장 길이에 비례하여 표시 시간 할당
            char_ratio = len(sentence) / total_chars if total_chars > 0 else 1 / len(sentences)
            sent_duration = max(1.0, subtitle_duration * char_ratio)

            sub_img_path = create_subtitle_image(
                sentence, w, font_size, sub_color, sub_bg, font_path,
            )
            if sub_img_path:
                sub_clip = (
                    ImageClip(sub_img_path, duration=sent_duration)
                    .with_start(current_time)
                    .with_position(("center", get_subtitle_y(sub_pos, h)))
                )
                layers.append(sub_clip)

            current_time += sent_duration

    composite = CompositeVideoClip(layers, size=(w, h))

    if audio_clip:
        composite = composite.with_audio(audio_clip)

    return composite


def main():
    sys.stdin.reconfigure(encoding='utf-8')
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

    raw = sys.stdin.read()
    options = json.loads(raw)

    pages = options["pages"]
    cover = options.get("cover")
    aspect_ratio = options.get("aspectRatio", "16:9")
    bgm_url = options.get("bgmUrl")
    bgm_volume = options.get("bgmVolume", 30) / 100.0
    work_dir = options.get("workDir", os.path.join(os.environ.get("TEMP", "/tmp"), "tangobook-audiobook"))
    output_path = options.get("outputPath", os.path.join(work_dir, "output.mp4"))

    resolution = RESOLUTIONS.get(aspect_ratio, (1920, 1080))
    font_path = find_font()
    total_pages = len(pages)

    Path(work_dir).mkdir(parents=True, exist_ok=True)

    clips = []
    report_progress(0, "시작")

    # 표지 클립
    if cover and cover.get("imageUrl"):
        report_progress(2, "표지 다운로드")
        cover_img_path = os.path.join(work_dir, "cover_img.jpg")
        try:
            download_file(cover["imageUrl"], cover_img_path)
            resized_cover = os.path.join(work_dir, "cover_resized.png")
            resize_image_to_fit(cover_img_path, resolution[0], resolution[1], resized_cover)
            cover_clip = ImageClip(resized_cover, duration=cover.get("duration", 3))
            clips.append(cover_clip)
        except Exception as e:
            report_progress(2, f"표지 처리 실패: {e}")

    # 페이지별 클립 (전체의 5%~80% 할당)
    for i, page in enumerate(pages):
        page_progress = 5 + int((i / max(total_pages, 1)) * 75)
        report_progress(page_progress, f"페이지 {i + 1}/{total_pages} 처리 중")

        img_url = page.get("imageUrl", "")
        audio_url = page.get("audioUrl")
        text = page.get("text", "")

        if not img_url:
            continue

        img_path = os.path.join(work_dir, f"page_{i}_img.jpg")
        try:
            download_file(img_url, img_path)
        except Exception as e:
            report_progress(page_progress, f"페이지 {i + 1} 이미지 다운로드 실패")
            continue

        audio_path = None
        if audio_url:
            audio_path = os.path.join(work_dir, f"page_{i}_audio.mp3")
            try:
                download_file(audio_url, audio_path)
            except Exception:
                audio_path = None

        try:
            clip = create_page_clip(
                img_path, audio_path, text,
                resolution, options, font_path,
                work_dir, i,
            )
            clips.append(clip)
        except Exception as e:
            report_progress(page_progress, f"페이지 {i + 1} 클립 생성 실패: {e}")
            continue

    if not clips:
        report_progress(100, "생성할 클립이 없습니다")
        sys.exit(1)

    report_progress(80, "클립 연결 중")
    final = concatenate_videoclips(clips, method="compose")

    # BGM 믹싱
    if bgm_url:
        report_progress(83, "배경음악 믹싱")
        bgm_path = os.path.join(work_dir, "bgm.mp3")
        try:
            download_file(bgm_url, bgm_path)
            bgm_audio = AudioFileClip(bgm_path).with_volume_scaled(bgm_volume)

            if bgm_audio.duration < final.duration:
                loops_needed = int(final.duration / bgm_audio.duration) + 1
                bgm_audio = concatenate_audioclips([bgm_audio] * loops_needed)

            bgm_audio = bgm_audio.subclipped(0, final.duration)

            if final.audio:
                mixed = CompositeAudioClip([final.audio, bgm_audio])
                final = final.with_audio(mixed)
            else:
                final = final.with_audio(bgm_audio)
        except Exception as e:
            report_progress(85, f"BGM 처리 실패 (계속 진행): {e}")

    report_progress(85, "MP4 인코딩 중")
    final.write_videofile(
        output_path,
        fps=24,
        codec="libx264",
        audio_codec="aac",
        preset="medium",
        threads=2,
        logger=None,
    )

    report_progress(98, "업로드 준비")
    final.close()
    for clip in clips:
        clip.close()

    print(json.dumps({"outputPath": output_path}))


if __name__ == "__main__":
    main()
