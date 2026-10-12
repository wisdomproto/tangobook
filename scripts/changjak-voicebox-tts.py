"""Resumable local Voicebox narration; never writes operating books or uploads audio.

Inventory and untouched snapshots are required. English drafts must be reviewed before
audio generation. The two GPU models are explicitly unloaded between stages.
"""
import argparse
import hashlib
import json
import os
import pathlib
import re
import subprocess
import time
import urllib.request
import urllib.error

PROFILES = {
    "ko": "b8f4b383-9598-4ca4-bfad-daf8917cf30d",
    "en": "391dcc3c-f1b7-472a-9b14-77ed29f98b21",
}
SERIES = "pongi coco mei dodo bruno twins mio pipo nono lulu".split()
SERIES_COUNTS = {**dict.fromkeys(SERIES, 50),
                 **dict.fromkeys("bung dingding taro yuki mina".split(), 50),
                 **dict.fromkeys("kota moya bami dari".split(), 25)}
SPEED = {"ko": "atempo=0.85", "en": "rubberband=tempo=0.85"}


def digest(value):
    if not isinstance(value, bytes):
        value = json.dumps(value, ensure_ascii=False, sort_keys=True).encode()
    return hashlib.sha256(value).hexdigest()


def read(path):
    return json.loads(path.read_text(encoding="utf-8"))


def save(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_suffix(path.suffix + ".tmp")
    temp.write_text(json.dumps(value, ensure_ascii=False, indent=2), encoding="utf-8")
    temp.replace(path)


def request(base, path, payload, raw=False):
    req = urllib.request.Request(base + path, data=json.dumps(payload).encode(),
                                 headers={"Content-Type": "application/json"})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=1200) as response:
                if response.status != 200:
                    raise RuntimeError(f"Voicebox not ready: HTTP {response.status}")
                return response.read() if raw else json.load(response)
        except urllib.error.HTTPError as exc:
            if exc.code not in (500, 502, 503, 504) or attempt == 2:
                raise
        except (urllib.error.URLError, TimeoutError, ConnectionError):
            if attempt == 2:
                raise
        time.sleep(2 ** (attempt + 1))


def scope_ids(scope):
    slugs = SERIES if scope == "01-10" else list(SERIES_COUNTS)[10:] if scope == "11-19" else list(SERIES_COUNTS)
    if scope not in ("01-10", "11-19", "01-19"):
        raise ValueError("Unknown series scope")
    return {f"changjak-{slug}-{n:02d}" for slug in slugs for n in range(1, SERIES_COUNTS[slug]+1)}


def books(root, only, scope="01-10"):
    inventory = read(root / "inventory.json")
    selected = inventory["perBook"]
    expected = scope_ids(scope)
    if len(selected) != len(expected) or {b["id"] for b in selected} != expected:
        raise ValueError(f"Inventory must contain exactly scope {scope}, {len(expected)} unique books")
    for row in selected:
        if only and not row["id"].startswith(only):
            continue
        book = read(root / "books-before" / (row["id"] + ".json"))
        if book["id"] != row["id"]:
            raise ValueError("Snapshot ID mismatch")
        if [p["page_number"] for p in book["pages"]] != list(range(1, 11)):
            raise ValueError(f"Page numbering mismatch: {book['id']}")
        if any(not isinstance(p.get("text"), str) or not p["text"].strip() for p in book["pages"]):
            raise ValueError("Empty source narration")
        yield book


def source_hash(book):
    return digest({"title": book["title"], "characters": book["characters"],
                   "pages": [{k: p.get(k) for k in ("page_number", "text", "scene_description")}
                             for p in book["pages"]]})


