// 발행 레코드 하나가 끝날 때까지 기다린다(성공/실패 둘 다 종료).
//   npx tsx scripts/_wait-publish.ts <recordId>
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENV_FILE = [
  path.join(__dirname, '..', '.env'),
  'C:/projects/tangobook/packages/server/.env',
].find((f) => fs.existsSync(f));
if (!ENV_FILE) throw new Error('.env 를 못 찾았다');
for (const line of fs.readFileSync(ENV_FILE, 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
}

const id = process.argv[2];
const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key || !id) throw new Error('SUPABASE_URL/SERVICE_ROLE_KEY/recordId 필요');

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

for (let i = 0; i < 60; i++) {
  const r = await fetch(
    `${url}/rest/v1/mkt_publish_records?id=eq.${id}&select=status,published_url,error_message,retry_count`,
    { headers: { apikey: key, Authorization: `Bearer ${key}` } }
  );
  const [row] = (await r.json()) as {
    status: string;
    published_url: string | null;
    error_message: string | null;
    retry_count: number;
  }[];
  if (!row) {
    console.log('레코드 없음');
    process.exit(1);
  }
  if (row.status !== 'scheduled' && row.status !== 'publishing') {
    console.log(
      `${row.status} ${row.published_url ?? ''} ${row.error_message ? '| ' + row.error_message : ''}`
    );
    process.exit(row.status === 'published' ? 0 : 1);
  }
  await sleep(20000);
}
console.log('시간 초과 — 아직 scheduled');
process.exit(1);
