"""Independent CPU transcription audit of saved Voicebox page MP3s."""
import argparse
import difflib
import hashlib
import json
import pathlib
import re
import subprocess
import time

from faster_whisper import WhisperModel


def receipt_paths(args):
    while True:
        yield from sorted((args.root / "audio").glob("*/*/p*.json"))
        state_path = args.root / "generate-job.json"
        if not args.follow or not state_path.exists():
            return
        state = json.loads(state_path.read_text(encoding="utf-8"))
        if state["status"] != "running":
            return
        time.sleep(10)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=pathlib.Path,
                        default=pathlib.Path("D:/tangobook-audio/changjak-series-01-10-20261004"))
    parser.add_argument("--only", default="")
    parser.add_argument("--limit", type=int, default=0)
    parser.add_argument("--model", choices=["large-v3", "medium"], default="large-v3")
    parser.add_argument("--follow", action="store_true", help="Audit new files until generation ends")
    args = parser.parse_args()
    model = None
    count = 0
    for path in receipt_paths(args):
        if path.name.endswith(".request.json"):
            continue
        receipt = json.loads(path.read_text(encoding="utf-8"))
        if args.only and not receipt["bookId"].startswith(args.only):
            continue
        audio = path.with_suffix(".mp3")
        audio_hash = hashlib.sha256(audio.read_bytes()).hexdigest()
        if audio_hash != receipt["mp3Sha256"]:
            raise ValueError(f"Audio hash mismatch: {audio}")
        output = args.root / ("audit-" + args.model + "-vad-v1") / receipt["bookId"] / receipt["language"] / path.name
        if output.exists():
            previous = json.loads(output.read_text(encoding="utf-8"))
            if previous["mp3Sha256"] == audio_hash:
                continue
            raise ValueError(f"Audit audio changed; preserve previous audit: {output}")
        if args.limit and count >= args.limit:
            break
        subprocess.run(["ffmpeg", "-v", "error", "-i", str(audio), "-f", "null", "-"],
                       check=True, stdout=subprocess.DEVNULL)
        if model is None:
            model = WhisperModel(args.model, device="cpu", compute_type="int8",
                                 cpu_threads=6, local_files_only=True)
        segments, _ = model.transcribe(str(audio), language=receipt["language"],
                                       beam_size=5, word_timestamps=True, vad_filter=True,
                                       vad_parameters={"min_silence_duration_ms": 250},
                                       condition_on_previous_text=False)
        segments = list(segments)
        actual = " ".join(s.text.strip() for s in segments)
        expected = receipt["request"]["text"]
        normalize = lambda t: re.sub(r"[^가-힣a-z0-9]", "", t.lower())
        similarity = difflib.SequenceMatcher(None, normalize(expected), normalize(actual)).ratio()
        result = {"bookId": receipt["bookId"], "pageNumber": receipt["pageNumber"],
                  "language": receipt["language"], "mp3Sha256": audio_hash,
                  "expected": expected, "transcribed": actual,
                  "similarity": similarity, "decoder": "ffmpeg complete decode",
                  "asr": f"faster-whisper-{args.model} CPU int8",
                  "vad": "silero min_silence_duration_ms=250; independent page context",
                  "status": "asr-matched" if similarity >= .95 else "needs-listening-review",
                  "segments": [{"start": s.start, "end": s.end, "text": s.text}
                               for s in segments]}
        output.parent.mkdir(parents=True, exist_ok=True)
        temp = output.with_suffix(".json.tmp")
        temp.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
        temp.replace(output)
        count += 1
        print(f"AUDIT {receipt['bookId']} {receipt['language']} p{receipt['pageNumber']:02d} "
              f"{similarity:.3f} {actual}", flush=True)


if __name__ == "__main__":
    main()
