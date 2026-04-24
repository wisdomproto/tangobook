import * as Phaser from 'phaser';
import {
  GAME_CONFIG,
  HORI_CONFIG,
  ITEM_CONFIG,
  ITEMS,
  GAME_RULES,
  DIFFICULTY,
  ANIM_KEYS,
  SPRITE_KEYS,
  SFX_KEYS,
  ItemType,
} from '../config';

type HoriState = 'idle' | 'moving' | 'hurt';

interface FallingItem {
  obj: Phaser.GameObjects.Text;
  type: ItemType;
  vy: number;
}

export class GameScene extends Phaser.Scene {
  private hori!: Phaser.GameObjects.Sprite;
  private basket!: Phaser.GameObjects.Graphics;
  private items: FallingItem[] = [];
  private spawnTimer?: Phaser.Time.TimerEvent;
  private scoreText!: Phaser.GameObjects.Text;
  private heartIcons: Phaser.GameObjects.Text[] = [];

  private score = 0;
  private lives = GAME_RULES.startLives;
  private state: HoriState = 'idle';
  private gameOver = false;
  private startTimeMs = 0;
  private bgm?: Phaser.Sound.BaseSound;

  // Input state — direction buttons/keys
  private inputLeft = false;
  private inputRight = false;
  private keyLeft?: Phaser.Input.Keyboard.Key;
  private keyRight?: Phaser.Input.Keyboard.Key;

  // Parallax layers
  private parallaxFarHills?: Phaser.GameObjects.TileSprite;
  private parallaxMountains?: Phaser.GameObjects.TileSprite;
  private parallaxClouds?: Phaser.GameObjects.TileSprite;
  private parallaxTrees?: Phaser.GameObjects.TileSprite;
  private parallaxGround?: Phaser.GameObjects.TileSprite;

  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    // Reset state
    this.score = 0;
    this.lives = GAME_RULES.startLives;
    this.state = 'idle';
    this.gameOver = false;
    this.items = [];
    this.heartIcons = [];
    this.startTimeMs = this.time.now;
    this.inputLeft = false;
    this.inputRight = false;

    const { width: W, height: H, groundY } = GAME_CONFIG;

    // Gradient sky — soft pastel (top cool blue → bottom warm peach horizon)
    const skyGradient = this.add.graphics();
    skyGradient.fillGradientStyle(0x87ceeb, 0x87ceeb, 0xffdab9, 0xffdab9, 1);
    skyGradient.fillRect(0, 0, W, groundY);

    // Sun with soft halo (top-right area)
    this.drawSun(W - 180, 130);

    // Parallax background (mountains, trees, clouds, ground)
    this.buildParallaxLayers();

    // Floating balloons — spawn every few seconds, drift up and off-screen
    this.spawnBalloon();
    this.time.addEvent({
      delay: 4500,
      loop: true,
      callback: () => {
        if (!this.gameOver) this.spawnBalloon();
      },
    });

    // Butterflies — tiny decoration in mid-ground
    this.spawnButterfly();
    this.time.addEvent({
      delay: 6500,
      loop: true,
      callback: () => {
        if (!this.gameOver) this.spawnButterfly();
      },
    });

    // Animations
    this.createAnimations();

    // Hori
    this.hori = this.add.sprite(HORI_CONFIG.startX, groundY - 100, SPRITE_KEYS.idle);
    this.hori.setScale(HORI_CONFIG.scale);
    this.hori.play(ANIM_KEYS.idle);

    // Basket (drawn below Hori)
    this.basket = this.add.graphics();
    this.drawBasket();

    // UI — score
    this.scoreText = this.add
      .text(W / 2, 30, '0', {
        fontSize: '64px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#1a1a1a',
        strokeThickness: 6,
      })
      .setOrigin(0.5, 0);

    // UI — hearts (top-right)
    this.renderHearts();

    // Mute toggle (top-left, but reserve space for page-level "나가기" button)
    const muteBtn = this.add
      .text(24, 84, this.sound.mute ? '🔇' : '🔊', {
        fontSize: '32px',
        backgroundColor: '#00000080',
        padding: { left: 8, right: 8, top: 4, bottom: 4 },
      })
      .setInteractive({ useHandCursor: true })
      .setDepth(1000);
    muteBtn.on('pointerdown', () => {
      this.sound.mute = !this.sound.mute;
      muteBtn.setText(this.sound.mute ? '🔇' : '🔊');
    });

