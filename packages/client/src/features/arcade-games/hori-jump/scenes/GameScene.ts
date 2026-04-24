import * as Phaser from 'phaser';
import {
  GAME_CONFIG,
  HORI_CONFIG,
  PLATFORM_CONFIG,
  SPRITE_KEYS,
  ANIM_KEYS,
  SFX_KEYS,
} from '../config';

interface Platform {
  rect: Phaser.GameObjects.Rectangle;
  top: Phaser.GameObjects.Rectangle;
  y: number; // world y
  x: number;
}

export class GameScene extends Phaser.Scene {
  private hori!: Phaser.GameObjects.Sprite;
  private horiWorldY = 0;
  private horiWorldX = 0;
  private horiVy = 0;
  private platforms: Platform[] = [];
  private camY = 0; // world y of the top edge of the viewport
  private highestY = 0; // lowest world y value (max height ascended)
  private score = 0;
  private scoreText!: Phaser.GameObjects.Text;
  private bgm?: Phaser.Sound.BaseSound;
  private gameOver = false;
  // Input
  private inputLeft = false;
  private inputRight = false;
  private keyLeft?: Phaser.Input.Keyboard.Key;
  private keyRight?: Phaser.Input.Keyboard.Key;

  // Parallax / background
  private sky?: Phaser.GameObjects.Graphics;
  private parallaxClouds?: Phaser.GameObjects.TileSprite;

  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    // Reset
    this.platforms = [];
    this.score = 0;
    this.horiVy = 0;
    this.horiWorldX = HORI_CONFIG.startX;
    this.horiWorldY = HORI_CONFIG.startY;
    this.camY = 0;
    this.highestY = this.horiWorldY;
    this.gameOver = false;
    this.inputLeft = false;
    this.inputRight = false;

    const { width: W, height: H } = GAME_CONFIG;

    // Sky gradient (stays fixed, no scroll)
    this.sky = this.add.graphics();
    this.sky.fillGradientStyle(0xa3d8f4, 0xa3d8f4, 0xffdab9, 0xffdab9, 1);
    this.sky.fillRect(0, 0, W, H);

    // Clouds tile sprite — subtle drift
    this.makeTexture('jmp-clouds', 512, 300, (g) => {
      g.fillStyle(0xffffff, 0.85);
      const clouds = [
        { x: 80, y: 80, r: 30 },
        { x: 115, y: 75, r: 38 },
        { x: 148, y: 82, r: 30 },
        { x: 280, y: 160, r: 25 },
        { x: 310, y: 155, r: 34 },
        { x: 340, y: 162, r: 25 },
        { x: 420, y: 60, r: 28 },
        { x: 450, y: 55, r: 36 },
        { x: 480, y: 62, r: 28 },
      ];
      for (const c of clouds) g.fillCircle(c.x, c.y, c.r);
    });
    this.parallaxClouds = this.add
      .tileSprite(W / 2, 180, W, 300, 'jmp-clouds')
      .setScrollFactor(0)
      .setDepth(-5);

    // Title
    this.add
      .text(W / 2, 20, '🦘 호리 점프', {
        fontSize: '28px',
        fontStyle: 'bold',
        color: '#1a1a1a',
      })
      .setOrigin(0.5, 0)
      .setDepth(100);

    // Score
    this.scoreText = this.add
      .text(20, 20, '높이: 0', {
        fontSize: '26px',
        fontStyle: 'bold',
        color: '#1a1a1a',
      })
      .setDepth(100);

