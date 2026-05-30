// 번역 파이프라인 공통 모듈. translate-extract / translate-apply / translate-verify 가 공유.
// R2 접근(.env 파싱 + S3Client), storybook GET/PUT, CLI 파싱, 경로 헬퍼.
import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const VARIANT_RE = /__L\d+$/;
export const HANGUL_RE = /[가-힣]/;

export function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  const envText = fs.readFileSync(envPath, 'utf-8');
  for (const line of envText.split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
}

let _s3;
let _bucket;
function r2() {
  if (!_s3) {
    loadEnv();
    _s3 = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      },
    });
    _bucket = process.env.R2_BUCKET_NAME;
  }
  return { s3: _s3, bucket: _bucket };
}

export async function listStorybookKeys() {
  const { s3, bucket } = r2();
  const keys = [];
  let token;
  do {
    const out = await s3.send(
      new ListObjectsV2Command({ Bucket: bucket, Prefix: 'storybook-', ContinuationToken: token })
    );
    (out.Contents ?? []).forEach((o) => {
      if (o.Key && o.Key.endsWith('.json')) keys.push(o.Key);
    });
    token = out.IsTruncated ? out.NextContinuationToken : undefined;
  } while (token);
  return keys;
}

export async function getJsonByKey(key) {
  const { s3, bucket } = r2();
  const out = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  return JSON.parse(await out.Body.transformToString('utf-8'));
}

export const getStorybook = (id) => getJsonByKey(`storybook-${id}.json`);

export async function putStorybook(id, data) {
  const { s3, bucket } = r2();
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: `storybook-${id}.json`,
      Body: JSON.stringify(data),
      ContentType: 'application/json',
    })
  );
}

/** `--lang=vi --id=123 --all` → { lang:'vi', id:'123', _:[], flags:Set{'all'} } */
export function parseArgs(argv) {
  const args = { _: [], flags: new Set() };
  for (const a of argv) {
    const m = a.match(/^--([^=]+)=(.*)$/);
    if (m) args[m[1]] = m[2];
    else if (a.startsWith('--')) args.flags.add(a.slice(2));
    else args._.push(a);
  }
  return args;
}

/** 번역 소스 디렉토리: scripts/_data/translations/<lang>/ */
export function langDir(lang) {
  return path.join(__dirname, '_data', 'translations', lang);
}
