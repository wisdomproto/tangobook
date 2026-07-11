// UI 로케일 검증 — ko(원문) 대비 각 언어의 키 누락/여분/빈 값 체크.
// 사용: node packages/client/scripts/verify-locales.mjs [lang]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCALES = path.join(__dirname, '..', 'src', 'i18n', 'locales');

function flatten(obj, prefix = '') {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object') Object.assign(out, flatten(v, key));
    else out[key] = v;
  }
  return out;
}

const onlyLang = process.argv[2];
const langs = fs
  .readdirSync(LOCALES)
  .filter((d) => d !== 'ko' && (!onlyLang || d === onlyLang));
const koFiles = fs.readdirSync(path.join(LOCALES, 'ko')).filter((f) => f.endsWith('.json'));

let problems = 0;
for (const lang of langs) {
  for (const file of koFiles) {
    const koFlat = flatten(JSON.parse(fs.readFileSync(path.join(LOCALES, 'ko', file), 'utf-8')));
    const langPath = path.join(LOCALES, lang, file);
    if (!fs.existsSync(langPath)) {
      console.log(`❌ ${lang}/${file}: 파일 없음`);
      problems++;
      continue;
    }
    const langFlat = flatten(JSON.parse(fs.readFileSync(langPath, 'utf-8')));
    const missing = Object.keys(koFlat).filter((k) => !(k in langFlat));
    const extra = Object.keys(langFlat).filter((k) => !(k in koFlat));
    const empty = Object.entries(langFlat).filter(([, v]) => v === '').map(([k]) => k);
    // 보간 변수({{x}}) 불일치
    const varMismatch = Object.keys(koFlat).filter((k) => {
      if (!(k in langFlat)) return false;
      const vars = (s) => String(s).match(/\{\{\w+\}\}/g)?.sort().join(',') ?? '';
      return vars(koFlat[k]) !== vars(langFlat[k]);
    });
    if (missing.length || extra.length || empty.length || varMismatch.length) {
      console.log(`❌ ${lang}/${file}: 누락 ${missing.length} 여분 ${extra.length} 빈값 ${empty.length} 보간불일치 ${varMismatch.length}`);
      if (missing.length) console.log(`   누락: ${missing.slice(0, 5).join(', ')}${missing.length > 5 ? '…' : ''}`);
      if (varMismatch.length) console.log(`   보간: ${varMismatch.slice(0, 5).join(', ')}`);
      problems++;
    }
  }
  if (!problems) console.log(`✅ ${lang}: ${koFiles.length}개 네임스페이스 전부 일치`);
}
if (!langs.length) console.log('(검증할 언어 없음 — locales/ 에 ko 외 폴더 없음)');
process.exit(problems ? 1 : 0);
