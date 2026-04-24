import * as Phaser from 'phaser';
import { GAME_CONFIG, SPRITE_KEYS, ANIM_KEYS, SFX_KEYS, PADS, PadId } from '../config';

type Phase = 'show' | 'input' | 'between' | 'gameover';

interface Pad {
  id: PadId;
  bg: Phaser.GameObjects.Graphics;
  zone: Phaser.GameObjects.Zone;
}

export class GameScene extends Phaser.Scene {
  private pads: Pad[] = [];
  private sequence: PadId[] = [];
  private inputIndex = 0;
  private round = 0;
  private phase: Phase = 'show';
  private hori!: Phaser.GameObjects.Sprite;
  private roundText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;
  private bgm?: Phaser.Sound.BaseSound;

  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    this.pads = [];
    this.sequence = [];
    this.inputIndex = 0;
    this.round = 0;
    this.phase = 'show';

    const { width: W, height: H } = GAME_CONFIG;

    // Soft gradient background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x243555, 0x243555, 0x4a6aa3, 0x4a6aa3, 1);
    bg.fillRect(0, 0, W, H);

    // Decorative stars in the sky
    for (let i = 0; i < 24; i++) {
      const x = Phaser.Math.Between(0, W);
      const y = Phaser.Math.Between(20, 240);
      const size = Phaser.Math.Between(2, 4);
      const star = this.add.circle(x, y, size, 0xffffff, Phaser.Math.FloatBetween(0.4, 0.9));
      this.tweens.add({
        targets: star,
        alpha: { from: 0.3, to: 0.9 },
        duration: Phaser.Math.Between(1500, 3500),
        yoyo: true,
        repeat: -1,
      });
    }

    // Title
    this.add
      .text(W / 2, 30, '🎵 따라해봐', {
        fontSize: '44px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#1a1a1a',
        strokeThickness: 4,
      })
      .setOrigin(0.5, 0);

    // Round + status
    this.roundText = this.add
      .text(40, 40, '라운드: -', {
        fontSize: '30px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0, 0);
    this.statusText = this.add
      .text(W / 2, 92, '잘 봐!', {
        fontSize: '22px',
        color: '#ffd7a1',
      })
      .setOrigin(0.5, 0);

    // Mute button
    const muteBtn = this.add
      .text(W - 40, 44, this.sound.mute ? '🔇' : '🔊', { fontSize: '28px' })
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: true });
    muteBtn.on('pointerdown', () => {
      this.sound.mute = !this.sound.mute;
      muteBtn.setText(this.sound.mute ? '🔇' : '🔊');
    });

    // Animations
    const createAnim = (key: string, sheet: string, rate: number, repeat: number) => {
      if (this.anims.exists(key)) return;
      this.anims.create({
        key,
        frames: this.anims.generateFrameNumbers(sheet, { start: 0, end: 3 }),
        frameRate: rate,
        repeat,
      });
    };
    createAnim(ANIM_KEYS.idle, SPRITE_KEYS.idle, 3, -1);
    createAnim(ANIM_KEYS.celebrate, SPRITE_KEYS.celebrate, 5.5, 0);
    createAnim(ANIM_KEYS.hurt, SPRITE_KEYS.hurt, 5, 0);
    createAnim(ANIM_KEYS.jump, SPRITE_KEYS.jump, 5.5, 0);

    // Hori center-stage
    this.hori = this.add.sprite(W / 2, H / 2 - 20, SPRITE_KEYS.idle).setScale(0.4);
    this.hori.play(ANIM_KEYS.idle);

    // 4 pads arranged in 2×2 around hori (corners)
    this.createPads();

    // BGM
    if (!this.sound.get(SFX_KEYS.bgm)) {
      this.bgm = this.sound.add(SFX_KEYS.bgm, { loop: true, volume: 0.18 });
    } else {
      this.bgm = this.sound.get(SFX_KEYS.bgm);
    }
    if (!this.bgm.isPlaying) this.bgm.play();

