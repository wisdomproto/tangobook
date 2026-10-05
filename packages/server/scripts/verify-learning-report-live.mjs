// Explicitly requested live QA. Writes ONLY newly created, labelled QA accounts.
// Credentials/results stay in ignored scratch/, never print passwords or tokens.
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { randomUUID, randomBytes } from 'node:crypto';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { KOREAN_PHONICS_CURRICULUM, ENGLISH_PHONICS_CURRICULUM } from '@tangobook/shared';

dotenv.config({ path: resolve('packages/server/.env'), quiet: true });
dotenv.config({ path: resolve('.env'), quiet: true });
dotenv.config({ path: resolve('packages/client/.env.local'), quiet: true });
const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const anon = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !anon || !service) throw new Error('Required QA environment missing');
const admin = createClient(url, service, { auth: { persistSession: false } });
const dir = resolve('scratch/learning-report-live-qa');
await mkdir(dir, { recursive: true });
const credentialsFile = resolve(dir, 'credentials.json');
let credentials;
try { credentials = JSON.parse(await readFile(credentialsFile, 'utf8')); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
const checked = (result) => { if (result.error) throw new Error(result.error.message); return result.data; };
if (!credentials) {
  credentials = { run: `learning-qa-${Date.now()}`, createdAt: new Date().toISOString(), accounts: [] };
  for (const label of ['primary', 'isolation']) {
    const email = `qa.learning.${Date.now()}.${label}@example.com`;
    const password = `Qa!${randomBytes(18).toString('base64url')}8`;
    const { user } = checked(await admin.auth.admin.createUser({
      email, password, email_confirm: true,
      user_metadata: { qa_only: true, qa_purpose: 'learning report verification' },
    }));
    credentials.accounts.push({ label, email, password, id: user.id });
    await writeFile(credentialsFile, JSON.stringify(credentials, null, 2));
  }
}
assert.equal(credentials.accounts.length, 2, 'Both QA accounts must exist');
const clients = [];
for (const account of credentials.accounts) {
  const client = createClient(url, anon, { auth: { persistSession: false } });
  checked(await client.auth.signInWithPassword({ email: account.email, password: account.password }));
  assert.equal(checked(await client.auth.getUser()).user.id, account.id);
  const owned = checked(await client.from('child_profiles').select('*').eq('account_id', account.id));
  const names = account.label === 'primary' ? ['테스트민준', '테스트서연', '다국어테스트', '빈기록테스트'] : ['격리테스트'];
  account.profiles = [];
  for (const name of names) {
    const profile = owned.find(p => p.name === name) || checked(await client.from('child_profiles')
      .insert({ account_id: account.id, name, avatar_id: 'hori', birth_date: '2021-03-01' }).select('*').single());
    account.profiles.push({ id: profile.id, name });
  }
  // PIN setup prevents onboarding from blocking browser QA; private credential file only.
  account.pin = account.pin || String(Math.floor(1000 + Math.random() * 9000));
  checked(await client.rpc('set_pin', { raw_pin: account.pin }));
  clients.push(client);
}
await writeFile(credentialsFile, JSON.stringify(credentials, null, 2));
const [primary, isolation] = clients;
const [childA, childB, multilingual, empty] = credentials.accounts[0].profiles;
const isolated = credentials.accounts[1].profiles[0];
const response = await fetch('https://www.tangobook.co.kr/api/storybooks');
if (!response.ok) throw new Error('Published storybook list unavailable');
const payload = await response.json();
const books = Array.isArray(payload) ? payload : (payload.data || payload.storybooks || []);
const story = books.find(b => b.type !== 'phonics' && b.isPublic !== false);
if (!story) throw new Error('No published sample book found');
let fixtures;
const fixturesFile = resolve(dir, 'fixtures.json');
try { fixtures = JSON.parse(await readFile(fixturesFile, 'utf8')); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
if (!fixtures) {
  fixtures = [];
  const ko = [...new Set(KOREAN_PHONICS_CURRICULUM.flatMap(l => l.units.flatMap(u => u.sampleWords)))];
  const en = [...new Set(ENGLISH_PHONICS_CURRICULUM.flatMap(l => l.units.flatMap(u => u.sampleWords)))];
  const now = Date.now();
  const add = (profile, eventType, word, lang, ageDays, meta = {}) => {
    fixtures.push({ id: randomUUID(), profile_id: profile.id, event_type: eventType,
      word, storybook_id: story.id, game_type: eventType.includes('correct') || eventType.includes('wrong') ? 'korean-block' : null,
      created_at: new Date(now - ageDays * 86400000 - (fixtures.length % 100) * 1000).toISOString(),
      metadata: { schemaVersion: 2, lang, source: 'storybook', qaRun: credentials.run, ...meta } });
  };
  for (const [profile, language, vocabulary, count] of [[childA, 'ko', ko, 1400], [childB, 'en', en, 1100]]) {
    for (let i = 0; i < count; i++) {
      const word = vocabulary[i % vocabulary.length];
      const type = i % 4 === 0 ? 'word_wrong' : i % 4 === 1 ? 'word_correct' : 'word_exposed';
      add(profile, type, word, language, i % 30,
        type === 'word_exposed' ? {} : { skill: i % 3 ? 'building' : 'tracing',
          firstAttempt: true, evidence: i % 3 ? 'first-attempt' : 'completion',
          source: i % 7 === 0 ? 'phonics' : 'storybook' });
    }
  }
  // Deliberate diagnostic cases: exposure-only target, frequent errors, mastered target,
  // writing-only evidence, old evidence, speech-only, coda, repeated timestamps.
  for (let i = 0; i < 18; i++) add(childA, 'word_exposed', '아기', 'ko', i % 6);
  for (let i = 0; i < 12; i++) add(childA, 'word_wrong', '고기', 'ko', i % 4,
    { source: 'phonics', unitId: 'kr-h1-u02', skill: 'building', evidence: 'first-attempt', firstAttempt: true });
  for (let i = 0; i < 8; i++) add(childA, 'word_correct', '가구', 'ko', i % 3,
    { source: 'phonics', unitId: 'kr-h1-u02', skill: 'building', evidence: 'first-attempt', firstAttempt: true });
  for (let i = 0; i < 5; i++) add(childA, 'word_correct', '강', 'ko', 1,
    { skill: 'tracing', evidence: 'completion', coda: 'ㅇ' });
  add(childA, 'word_correct', '옛기록', 'ko', 20, { schemaVersion: undefined });
  add(childA, 'word_spoken', '발음만', 'ko', 0, { skill: 'participation', evidence: 'participation' });
  add(childA, 'word_exposed', '진단단어', 'ko', 0);
  for (const [lang, word] of [['vi', 'cá'], ['zh', '鱼'], ['th', 'ปลา']])
    for (let i = 0; i < 100; i++) add(multilingual, i % 5 ? 'word_exposed' : 'word_correct', word, lang, i % 14,
      i % 5 ? {} : { skill: 'meaning', evidence: 'first-attempt', firstAttempt: true });
  add(isolated, 'word_exposed', '격리전용', 'ko', 0);
  await writeFile(fixturesFile, JSON.stringify(fixtures, null, 2));
}
const accountsProfiles = new Set(credentials.accounts.flatMap(a => a.profiles.map(p => p.id)));
const stageArgument = process.argv.find(arg => arg.startsWith('--adaptive-stage='));
if (stageArgument) {
  const stage = stageArgument.split('=')[1];
  assert(['before', 'after'].includes(stage), 'Unknown adaptive QA stage');
  if (!fixtures.some(e => e.metadata.qaStage === stage)) {
    const types = stage === 'before' ? ['word_exposed', 'word_wrong', 'word_wrong'] : ['word_correct', 'word_correct'];
    types.forEach((event_type, index) => fixtures.push({
      id: randomUUID(), profile_id: empty.id, event_type,
      word: event_type === 'word_exposed' ? '아기' : '고기',
      storybook_id: event_type === 'word_exposed' ? story.id : 'kr-h1-u02',
      game_type: event_type === 'word_exposed' ? null : 'korean-block',
      created_at: new Date(Date.now() - (types.length - index) * 1000).toISOString(),
      metadata: { schemaVersion: 2, lang: 'ko', source: event_type === 'word_exposed' ? 'storybook' : 'phonics',
        unitId: event_type === 'word_exposed' ? undefined : 'kr-h1-u02', skill: 'building',
        evidence: 'first-attempt', firstAttempt: true, qaRun: credentials.run, qaStage: stage },
    }));
    await writeFile(fixturesFile, JSON.stringify(fixtures, null, 2));
  }
}
assert(fixtures.every(e => accountsProfiles.has(e.profile_id) && e.metadata.qaRun === credentials.run));
const skipUnsupported = process.argv.includes('--skip-unsupported');
const activeFixtures = skipUnsupported ? fixtures.filter(e => !['vi', 'zh', 'th'].includes(e.metadata.lang)) : fixtures;
for (const [client, account] of [[primary, credentials.accounts[0]], [isolation, credentials.accounts[1]]]) {
  const owned = new Set(account.profiles.map(p => p.id));
  const rows = activeFixtures.filter(e => owned.has(e.profile_id));
  for (let offset = 0; offset < rows.length; offset += 100)
    checked(await client.from('learning_events').upsert(rows.slice(offset, offset + 100), { onConflict: 'id', ignoreDuplicates: true }));
}
const summary = { run: credentials.run, totalFixtures: fixtures.length, seededFixtures: activeFixtures.length,
  pendingMultilingual: fixtures.length - activeFixtures.length,
  book: { id: story.id, title: story.title }, checks: [] };
const check = (name, success, details) => { assert(success, name); summary.checks.push({ name, passed: true, details }); };
for (const profile of credentials.accounts[0].profiles) {
  const expected = activeFixtures.filter(e => e.profile_id === profile.id).length;
  const query = await primary.from('learning_events').select('id', { count: 'exact', head: true }).eq('profile_id', profile.id);
  checked(query); check(`exact count ${profile.name}`, query.count === expected, query.count);
}
// Same event replay must not award twice or alter server word mastery.
const replay = fixtures.find(e => e.profile_id === childA.id && e.event_type === 'word_correct');
const ledgerCount = async () => { const r = await primary.from('star_ledger').select('id', { count: 'exact', head: true }).eq('profile_id', childA.id); checked(r); return r.count; };
const mastery = async () => checked(await primary.from('word_mastery').select('*').eq('profile_id', childA.id).eq('word', replay.word));
const ledgerBefore = await ledgerCount(); const masteryBefore = await mastery();
checked(await primary.from('learning_events').upsert([replay], { onConflict: 'id', ignoreDuplicates: true }));
check('event replay reward idempotency', await ledgerCount() === ledgerBefore, ledgerBefore);
check('event replay mastery idempotency', JSON.stringify(await mastery()) === JSON.stringify(masteryBefore));
if (!skipUnsupported) {
  for (const [lang, word] of [['vi', 'cá'], ['zh', '鱼'], ['th', 'ปลา']]) {
    const rows = checked(await primary.from('learning_events').select('*').eq('profile_id', multilingual.id).eq('metadata->>lang', lang));
    check(`multilingual events ${lang}`, rows.length === 100 && rows.every(row => row.word === word), rows.length);
    const wordRow = checked(await primary.from('word_mastery').select('*').eq('profile_id', multilingual.id).eq('language', lang).eq('word', word).single());
    check(`multilingual mastery ${lang}`, wordRow.exposed === 80 && wordRow.correct === 20 && wordRow.wrong === 0,
      { exposed: wordRow.exposed, correct: wordRow.correct, wrong: wordRow.wrong });
    checked(await primary.from('learning_events').upsert(rows.filter(row => row.event_type === 'word_correct'), { onConflict: 'id', ignoreDuplicates: true }));
    const afterReplay = checked(await primary.from('word_mastery').select('*').eq('profile_id', multilingual.id).eq('language', lang).eq('word', word).single());
    check(`multilingual replay idempotency ${lang}`, JSON.stringify(afterReplay) === JSON.stringify(wordRow));
  }
}
check('cross-account select RLS', checked(await primary.from('learning_events').select('id').eq('profile_id', isolated.id)).length === 0);
const denied = await primary.from('learning_events').insert({ id: randomUUID(), profile_id: isolated.id, event_type: 'word_exposed', word: '침범금지', metadata: { qaRun: credentials.run } });
check('cross-account insert RLS', !!denied.error, denied.error?.code);
check('anonymous select RLS', checked(await createClient(url, anon).from('learning_events').select('id').eq('profile_id', childA.id)).length === 0);
// Mirror production cursor pagination exactly; compare every ID with manifest.
for (const profile of [childA, childB]) {
  let cursor; const received = []; let total = 0;
  while (true) {
    let req = primary.from('learning_events').select('*', cursor ? undefined : { count: 'exact' }).eq('profile_id', profile.id)
      .order('created_at', { ascending: false }).order('id', { ascending: false });
    if (cursor) req = req.or(`created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.lt.${cursor.id})`);
    const result = await req.range(0, 499); const page = checked(result);
    if (!cursor) total = result.count; received.push(...page); cursor = page.at(-1);
    if (page.length < 500) break;
  }
  const expectedIds = fixtures.filter(e => e.profile_id === profile.id).map(e => e.id).sort();
  check(`cursor pagination ${profile.name}`, received.length === total && JSON.stringify(received.map(e => e.id).sort()) === JSON.stringify(expectedIds), { total, distinct: new Set(received.map(e => e.id)).size });
  await writeFile(resolve(dir, `${profile.name}-server-events.json`), JSON.stringify(received, null, 2));
}
await writeFile(resolve(dir, 'api-results.json'), JSON.stringify(summary, null, 2));
console.log(JSON.stringify({ ...summary, accounts: credentials.accounts.map(a => ({ label: a.label, email: a.email, profiles: a.profiles })), credentialsFile }, null, 2));