    // Mute
    const muteBtn = this.add
      .text(W - 20, 20, this.sound.mute ? '🔇' : '🔊', { fontSize: '26px' })
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: true })
      .setDepth(100);
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
    createAnim(ANIM_KEYS.jump, SPRITE_KEYS.jump, 8, -1);
    createAnim(ANIM_KEYS.hurt, SPRITE_KEYS.hurt, 5, 0);
    createAnim(ANIM_KEYS.celebrate, SPRITE_KEYS.celebrate, 5.5, -1);

    // Hori sprite
    this.hori = this.add.sprite(HORI_CONFIG.startX, HORI_CONFIG.startY, SPRITE_KEYS.jump);
    this.hori.setScale(HORI_CONFIG.scale);
    this.hori.play(ANIM_KEYS.jump);
    this.hori.setDepth(10);

    // Seed initial platforms
    this.spawnInitialPlatforms();

    // Give hori initial bounce
    this.horiVy = HORI_CONFIG.jumpVelocity;

    // Input — keyboard
    this.keyLeft = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
    this.keyRight = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);

    // Input — big touch buttons (bottom corners)
    this.buildMoveButtons();

    // BGM
    if (!this.sound.get(SFX_KEYS.bgm)) {
      this.bgm = this.sound.add(SFX_KEYS.bgm, { loop: true, volume: 0.22 });
    } else {
      this.bgm = this.sound.get(SFX_KEYS.bgm);
    }
    if (!this.bgm.isPlaying) this.bgm.play();
  }

  update(_time: number, delta: number) {
    if (this.gameOver) return;
    const dt = delta / 1000;
    const { width: W, height: H } = GAME_CONFIG;

    // Cloud drift
    if (this.parallaxClouds) this.parallaxClouds.tilePositionX += 0.2;

    // Horizontal input
    const left = this.inputLeft || !!this.keyLeft?.isDown;
    const right = this.inputRight || !!this.keyRight?.isDown;
    const dir = (right ? 1 : 0) - (left ? 1 : 0);
    this.horiWorldX += dir * HORI_CONFIG.moveSpeed * dt;

    // Wrap horizontally (edges teleport)
    if (this.horiWorldX < -20) this.horiWorldX = W + 20;
    if (this.horiWorldX > W + 20) this.horiWorldX = -20;

    // Apply gravity
    this.horiVy += HORI_CONFIG.gravity * dt;
    const prevWorldY = this.horiWorldY;
    this.horiWorldY += this.horiVy * dt;

    // Platform collision — only when falling (vy > 0)
    if (this.horiVy > 0) {
      for (const p of this.platforms) {
        const withinX = Math.abs(this.horiWorldX - p.x) < PLATFORM_CONFIG.width / 2 + 30;
        const crossed = prevWorldY < p.y - 10 && this.horiWorldY >= p.y - 10;
        if (withinX && crossed) {
          // Bounce!
          this.horiVy = HORI_CONFIG.jumpVelocity;
          this.horiWorldY = p.y - 10;
          this.sound.play(SFX_KEYS.bounce, {
            volume: 0.4,
            rate: Phaser.Math.FloatBetween(0.92, 1.1),
          });
          // Platform squish anim
          this.tweens.add({
            targets: [p.rect, p.top],
            scaleY: { from: 1, to: 0.6 },
            duration: 90,
            yoyo: true,
            ease: 'Sine.easeOut',
          });
          break;
        }
      }
    }

    // Update highest reached
    if (this.horiWorldY < this.highestY) {
      this.highestY = this.horiWorldY;
      this.score = Math.floor((HORI_CONFIG.startY - this.highestY) / 10);
      this.scoreText.setText(`높이: ${this.score}`);
    }

    // Camera follows hori's rise — never descends
    const desiredCamY = this.highestY - HORI_CONFIG.screenFollowY;
    if (desiredCamY < this.camY) this.camY = desiredCamY;

    // Game over if hori falls off the bottom of the viewport
    const horiScreenY = this.horiWorldY - this.camY;
    if (horiScreenY > H + 80) {
      this.handleGameOver();
      return;
    }

    // Render hori at screen coords
    this.hori.x = this.horiWorldX;
    this.hori.y = horiScreenY;
    this.hori.setFlipX(dir < 0);

    // Render platforms + spawn new ones + despawn old
    for (let i = this.platforms.length - 1; i >= 0; i--) {
      const p = this.platforms[i];
      const sy = p.y - this.camY;
      p.rect.y = sy;
      p.top.y = sy - PLATFORM_CONFIG.height / 2 + 3;
      // Despawn if below bottom
      if (sy > H + 60) {
        p.rect.destroy();
        p.top.destroy();
        this.platforms.splice(i, 1);
      }
    }

    // Spawn new platforms above the highest existing platform up to camY - 100
    let highestPlatY = this.platforms.length
      ? Math.min(...this.platforms.map((p) => p.y))
      : HORI_CONFIG.startY;
    while (highestPlatY > this.camY - 200) {
      const gap = Phaser.Math.Between(PLATFORM_CONFIG.spawnGapMin, PLATFORM_CONFIG.spawnGapMax);
      const newY = highestPlatY - gap;
      const newX = Phaser.Math.Between(80, W - 80);
      this.createPlatform(newX, newY);
      highestPlatY = newY;
    }
  }

  private spawnInitialPlatforms() {
    const { width: W } = GAME_CONFIG;
    // Starting platform right under hori
    this.createPlatform(HORI_CONFIG.startX, HORI_CONFIG.startY + 40);
    // Seed platforms going up
    let y = HORI_CONFIG.startY - 20;
    for (let i = 0; i < 12; i++) {
      y -= Phaser.Math.Between(PLATFORM_CONFIG.spawnGapMin, PLATFORM_CONFIG.spawnGapMax);
      const x = Phaser.Math.Between(80, W - 80);
      this.createPlatform(x, y);
    }
  }

  private createPlatform(x: number, y: number) {
    const w = PLATFORM_CONFIG.width;
    const h = PLATFORM_CONFIG.height;
    const rect = this.add.rectangle(x, 0, w, h, PLATFORM_CONFIG.color).setDepth(5);
    const top = this.add.rectangle(x, 0, w, 6, PLATFORM_CONFIG.topColor).setDepth(6);
    this.platforms.push({ rect, top, x, y });
  }

  private buildMoveButtons() {
    const { width: W, height: H } = GAME_CONFIG;
    const radius = 55;
    const margin = 30;
    const bottomY = H - margin - radius;

    const makeButton = (x: number, arrow: string, onDown: () => void, onUp: () => void) => {
      const bg = this.add
        .circle(x, bottomY, radius, 0xffffff, 0.35)
        .setStrokeStyle(4, 0x1a1a1a, 0.5)
        .setInteractive({ useHandCursor: true })
        .setDepth(900);
      const label = this.add
        .text(x, bottomY, arrow, {
          fontSize: '56px',
          fontStyle: 'bold',
          color: '#1a1a1a',
        })
        .setOrigin(0.5)
        .setDepth(901);
      bg.on(
        'pointerdown',
        (_p: Phaser.Input.Pointer, _x: number, _y: number, evt: Phaser.Types.Input.EventData) => {
          evt.stopPropagation();
          onDown();
          bg.setFillStyle(0xffffff, 0.6);
          label.setScale(0.9);
        }
      );
      const release = () => {
        onUp();
        bg.setFillStyle(0xffffff, 0.35);
        label.setScale(1);
      };
      bg.on('pointerup', release);
      bg.on('pointerupoutside', release);
      bg.on('pointerout', release);
    };

    makeButton(
      margin + radius,
      '◀',
      () => (this.inputLeft = true),
      () => (this.inputLeft = false)
    );
    makeButton(
      W - margin - radius,
      '▶',
      () => (this.inputRight = true),
      () => (this.inputRight = false)
    );
  }

  private makeTexture(
    key: string,
    w: number,
    h: number,
    drawFn: (g: Phaser.GameObjects.Graphics) => void
  ) {
    if (this.textures.exists(key)) return;
    const g = this.add.graphics();
    drawFn(g);
    g.generateTexture(key, w, h);
    g.destroy();
  }

  private handleGameOver() {
    this.gameOver = true;
    this.hori.play(ANIM_KEYS.hurt);
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
        .text(W / 2, H / 2 - 80, '😵', { fontSize: '80px' })
        .setOrigin(0.5)
        .setDepth(501);
      this.add
        .text(W / 2, H / 2 - 10, '떨어졌어', {
          fontSize: '54px',
          fontStyle: 'bold',
          color: '#ffffff',
        })
        .setOrigin(0.5)
        .setDepth(501);
      this.add
        .text(W / 2, H / 2 + 50, `높이: ${this.score}`, {
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
