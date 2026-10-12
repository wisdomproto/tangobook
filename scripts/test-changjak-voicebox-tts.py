"""Scope and source-integrity regressions for resumable narration."""
import importlib.util
import pathlib
import tempfile
import unittest

spec=importlib.util.spec_from_file_location('tts',pathlib.Path(__file__).with_name('changjak-voicebox-tts.py'))
tts=importlib.util.module_from_spec(spec);spec.loader.exec_module(tts)
batch_spec=importlib.util.spec_from_file_location('batch',pathlib.Path(__file__).with_name('changjak-voicebox-batch.py'))
batch=importlib.util.module_from_spec(batch_spec);batch_spec.loader.exec_module(batch)


class NarrationIntegrityTests(unittest.TestCase):
    def test_localized_windows_connection_failure_can_retry(self):
        self.assertTrue(batch.transient_generation_error('<urlopen error [WinError 10061] 대상 컴퓨터에서 연결을 거부>'))
        self.assertTrue(batch.transient_generation_error('HTTP Error 503: unavailable'))
        self.assertFalse(batch.transient_generation_error('Audit/receipt version mismatch'))
        self.assertFalse(batch.transient_generation_error('Existing MP3 hash mismatch'))

    def test_original_scope_and_new_series_boundaries(self):
        old=tts.scope_ids('01-10');new=tts.scope_ids('11-19');all_books=tts.scope_ids('01-19')
        self.assertEqual((len(old),len(new),len(all_books)),(500,350,850))
        self.assertEqual(old&new,set());self.assertEqual(old|new,all_books)
        self.assertIn('changjak-lulu-50',old);self.assertNotIn('changjak-bung-01',old)
        self.assertIn('changjak-kota-25',new);self.assertNotIn('changjak-kota-26',new)
        with self.assertRaises(ValueError):tts.scope_ids('all-but-unknown')

    def test_duplicate_inventory_is_rejected(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=pathlib.Path(tmp);rows=[{'id':bid} for bid in sorted(tts.scope_ids('01-19'))]
            rows.append(rows[0]);tts.save(root/'inventory.json',{'perBook':rows})
            with self.assertRaises(ValueError):list(tts.books(root,'','01-19'))

    def test_changed_korean_cannot_narrate_old_english(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=pathlib.Path(tmp);book={'id':'changjak-kota-01','title':'Original','characters':[],
                'pages':[{'page_number':n,'text':'Korean source','scene_description':'Scene'} for n in range(1,11)]}
            translated={'sourceSha256':tts.source_hash(book),'reviewed':True,
                'pages':[{'pageNumber':n,'text':'English narration.'} for n in range(1,11)]}
            tts.save(root/'translations/changjak-kota-01.json',translated)
            self.assertEqual(len(tts.narration(book,'en',root)),10)
            translated['reviewed']=False;tts.save(root/'translations/changjak-kota-01.json',translated)
            self.assertIsNone(tts.narration(book,'en',root))
            book['pages'][0]['text']='Updated source'
            with self.assertRaises(ValueError):tts.narration(book,'en',root)

    def test_reuse_key_keeps_old_recipe_and_changes_with_text(self):
        bid='changjak-pongi-01';text='Original narration.'
        legacy={'text':text,'language':'ko','profile_id':tts.PROFILES['ko'],'engine':'qwen',
            'model_size':'1.7B','seed':104001}
        recipe=tts.recipe_for(bid,'ko',1,text,{bid+'/ko/p01':104001})
        self.assertEqual(recipe,legacy)
        legacy_key=tts.digest({'recipe':legacy,'speed':'atempo=0.85','format':'mp3-24k-96k-v1'})
        self.assertEqual(tts.recipe_key(recipe),legacy_key)
        altered=tts.recipe_for(bid,'ko',1,'Revised narration.',{bid+'/ko/p01':104001})
        self.assertNotEqual(tts.recipe_key(altered),legacy_key)


if __name__=='__main__':unittest.main()
