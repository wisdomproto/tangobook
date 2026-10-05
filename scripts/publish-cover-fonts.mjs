/** Publish only the explicitly requested immutable font versions. No book writes. */
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const workspace = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(path.join(workspace, 'packages/server/package.json'));
const args = process.argv.slice(2);
const option = (key) => args.includes(key) ? args[args.indexOf(key)+1] : undefined;
const output = option('--output');
if (!output) throw new Error('Pass --output <local evidence folder>');
const publish = args.includes('--publish');
const cdn = 'https://assets.tangobook.co.kr';
const root = path.join(workspace, 'assets/fonts/tangobook-story-hand');
let r2, bucket, PutObjectCommand, GetObjectCommand;
if (publish) {
  const envFile = option('--env');
  if (!envFile) throw new Error('Pass --env <existing server env file> with --publish');
  require('dotenv').config({path: envFile, quiet: true});
  const sdk = require('@aws-sdk/client-s3');
  ({PutObjectCommand, GetObjectCommand} = sdk);
  bucket = process.env.R2_BUCKET_NAME;
  if (!bucket || !process.env.R2_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) throw new Error('Missing R2 configuration');
  r2 = new sdk.S3Client({region:'auto', endpoint:`https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`, credentials:{accessKeyId:process.env.R2_ACCESS_KEY_ID, secretAccessKey:process.env.R2_SECRET_ACCESS_KEY}, maxAttempts:3});
}
const sha = (data) => createHash('sha256').update(data).digest('hex');
const records = [], objects = [];
const files = [];
for (const [version, folder, stem, family, languages] of [
  ['0.1.0','dist','TangoBookStoryHand-Trial-Regular','TangoBook Story Hand Trial',['ko','en']],
  ['0.2.0','dist-asian','TangoBookStoryHand-AsianTrial-Regular','TangoBook Story Hand Asian Trial',['ko','en','ja','zh','vi','th','ms','id']],
]) {
  const directory = path.join(root,folder);
  const coverage = JSON.parse(await fs.readFile(path.join(directory,'coverage.json'),'utf8'));
  const verification = JSON.parse(await fs.readFile(path.join(directory,'verification.json'),'utf8'));
  const prefix = `fonts/tangobook-story-hand/${version}`;
  const ttf = await fs.readFile(path.join(directory,stem+'.ttf'));
  const web = await fs.readFile(path.join(directory,stem+'.woff2'));
  records.push({id:`tangobook-story-hand-${version}`,family,version,usage:'storybook-cover',status:'title-subset-trial',preferred:version==='0.2.0',languages,ttf_url:`${cdn}/${prefix}/${stem}.ttf`,woff2_url:`${cdn}/${prefix}/${stem}.woff2`,ttf_sha256:sha(ttf),woff2_sha256:sha(web),coverage,metadata:{verification,coverageUrl:`${cdn}/${prefix}/coverage.json`,fullLanguageCoverage:false,instructions:'docs/cover-fonts.md'}});
  for (const [filename, contentType] of [[stem+'.ttf','font/ttf'],[stem+'.woff2','font/woff2'],['coverage.json','application/json'],['verification.json','application/json']]) {
    files.push({key:`${prefix}/${filename}`,data:await fs.readFile(path.join(directory,filename)),contentType});
  }
}
files.push({key:'fonts/tangobook-story-hand/registry-20261005.json',data:Buffer.from(JSON.stringify({schemaVersion:1,records},null,2)+'\n'),contentType:'application/json'});
// Preflight every object before starting a write. Existing different bytes are an error.
for (const item of files) {
  if (!publish) continue;
  try {
    const response = await r2.send(new GetObjectCommand({Bucket:bucket,Key:item.key}));
    const existing = Buffer.from(await response.Body.transformToByteArray());
    if (sha(existing)!==sha(item.data)) throw new Error(`Immutable object differs: ${item.key}`);
    item.exists = true;
  } catch (error) {
    if (error.$metadata?.httpStatusCode!==404) throw error;
  }
}
for (const item of files) {
  if (publish && !item.exists) await r2.send(new PutObjectCommand({Bucket:bucket,Key:item.key,Body:item.data,ContentType:item.contentType,CacheControl:'public, max-age=31536000, immutable',IfNoneMatch:'*',Metadata:{sha256:sha(item.data)}}));
  if (publish) {
    const response = await fetch(`${cdn}/${item.key}`,{signal:AbortSignal.timeout(30000)});
    if (!response.ok) throw new Error(`CDN verification HTTP ${response.status}: ${item.key}`);
    if (sha(Buffer.from(await response.arrayBuffer()))!==sha(item.data)) throw new Error(`CDN hash differs: ${item.key}`);
  }
  objects.push({key:item.key,url:`${cdn}/${item.key}`,contentType:item.contentType,bytes:item.data.length,sha256:sha(item.data),verified:publish});
}
await fs.mkdir(output,{recursive:true});
await fs.writeFile(path.join(output,'font-registry.json'),JSON.stringify({schemaVersion:1,records,objects},null,2)+'\n');
const quote = (value) => "'"+String(value).replaceAll("'","''")+"'";
const sql = records.map((record) => {
  const fields = Object.keys(record);
  const values = fields.map((field) => field==='languages' ? `ARRAY[${record[field].map(quote).join(',')}]::text[]` : ['coverage','metadata'].includes(field) ? quote(JSON.stringify(record[field]))+'::jsonb' : typeof record[field]==='boolean' ? String(record[field]) : quote(record[field]));
  return `insert into public.cover_font_assets (${fields.join(',')}) values (${values.join(',')}) on conflict (id) do nothing;`;
}).join('\n');
await fs.writeFile(path.join(output,'register-fonts.sql'),'begin;\n'+sql+'\ncommit;\n');
console.log(JSON.stringify({published:publish,versions:records.map(record=>record.version),verifiedObjects:publish ? objects.length : 0,output}));
