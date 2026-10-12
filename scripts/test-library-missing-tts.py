"""Offline guards for a source-bound narration batch; no Voicebox/R2 calls."""
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('missing_tts', Path(__file__).with_name('library-missing-tts.py'))
batch = importlib.util.module_from_spec(spec)
spec.loader.exec_module(batch)


class SourceGuards(unittest.TestCase):
    def test_media_updates_do_not_change_source_but_text_changes_do(self):
        book = {'title': 'Book', 'pages': [{'pageNumber': 1, 'text': 'Original', 'scene_description': 'Scene'}]}
        before = batch.source_hash(book)
        book['pages'][0].update(ttsUrl='new.mp3', illustrationUrl='new.webp')
        self.assertEqual(batch.source_hash(book), before)
        book['pages'][0]['text'] = 'Edited'
        self.assertNotEqual(batch.source_hash(book), before)

    def test_translation_requires_review_and_matching_source(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            job = {'bookId': '1', 'pageNumber': 1, 'sourceSha256': 'source', 'existingText': None}
            self.assertIsNone(batch.resolve_text(root, job))
            target = root / 'translations' / '1.json'
            target.parent.mkdir()
            record = {'sourceSha256': 'source', 'reviewed': False, 'pages': [{'pageNumber': 1, 'text': 'Hello!'}]}
            target.write_text(json.dumps(record), encoding='utf-8')
            self.assertIsNone(batch.resolve_text(root, job))
            record['reviewed'] = True
            target.write_text(json.dumps(record), encoding='utf-8')
            self.assertEqual(batch.resolve_text(root, job), 'Hello!')
            record['sourceSha256'] = 'different'
            target.write_text(json.dumps(record), encoding='utf-8')
            with self.assertRaises(ValueError):
                batch.resolve_text(root, job)


if __name__ == '__main__':
    unittest.main()
