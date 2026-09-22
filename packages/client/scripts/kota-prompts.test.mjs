import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { test } from 'node:test';

// Exercise the generated copy functions without starting the app or touching stored images.
const publicDir = new URL('../public/', import.meta.url);
const core = fs.readFileSync(new URL('kota-core.js', publicDir), 'utf8');
const html = fs.readFileSync(new URL('kota-05.html', publicDir), 'utf8');
const guests = JSON.parse(html.match(/window.SH_GUESTS=(\[[\s\S]*?\])<\/script>/)[1]);
const ctx = { window: { SH_GUESTS: guests } };
vm.createContext(ctx);
const variables = core.slice(core.indexOf('  var KEY ='), core.indexOf('  (function', core.indexOf('  var KEY =')));
const functions = core.slice(core.indexOf('  var GUESTS ='), core.indexOf('  function collectPages'));
vm.runInContext(`${variables}\n${functions}\nthis.api = { composeBatchPrompt, sheetPrompt };`, ctx);
const scenes = JSON.parse(fs.readFileSync(new URL('../../../docs/changjak-books/kota/_scenes.json', import.meta.url)));
const plain = (s) => s.replace(/<br\s*\/?>/g, '\n').replace(/<[^>]*>/g, '');

test('hippo page keeps its own face and includes clothing/reference instructions', () => {
  const scene = plain(scenes['05'].p2);
  const prompt = ctx.api.composeBatchPrompt([{ label: 'p2', scene }]);
  assert.match(prompt, /참조 우선:/);
  assert.match(prompt, /CLOTH: default[^]*OCHRE/);
  assert.match(prompt, /deep AZURE/);
  assert.match(prompt, /robe keeps the exact colour and cut of the attached guest reference/);
  assert.match(scene, /놀라 눈이 커졌다/);
  assert.doesNotMatch(scene, /먹 도형|먹 줄|두 조각|눈 크기는/);
  const appear = prompt.match(/\[등장\] ([^\n]*)\n/)[1];
  assert.match(appear, /@image1\(코타\)/);
  assert.match(appear, /@image9\(하마 손님\)/);
  assert.doesNotMatch(appear, /@image2/);
});

test('guest sheet contains both species identity and shared clothing continuity', () => {
  const sheet = ctx.api.sheetPrompt('hippo');
  assert.ok(sheet.includes(guests[0].desc));
  assert.match(sheet, /robe keeps the exact colour/);
  assert.doesNotMatch(sheet, /이 문서를 고칠 때|ONE flat ink shape/);
});

test('acting notes do not add an off-screen character to the drawing', () => {
  const prompt = ctx.api.composeBatchPrompt([{ label: 'detail', scene: '인물 없음\n표정 연기\n코타와 아빠, 하마 손님의 외형을 참고한다.' }]);
  assert.match(prompt, /\[등장\] \(배경\/사물 컷\)/);
});
