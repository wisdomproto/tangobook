import { pcmToMp3, wavToMp3, imageToWebp } from '../utils/transcode.js';
import sharp from 'sharp';

async function main() {
  // Synthetic PCM: 1 second of 440Hz tone at 24kHz
  const sampleRate = 24000;
  const samples = sampleRate;
  const pcm = Buffer.alloc(samples * 2);
  for (let i = 0; i < samples; i++) {
    const v = Math.round(Math.sin((2 * Math.PI * 440 * i) / sampleRate) * 16000);
    pcm.writeInt16LE(v, i * 2);
  }

  const mp3 = await pcmToMp3(pcm);
  console.log('[pcmToMp3] input:', pcm.length, 'bytes → output:', mp3.length, 'bytes');
  if (mp3.length < 100) throw new Error('MP3 too small');
  const header = mp3.slice(0, 3).toString('hex');
  if (
    !header.startsWith('fffb') &&
    !header.startsWith('fff3') &&
    mp3.slice(0, 3).toString() !== 'ID3'
  ) {
    throw new Error('Invalid MP3 header: ' + header);
  }

  // Synthetic PNG: solid 100x100 red
  const png = await sharp({
    create: { width: 100, height: 100, channels: 3, background: { r: 255, g: 0, b: 0 } },
  })
    .png()
    .toBuffer();

  const webp = await imageToWebp(png);
  console.log('[imageToWebp] PNG', png.length, 'bytes → WebP', webp.length, 'bytes');
  if (webp.slice(0, 4).toString() !== 'RIFF' || webp.slice(8, 12).toString() !== 'WEBP') {
    throw new Error('Invalid WebP header');
  }

  // Round-trip via WAV
  const wavHeader = Buffer.alloc(44);
  wavHeader.write('RIFF', 0);
  wavHeader.writeUInt32LE(36 + pcm.length, 4);
  wavHeader.write('WAVEfmt ', 8);
  wavHeader.writeUInt32LE(16, 16);
  wavHeader.writeUInt16LE(1, 20);
  wavHeader.writeUInt16LE(1, 22);
  wavHeader.writeUInt32LE(sampleRate, 24);
  wavHeader.writeUInt32LE(sampleRate * 2, 28);
  wavHeader.writeUInt16LE(2, 32);
  wavHeader.writeUInt16LE(16, 34);
  wavHeader.write('data', 36);
  wavHeader.writeUInt32LE(pcm.length, 40);
  const wav = Buffer.concat([wavHeader, pcm]);
  const mp3FromWav = await wavToMp3(wav);
  console.log('[wavToMp3] WAV', wav.length, 'bytes → MP3', mp3FromWav.length, 'bytes');
  if (mp3FromWav.length < 100) throw new Error('wavToMp3 output too small');

  console.log('\n✅ All transcode verifications passed');
}

main().catch((e) => {
  console.error('❌', e);
  process.exit(1);
});
