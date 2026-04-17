"""
롱폼 동영상 렌더링 스크립트 (ffmpeg 네이티브 버전).

MoviePy 제거 → Pillow(자막 PNG) + ffmpeg subprocess로 처리.
- stdin: JSON (LongformRenderOptions)
- stdout: JSON { "outputPath": "..." }
- stderr: 진행 상황 JSON lines { "progress": 0-100, "step": "..." }
"""

import json
import sys
import os
import time
import shutil
import subprocess
import tempfile
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

RESOLUTIONS = {
    "16:9": (1280, 720),
    "9:16": (720, 1280),
    "1:1": (720, 720),
}

CROSSFADE_DURATION = 0.5
J_CUT_DURATION = 1.0
SUBTITLE_SIZES = {"sm": 20, "md": 26, "lg": 34}

FONT_PATHS = [
    "/usr/share/fonts/truetype/nanum/NanumGothic.ttf",
    "C:/Windows/Fonts/malgun.ttf",
    "C:/Windows/Fonts/NanumGothic.ttf",
    "/System/Library/Fonts/AppleSDGothicNeo.ttc",
]

# ffmpeg 경로: 시스템 ffmpeg 우선, 없으면 ffmpeg-static
FFMPEG = shutil.which("ffmpeg") or "ffmpeg"


def report_progress(progress: int, step: str):
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
    data = resp.content
    if not data:
        raise RuntimeError(f"다운로드 결과가 0바이트: {url}")
    with open(dest, "wb") as f:
        f.write(data)
    return dest


def run_ffmpeg(args: list[str], timeout=300):
    """ffmpeg 실행. 실패 시 예외."""
    result = subprocess.run(
        [FFMPEG] + args,
        capture_output=True, text=True, timeout=timeout,
    )
    if result.returncode != 0:
        raise RuntimeError(f"ffmpeg 실패: {result.stderr[-500:]}")
    return result


def get_duration(filepath: str) -> float:
    """ffprobe로 duration 조회."""
    ffprobe = shutil.which("ffprobe") or "ffprobe"
    result = subprocess.run(
        [ffprobe, "-v", "quiet", "-print_format", "json", "-show_format", filepath],
        capture_output=True, text=True, timeout=30,
    )
    if result.returncode == 0:
        info = json.loads(result.stdout)
        return float(info.get("format", {}).get("duration", 0))
    return 0


# ===== Pillow 자막 이미지 (기존 로직 그대로) =====

def hex_to_rgb(hex_color: str):
    h = hex_color.lstrip("#")
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))[:3]


def hex_to_rgba(hex_color: str):
    h = hex_color.lstrip("#")
    if len(h) == 8:
        return tuple(int(h[i:i+2], 16) for i in (0, 2, 4, 6))
    return (*hex_to_rgb(hex_color), 255)


def wrap_text(text: str, font, max_width: int, draw) -> list[str]:
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

    result = []
    for line in lines:
        bbox = draw.textbbox((0, 0), line, font=font)
        if bbox[2] - bbox[0] <= max_width:
            result.append(line)
        else:
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