    // Input — keyboard arrows (and A/D as alternates)
    this.keyLeft = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
    this.keyRight = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);

    // Tablet/mouse — big on-screen buttons at bottom corners
    this.buildMoveButtons();

    // Disable default right-click menu on game canvas
    this.input.mouse?.disableContextMenu();

    // BGM
    if (!this.sound.get(SFX_KEYS.bgm)) {
      this.bgm = this.sound.add(SFX_KEYS.bgm, { loop: true, volume: 0.22 });
    } else {
      this.bgm = this.sound.get(SFX_KEYS.bgm);
    }
    if (!this.bgm.isPlaying) this.bgm.play();

    // Start spawning
    this.scheduleNextSpawn();
  }

  update(_time: number, delta: number) {
    if (this.gameOver) return;

    const dt = delta / 1000;
    const { width: W, groundY } = GAME_CONFIG;

    // Parallax scroll (tiny, just for atmosphere — game doesn't scroll world)
    if (this.parallaxClouds) this.parallaxClouds.tilePositionX += 0.15;
    if (this.parallaxFarHills) this.parallaxFarHills.tilePositionX += 0.05;

    // Resolve input direction (keyboard + on-screen buttons)
    const keyLeftDown = !!this.keyLeft?.isDown;
    const keyRightDown = !!this.keyRight?.isDown;
    const left = keyLeftDown || this.inputLeft;
    const right = keyRightDown || this.inputRight;
    const direction = (right ? 1 : 0) - (left ? 1 : 0);

    // Move Hori by direction × speed
    const step = direction * HORI_CONFIG.moveSpeed * dt;
    if (step !== 0) {
      this.hori.x = Phaser.Math.Clamp(this.hori.x + step, 80, W - 80);
      this.hori.setFlipX(direction < 0);
      if (this.state !== 'moving' && this.state !== 'hurt') {
        this.state = 'moving';
        this.hori.play(ANIM_KEYS.run, true);
      }
    } else if (this.state === 'moving') {
      this.state = 'idle';
      this.hori.play(ANIM_KEYS.idle, true);
    }

    // Basket follows hori
    this.basket.x = this.hori.x;

    // Items fall + collision check
    const basketX = this.hori.x;
    const basketY = this.hori.y + HORI_CONFIG.basketOffsetY + HORI_CONFIG.basketHeight / 2;
    const halfW = HORI_CONFIG.basketWidth / 2;
    const halfH = HORI_CONFIG.basketHeight / 2;

    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];
      item.obj.y += item.vy * dt;

      // Caught?
      const within =
        Math.abs(item.obj.x - basketX) < halfW + ITEM_CONFIG.size * 0.3 &&
        item.obj.y > basketY - halfH &&
        item.obj.y < basketY + halfH + 20;

      if (within) {
        this.handleCatch(item);
        item.obj.destroy();
        this.items.splice(i, 1);
        continue;
      }

      // Off-screen bottom
      if (item.obj.y > groundY + 80) {
        item.obj.destroy();
        this.items.splice(i, 1);
      }
    }
  }

  // ===== Setup helpers =====

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
    create(ANIM_KEYS.run, SPRITE_KEYS.run, 7.7, -1);
    create(ANIM_KEYS.hurt, SPRITE_KEYS.hurt, 5, 0);
    create(ANIM_KEYS.celebrate, SPRITE_KEYS.celebrate, 5.5, -1);
  }

  private drawBasket() {
    const w = HORI_CONFIG.basketWidth;
    const h = HORI_CONFIG.basketHeight;
    this.basket.clear();
    // basket body (brown wicker)
    this.basket.fillStyle(0x8a5c30, 1);
    this.basket.fillRoundedRect(-w / 2, 0, w, h, 6);
    // lighter rim on top
    this.basket.fillStyle(0xa67846, 1);
    this.basket.fillRoundedRect(-w / 2, -4, w, 8, 4);
    // handle
    this.basket.lineStyle(5, 0xa67846, 1);
    this.basket.beginPath();
    this.basket.arc(0, -2, w * 0.4, Phaser.Math.DegToRad(200), Phaser.Math.DegToRad(340));
    this.basket.strokePath();
    // weave lines
    this.basket.lineStyle(1.5, 0x5a3a22, 0.5);
    for (let i = 1; i < 5; i++) {
      const y = (i * h) / 5;
      this.basket.beginPath();
      this.basket.moveTo(-w / 2 + 4, y);
      this.basket.lineTo(w / 2 - 4, y);
      this.basket.strokePath();
    }
    this.basket.y = this.hori.y + HORI_CONFIG.basketOffsetY;
    this.basket.x = this.hori.x;
    this.basket.setDepth(10);
  }

  private renderHearts() {
    this.heartIcons.forEach((h) => h.destroy());
    this.heartIcons = [];
    const { width: W } = GAME_CONFIG;
    for (let i = 0; i < GAME_RULES.maxLives; i++) {
      const filled = i < this.lives;
      const icon = this.add
        .text(W - 30 - i * 56, 30, filled ? '❤️' : '🖤', {
          fontSize: '44px',
        })
        .setOrigin(1, 0)
        .setAlpha(filled ? 1 : 0.4);
      this.heartIcons.push(icon);
    }
  }

  // ===== Spawning =====

  private scheduleNextSpawn() {
    const elapsed = this.time.now - this.startTimeMs;
    const progress = Math.min(1, elapsed / DIFFICULTY.rampDurationMs);
    const mul = 1 - (1 - DIFFICULTY.spawnMinMultiplier) * progress;
    const delay = Phaser.Math.Between(
      ITEM_CONFIG.spawnIntervalMin * mul,
      ITEM_CONFIG.spawnIntervalMax * mul
    );
    this.spawnTimer = this.time.delayedCall(delay, () => {
      this.spawnItem();
      if (!this.gameOver) this.scheduleNextSpawn();
    });
  }

  private spawnItem() {
    const { width: W } = GAME_CONFIG;
    const type = this.pickItemType();
    const meta = ITEMS[type];
    const x = Phaser.Math.Between(80, W - 80);

    const txt = this.add
      .text(x, -40, meta.emoji, { fontSize: `${ITEM_CONFIG.size}px` })
      .setOrigin(0.5)
      .setDepth(5);

    const elapsed = this.time.now - this.startTimeMs;
    const progress = Math.min(1, elapsed / DIFFICULTY.rampDurationMs);
    const speedMul = 1 + (DIFFICULTY.speedMaxMultiplier - 1) * progress;
    const vy = Phaser.Math.Between(ITEM_CONFIG.fallSpeedMin, ITEM_CONFIG.fallSpeedMax) * speedMul;

    // Slight wobble tween for organic feel
    this.tweens.add({
      targets: txt,
      angle: { from: -8, to: 8 },
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.items.push({ obj: txt, type, vy });
  }

  private pickItemType(): ItemType {
    const total = Object.values(ITEMS).reduce((s, it) => s + it.weight, 0);
    let r = Phaser.Math.FloatBetween(0, total);
    for (const [key, meta] of Object.entries(ITEMS)) {
      r -= meta.weight;
      if (r <= 0) return key as ItemType;
    }
    return 'star';
  }

  // ===== Interactions =====

  private handleCatch(item: FallingItem) {
    const meta = ITEMS[item.type];
    if (meta.bad) {
      this.lives -= 1;
      this.renderHearts();
      this.sound.play(SFX_KEYS.catchBad, { volume: 0.6 });
      this.state = 'hurt';
      this.hori.play(ANIM_KEYS.hurt);
      this.cameras.main.shake(200, 0.01);
      this.spawnPopup(item.obj.x, item.obj.y, '💥', '#ff4d4d');
      // Return to idle after hurt anim finishes (400ms)
      this.time.delayedCall(650, () => {
        if (this.state === 'hurt' && !this.gameOver) {
          this.state = 'idle';
          this.hori.play(ANIM_KEYS.idle);
        }
      });
      if (this.lives <= 0) {
        this.handleGameOver();
      }
    } else {
      this.score += meta.score;
      this.scoreText.setText(Math.floor(this.score).toString());
      this.sound.play(SFX_KEYS.catchGood, {
        volume: 0.5,
        rate: Phaser.Math.FloatBetween(0.92, 1.08),
      });
      this.spawnPopup(item.obj.x, item.obj.y, `+${meta.score}`, '#ffd700');
      // Score milestone celebration
      if (Math.floor(this.score / 25) > Math.floor((this.score - meta.score) / 25)) {
        this.flashCelebrate();
      }
    }
  }

  private spawnPopup(x: number, y: number, text: string, color: string) {
    const popup = this.add
      .text(x, y, text, {
        fontSize: '40px',
        fontStyle: 'bold',
        color,
        stroke: '#1a1a1a',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(100);
    this.tweens.add({
      targets: popup,
      y: y - 60,
      alpha: 0,
      scale: 1.4,
      duration: 700,
      ease: 'Cubic.easeOut',
      onComplete: () => popup.destroy(),
    });
  }

  private flashCelebrate() {
    if (this.state === 'hurt') return;
    const prev = this.state;
    this.state = 'idle';
    this.hori.play(ANIM_KEYS.celebrate);
    this.time.delayedCall(900, () => {
      if (this.state !== 'hurt' && !this.gameOver) {
        this.state = prev;
        this.hori.play(prev === 'moving' ? ANIM_KEYS.run : ANIM_KEYS.idle, true);
      }
    });
  }

  // ===== Game over =====

  private handleGameOver() {
    this.gameOver = true;
    this.spawnTimer?.remove();
    // Freeze remaining items
    this.items.forEach((it) => (it.vy = 0));

    // Fade BGM
    if (this.bgm?.isPlaying) {
      this.tweens.add({
        targets: this.bgm,
        volume: 0,
        duration: 800,
        onComplete: () => this.bgm?.stop(),
      });
    }

    const { width: W, height: H } = GAME_CONFIG;
    this.time.delayedCall(500, () => {
      this.sound.play(SFX_KEYS.gameover, { volume: 0.6 });
      this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.55).setDepth(500);
      this.add
        .text(W / 2, H / 2 - 60, '게임 오버', {
          fontSize: '72px',
          fontStyle: 'bold',
          color: '#ffffff',
        })
        .setOrigin(0.5)
        .setDepth(501);
      this.add
        .text(W / 2, H / 2 + 10, `점수: ${Math.floor(this.score)}`, {
          fontSize: '48px',
          color: '#ffd7a1',
        })
        .setOrigin(0.5)
        .setDepth(501);
      this.add
        .text(W / 2, H / 2 + 80, '탭하거나 스페이스로 다시 시작', {
          fontSize: '24px',
          color: '#ffffff',
        })
        .setOrigin(0.5)
        .setDepth(501);

      const restart = () => this.scene.restart();
      this.input.keyboard?.once('keydown-SPACE', restart);
      this.input.once('pointerdown', restart);
    });
  }

  // ===== Decorative background elements =====

  private drawSun(x: number, y: number) {
    // Outer soft halo
    const halo2 = this.add.circle(x, y, 110, 0xfff4a3, 0.18).setDepth(-7);
    const halo1 = this.add.circle(x, y, 80, 0xffe066, 0.3).setDepth(-7);
    const sun = this.add.circle(x, y, 55, 0xffd750, 1).setDepth(-6);
    const inner = this.add.circle(x, y, 45, 0xfff4a3, 0.9).setDepth(-6);
    // Slow pulse
    this.tweens.add({
      targets: [halo1, halo2],
      scale: { from: 1, to: 1.08 },
      alpha: { from: 0.18, to: 0.28 },
      duration: 2500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    void sun;
    void inner;
  }

  private spawnBalloon() {
    const { width: W, groundY } = GAME_CONFIG;
    const colors = [0xff8c7a, 0xffd166, 0x95d1a1, 0xa3d8f4, 0xc9a3f4, 0xf4a3d8];
    const color = Phaser.Math.RND.pick(colors);
    const startX = Phaser.Math.Between(60, W - 60);
    const startY = groundY - 40;
    const size = Phaser.Math.Between(28, 40);

    const balloon = this.add.graphics().setDepth(-1);
    // balloon body
    balloon.fillStyle(color, 1);
    balloon.fillEllipse(0, 0, size, size * 1.15);
    // highlight
    balloon.fillStyle(0xffffff, 0.35);
    balloon.fillEllipse(-size / 5, -size / 5, size / 4, size / 3);
    // tie knot
    balloon.fillStyle(color, 1);
    balloon.fillTriangle(-3, size * 0.55, 3, size * 0.55, 0, size * 0.65);
    // string
    balloon.lineStyle(1.5, 0x1a1a1a, 0.4);
    balloon.beginPath();
    balloon.moveTo(0, size * 0.65);
    balloon.lineTo(-5, size * 0.95);
    balloon.lineTo(5, size * 1.25);
    balloon.lineTo(-3, size * 1.55);
    balloon.strokePath();

    balloon.x = startX;
    balloon.y = startY;

    // Drift up + gentle sway
    this.tweens.add({
      targets: balloon,
      y: -100,
      duration: Phaser.Math.Between(14000, 20000),
      ease: 'Linear',
      onComplete: () => balloon.destroy(),
    });
    this.tweens.add({
      targets: balloon,
      x: startX + Phaser.Math.Between(-80, 80),
      duration: 3000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private spawnButterfly() {
    const { width: W, groundY } = GAME_CONFIG;
    const colors = [0xffd0e4, 0xd4b5ff, 0xffe0a3, 0xb5e8ff];
    const color = Phaser.Math.RND.pick(colors);
    const fromLeft = Math.random() < 0.5;
    const startX = fromLeft ? -40 : W + 40;
    const endX = fromLeft ? W + 40 : -40;
    const startY = Phaser.Math.Between(groundY - 260, groundY - 100);

    const bf = this.add.graphics().setDepth(-1);
    // simple 4-wing butterfly
    bf.fillStyle(color, 0.95);
    bf.fillEllipse(-8, -4, 12, 10);
    bf.fillEllipse(8, -4, 12, 10);
    bf.fillEllipse(-6, 5, 9, 7);
    bf.fillEllipse(6, 5, 9, 7);
    bf.fillStyle(0x1a1a1a, 1);
    bf.fillEllipse(0, 0, 3, 8);

    bf.x = startX;
    bf.y = startY;

    // flap wings (scaleY pulse)
    this.tweens.add({
      targets: bf,
      scaleY: { from: 1, to: 0.4 },
      duration: 120,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    // drift across with up-down wave
    this.tweens.add({
      targets: bf,
      x: endX,
      duration: Phaser.Math.Between(9000, 13000),
      ease: 'Linear',
      onComplete: () => bf.destroy(),
    });
    this.tweens.add({
      targets: bf,
      y: startY - 40,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  // ===== On-screen control buttons (tablet) =====

  private buildMoveButtons() {
    const { width: W, height: H } = GAME_CONFIG;
    const radius = 55;
    const margin = 40;
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
      // Don't propagate to game-level pointer handlers
      bg.on(
        'pointerdown',
        (p: Phaser.Input.Pointer, _x: number, _y: number, evt: Phaser.Types.Input.EventData) => {
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
      return { bg, label };
    };

    makeButton(
      margin + radius,
      '◀',
      () => {
        this.inputLeft = true;
      },
      () => {
        this.inputLeft = false;
      }
    );
    makeButton(
      W - margin - radius,
      '▶',
      () => {
        this.inputRight = true;
      },
      () => {
        this.inputRight = false;
      }
    );
  }

  // ===== Parallax =====

  private buildParallaxLayers() {
    const { width: W, groundY } = GAME_CONFIG;

    this.makeTexture('catch-plx-far-hills', 512, 140, (g) => {
      g.fillStyle(0x9fc4bd, 1);
      const hills = [
        { x: 60, rx: 140, ry: 80 },
        { x: 220, rx: 170, ry: 90 },
        { x: 400, rx: 160, ry: 85 },
      ];
      for (const p of hills) g.fillEllipse(p.x, 100, p.rx * 2, p.ry * 2);
    });
    this.parallaxFarHills = this.add
      .tileSprite(W / 2, groundY - 70, W, 140, 'catch-plx-far-hills')
      .setScrollFactor(0)
      .setDepth(-5);

    this.makeTexture('catch-plx-mountains', 512, 200, (g) => {
      g.fillStyle(0x6d8e9e, 1);
      const peaks = [
        [-20, 200, 80, 40, 180, 200],
        [120, 200, 220, 30, 320, 200],
        [280, 200, 370, 60, 460, 200],
        [420, 200, 500, 80, 580, 200],
      ];
      for (const p of peaks) g.fillTriangle(p[0], p[1], p[2], p[3], p[4], p[5]);
      g.fillStyle(0xffffff, 0.8);
      g.fillTriangle(210, 50, 220, 30, 230, 50);
      g.fillTriangle(360, 80, 370, 60, 380, 80);
    });
    this.parallaxMountains = this.add
      .tileSprite(W / 2, groundY - 110, W, 200, 'catch-plx-mountains')
      .setScrollFactor(0)
      .setDepth(-4);

    this.makeTexture('catch-plx-clouds', 512, 200, (g) => {
      g.fillStyle(0xffffff, 0.92);
      const clouds = [
        { x: 80, y: 60, r: 28 },
        { x: 105, y: 55, r: 34 },
        { x: 135, y: 62, r: 28 },
        { x: 260, y: 100, r: 22 },
        { x: 285, y: 95, r: 30 },
        { x: 310, y: 102, r: 22 },
        { x: 400, y: 50, r: 26 },
        { x: 425, y: 46, r: 32 },
        { x: 455, y: 52, r: 26 },
      ];
      for (const c of clouds) g.fillCircle(c.x, c.y, c.r);
    });
    this.parallaxClouds = this.add
      .tileSprite(W / 2, 140, W, 200, 'catch-plx-clouds')
      .setScrollFactor(0)
      .setDepth(-3);

    this.makeTexture('catch-plx-trees', 512, 140, (g) => {
      const trees = [
        { x: 50, w: 70, h: 110 },
        { x: 180, w: 55, h: 90 },
        { x: 280, w: 80, h: 125 },
        { x: 400, w: 60, h: 95 },
      ];
      for (const t of trees) {
        const baseY = 140;
        g.fillStyle(0x5a3a22, 1);
        g.fillRect(t.x + t.w / 2 - 6, baseY - t.h / 3, 12, t.h / 3);
        g.fillStyle(0x4a7a3c, 1);
        g.fillTriangle(
          t.x,
          baseY - t.h / 3 + 10,
          t.x + t.w / 2,
          baseY - t.h,
          t.x + t.w,
          baseY - t.h / 3 + 10
        );
        g.fillStyle(0x5d9348, 1);
        g.fillTriangle(
          t.x + 10,
          baseY - t.h / 3,
          t.x + t.w / 2,
          baseY - t.h + 20,
          t.x + t.w - 10,
          baseY - t.h / 3
        );
      }
      g.fillStyle(0x4a7a3c, 1);
      const bushes = [
        { x: 130, y: 125, r: 18 },
        { x: 240, y: 128, r: 14 },
        { x: 350, y: 125, r: 18 },
        { x: 470, y: 128, r: 14 },
      ];
      for (const b of bushes) g.fillCircle(b.x, b.y, b.r);
    });
    this.parallaxTrees = this.add
      .tileSprite(W / 2, groundY - 40, W, 140, 'catch-plx-trees')
      .setScrollFactor(0)
      .setDepth(-2);

    this.makeTexture('catch-plx-ground', 256, 120, (g) => {
      // base grass
      g.fillStyle(0x5a9039, 1);
      g.fillRect(0, 0, 256, 120);
      // darker grass tufts
      g.fillStyle(0x4a7a30, 1);
      const tufts = [
        { x: 20, w: 3, h: 8 },
        { x: 40, w: 2, h: 6 },
        { x: 60, w: 3, h: 10 },
        { x: 95, w: 2, h: 7 },
        { x: 130, w: 3, h: 9 },
        { x: 175, w: 2, h: 6 },
        { x: 210, w: 3, h: 8 },
      ];
      for (const t of tufts) g.fillRect(t.x, 2, t.w, t.h);
      // flowers scattered (petals + center)
      const flowers = [
        { x: 30, y: 16, c: 0xff8c7a }, // coral
        { x: 80, y: 22, c: 0xffd166 }, // yellow
        { x: 145, y: 18, c: 0xc9a3f4 }, // lilac
        { x: 195, y: 24, c: 0xff8c7a }, // coral
        { x: 235, y: 16, c: 0xfff0a3 }, // pale yellow
      ];
      for (const f of flowers) {
        // 4 petals
        g.fillStyle(f.c, 1);
        g.fillCircle(f.x - 3, f.y, 3);
        g.fillCircle(f.x + 3, f.y, 3);
        g.fillCircle(f.x, f.y - 3, 3);
        g.fillCircle(f.x, f.y + 3, 3);
        // center
        g.fillStyle(0xffd700, 1);
        g.fillCircle(f.x, f.y, 2);
      }
      // soil highlights at bottom
      g.fillStyle(0x3d6524, 0.6);
      g.fillRect(0, 100, 256, 4);
    });
    this.parallaxGround = this.add
      .tileSprite(W / 2, groundY + 60, W, 120, 'catch-plx-ground')
      .setScrollFactor(0)
      .setDepth(-1);
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
}
