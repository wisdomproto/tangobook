import * as Phaser from 'phaser';
import { GAME_CONFIG, GRID, GAME_RULES, SPRITE_KEYS, ANIM_KEYS, SFX_KEYS } from '../config';

interface Hole {
  x: number;
  y: number;
  mound: Phaser.GameObjects.Graphics;
  mask: Phaser.GameObjects.Graphics;
  hori: Phaser.GameObjects.Sprite;
  state: 'empty' | 'up' | 'hit';
  targetY: number;
  hiddenY: number;
  hitTimer?: Phaser.Time.TimerEvent;
  downTimer?: Phaser.Time.TimerEvent;
}

export class GameScene extends Phaser.Scene {
  private holes: Hole[] = [];
  private score = 0;
  private scoreText!: Phaser.GameObjects.Text;
  private timeText!: Phaser.GameObjects.Text;
  private remainingMs = GAME_RULES.durationMs;
  private bgm?: Phaser.Sound.BaseSound;
  private spawnTimer?: Phaser.Time.TimerEvent;
  private gameOver = false;
  private startTimeMs = 0;

  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    this.holes = [];
    this.score = 0;
    this.remainingMs = GAME_RULES.durationMs;
    this.gameOver = false;
    this.startTimeMs = this.time.now;

    const { width: W, height: H } = GAME_CONFIG;

    // Grass/sky gradient background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0xbde3ff, 0xbde3ff, 0x88c56a, 0x88c56a, 1);
    bg.fillRect(0, 0, W, H);