def translate(args):
    request(args.base, "/models/unload", {})
    for i, book in enumerate(books(args.root, args.only, args.scope)):
        if args.limit and i >= args.limit:
            break
        output = args.root / "translations" / (book["id"] + ".json")
        src = source_hash(book)
        if output.exists():
            if read(output)["sourceSha256"] != src:
                raise ValueError(f"Source changed; preserve and review old translation: {output}")
            continue
        glossary = "; ".join(f"{c['name']}={c.get('token') or c['name']}"
                             for c in book["characters"])
        system = (
            "Carefully translate Korean picture-book narration into simple natural English. "
            "Translate ONLY narration, never scene_context. Preserve every fact, speaker, "
            "emotion and dialogue, including negation and uncertainty. Use the complete story "
            "and scene context to disambiguate words such as 다리 (bridge or leg). "
            "Do not invent a farm, location, moral or explanation. Preserve named animals. "
            "Translate sound words according to the action. Return ONLY a JSON array of "
            "objects with pageNumber (integer) and text (English). Glossary: " + glossary
        )
        prompt = json.dumps([{"pageNumber": p["page_number"], "narration": p["text"],
                              "scene_context": p.get("scene_description", "")}
                             for p in book["pages"]], ensure_ascii=False)
        started = time.time()
        result = request(args.base, "/llm/generate", {"system": system, "prompt": prompt,
                         "model_size": "4B", "temperature": 0, "max_tokens": 3000})
        raw = result["text"].strip()
        if raw.startswith("```"):
            raw = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw)
        try:
            pages = json.loads(raw)
            assert isinstance(pages, list)
            assert [p["pageNumber"] for p in pages] == list(range(1, 11))
            assert all(isinstance(p["text"], str) and re.search("[A-Za-z]", p["text"])
                       and not re.search("[가-힣]", p["text"]) for p in pages)
        except (ValueError, KeyError, TypeError, AssertionError):
            save(args.root / "translation-failures" / (book["id"] + ".json"), result)
            raise ValueError(f"Malformed translation: {book['id']}")
        save(output, {"bookId": book["id"], "sourceSha256": src,
                      "model": "Voicebox Qwen3-4B", "reviewed": False, "pages": pages})
        print(f"DRAFT {book['id']} {time.time()-started:.1f}s", flush=True)


def narration(book, language, root):
    if language == "ko":
        return [p["text"] for p in book["pages"]]
    path = root / "translations" / (book["id"] + ".json")
    if not path.exists():
        return None
    translation = read(path)
    if translation["sourceSha256"] != source_hash(book):
        raise ValueError(f"English source outdated: {book['id']}")
    if translation.get("reviewed") is not True:
        return None
    if [p["pageNumber"] for p in translation["pages"]] != list(range(1, 11)):
        raise ValueError("English page numbering mismatch")
    return [p["text"] for p in translation["pages"]]


def recipe_for(book_id, lang, number, text, seed_overrides):
    return {"text": text, "language": lang, "profile_id": PROFILES[lang],
            "engine": "qwen", "model_size": "1.7B",
            "seed": seed_overrides.get(f"{book_id}/{lang}/p{number:02d}",
                                       int(digest([book_id, lang, number])[:7], 16))}


def recipe_key(recipe):
    return digest({"recipe": recipe, "speed": SPEED[recipe["language"]], "format": "mp3-24k-96k-v1"})