def create_subtitle_image(text, width, font_size, text_color, outline_color, bg_color, font_path, padding=20):
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
    max_text_width = width - 80
    lines = wrap_text(text, font, max_text_width, draw)
    wrapped_text = "\n".join(lines)
    bbox = draw.textbbox((0, 0), wrapped_text, font=font, stroke_width=stroke_width)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    pad_x, pad_y = padding + 4, padding
    img_w = min(tw + pad_x * 2, width - 40)
    img_h = th + pad_y * 2

    img = Image.new("RGBA", (img_w, img_h), rgba_bg)
    draw = ImageDraw.Draw(img)
    draw.text(
        ((img_w - tw) // 2, pad_y), wrapped_text,
        fill=(*rgb_text, 255), font=font,
        stroke_width=stroke_width, stroke_fill=(*rgb_outline, 255), align="center",
    )
    tmp = tempfile.NamedTemporaryFile(suffix=".png", delete=False)
    img.save(tmp.name, "PNG")
    return tmp.name, img_h


def get_subtitle_y(position, h, sub_h=60):
    margin = 40
    if position == "top":
        return margin
    elif position == "center":
        return (h - sub_h) // 2
    return h - sub_h - margin


# ===== 병렬 다운로드 =====

def download_all_files(scenes, work_dir, bgm_url=None):
    tasks = {}
    for i, scene in enumerate(scenes):
        if scene.get("clipUrl"):
            tasks[f"clip_{i}"] = (scene["clipUrl"], os.path.join(work_dir, f"scene_{i}.mp4"))
        if scene.get("sfxUrl"):
            tasks[f"sfx_{i}"] = (scene["sfxUrl"], os.path.join(work_dir, f"sfx_{i}.mp3"))
        if scene.get("ttsUrl"):
            tasks[f"tts_{i}"] = (scene["ttsUrl"], os.path.join(work_dir, f"tts_{i}.mp3"))
    if bgm_url:
        tasks["bgm"] = (bgm_url, os.path.join(work_dir, "bgm.mp3"))

    results = {}
    total = len(tasks)
    done = 0
    with ThreadPoolExecutor(max_workers=3) as executor:
        futures = {executor.submit(download_file, url, dest): key for key, (url, dest) in tasks.items()}
        for future in as_completed(futures):
            key = futures[future]
            done += 1
            try:
                results[key] = future.result()
                report_progress(2 + int((done / max(total, 1)) * 18), f"다운로드 {done}/{total}")
            except Exception as e:
                report_progress(-1, f"다운로드 실패 ({key}): {e}")
    return results


# ===== 씬별 처리: Pillow 자막 PNG + ffmpeg overlay =====

def process_scene(scene, scene_idx, downloaded, resolution, subtitle_style, font_path, work_dir):
    """씬 하나를 처리: trim + scale + 자막 overlay → processed_{i}.mp4"""
    w, h = resolution
    clip_path = downloaded.get(f"clip_{scene_idx}")
    if not clip_path:
        return None

    output_path = os.path.join(work_dir, f"processed_{scene_idx}.mp4")
    trim_start = scene.get("trimStart", 0) or 0
    trim_end = scene.get("trimEnd", 0) or 0
    clip_duration = scene.get("clipDuration", 10)
    duration = clip_duration - trim_start - trim_end

    if duration <= 0.1:
        print(
            f"[scene {scene_idx+1}] 스킵: duration={duration:.2f}s "
            f"(clipDuration={clip_duration}, trimStart={trim_start}, trimEnd={trim_end})",
            file=sys.stderr, flush=True,
        )
        return None

    # 입력 파일 유효성 검사 (0바이트 방어)
    if os.path.getsize(clip_path) == 0:
        print(f"[scene {scene_idx+1}] 스킵: 클립 파일이 0바이트 ({clip_path})", file=sys.stderr, flush=True)
        return None

    subtitles = [s for s in scene.get("subtitles", []) if s.get("text", "").strip()]

    if not subtitles:
        # 자막 없음 → trim + scale만
        run_ffmpeg([
            "-i", clip_path,
            *(["-ss", str(trim_start)] if trim_start > 0 else []),
            "-t", str(duration),
            "-vf", f"scale={w}:{h}",
            "-c:v", "libx264", "-preset", "ultrafast", "-threads", "2",
            "-an", "-y", output_path,
        ])
        return output_path

    # 자막 PNG 생성 (Pillow)
    raw_size = subtitle_style.get("fontSize", 44)
    font_size = raw_size if isinstance(raw_size, int) else SUBTITLE_SIZES.get(raw_size, 44)
    text_color = subtitle_style.get("textColor", "#ffffff")
    outline_color = subtitle_style.get("outlineColor", "#000000")
    bg_color = subtitle_style.get("bgColor", "#00000080")
    position = subtitle_style.get("position", "bottom")

    sub_images = []
    for si, sub in enumerate(subtitles):
        result = create_subtitle_image(sub["text"], w, font_size, text_color, outline_color, bg_color, font_path)
        if result:
            png_path, img_h = result
            y = get_subtitle_y(position, h, img_h)
            sub_images.append({
                "path": png_path, "y": y,
                "start": sub.get("startTime", 0), "end": sub.get("endTime", duration),
            })

    if not sub_images:
        run_ffmpeg([
            "-i", clip_path,
            *(["-ss", str(trim_start)] if trim_start > 0 else []),
            "-t", str(duration),
            "-vf", f"scale={w}:{h}",
            "-c:v", "libx264", "-preset", "ultrafast", "-threads", "2",
            "-an", "-y", output_path,
        ])
        return output_path

    # ffmpeg: 자막 PNG overlay
    inputs = ["-i", clip_path]
    for si in sub_images:
        inputs += ["-i", si["path"]]

    # filter_complex 조립
    filters = [f"[0:v]scale={w}:{h}[base]"]
    prev = "base"
    for idx, si in enumerate(sub_images):
        out = "vout" if idx == len(sub_images) - 1 else f"v{idx}"
        enable = f"between(t,{si['start']},{si['end']})"
        filters.append(f"[{prev}][{idx+1}:v]overlay=(W-w)/2:{si['y']}:enable='{enable}'[{out}]")
        prev = out

    run_ffmpeg([
        *inputs,
        *(["-ss", str(trim_start)] if trim_start > 0 else []),
        "-t", str(duration),
        "-filter_complex", ";".join(filters),
        "-map", "[vout]",
        "-c:v", "libx264", "-preset", "ultrafast", "-threads", "2",
        "-an", "-y", output_path,
    ])

    # PNG 정리
    for si in sub_images:
        try:
            os.unlink(si["path"])
        except OSError:
            pass

    return output_path


# ===== 메인 =====

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
    report_progress(0, "시작")

    # Phase 1: 병렬 다운로드 (0~20%)
    report_progress(1, f"다운로드 시작 ({total_scenes}장면)")
    t0 = time.time()
    downloaded = download_all_files(scenes, work_dir, bgm_url)
    report_progress(20, f"다운로드 완료 ({time.time()-t0:.1f}초)")

    # Phase 2: 씬별 처리 — Pillow 자막 PNG + ffmpeg overlay (20~70%)
    processed = []
    scene_durations = []
    skipped = 0
    for i, scene in enumerate(scenes):
        pct = 20 + int((i / max(total_scenes, 1)) * 50)
        report_progress(pct, f"장면 {i+1}/{total_scenes} 처리 중")

        try:
            result = process_scene(scene, i, downloaded, resolution, subtitle_style, font_path, work_dir)
        except Exception as e:
            print(f"[scene {i+1}] 처리 실패: {e}", file=sys.stderr, flush=True)
            result = None

        if result:
            dur = get_duration(result)
            fallback = (scene.get("clipDuration", 5) - (scene.get("trimStart", 0) or 0) - (scene.get("trimEnd", 0) or 0))
            effective = dur if dur > 0 else fallback
            if effective <= 0.1:
                print(f"[scene {i+1}] 스킵: 처리 후 duration={effective:.2f}s", file=sys.stderr, flush=True)
                skipped += 1
                continue
            processed.append(result)
            scene_durations.append(effective)
        else:
            skipped += 1

    if not processed:
        print(
            f"처리할 클립이 없습니다 (전체 {total_scenes}장면 중 {skipped}장면 스킵). "
            f"clipUrl 누락, 트리밍 과다(duration≤0), 다운로드 실패 중 하나입니다.",
            file=sys.stderr, flush=True,
        )
        report_progress(100, "처리할 클립이 없습니다")
        sys.exit(1)

    # Phase 3: 크로스디졸브 연결 (70~80%)
    transition = options.get("transitionDuration", CROSSFADE_DURATION)
    report_progress(70, "크로스디졸브 연결 중")
    concat_path = os.path.join(work_dir, "concat_video.mp4")

    if len(processed) == 1:
        shutil.copy2(processed[0], concat_path)
    elif transition <= 0 or len(processed) <= 1:
        # 크로스디졸브 없이 단순 concat
        concat_list = os.path.join(work_dir, "concat.txt")
        with open(concat_list, "w") as f:
            for p in processed:
                f.write(f"file '{p}'\n")
        run_ffmpeg(["-f", "concat", "-safe", "0", "-i", concat_list, "-c", "copy", "-y", concat_path])
    else:
        # xfade 체인으로 크로스디졸브 적용
        # ffmpeg -i s0.mp4 -i s1.mp4 -i s2.mp4 -filter_complex
        #   "[0][1]xfade=transition=fade:duration=0.5:offset=X[v01];
        #    [v01][2]xfade=transition=fade:duration=0.5:offset=Y[v012]"

        # transition보다 짧은 장면이 있으면 xfade가 0프레임을 뱉으므로 transition을 줄인다
        min_dur = min(scene_durations)
        if min_dur <= transition:
            adjusted = max(0.1, min_dur * 0.5)
            print(
                f"[xfade] 최단 장면({min_dur:.2f}s)이 transition({transition}s) 이하. "
                f"transition을 {adjusted:.2f}s로 조정",
                file=sys.stderr, flush=True,
            )
            transition = adjusted

        args = []
        for p in processed:
            args += ["-i", p]

        n = len(processed)
        filters = []
        offset = scene_durations[0] - transition  # 첫 xfade 시작점

        for i in range(1, n):
            in0 = f"[v{i-1}]" if i > 1 else "[0:v]"
            in1 = f"[{i}:v]"
            out = f"[v{i}]" if i < n - 1 else "[vout]"
            filters.append(f"{in0}{in1}xfade=transition=fade:duration={transition}:offset={offset:.3f}{out}")
            if i < n - 1:
                offset += scene_durations[i] - transition

        report_progress(73, f"xfade 필터 ({n}장면, {len(filters)}전환)")
        args += [
            "-filter_complex", ";".join(filters),
            "-map", "[vout]",
            "-c:v", "libx264", "-preset", "ultrafast", "-threads", "2",
            "-an", "-y", concat_path,
        ]
        run_ffmpeg(args, timeout=600)

    # Phase 4: 오디오 믹싱 (80~90%)
    report_progress(80, "오디오 믹싱 중")

    # 장면 시작 오프셋 계산 (크로스디졸브 반영)
    scene_offsets = []
    t = 0.0
    for i, dur in enumerate(scene_durations):
        scene_offsets.append(t)
        overlap = transition if (transition > 0 and i < len(scene_durations) - 1) else 0
        t += dur - overlap

    # 오디오 입력 수집
    audio_inputs = []  # (filepath, delay_ms, volume)
    ready_scenes = [s for s in scenes if s.get("clipUrl")]

    for i, scene in enumerate(ready_scenes):
        if i >= len(scene_offsets):
            break
        offset = scene_offsets[i]

        sfx_path = downloaded.get(f"sfx_{i}")
        if sfx_path:
            delay = max(0, int((offset + (scene.get("sfxOffset", 0) or 0)) * 1000))
            vol = scene.get("sfxVolume", 60) / 100.0
            audio_inputs.append((sfx_path, delay, vol))

        tts_path = downloaded.get(f"tts_{i}")
        if tts_path:
            delay = max(0, int((offset + (scene.get("ttsOffset", 0) or 0) + 0.5) * 1000))
            tts_vol = scene.get("ttsVolume", 70) / 100.0
            audio_inputs.append((tts_path, delay, tts_vol))

    bgm_path = downloaded.get("bgm")
    has_audio = len(audio_inputs) > 0 or bgm_path

    if not has_audio:
        # 오디오 없음 → concat 결과가 최종
        shutil.copy2(concat_path, output_path)
    else:
        # ffmpeg amix로 오디오 믹싱
        args = ["-i", concat_path]
        filter_parts = []
        labels = []

        # 무음 베이스 (영상에 오디오가 없으므로)
        total_dur = sum(scene_durations)
        filter_parts.append(f"anullsrc=channel_layout=stereo:sample_rate=44100:d={total_dur}[silence]")
        labels.append("[silence]")

        input_idx = 1
        for filepath, delay_ms, vol in audio_inputs:
            args += ["-i", filepath]
            label = f"a{input_idx}"
            delay_f = f"adelay={delay_ms}|{delay_ms}," if delay_ms > 0 else ""
            vol_f = f"volume={vol:.2f}," if vol != 1.0 else ""
            filter_parts.append(f"[{input_idx}:a]{delay_f}{vol_f}aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo[{label}]")
            labels.append(f"[{label}]")
            input_idx += 1

        if bgm_path:
            args += ["-i", bgm_path]
            label = "bgm"
            vol_f = f"volume={bgm_volume:.2f}," if bgm_volume != 1.0 else ""
            filter_parts.append(f"[{input_idx}:a]{vol_f}aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo[{label}]")
            labels.append(f"[{label}]")

        mix_inputs = "".join(labels)
        n = len(labels)
        filter_parts.append(f"{mix_inputs}amix=inputs={n}:duration=first:dropout_transition=2:normalize=0[aout]")

        report_progress(80, f"오디오 믹싱 ({n}트랙)")

        args += [
            "-filter_complex", ";".join(filter_parts),
            "-map", "0:v", "-map", "[aout]",
            "-c:v", "copy", "-c:a", "aac",
            "-shortest", "-movflags", "+faststart", "-y", output_path,
        ]
        run_ffmpeg(args, timeout=600)

    report_progress(95, "완료")

    # 정리
    for p in processed:
        try:
            os.unlink(p)
        except OSError:
            pass

    print(json.dumps({"outputPath": output_path}))


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        import traceback
        print(f"[longform] 예외 발생: {type(e).__name__}: {e}", file=sys.stderr, flush=True)
        traceback.print_exc(file=sys.stderr)
        sys.stderr.flush()
        sys.exit(1)