    // Decorative sun
    const halo = this.add.circle(1120, 100, 70, 0xffe066, 0.3);
    this.add.circle(1120, 100, 48, 0xffd750, 1);
    this.add.circle(1120, 100, 38, 0xfff4a3, 0.8);
    this.tweens.add({
      targets: halo,
      scale: { from: 1, to: 1.1 },
      duration: 2500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Title
    this.add
      .text(W / 2, 30, '🎯 두더지 잡기', {
        fontSize: '40px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#1a1a1a',
        strokeThickness: 4,
      })
      .setOrigin(0.5, 0);

    // Score + time
    this.scoreText = this.add
      .text(40, 40, '점수: 0', {
        fontSize: '32px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#1a1a1a',
        strokeThickness: 4,
      })
      .setOrigin(0, 0);
    this.timeText = this.add
      .text(W - 40, 40, '남은시간: 60', {
        fontSize: '32px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#1a1a1a',
        strokeThickness: 4,
      })
      .setOrigin(1, 0);

    // Mute button
    const muteBtn = this.add
      .text(W / 2, 86, this.sound.mute ? '🔇' : '🔊', {
        fontSize: '26px',
      })
      .setOrigin(0.5, 0)
      .setInteractive({ useHandCursor: true });
    muteBtn.on('pointerdown', () => {
      this.sound.mute = !this.sound.mute;
      muteBtn.setText(this.sound.mute ? '🔇' : '🔊');
    });

    // Animations
    this.createAnimations();

    // Holes 3x3 grid
    const totalW = GRID.cols * GRID.holeWidth + (GRID.cols - 1) * GRID.gapX;
    const totalH = GRID.rows * GRID.holeHeight + (GRID.rows - 1) * GRID.gapY;
    const startX = (W - totalW) / 2 + GRID.holeWidth / 2;
    const startY = GRID.topOffset + GRID.holeHeight / 2 + 20;

    for (let r = 0; r < GRID.rows; r++) {
      for (let c = 0; c < GRID.cols; c++) {
        const x = startX + c * (GRID.holeWidth + GRID.gapX);
        const y = startY + r * (GRID.holeHeight + GRID.gapY);
        this.createHole(x, y);
      }
    }

    // BGM
    if (!this.sound.get(SFX_KEYS.bgm)) {
      this.bgm = this.sound.add(SFX_KEYS.bgm, { loop: true, volume: 0.22 });
    } else {
      this.bgm = this.sound.get(SFX_KEYS.bgm);
    }
    if (!this.bgm.isPlaying) this.bgm.play();

    // Start spawning moles
    this.scheduleNextPop();
  }

  update(_time: number, delta: number) {
    if (this.gameOver) return;
    this.remainingMs = Math.max(0, this.remainingMs - delta);
    const seconds = Math.ceil(this.remainingMs / 1000);
    this.timeText.setText(`남은시간: ${seconds}`);
    if (this.remainingMs <= 0) this.handleGameOver();
  }

  private createAnimations() {
    const create = (key: string, sheet: string, rate: number, repeat: number) => {
      if (this.anims.exists(key)) return;
      this.anims.create({
        key,
        frames: this.anims.generateFrameNumbers(sheet, { start: 0, end: 3 }),
        frameRate: rate,
        repeat,
      });
    };
    create(ANIM_KEYS.idle, SPRITE_KEYS.idle, 3, -1);
    create(ANIM_KEYS.celebrate, SPRITE_KEYS.celebrate, 5.5, 0);
    create(ANIM_KEYS.hurt, SPRITE_KEYS.hurt, 5, 0);
  }

  private createHole(x: number, y: number) {
    // Dirt mound (ellipse, darker top)
    const mound = this.add.graphics();
    mound.fillStyle(0x6b4423, 1);
    mound.fillEllipse(0, 0, GRID.holeWidth, GRID.holeHeight * 0.9);
    mound.fillStyle(0x5a3a22, 1);
    mound.fillEllipse(0, 10, GRID.holeWidth * 0.92, GRID.holeHeight * 0.5);
    // Dark hole in center
    mound.fillStyle(0x2a1a10, 1);
    mound.fillEllipse(0, -4, GRID.holeWidth * 0.62, GRID.holeHeight * 0.3);
    mound.x = x;
    mound.y = y;
    mound.setDepth(10);

    // Hori sprite inside hole
    const targetY = y - 70; // when popped up
    const hiddenY = y + 20; // when hidden
    const hori = this.add.sprite(x, hiddenY, SPRITE_KEYS.idle);
    hori.setScale(0.28);
    hori.play(ANIM_KEYS.idle);
    hori.setDepth(9);
    hori.setVisible(false);

    // Mask to clip hori below mound top
    const mask = this.add.graphics();
    mask.fillStyle(0xffffff, 1);
    mask.fillRect(x - GRID.holeWidth / 2, y - 140, GRID.holeWidth, 140);
    mask.setVisible(false);
    const geoMask = mask.createGeometryMask();
    hori.setMask(geoMask);

    // Interaction on the whole hole area
    const hit = this.add
      .zone(x, y - 50, GRID.holeWidth * 1.1, GRID.holeHeight * 1.6)
      .setInteractive({ useHandCursor: true });

    const hole: Hole = {
      x,
      y,
      mound,
      mask,
      hori,
      state: 'empty',
      targetY,
      hiddenY,
    };

    hit.on('pointerdown', () => this.onHolePress(hole));
    this.holes.push(hole);
  }

  private scheduleNextPop() {
    if (this.gameOver) return;
    const elapsed = this.time.now - this.startTimeMs;
    const progress = Math.min(1, elapsed / GAME_RULES.durationMs);
    const interval =
      GAME_RULES.spawnIntervalStart -
      (GAME_RULES.spawnIntervalStart - GAME_RULES.spawnIntervalMin) * progress;
    this.spawnTimer = this.time.delayedCall(interval, () => {
      this.popRandomHole();
      this.scheduleNextPop();
    });
  }

  private popRandomHole() {
    const emptyHoles = this.holes.filter((h) => h.state === 'empty');
    if (emptyHoles.length === 0) return;
    const hole = Phaser.Math.RND.pick(emptyHoles);
    this.popUp(hole);
  }

  private popUp(hole: Hole) {
    hole.state = 'up';
    hole.hori.y = hole.hiddenY;
    hole.hori.setVisible(true);
    hole.hori.play(ANIM_KEYS.idle);
    this.sound.play(SFX_KEYS.pop, {
      volume: 0.3,
      rate: Phaser.Math.FloatBetween(0.9, 1.2),
    });
    this.tweens.add({
      targets: hole.hori,
      y: hole.targetY,
      duration: 180,
      ease: 'Back.easeOut',
    });

    // Down timer
    const elapsed = this.time.now - this.startTimeMs;
    const progress = Math.min(1, elapsed / GAME_RULES.durationMs);
    const upDur =
      GAME_RULES.popUpMsStart - (GAME_RULES.popUpMsStart - GAME_RULES.popUpMsMin) * progress;
    hole.downTimer = this.time.delayedCall(upDur, () => {
      if (hole.state === 'up') this.popDown(hole);
    });
  }

  private popDown(hole: Hole) {
    if (hole.state !== 'up') return;
    this.tweens.add({
      targets: hole.hori,
      y: hole.hiddenY,
      duration: 180,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        hole.hori.setVisible(false);
        hole.state = 'empty';
      },
    });
  }

