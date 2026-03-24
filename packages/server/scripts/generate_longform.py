"""
롱폼 동영상 렌더링 스크립트.

Node.js에서 child_process.spawn으로 호출.
- stdin: JSON (LongformRenderOptions)
- stdout: JSON { "outputPath": "..." }
- stderr: 진행 상황 JSON lines { "progress": 0-100, "step": "..." }
"""

import json
import sys
import os
import gc
import tempfile
import requests
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

from moviepy import (
    VideoFileClip,
    ImageClip,
    AudioFileClip,
    CompositeVideoClip,
    CompositeAudioClip,
    concatenate_videoclips,
    concatenate_audioclips,
)
from moviepy.video.fx import CrossFadeIn, CrossFadeOut
from moviepy.audio.fx import AudioFadeIn

RESOLUTIONS = {
    "16:9": (1280, 720),
    "9:16": (720, 1280),
    "1:1": (720, 720),
}

CROSSFADE_DURATION = 0.5  # seconds of cross-dissolve between scenes
J_CUT_DURATION = 1.0  # seconds of audio pre-lap before scene transition

SUBTITLE_SIZES = {"sm": 20, "md": 26, "lg": 34}

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
    resp = requests.get(url, timeout=120)
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


def wrap_text(text: str, font, max_width: int, draw) -> list[str]:
    """텍스트를 max_width 내로 자동 줄바꿈."""
    words = text.split()
    if not words:
        return [text]

    lines = []
    current_line = words[0]

    for word in words[1:]:
        test_line = current_line + " " + word
        bbox = draw.textbbox((0, 0), test_line, font=font)
        if bbox[2] - bbox[0] <= max_width:
            current_line = test_line
        else:
            lines.append(current_line)
            current_line = word

    lines.append(current_line)

    # 한글 등 공백 없는 긴 텍스트 처리: 글자 단위로 자르기
    result = []
    for line in lines:
        bbox = draw.textbbox((0, 0), line, font=font)
        if bbox[2] - bbox[0] <= max_width:
            result.append(line)
        else:
            # 글자 단위로 자르기
            buf = ""
            for ch in line:
                test = buf + ch
                bb = draw.textbbox((0, 0), test, font=font)
                if bb[2] - bb[0] > max_width and buf:
                    result.append(buf)
                    buf = ch
                else:
                    buf = test
            if buf:
                result.append(buf)

    return result


