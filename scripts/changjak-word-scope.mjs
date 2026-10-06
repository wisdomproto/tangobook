import path from 'node:path';
import { SERIES } from '../packages/client/scripts/_series-config.mjs';

export const later = process.argv.includes('--scope=11-19');
export const root = path.resolve(
  'generated-images/' + (later ? 'changjak-words-11-19' : 'changjak-words')
);
export const targets = Object.entries(SERIES).filter(([, c]) =>
  later ? +c.no >= 11 && +c.no <= 19 : +c.no <= 10
);
export const taskId = later
  ? '20261003-changjak-11-19-word-images'
  : '20261003-changjak-word-images';
