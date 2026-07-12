// 게임 칭찬(정답) 효과음을 언어별로 생성 → R2 system-sounds/{lang}/correct/*.mp3 직접 업로드.
// 한글/영어처럼 언어당 5개, 게임이 랜덤 재생. Google Cloud TTS(단어 음원과 같은 보이스).
// 서버/어휘배치와 무관하게 R2 에 직접 PUT (서버 재시작 불필요).
//
// 사용: node packages/server/scripts/generate-praise-sounds.mjs [--lang chinese] [--dry-run]
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { loadEnv } from './translation-core.mjs';

loadEnv();

const argv = process.argv;
const argVal = (f) => {
  const i = argv.indexOf(f);
  return i >= 0 ? argv[i + 1] : undefined;
};
const DRY = argv.includes('--dry-run');
const ONLY = argVal('--lang');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const KEY = process.env.GOOGLE_TTS_API_KEY || process.env.GEMINI_API_KEY;
const PUBLIC = process.env.R2_PUBLIC_URL;

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});
const BUCKET = process.env.R2_BUCKET_NAME;

// 언어별 아동친화 칭찬 문구 5개 + Google 보이스(단어 음원과 동일 톤).
const LANGS = {
  chinese: {
    voice: { languageCode: 'cmn-CN', name: 'cmn-CN-Chirp3-HD-Leda' },
    phrases: ['太棒了', '做得好', '真厉害', '你真棒', '好极了'],
  },
  vietnamese: {
    voice: { languageCode: 'vi-VN', name: 'vi-VN-Chirp3-HD-Achernar' },
    phrases: ['Giỏi lắm', 'Tuyệt vời', 'Làm tốt lắm', 'Con giỏi quá', 'Xuất sắc'],
  },
  thai: {
    voice: { languageCode: 'th-TH', name: 'th-TH-Chirp3-HD-Leda' },
    phrases: ['เก่งมาก', 'ยอดเยี่ยม', 'ดีมาก', 'เยี่ยมมาก', 'สุดยอด'],
  },
};

async function googleTts(text, voice) {
  const res = await fetch(
    `https://texttospeech.googleapis.com/v1/text:synthesize?key=${KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: { text },
        voice: { languageCode: voice.languageCode, name: voice.name },
        audioConfig: { audioEncoding: 'MP3', speakingRate: 1.0 },
      }),
    }
  );
  const j = await res.json();
  if (!j.audioContent) throw new Error(`TTS: ${JSON.stringify(j.error || j).slice(0, 120)}`);
  return Buffer.from(j.audioContent, 'base64');
}

(async () => {
  const langs = ONLY ? [ONLY] : Object.keys(LANGS);
  for (const lang of langs) {
    const cfg = LANGS[lang];
    if (!cfg) {
      console.log(`! ${lang}: 정의 없음`);
      continue;
    }
    console.log(`\n▶ ${lang} — 칭찬음 ${cfg.phrases.length}개 (${cfg.voice.name})`);
    for (let i = 0; i < cfg.phrases.length; i++) {
      const phrase = cfg.phrases[i];
      const name = `praise-${i + 1}`;
      const key = `system-sounds/${lang}/correct/${name}.mp3`;
      if (DRY) {
        console.log(`  [dry] ${phrase} → ${key}`);
        continue;
      }
      try {
        const buf = await googleTts(phrase, cfg.voice);
        await s3.send(
          new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: buf, ContentType: 'audio/mpeg' })
        );
        console.log(`  ✓ ${phrase.padEnd(12)} → ${PUBLIC}/${key} (${buf.length}B)`);
      } catch (e) {
        console.log(`  ✗ ${phrase} 실패: ${e.message}`);
      }
      await sleep(400);
    }
  }
  console.log('\n완료.');
})();