def create_subtitle_image(text: str, width: int, font_size: int,
                          text_color: str, outline_color: str,
                          bg_color: str, font_path, padding: int = 20):
    """자막 이미지 생성 (외곽선 + 자동 줄바꿈 지원)."""
    if not text.strip():
        return None

    rgba_bg = hex_to_rgba(bg_color)
    rgb_text = hex_to_rgb(text_color)
    rgb_outline = hex_to_rgb(outline_color)

    try:
        font = ImageFont.truetype(font_path, font_size) if font_path else ImageFont.load_default()
    except Exception:
        font = ImageFont.load_default()

    dummy = Image.new("RGBA", (1, 1))
    draw = ImageDraw.Draw(dummy)

    stroke_width = 2
    max_text_width = width - 80  # 양쪽 여백

    # 자동 줄바꿈
    lines = wrap_text(text, font, max_text_width, draw)
    wrapped_text = "\n".join(lines)

    # 줄바꿈된 텍스트 전체 bbox 계산
    bbox = draw.textbbox((0, 0), wrapped_text, font=font, stroke_width=stroke_width)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]

    pad_x, pad_y = padding + 4, padding
    img_w = min(tw + pad_x * 2, width - 40)
    img_h = th + pad_y * 2

    img = Image.new("RGBA", (img_w, img_h), rgba_bg)
    draw = ImageDraw.Draw(img)
    draw.text(
        ((img_w - tw) // 2, pad_y),
        wrapped_text,
        fill=(*rgb_text, 255),
        font=font,
        stroke_width=stroke_width,
        stroke_fill=(*rgb_outline, 255),
        align="center",
    )

    tmp = tempfile.NamedTemporaryFile(suffix=".png", delete=False)
    img.save(tmp.name, "PNG")
    return tmp.name, img_h


def get_subtitle_y(position: str, h: int, sub_h: int = 60) -> int:
    """자막 위치 Y좌표 계산. sub_h는 실제 자막 이미지 높이."""
    margin = 40
    if position == "top":
        return margin
    elif position == "center":
        return (h - sub_h) // 2
    else:  # bottom
        return h - sub_h - margin


def create_scene_clip(scene, resolution, subtitle_style, font_path, work_dir, scene_idx, transition_offset=0):
    """한 장면의 비디오 클립 생성 (비디오 + 자막).
    transition_offset: 크로스 디졸브로 인해 자막/오디오를 지연시킬 초 (첫 장면 제외)."""
    w, h = resolution

    clip_path = os.path.join(work_dir, f"scene_{scene_idx}_clip.mp4")
    download_file(scene["clipUrl"], clip_path)

    video_clip = VideoFileClip(clip_path)

    # 트리밍 적용: trimStart/trimEnd로 클립의 시작/끝을 잘라냄
    trim_start = scene.get("trimStart", 0) or 0
    trim_end = scene.get("trimEnd", 0) or 0
    target_duration = scene.get("clipDuration", video_clip.duration)
    clip_end = min(video_clip.duration, target_duration - trim_end)
    clip_start = min(trim_start, clip_end - 0.1)
    video_clip = video_clip.subclipped(clip_start, clip_end)

    duration = video_clip.duration

    # 비디오 크기를 해상도에 맞게 리사이즈
    video_clip = video_clip.resized((w, h))

    layers = [video_clip]

    # 자막 오버레이
    subtitles = scene.get("subtitles", [])
    if subtitles:
        raw_size = subtitle_style.get("fontSize", 28)
        font_size = raw_size if isinstance(raw_size, int) else SUBTITLE_SIZES.get(raw_size, 26)
        text_color = subtitle_style.get("textColor", "#ffffff")
        outline_color = subtitle_style.get("outlineColor", "#000000")
        bg_color = subtitle_style.get("bgColor", "#00000080")
        position = subtitle_style.get("position", "bottom")

        for sub in subtitles:
            sub_text = sub.get("text", "").strip()
            if not sub_text:
                continue

            start_time = sub.get("startTime", 0) + transition_offset
            end_time = sub.get("endTime", duration) + transition_offset

            # 클립 길이를 초과하지 않도록 제한
            start_time = min(start_time, duration)
            end_time = min(end_time, duration)
            if end_time <= start_time:
                continue

            sub_result = create_subtitle_image(
                sub_text, w, font_size, text_color, outline_color, bg_color, font_path,
            )
            if sub_result:
                sub_img_path, sub_img_h = sub_result
                sub_duration = end_time - start_time
                sub_clip = (
                    ImageClip(sub_img_path, duration=sub_duration)
                    .with_start(start_time)
                    .with_position(("center", get_subtitle_y(position, h, sub_img_h)))
                )
                layers.append(sub_clip)

    composite = CompositeVideoClip(layers, size=(w, h))
    # 오디오 없이 반환 (J-Cut을 위해 main에서 별도 처리)
    composite = composite.without_audio()
    return composite


def download_scene_audio(scene, work_dir, scene_idx, duration, transition_offset=0):
    """장면의 SFX/TTS 오디오를 다운로드하여 믹싱된 AudioClip 반환.
    transition_offset: 크로스 디졸브로 인해 오디오를 지연시킬 초."""
    audio_tracks = []

    # SFX (영상에서 분리된 효과음)
    sfx_url = scene.get("sfxUrl")
    sfx_volume = scene.get("sfxVolume", 100) / 100.0
    sfx_offset = (scene.get("sfxOffset", 0) or 0) + transition_offset
    if sfx_url:
        sfx_path = os.path.join(work_dir, f"scene_{scene_idx}_sfx.mp3")
        try:
            download_file(sfx_url, sfx_path)
            sfx_audio = AudioFileClip(sfx_path).with_volume_scaled(sfx_volume)
            if sfx_audio.duration > duration - sfx_offset:
                sfx_audio = sfx_audio.subclipped(0, duration - sfx_offset)
            if sfx_offset > 0:
                sfx_audio = sfx_audio.with_start(sfx_offset)
            audio_tracks.append(sfx_audio)
        except Exception as e:
            report_progress(-1, f"SFX 로드 실패 (장면 {scene_idx}): {e}")

    # TTS (0.5s delay for natural pacing after scene transition)
    TTS_DELAY = 0.5
    tts_url = scene.get("ttsUrl")
    tts_offset = (scene.get("ttsOffset", 0) or 0) + transition_offset + TTS_DELAY
    if tts_url:
        tts_path = os.path.join(work_dir, f"scene_{scene_idx}_tts.mp3")
        try:
            download_file(tts_url, tts_path)
            tts_audio = AudioFileClip(tts_path)
            if tts_audio.duration > duration - tts_offset:
                tts_audio = tts_audio.subclipped(0, duration - tts_offset)
            if tts_offset > 0:
                tts_audio = tts_audio.with_start(tts_offset)
            audio_tracks.append(tts_audio)
        except Exception as e:
            report_progress(-1, f"TTS 로드 실패 (장면 {scene_idx}): {e}")

    if not audio_tracks:
        return None
    if len(audio_tracks) == 1:
        return audio_tracks[0]
    return CompositeAudioClip(audio_tracks)


def main():
    sys.stdin.reconfigure(encoding='utf-8')
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

    raw = sys.stdin.read()
    options = json.loads(raw)

    scenes = options["scenes"]
    aspect_ratio = options.get("aspectRatio", "16:9")
    bgm_url = options.get("bgmUrl")
    bgm_volume = options.get("bgmVolume", 50) / 100.0
    subtitle_style = options.get("subtitleStyle", {})
    work_dir = options.get("workDir", os.path.join(os.environ.get("TEMP", "/tmp"), "tangobook-longform"))
    output_path = options.get("outputPath", os.path.join(work_dir, "output.mp4"))

    resolution = RESOLUTIONS.get(aspect_ratio, (1280, 720))
    font_path = find_font()
    total_scenes = len(scenes)

    Path(work_dir).mkdir(parents=True, exist_ok=True)

    transition = options.get("transitionDuration", CROSSFADE_DURATION)

    clips = []
    clip_durations = []
    audio_scene_data = []  # (scene, scene_idx, duration, transition_offset)
    report_progress(0, "시작")

    # 장면별 클립 생성 (5%~80%)
    for i, scene in enumerate(scenes):
        scene_progress = 5 + int((i / max(total_scenes, 1)) * 75)
        report_progress(scene_progress, f"장면 {i + 1}/{total_scenes} 처리 중")

        if not scene.get("clipUrl"):
            report_progress(scene_progress, f"장면 {i + 1} 클립 URL 없음 (건너뜀)")
            continue

        # 첫 장면 이후에는 크로스 디졸브 오버랩만큼 자막/오디오를 지연
        t_offset = transition if (i > 0 and total_scenes > 1 and transition > 0) else 0

        try:
            clip = create_scene_clip(
                scene, resolution, subtitle_style, font_path, work_dir, i, t_offset,
            )
            clips.append(clip)
            clip_durations.append(clip.duration)
            audio_scene_data.append((scene, i, clip.duration, t_offset))
        except Exception as e:
            report_progress(scene_progress, f"장면 {i + 1} 클립 생성 실패: {e}")
            continue

        # 메모리 절약: 매 5장면마다 가비지 컬렉션
        if (i + 1) % 5 == 0:
            gc.collect()

    if not clips:
        report_progress(100, "생성할 클립이 없습니다")
        sys.exit(1)

    report_progress(80, "클립 연결 중 (크로스 디졸브 적용)")

    # Apply cross-dissolve transitions between clips
    if len(clips) > 1 and transition > 0:
        for i in range(len(clips)):
            if i > 0:
                clips[i] = clips[i].with_effects([CrossFadeIn(transition)])
            if i < len(clips) - 1:
                clips[i] = clips[i].with_effects([CrossFadeOut(transition)])
        final = concatenate_videoclips(clips, method="compose", padding=-transition)
    else:
        final = concatenate_videoclips(clips, method="compose")

    # J-Cut 오디오 믹싱: 장면별 오디오를 별도로 위치시킴
    j_cut = options.get("jCutDuration", J_CUT_DURATION)

    # 장면 시작 시간 계산 (크로스 디졸브 패딩 반영)
    scene_starts = []
    t = 0.0
    for i, dur in enumerate(clip_durations):
        scene_starts.append(t)
        overlap = transition if (len(clips) > 1 and transition > 0 and i < len(clip_durations) - 1) else 0
        t += dur - overlap

    report_progress(81, "오디오 믹싱 (J-Cut 적용)")

    all_audio = []
    for idx, (scene, scene_idx, duration, t_offset) in enumerate(audio_scene_data):
        scene_audio = download_scene_audio(scene, work_dir, scene_idx, duration, t_offset)
        if scene_audio is None:
            continue

        if idx > 0 and j_cut > 0:
            # J-Cut: 다음 장면 오디오를 j_cut초 앞에서 페이드인 시작
            audio_start = max(0, scene_starts[idx] - j_cut)
            scene_audio = scene_audio.with_effects([AudioFadeIn(j_cut)])
        else:
            audio_start = scene_starts[idx]

        scene_audio = scene_audio.with_start(audio_start)
        all_audio.append(scene_audio)

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
            all_audio.append(bgm_audio)
        except Exception as e:
            report_progress(85, f"BGM 처리 실패 (계속 진행): {e}")

    if all_audio:
        final = final.with_audio(CompositeAudioClip(all_audio))

    encode_threads = 4
    report_progress(85, f"MP4 인코딩 중 (threads={encode_threads})")
    final.write_videofile(
        output_path,
        fps=24,
        codec="libx264",
        audio_codec="aac",
        preset="ultrafast",
        threads=encode_threads,
        logger=None,
    )

    report_progress(98, "업로드 준비")
    final.close()
    for clip in clips:
        clip.close()

    print(json.dumps({"outputPath": output_path}))


if __name__ == "__main__":
    main()
