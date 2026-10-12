"""Independent medium-model, no-VAD check of low-scoring local narration.

Never supplies the expected text to ASR. Leaves original ASR and audio untouched.
"""
import argparse
import difflib
import hashlib
import json
from pathlib import Path
import re
import time
from faster_whisper import WhisperModel


def read(p):
    return json.loads(p.read_text(encoding='utf-8'))


def save(p, x):
    p.parent.mkdir(parents=True, exist_ok=True)
    q = p.with_suffix('.tmp'); q.write_text(json.dumps(x, ensure_ascii=False, indent=2), encoding='utf-8'); q.replace(p)


def norm(s):
    return re.sub(r'[^가-힣a-z0-9]', '', s.lower())


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=Path('D:/tangobook-audio/library-missing-20261012'))
    parser.add_argument('--follow', action='store_true')
    args = parser.parse_args()
    model = None
    while True:
        for p in sorted((args.root / 'audit-large-v3-vad-v1').glob('*/*/p*.json')):
            primary = read(p)
            if primary['status'] == 'asr-matched':
                continue
            rel = p.relative_to(args.root / 'audit-large-v3-vad-v1')
            target = args.root / 'audit-medium-independent' / rel
            audio = args.root / 'audio' / rel.with_suffix('.mp3')
            if not audio.exists():
                continue
            digest = hashlib.sha256(audio.read_bytes()).hexdigest()
            if digest != primary['mp3Sha256']:
                continue  # A targeted regeneration may be between audio and new primary audit.
            if target.exists() and read(target)['mp3Sha256'] == digest:
                continue
            if model is None:
                model = WhisperModel('medium', device='cpu', compute_type='int8', cpu_threads=6, local_files_only=True)
            segments, _ = model.transcribe(str(audio), language=primary['language'], beam_size=5,
                vad_filter=False, word_timestamps=True, condition_on_previous_text=False,
                hallucination_silence_threshold=0.5)
            segments = list(segments)
            actual = ' '.join(s.text.strip() for s in segments)
            score = difflib.SequenceMatcher(None, norm(primary['expected']), norm(actual)).ratio()
            result = {**{k: primary[k] for k in ('bookId', 'pageNumber', 'language', 'expected')},
                      'mp3Sha256': digest, 'transcribed': actual, 'similarity': score,
                      'asr': 'faster-whisper-medium CPU int8; no expected-text prompt; no VAD',
                      'status': 'secondary-asr-matched' if score >= 0.95 else 'needs-review',
                      'segments': [{'start': float(s.start), 'end': float(s.end), 'text': s.text,
                                    'avgLogprob': s.avg_logprob, 'noSpeechProb': s.no_speech_prob} for s in segments]}
            save(target, result)
            print(f"SECONDARY {rel.as_posix()} score={score:.3f} {actual}", flush=True)
            if score >= 0.95:
                review_path = args.root / 'asr-review.json'
                reviews = read(review_path) if review_path.exists() else {}
                reviews[rel.with_suffix('').as_posix()] = {'status': 'pass', 'mp3Sha256': digest,
                     'basis': 'Independent non-prompted medium ASR recovers source; similarity >= 0.95',
                     'primarySimilarity': primary['similarity'], 'secondarySimilarity': score}
                save(review_path, reviews)
        state = read(args.root / 'generate-job.json')
        primary_count = len(list((args.root / 'audit-large-v3-vad-v1').glob('*/*/p*.json')))
        if not args.follow or (state['status'] == 'finished' and primary_count == state['expected']):
            return
        time.sleep(10)


if __name__ == '__main__':
    main()