def generate(args):
    request(args.base, "/models/qwen3-4b/unload", {})
    override_path = args.root / "seed-overrides.json"
    seed_overrides = read(override_path) if override_path.exists() else {}
    count = 0
    for book in books(args.root, args.only, args.scope):
        for lang in args.languages.split(","):
            texts = narration(book, lang, args.root)
            if texts is None:
                print(f"WAIT_TRANSLATION {book['id']} {lang}", flush=True)
                continue
            for number, text in enumerate(texts, 1):
                target = args.root / "audio" / book["id"] / lang / f"p{number:02d}"
                target.parent.mkdir(parents=True, exist_ok=True)
                recipe = recipe_for(book['id'], lang, number, text, seed_overrides)
                key = recipe_key(recipe)
                receipt_path = target.with_suffix(".json")
                mp3 = target.with_suffix(".mp3")
                wav = target.with_suffix(".wav")
                if receipt_path.exists():
                    receipt = read(receipt_path)
                    if receipt.get("recipeSha256") != key:
                        raise ValueError(f"Recipe changed; preserve previous output: {target}")
                    if mp3.exists() and digest(mp3.read_bytes()) == receipt["mp3Sha256"]:
                        continue
                    raise ValueError(f"Receipt audio missing or changed: {target}")
                if mp3.exists() and not wav.exists():
                    raise ValueError(f"Unreceipted MP3 without recoverable WAV; preserve it: {mp3}")
                if args.limit and count >= args.limit:
                    return
                started = time.time()
                if wav.exists():
                    request_path = target.with_suffix(".request.json")
                    if not request_path.exists() or read(request_path) != recipe:
                        raise ValueError(f"Unknown existing WAV; preserve it: {wav}")
                    data = wav.read_bytes()
                else:
                    save(target.with_suffix(".request.json"), recipe)
                    data = request(args.base, "/generate/stream", recipe, raw=True)
                    if data[:4] != b"RIFF" or data[8:12] != b"WAVE":
                        raise ValueError(f"Invalid WAV: {book['id']} {lang} {number}")
                    partial_wav = target.with_suffix(".partial.wav")
                    partial_wav.write_bytes(data)
                    partial_wav.replace(wav)
                partial = target.with_suffix(".partial.mp3")
                subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(wav),
                                "-af", SPEED[lang], "-ar", "24000", "-ac", "1",
                                "-b:a", "96k", str(partial)], check=True)
                duration = float(subprocess.check_output([
                    "ffprobe", "-v", "error", "-show_entries", "format=duration",
                    "-of", "default=nw=1:nk=1", str(partial)], text=True).strip())
                if not 1 <= duration <= 180:
                    raise ValueError(f"Unexpected duration {duration}: {target}")
                if mp3.exists():
                    # Recover an interruption after final conversion only when the
                    # exact recorded request and WAV recreate the same MP3 bytes.
                    if digest(mp3.read_bytes()) != digest(partial.read_bytes()):
                        raise ValueError(f"Unknown existing MP3; preserve it: {mp3}")
                    partial.unlink()
                else:
                    partial.replace(mp3)
                save(receipt_path, {"bookId": book["id"], "pageNumber": number,
                     "language": lang, "recipeSha256": key, "request": recipe,
                     "speedFilter": SPEED[lang], "duration": duration,
                     "generationWallSeconds": time.time()-started,
                     "wavSha256": digest(data), "mp3Sha256": digest(mp3.read_bytes()),
                     "status": "generated-awaiting-narration-audit"})
                count += 1
                save(args.root / "progress.json", {"updatedAt": time.time(), "lastBook": book["id"],
                     "lastLanguage": lang, "lastPage": number, "thisRunGenerated": count})
                print(f"GENERATED {book['id']} {lang} p{number:02d} "
                      f"audio={duration:.1f}s wall={time.time()-started:.1f}s", flush=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("stage", choices=["translate", "generate"])
    parser.add_argument("--root", type=pathlib.Path,
                        default=pathlib.Path("D:/tangobook-audio/changjak-series-01-10-20261004"))
    parser.add_argument("--base", default="http://127.0.0.1:17493")
    parser.add_argument("--only", default="")
    parser.add_argument("--scope", choices=["01-10", "11-19", "01-19"], default="01-10")
    parser.add_argument("--limit", type=int, default=0)
    parser.add_argument("--languages", choices=["ko", "en", "ko,en"], default="ko,en")
    args = parser.parse_args()
    if args.limit < 0:
        parser.error("limit must be non-negative")
    if not args.base.startswith("http://127.0.0.1:"):
        parser.error("Voicebox must be a local service")
    args.root.mkdir(parents=True, exist_ok=True)
    # OS lock releases on process exit; retained file is not a stale lock.
    with (args.root / "voicebox-gpu.lock").open("a+b") as lock:
        if lock.seek(0, 2) == 0:
            lock.write(b"0")
            lock.flush()
        lock.seek(0)
        if os.name == "nt":
            import msvcrt
            msvcrt.locking(lock.fileno(), msvcrt.LK_NBLCK, 1)
        else:
            import fcntl
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        state = args.root / (args.stage + "-job.json")
        started = time.time()
        save(state, {"status": "running", "startedAt": started, "pid": os.getpid(),
                     "only": args.only, "languages": args.languages, "limit": args.limit, "scope": args.scope})
        try:
            (translate if args.stage == "translate" else generate)(args)
        except Exception as exc:
            save(state, {"status": "failed", "startedAt": started, "finishedAt": time.time(),
                         "pid": os.getpid(), "error": str(exc)})
            raise
        save(state, {"status": "finished", "startedAt": started, "finishedAt": time.time(),
                     "pid": os.getpid(), "only": args.only, "languages": args.languages,
                     "limit": args.limit, "scope": args.scope,
                     "note": "Generation finished; audit/review remain separate"})


if __name__ == "__main__":
    main()
