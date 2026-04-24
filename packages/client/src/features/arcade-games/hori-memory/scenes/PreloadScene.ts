import * as Phaser from 'phaser';
import { CARD_KEYS, CARD_IMAGES, SFX_KEYS, GAME_SFX_BASE, RUNNER_SFX_BASE } from '../config';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload() {
    const w = this.scale.width;
    const h = this.scale.height;
    const bar = this.add.rectangle(w / 2, h / 2, 320, 20, 0xffffff).setStrokeStyle(2, 0x000000);
    const fill = this.add.rectangle(w / 2 - 160, h / 2, 0, 20, 0xff8c3f).setOrigin(0, 0.5);
    this.load.on('progress', (p: number) => (fill.width = 320 * p));
    this.load.on('complete', () => {
      bar.destroy();
      fill.destroy();
    });

    // Card face images
    (Object.keys(CARD_KEYS) as Array<keyof typeof CARD_KEYS>).forEach((k) => {
      this.load.image(CARD_KEYS[k], CARD_IMAGES[k]);
    });

    // Sounds
    this.load.audio(SFX_KEYS.flip, `${RUNNER_SFX_BASE}/note-c4.mp3`);
    this.load.audio(SFX_KEYS.match, `${GAME_SFX_BASE}/correct.mp3`);
    this.load.audio(SFX_KEYS.mismatch, `${GAME_SFX_BASE}/incorrect.mp3`);
    this.load.audio(SFX_KEYS.win, `${GAME_SFX_BASE}/clear.mp3`);
    this.load.audio(SFX_KEYS.bgm, `${RUNNER_SFX_BASE}/bgm.mp3`);
  }

  create() {
    this.scene.start('GameScene');
  }
}
