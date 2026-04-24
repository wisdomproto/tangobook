import * as Phaser from 'phaser';
import { ASSET_BASE, SPRITE_KEYS, SFX_KEYS, GAME_SFX_BASE, RUNNER_SFX_BASE } from '../config';

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

    const sheet = (key: string, path: string) =>
      this.load.spritesheet(key, `${ASSET_BASE}/${path}`, {
        frameWidth: 512,
        frameHeight: 512,
      });
    sheet(SPRITE_KEYS.idle, 'idle/idle-sheet-2x2-clean.png');
    sheet(SPRITE_KEYS.celebrate, 'celebrate/celebrate-sheet-2x2-clean.png');
    sheet(SPRITE_KEYS.hurt, 'hurt/hurt-sheet-2x2-clean.png');
    sheet(SPRITE_KEYS.jump, 'jump/jump-sheet-2x2-clean.png');

    // 4 pad tones
    this.load.audio(SFX_KEYS.padRed, `${RUNNER_SFX_BASE}/note-c4.mp3`);
    this.load.audio(SFX_KEYS.padBlue, `${RUNNER_SFX_BASE}/note-e4.mp3`);
    this.load.audio(SFX_KEYS.padGreen, `${RUNNER_SFX_BASE}/note-g4.mp3`);
    this.load.audio(SFX_KEYS.padYellow, `${RUNNER_SFX_BASE}/note-c5.mp3`);
    this.load.audio(SFX_KEYS.correct, `${GAME_SFX_BASE}/correct.mp3`);
    this.load.audio(SFX_KEYS.wrong, `${GAME_SFX_BASE}/incorrect.mp3`);
    this.load.audio(SFX_KEYS.bgm, `${RUNNER_SFX_BASE}/bgm.mp3`);
  }

  create() {
    this.scene.start('GameScene');
  }
}