  private onHolePress(hole: Hole) {
    if (this.gameOver) return;
    if (hole.state === 'up') {
      // Hit!
      hole.state = 'hit';
      hole.downTimer?.remove();
      this.score += 1;
      this.scoreText.setText(`점수: ${this.score}`);
      this.sound.play(SFX_KEYS.hit, {
        volume: 0.5,
        rate: Phaser.Math.FloatBetween(0.95, 1.1),
      });
      hole.hori.play(ANIM_KEYS.celebrate);
      // Popup score
      const popup = this.add
        .text(hole.x, hole.targetY - 40, '+1', {
          fontSize: '40px',
          fontStyle: 'bold',
          color: '#ffd700',
          stroke: '#1a1a1a',
          strokeThickness: 4,
        })
        .setOrigin(0.5)
        .setDepth(100);
      this.tweens.add({
        targets: popup,
        y: hole.targetY - 120,
        alpha: 0,
        duration: 700,
        onComplete: () => popup.destroy(),
      });
      // Quick down
      this.time.delayedCall(300, () => {
        this.tweens.add({
          targets: hole.hori,
          y: hole.hiddenY,
          duration: 200,
          ease: 'Cubic.easeIn',
          onComplete: () => {
            hole.hori.setVisible(false);
            hole.state = 'empty';
          },
        });
      });
    } else {
      // Missed tap (empty hole)
      this.sound.play(SFX_KEYS.miss, { volume: 0.3 });
    }
  }

  private handleGameOver() {
    this.gameOver = true;
    this.spawnTimer?.remove();
    this.holes.forEach((h) => {
      h.downTimer?.remove();
      if (h.state === 'up') this.popDown(h);
    });
    if (this.bgm?.isPlaying) {
      this.tweens.add({
        targets: this.bgm,
        volume: 0,
        duration: 800,
        onComplete: () => this.bgm?.stop(),
      });
    }

    this.time.delayedCall(500, () => {
      this.sound.play(SFX_KEYS.gameover, { volume: 0.6 });
      const { width: W, height: H } = GAME_CONFIG;
      this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.55).setDepth(500);
      this.add
        .text(W / 2, H / 2 - 80, '⏰', { fontSize: '80px' })
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
        .text(W / 2, H / 2 + 50, `잡은 두더지: ${this.score}`, {
          fontSize: '36px',
          color: '#ffd7a1',
        })
        .setOrigin(0.5)
        .setDepth(501);
      this.add
        .text(W / 2, H / 2 + 120, '탭해서 다시 하기', {
          fontSize: '22px',
          color: '#ffffff',
        })
        .setOrigin(0.5)
        .setDepth(501);

      this.input.once('pointerdown', () => this.scene.restart());
      this.input.keyboard?.once('keydown-SPACE', () => this.scene.restart());
    });
  }
}
