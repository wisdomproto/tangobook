import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { test } from 'node:test';

const core = fs.readFileSync(new URL('../public/pipo-core.js', import.meta.url), 'utf8');
const ctx = { window: {} };
vm.createContext(ctx);
vm.runInContext(
  core.slice(core.indexOf('  var KEY ='), core.indexOf('  (function', core.indexOf('  var KEY ='))) +
  '\n' + core.slice(core.indexOf('  var GUESTS ='), core.indexOf('  function collectPages')) +
  '\nthis.api = { sheetPrompt, ALL, ANCHOR };', ctx
);

test('each Pipo sheet uses a compact individual reference prompt', () => {
  assert.equal(ctx.api.ALL.length, 5);
  for (const c of ctx.api.ALL) {
    const prompt = ctx.api.sheetPrompt(c.key);
    assert.ok(prompt.includes(c.spec), c.name);
    assert.ok(prompt.length < 5000, `${c.name}: ${prompt.length}`);
    assert.match(prompt, /PIPO STORYBOOK CHARACTER SHEET/);
    assert.match(prompt, /실제로 첨부/);
    assert.doesNotMatch(prompt, /STAGE CLAUSES|CHARACTER DESIGN LANGUAGE|Drawn Across Borders|#FF00FF/);
    for (const other of ctx.api.ALL.filter(x => x.key !== c.key)) assert.ok(!prompt.includes(other.spec));
  }
});

test('five identity specifications follow the supplied page designs', () => {
  const get = key => ctx.api.sheetPrompt(key);
  assert.match(get('pipo'), /WHITE puppy/);
  assert.match(get('pipo'), /Long charcoal-black floppy ears/);
  assert.match(get('mom'), /WHITE adult dog/);
  assert.match(get('mom'), /rounded arms ending in simple paw-like hands/);
  assert.match(get('sheep'), /white\/cream curly wool/);
  assert.match(get('goose'), /Broad feathered wings/);
  assert.match(get('horse'), /LIGHT-GREY upright horse/);
  assert.match(get('horse'), /tail hangs from the rump/);
  assert.match(get('horse'), /no pectorals, abs, biceps/);
  assert.doesNotMatch(ctx.api.ANCHOR.text, /SIX HEADS TALL|THE WIDEST SHOULDERS|ONE SHORT TASSEL|RUBBED DARK SMUDGE|SHADING IS ZERO/);
});