    // Start round 1
    this.time.delayedCall(900, () => this.nextRound());
  }

  private createPads() {
    const { width: W, height: H } = GAME_CONFIG;
    const padSize = 200;
    const cx = W / 2;
    const cy = H / 2 + 40;
    const offsetX = 280;
    const offsetY = 180;

    const positions: Record<PadId, { x: number; y: number }> = {
      red: { x: cx - offsetX, y: cy - offsetY },
      blue: { x: cx + offsetX, y: cy - offsetY },
      green: { x: cx - offsetX, y: cy + offsetY },
      yellow: { x: cx + offsetX, y: cy + offsetY },
    };

    (Object.keys(positions) as PadId[]).forEach((id) => {
      const pos = positions[id];
      const bg = this.add.graphics();
      this.drawPad(bg, PADS[id].color, padSize);
      bg.x = pos.x;
      bg.y = pos.y;
      const zone = this.add
        .zone(pos.x, pos.y, padSize * 1.1, padSize * 1.1)
        .setInteractive({ useHandCursor: true });
      zone.on('pointerdown', () => this.onPadPress(id));
      this.pads.push({ id, bg, zone });
    });
  }

  private drawPad(g: Phaser.GameObjects.Graphics, color: number, size: number) {
    g.clear();
    // Outer darker ring
    g.fillStyle(Phaser.Display.Color.IntegerToColor(color).darken(30).color, 1);
    g.fillRoundedRect(-size / 2 - 8, -size / 2 - 8, size + 16, size + 16, 24);
    // Main pad
    g.fillStyle(color, 1);
    g.fillRoundedRect(-size / 2, -size / 2, size, size, 20);
    // Inner highlight
    g.fillStyle(0xffffff, 0.18);
    g.fillRoundedRect(-size / 2 + 8, -size / 2 + 8, size - 16, size * 0.35, 14);
  }

  private flashPad(id: PadId, durationMs: number) {
    const pad = this.pads.find((p) => p.id === id);
    if (!pad) return;
    const size = 200;
    // Active color
    this.drawPad(pad.bg, PADS[id].colorActive, size);
    // Scale pulse
    this.tweens.add({
      targets: pad.bg,
      scale: { from: 1, to: 1.1 },
      duration: durationMs / 2,
      yoyo: true,
      ease: 'Sine.easeInOut',
    });
    // Hori jumps during pad flash (cute)
    if (this.phase === 'show' && this.anims.exists(ANIM_KEYS.jump)) {
      this.hori.play(ANIM_KEYS.jump);
      this.tweens.add({
        targets: this.hori,
        y: this.hori.y - 30,
        duration: 180,
        yoyo: true,
        ease: 'Cubic.easeOut',
      });
    }
    // Play tone
    this.sound.play(PADS[id].sfxKey, { volume: 0.5 });
    // Restore after flash
    this.time.delayedCall(durationMs, () => {
      this.drawPad(pad.bg, PADS[id].color, size);
      if (this.phase === 'show' && !this.hori.anims.isPlaying) {
        this.hori.play(ANIM_KEYS.idle);
      }
    });
  }

  private nextRound() {
    this.round += 1;
    this.roundText.setText(`라운드: ${this.round}`);
    this.statusText.setText('잘 봐!');
    this.hori.play(ANIM_KEYS.idle);
    // Add one random pad to sequence
    const padIds: PadId[] = ['red', 'blue', 'green', 'yellow'];
    this.sequence.push(Phaser.Math.RND.pick(padIds));
    this.inputIndex = 0;
    this.phase = 'show';
    this.playSequence();
  }

  private playSequence() {
    const stepMs = Math.max(380, 650 - this.round * 20); // speeds up each round
    const gapMs = Math.max(120, 200 - this.round * 5);
    this.sequence.forEach((id, i) => {
      this.time.delayedCall(i * (stepMs + gapMs), () => {
        if (this.phase !== 'show') return;
        this.flashPad(id, stepMs);
      });
    });
    // After sequence, player's turn
    this.time.delayedCall(this.sequence.length * (stepMs + gapMs) + 250, () => {
      this.phase = 'input';
      this.statusText.setText('네 차례야!');
    });
  }

  private onPadPress(id: PadId) {
    if (this.phase !== 'input') return;
    this.flashPad(id, 300);
    const expected = this.sequence[this.inputIndex];
    if (id === expected) {
      this.inputIndex += 1;
      if (this.inputIndex >= this.sequence.length) {
        // Round complete
        this.phase = 'between';
        this.statusText.setText('잘했어!');
        this.hori.play(ANIM_KEYS.celebrate);
        this.sound.play(SFX_KEYS.correct, { volume: 0.5 });
        this.time.delayedCall(1100, () => this.nextRound());
      }
    } else {
      // Wrong
      this.phase = 'gameover';
      this.statusText.setText('');
      this.hori.play(ANIM_KEYS.hurt);
      this.sound.play(SFX_KEYS.wrong, { volume: 0.5 });
      this.cameras.main.shake(250, 0.01);
      this.time.delayedCall(800, () => this.handleGameOver());
    }
  }

  private handleGameOver() {
    const { width: W, height: H } = GAME_CONFIG;
    if (this.bgm?.isPlaying) {
      this.tweens.add({
        targets: this.bgm,
        volume: 0,
        duration: 800,
        onComplete: () => this.bgm?.stop(),
      });
    }
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.55).setDepth(500);
    this.add
      .text(W / 2, H / 2 - 80, '🎯', { fontSize: '80px' })
      .setOrigin(0.5)
      .setDepth(501);
    this.add
      .text(W / 2, H / 2 - 10, '끝!', {
        fontSize: '64px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setDepth(501);
    this.add
      .text(W / 2, H / 2 + 50, `라운드 ${this.round - 1} 까지 성공`, {
        fontSize: '34px',
        color: '#ffd7a1',
      })
      .setOrigin(0.5)
      .setDepth(501);
    this.add
      .text(W / 2, H / 2 + 120, '탭해서 다시 하기', { fontSize: '22px', color: '#ffffff' })
      .setOrigin(0.5)
      .setDepth(501);

    this.input.once('pointerdown', () => this.scene.restart());
    this.input.keyboard?.once('keydown-SPACE', () => this.scene.restart());
  }
}
