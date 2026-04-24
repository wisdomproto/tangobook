import * as Phaser from 'phaser';
import { ASSET_BASE, SPRITE_KEYS, SFX_KEYS, SFX_BASE, GAME_SFX_BASE } from '../config';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload() {
    const w = this.scale.width;
    const h = this.scale.height;

    const bar = this.add.rectangle(w / 2, h / 2, 320, 20, 0xffffff).setStrokeStyle(2, 0x000000);
    const fill = this.add.rectangle(w / 2 - 160, h / 2, 0, 20, 0xff8c3f).setOrigin(0, 0.5);
    const label = this.add
      .text(w / 2, h / 2 - 40, '로딩 중...', { fontSize: '24px', color: '#1a1a1a' })
      .setOrigin(0.5);

    this.load.on('progress', (p: number) => {
      fill.width = 320 * p;
    });
    this.load.on('complete', () => {
      bar.destroy();
      fill.destroy();
      label.destroy();
    });

    const sheet = (key: string, path: string) =>
      this.load.spritesheet(key, `${ASSET_BASE}/${path}`, {
        frameWidth: 512,
        frameHeight: 512,
      });

    sheet(SPRITE_KEYS.idle, 'idle/idle-sheet-2x2-clean.png');
    sheet(SPRITE_KEYS.run, 'run/run-sheet-2x2-clean.png');
    sheet(SPRITE_KEYS.hurt, 'hurt/hurt-sheet-2x2-clean.png');
    sheet(SPRITE_KEYS.celebrate, 'celebrate/celebrate-sheet-2x2-clean.png');

    // Reuse existing sounds — correct.mp3 for catch, hurt.mp3 for bomb
    this.load.audio(SFX_KEYS.catchGood, `${GAME_SFX_BASE}/correct.mp3`);
    this.load.audio(SFX_KEYS.catchBad, `${SFX_BASE}/hurt.mp3`);
    this.load.audio(SFX_KEYS.gameover, `${SFX_BASE}/gameover.mp3`);
    this.load.audio(SFX_KEYS.bgm, `${SFX_BASE}/bgm.mp3`);
  }

  create() {
    this.scene.start('GameScene');
  }
}
