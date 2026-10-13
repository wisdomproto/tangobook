import copy, importlib.util, unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location('cleanup', Path(__file__).with_name('remove-unused-zodiac.py'))
cleanup = importlib.util.module_from_spec(spec); spec.loader.exec_module(cleanup)

class CleanupTests(unittest.TestCase):
    def test_english_story_removed_lesson_and_word_media_preserved(self):
        book = {'id': 'en-b1-u01', 'type': 'phonics', 'pages': [{'text': 'Hoppy walks.', 'ttsUrl': 'old.mp3'}],
                'characters': [{'name': 'Hoppy'}], 'phonicsLesson': {'letters': ['a']},
                'flashcards': [{'word': 'cat', 'imageUrl': 'cat.webp', 'ttsUrl': 'cat.mp3'}]}
        before = copy.deepcopy(book); after = cleanup.transform(book, [])
        self.assertEqual(book, before)
        self.assertEqual(after['pages'], [])
        self.assertEqual(after['characters'], [])
        self.assertEqual(after['phonicsLesson'], before['phonicsLesson'])
        self.assertEqual(after['flashcards'], before['flashcards'])

    def test_hori_pages_immutable_and_wrong_version_rejected(self):
        book = {'id': 'kr-h1-u01', 'type': 'phonics', 'pages': [{'text': '호리가 토토와 걸어요.', 'illustrationUrl': 'hori.webp'}],
                'characters': [{'name': '호돌이'}], 'coverPrompt': '호돌이의 숲'}
        after = cleanup.transform(book, [{'name': '호리'}, {'name': '토토'}, {'name': '호돌이'}])
        self.assertEqual(after['pages'], book['pages'])
        self.assertEqual(after['characters'], [{'name': '호리'}, {'name': '토토'}])
        self.assertNotIn('coverPrompt', after)
        book['pages'][0]['text'] = '호돌이가 걸어요.'
        with self.assertRaises(AssertionError): cleanup.transform(book, [{'name': '호리'}])

    def test_dependent_media_removed_and_plain_adjective_preserved(self):
        result = cleanup.clean({'sentence': 'Hoppy sat.', 'sentenceTtsUrl': 'old.mp3',
                                'imageDescription': 'Hoppy sits', 'imageUrl': 'old.webp',
                                'ttsUrl': 'hip.mp3', 'word': 'hip'})
        self.assertNotIn('sentenceTtsUrl', result)
        self.assertNotIn('imageUrl', result)
        self.assertEqual(result['ttsUrl'], 'hip.mp3')
        self.assertFalse(cleanup.retired('Fluffy cloud'))
        self.assertEqual(cleanup.clean([{'name': 'Fluffy cloud', 'nameEn': 'cloud'}]),
                         [{'name': 'Fluffy cloud', 'nameEn': 'cloud'}])
        self.assertTrue(cleanup.retired("Woof's paw"))
        self.assertEqual(cleanup.url_key('https://assets.tangobook.co.kr/x%20y.webp'),
                         cleanup.url_key('https://pub-example.r2.dev/x%20y.webp'))

if __name__ == '__main__': unittest.main()
