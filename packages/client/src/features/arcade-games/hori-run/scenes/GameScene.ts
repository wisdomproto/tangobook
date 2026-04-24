import * as Phaser from 'phaser';
import {
  GAME_CONFIG,
  HORI_CONFIG,
  WORLD_CONFIG,
  DIFFICULTY,
  ANIM_KEYS,
  SPRITE_KEYS,
  SFX_KEYS,
  OBSTACLES,
  ObstacleType,
  COIN_CONFIG,
  COIN_PATTERNS,
  POWERUPS,
  PowerUpType,
  POWERUP_SPAWN_INTERVAL_MS,
  COMBO_CONFIG,
  BIOMES,
  BiomeSpec,
  BIOME_TRANSITION_MS,
  MILESTONES_M,
  STORAGE_KEY,
  DEFAULT_STATS,
  HoriRunStats,
} from '../config';

type HoriState = 'running' | 'jumping' | 'hurt' | 'ducking';

interface ObstacleEntity {
  type: ObstacleType;
  gfx: Phaser.GameObjects.Container;
  width: number;
  height: number;
  hitboxShrinkX: number;
  hitboxShrinkY: number;
}

interface CoinEntity {
  gfx: Phaser.GameObjects.Container;
  collected: boolean;
}

interface PowerUpEntity {
  gfx: Phaser.GameObjects.Container;
  type: PowerUpType;
}

interface ParallaxLayer {
  tile: Phaser.GameObjects.TileSprite;
  scrollFactor: number;
  textureKey: string;
}

export class GameScene extends Phaser.Scene {
  // Hori
  private hori!: Phaser.GameObjects.Sprite;
  private horiVy = 0;
  private horiGrounded = true;
  private canDoubleJump = false;
  private state: HoriState = 'running';
  // Hori visual effects
  private shieldAura?: Phaser.GameObjects.Graphics;
  private magnetField?: Phaser.GameObjects.Graphics;
  private boostTrail: Phaser.GameObjects.Image[] = [];
  private lastTrailMs = 0;

  // World
  private obstacles: ObstacleEntity[] = [];
  private coins: CoinEntity[] = [];
  private powerups: PowerUpEntity[] = [];
  private obstacleSpawnTimer?: Phaser.Time.TimerEvent;
  private powerupSpawnTimer?: Phaser.Time.TimerEvent;
  private runDustTimer?: Phaser.Time.TimerEvent;

  // State
  private gameOver = false;
  private paused = false;
  private started = false;
  private startTimeMs = 0;
  private distanceM = 0;
  private scrollAccum = 0; // internal px accumulation -> distance

  // Score / coins
  private coinCount = 0;
  private combo = 0;
  private comboUntil = 0;

  // Active power-ups (timestamps in ms until which effect is active; 0 = inactive)
  private magnetUntil = 0;
  private boostUntil = 0;
  private doubleUntil = 0;
  private shieldActive = false;

  // Meta
  private stats!: HoriRunStats;
  private milestonesHit = new Set<number>();

  // UI
  private distanceText!: Phaser.GameObjects.Text;
  private coinText!: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;
  private biomeLabel!: Phaser.GameObjects.Text;
  private powerupIcons: Partial<Record<PowerUpType, Phaser.GameObjects.Container>> = {};

  // Biome
  private currentBiomeIdx = 0;
  private pendingBiomeIdx = 0;
  private biomeTransitioning = false;
  private skyTop!: Phaser.GameObjects.Graphics;
  private skyFadeTop?: Phaser.GameObjects.Graphics;
  private parallaxLayers: ParallaxLayer[] = [];
  private parallaxFadeLayers: ParallaxLayer[] = [];
  private skyDecor: Phaser.GameObjects.GameObject[] = [];

  // Audio
  private bgm?: Phaser.Sound.BaseSound;

  // Input
  private keyJump?: Phaser.Input.Keyboard.Key;
  private keyUp?: Phaser.Input.Keyboard.Key;
  private keyDown?: Phaser.Input.Keyboard.Key;
  private keySpace?: Phaser.Input.Keyboard.Key;
  private inputDuck = false;

  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    this.resetState();
    this.loadStats();
    this.buildBackground();
    this.buildAnimations();
    this.buildHori();
    this.buildInput();
    this.buildUI();
    this.buildBGM();
    this.showStartOverlay();
  }

  // ================================================================
  // SETUP
  // ================================================================

  private resetState() {
    this.obstacles = [];
    this.coins = [];
    this.powerups = [];
    this.horiVy = 0;
    this.horiGrounded = true;
    this.canDoubleJump = false;
    this.state = 'running';
    this.gameOver = false;
    this.paused = false;
    this.started = false;
    this.distanceM = 0;
    this.scrollAccum = 0;
    this.coinCount = 0;
    this.combo = 0;
    this.comboUntil = 0;
    this.magnetUntil = 0;
    this.boostUntil = 0;
    this.doubleUntil = 0;
    this.shieldActive = false;
    this.milestonesHit = new Set();
    this.currentBiomeIdx = 0;
    this.pendingBiomeIdx = 0;
    this.biomeTransitioning = false;
    this.parallaxLayers = [];
    this.parallaxFadeLayers = [];
    this.skyDecor = [];
    this.boostTrail = [];
    this.powerupIcons = {};
  }

  private buildBackground() {
    const biome = BIOMES[0];

    // Sky gradient
    this.skyTop = this.add.graphics().setDepth(-100);
    this.drawSkyGradient(this.skyTop, biome);

    // Sky decoration (sun/moon/stars)
    this.drawSkyDecor(biome);

    // Parallax layers
    this.buildParallaxLayers(biome, this.parallaxLayers, '');
  }

  private drawSkyGradient(g: Phaser.GameObjects.Graphics, biome: BiomeSpec) {
    const { width: W, height: H, groundY } = GAME_CONFIG;
    g.clear();
    g.fillGradientStyle(biome.skyTop, biome.skyTop, biome.skyBottom, biome.skyBottom, 1);
    g.fillRect(0, 0, W, H);
    void groundY;
  }

  private drawSkyDecor(biome: BiomeSpec) {
    // Clear previous decor
    this.skyDecor.forEach((o) => o.destroy());
    this.skyDecor = [];

    const { width: W } = GAME_CONFIG;

    if (biome.sunColor) {
      const sx = W - 180;
      const sy = 130;
      const halo = this.add.circle(sx, sy, 85, biome.sunColor, 0.22).setDepth(-90);
      const sun = this.add.circle(sx, sy, 55, biome.sunColor, 1).setDepth(-89);
      const inner = this.add.circle(sx, sy, 42, 0xffffff, 0.6).setDepth(-88);
      this.tweens.add({
        targets: halo,
        scale: { from: 1, to: 1.12 },
        alpha: { from: 0.2, to: 0.32 },
        duration: 2500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
      this.skyDecor.push(halo, sun, inner);
    }

    if (biome.moonVisible) {
      const mx = W - 200;
      const my = 140;
      const glow = this.add.circle(mx, my, 75, 0xe8d8ff, 0.22).setDepth(-90);
      const moon = this.add.circle(mx, my, 48, 0xfaf0e6, 1).setDepth(-89);
      const crater1 = this.add.circle(mx - 12, my - 6, 7, 0xddd0c4, 1).setDepth(-88);
      const crater2 = this.add.circle(mx + 8, my + 10, 5, 0xddd0c4, 1).setDepth(-88);
      const crater3 = this.add.circle(mx + 14, my - 14, 4, 0xddd0c4, 1).setDepth(-88);
      this.skyDecor.push(glow, moon, crater1, crater2, crater3);
    }

    if (biome.starsVisible) {
      for (let i = 0; i < 45; i++) {
        const x = Phaser.Math.Between(0, W);
        const y = Phaser.Math.Between(10, 260);
        const size = Phaser.Math.Between(1, 3);
        const star = this.add.circle(x, y, size, 0xffffff, Phaser.Math.FloatBetween(0.5, 1));
        star.setDepth(-91);
        this.tweens.add({
          targets: star,
          alpha: { from: 0.3, to: 1 },
          duration: Phaser.Math.Between(1200, 3000),
          yoyo: true,
          repeat: -1,
        });
        this.skyDecor.push(star);
      }
    }
  }

  private buildParallaxLayers(biome: BiomeSpec, into: ParallaxLayer[], suffix: string) {
    const { width: W, groundY } = GAME_CONFIG;
    const keyPrefix = `plx-${biome.id}${suffix}`;

    const addLayer = (
      keySuffix: string,
      width: number,
      height: number,
      y: number,
      scrollFactor: number,
      drawFn: (g: Phaser.GameObjects.Graphics) => void,
      depth: number
    ) => {
      const key = `${keyPrefix}-${keySuffix}`;
      if (!this.textures.exists(key)) {
        const g = this.add.graphics();
        drawFn(g);
        g.generateTexture(key, width, height);
        g.destroy();
      }
      const tile = this.add
        .tileSprite(W / 2, y, W, height, key)
        .setScrollFactor(0)
        .setDepth(depth);
      into.push({ tile, scrollFactor, textureKey: key });
    };

    // Far hills
    addLayer(
      'far-hills',
      512,
      140,
      groundY - 70,
      0.08,
      (g) => {
        g.fillStyle(biome.farHillColor, 1);
        const hills = [
          { x: 60, rx: 140, ry: 80 },
          { x: 220, rx: 170, ry: 90 },
          { x: 400, rx: 160, ry: 85 },
        ];
        for (const p of hills) g.fillEllipse(p.x, 100, p.rx * 2, p.ry * 2);
      },
      -60
    );

    // Mountains
    addLayer(
      'mountains',
      512,
      200,
      groundY - 110,
      0.18,
      (g) => {
        g.fillStyle(biome.mountainColor, 1);
        const peaks = [
          [-20, 200, 80, 40, 180, 200],
          [120, 200, 220, 30, 320, 200],
          [280, 200, 370, 60, 460, 200],
          [420, 200, 500, 80, 580, 200],
        ];
        for (const p of peaks) g.fillTriangle(p[0], p[1], p[2], p[3], p[4], p[5]);
        g.fillStyle(biome.mountainSnow, 0.85);
        g.fillTriangle(210, 52, 220, 30, 230, 52);
        g.fillTriangle(360, 80, 370, 60, 380, 80);
      },
      -50
    );

    // Clouds
    addLayer(
      'clouds',
      512,
      200,
      140,
      0.25,
      (g) => {
        g.fillStyle(biome.cloudColor, biome.cloudAlpha);
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
      },
      -40
    );

    // Trees
    addLayer(
      'trees',
      512,
      140,
      groundY - 40,
      0.55,
      (g) => {
        const trees = [
          { x: 50, w: 70, h: 110 },
          { x: 180, w: 55, h: 90 },
          { x: 280, w: 80, h: 125 },
          { x: 400, w: 60, h: 95 },
        ];
        for (const t of trees) {
          const baseY = 140;
          g.fillStyle(biome.treeTrunk, 1);
          g.fillRect(t.x + t.w / 2 - 6, baseY - t.h / 3, 12, t.h / 3);
          g.fillStyle(biome.treeFoliage, 1);
          g.fillTriangle(
            t.x,
            baseY - t.h / 3 + 10,
            t.x + t.w / 2,
            baseY - t.h,
            t.x + t.w,
            baseY - t.h / 3 + 10
          );
          g.fillStyle(biome.treeFoliage2, 1);
          g.fillTriangle(
            t.x + 10,
            baseY - t.h / 3,
            t.x + t.w / 2,
            baseY - t.h + 20,
            t.x + t.w - 10,
            baseY - t.h / 3
          );
        }
        g.fillStyle(biome.bushColor, 1);
        const bushes = [
          { x: 130, y: 125, r: 18 },
          { x: 240, y: 128, r: 14 },
          { x: 350, y: 125, r: 18 },
          { x: 470, y: 128, r: 14 },
        ];
        for (const b of bushes) g.fillCircle(b.x, b.y, b.r);
      },
      -30
    );

    // Ground
    addLayer(
      'ground',
      256,
      120,
      groundY + 60,
      1.0,
      (g) => {
        g.fillStyle(biome.grassBase, 1);
        g.fillRect(0, 0, 256, 120);
        g.fillStyle(biome.grassTuft, 1);
        const tufts = [20, 40, 60, 95, 130, 175, 210];
        for (const x of tufts) g.fillRect(x, 2, 3, 8);
        const flowers = [
          { x: 35, y: 18 },
          { x: 90, y: 24 },
          { x: 155, y: 18 },
          { x: 215, y: 22 },
        ];
        for (let i = 0; i < flowers.length; i++) {
          const f = flowers[i];
          const c = biome.flowerColors[i % biome.flowerColors.length];
          g.fillStyle(c, 1);
          g.fillCircle(f.x - 3, f.y, 3);
          g.fillCircle(f.x + 3, f.y, 3);
          g.fillCircle(f.x, f.y - 3, 3);
          g.fillCircle(f.x, f.y + 3, 3);
          g.fillStyle(0xffd700, 1);
          g.fillCircle(f.x, f.y, 2);
        }
        g.fillStyle(biome.grassTuft, 0.7);
        g.fillRect(0, 100, 256, 4);
      },
      -20
    );
  }

  private buildAnimations() {
    if (this.anims.exists(ANIM_KEYS.run)) return;
    const create = (key: string, sheet: string, rate: number, repeat: number) => {
      this.anims.create({
        key,
        frames: this.anims.generateFrameNumbers(sheet, { start: 0, end: 3 }),
        frameRate: rate,
        repeat,
      });
    };
    create(ANIM_KEYS.run, SPRITE_KEYS.run, 7.7, -1);
    create(ANIM_KEYS.jump, SPRITE_KEYS.jump, 5.5, 0);
    create(ANIM_KEYS.hurt, SPRITE_KEYS.hurt, 5, 0);
    create(ANIM_KEYS.idle, SPRITE_KEYS.idle, 3, -1);
    create(ANIM_KEYS.celebrate, SPRITE_KEYS.celebrate, 5.5, -1);
  }

  private buildHori() {
    const { groundY } = GAME_CONFIG;
    this.hori = this.add
      .sprite(HORI_CONFIG.startX, groundY - 80, SPRITE_KEYS.run)
      .setScale(HORI_CONFIG.scale)
      .setDepth(20);
    this.hori.play(ANIM_KEYS.run);

    // Shield aura (hidden by default)
    this.shieldAura = this.add.graphics().setDepth(19).setVisible(false);

    // Magnet field (hidden)
    this.magnetField = this.add.graphics().setDepth(18).setVisible(false);
  }

  private buildInput() {
    this.keyJump = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
    this.keyUp = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keySpace = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.keyDown = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);

    this.input.keyboard?.on('keydown-SPACE', () => this.onJumpInput());
    this.input.keyboard?.on('keydown-UP', () => this.onJumpInput());
    this.input.keyboard?.on('keydown-W', () => this.onJumpInput());
    this.input.keyboard?.on('keydown-DOWN', () => (this.inputDuck = true));
    this.input.keyboard?.on('keyup-DOWN', () => (this.inputDuck = false));
    this.input.keyboard?.on('keydown-S', () => (this.inputDuck = true));
    this.input.keyboard?.on('keyup-S', () => (this.inputDuck = false));

    // Pointer: tap upper half = jump, lower half = duck (hold)
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (p.y > GAME_CONFIG.height * 0.6) this.inputDuck = true;
      else this.onJumpInput();
    });
    this.input.on('pointerup', () => (this.inputDuck = false));
    this.input.on('pointerupoutside', () => (this.inputDuck = false));
  }

  private buildUI() {
    const { width: W } = GAME_CONFIG;

    // Distance (top-center)
    this.distanceText = this.add
      .text(W / 2, 26, '0m', {
        fontSize: '48px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#1a1a1a',
        strokeThickness: 5,
      })
      .setOrigin(0.5, 0)
      .setDepth(1000);

    // Coin counter (top-right)
    this.coinText = this.add
      .text(W - 40, 32, '🪙 0', {
        fontSize: '34px',
        fontStyle: 'bold',
        color: '#ffd700',
        stroke: '#1a1a1a',
        strokeThickness: 5,
      })
      .setOrigin(1, 0)
      .setDepth(1000);

    // Combo (below coin, hidden unless active)
    this.comboText = this.add
      .text(W - 40, 86, '', {
        fontSize: '26px',
        fontStyle: 'bold',
        color: '#ff8c7a',
        stroke: '#1a1a1a',
        strokeThickness: 4,
      })
      .setOrigin(1, 0)
      .setDepth(1000);

    // Biome label (top-left)
    this.biomeLabel = this.add
      .text(40, 32, BIOMES[0].name, {
        fontSize: '26px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#1a1a1a',
        strokeThickness: 4,
      })
      .setDepth(1000);

    // Mute button (top-left below biome)
    const muteBtn = this.add
      .text(40, 80, this.sound.mute ? '🔇' : '🔊', {
        fontSize: '26px',
        backgroundColor: '#00000066',
        padding: { left: 6, right: 6, top: 2, bottom: 2 },
      })
      .setInteractive({ useHandCursor: true })
      .setDepth(1000);
    muteBtn.on('pointerdown', () => {
      this.sound.mute = !this.sound.mute;
      muteBtn.setText(this.sound.mute ? '🔇' : '🔊');
    });
  }

  private buildBGM() {
    if (!this.sound.get(SFX_KEYS.bgm)) {
      this.bgm = this.sound.add(SFX_KEYS.bgm, { loop: true, volume: 0.22 });
    } else {
      this.bgm = this.sound.get(SFX_KEYS.bgm);
    }
  }

  private showStartOverlay() {
    const { width: W, height: H } = GAME_CONFIG;
    const overlay = this.add.container(0, 0).setDepth(2000);
    const bg = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.55);
    const title = this.add
      .text(W / 2, H / 2 - 140, '🏃 호리 달리기', {
        fontSize: '64px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0.5);
    const subtitle = this.add
      .text(
        W / 2,
        H / 2 - 80,
        '스페이스 / 탭 위쪽: 점프 (공중에서 한 번 더 = 이중점프)   ↓ / 탭 아래쪽 꾹: 슬라이드',
        {
          fontSize: '18px',
          color: '#ffd7a1',
        }
      )
      .setOrigin(0.5);
    const bestDist = this.add
      .text(W / 2, H / 2 - 20, `🏆 최고기록 ${this.stats.bestDistance}m`, {
        fontSize: '28px',
        color: '#ffffff',
      })
      .setOrigin(0.5);
    const totalCoins = this.add
      .text(W / 2, H / 2 + 20, `🪙 누적 ${this.stats.totalCoins}개`, {
        fontSize: '24px',
        color: '#ffd700',
      })
      .setOrigin(0.5);
    const prompt = this.add
      .text(W / 2, H / 2 + 100, '탭하거나 스페이스로 시작', {
        fontSize: '26px',
        color: '#ffffff',
      })
      .setOrigin(0.5);
    this.tweens.add({
      targets: prompt,
      alpha: { from: 1, to: 0.4 },
      duration: 800,
      yoyo: true,
      repeat: -1,
    });
    overlay.add([bg, title, subtitle, bestDist, totalCoins, prompt]);

    const start = () => {
      overlay.destroy();
      this.startGame();
    };
    this.input.keyboard?.once('keydown-SPACE', start);
    this.input.once('pointerdown', start);
  }

  private startGame() {
    this.started = true;
    this.startTimeMs = this.time.now;
    if (!this.bgm?.isPlaying) this.bgm?.play();

    this.scheduleNextObstacle();
    this.scheduleNextPowerup();
    this.scheduleCoinSpawn();
    this.runDustTimer = this.time.addEvent({
      delay: 220,
      loop: true,
      callback: () => {
        if (this.state === 'running' && this.horiGrounded && !this.gameOver) {
          this.spawnDustPuff(this.hori.x - 20, GAME_CONFIG.groundY - 8, 3, 0xd9c9a8);
        }
      },
    });
  }

  // ================================================================
  // UPDATE LOOP
  // ================================================================

  update(_time: number, delta: number) {
    if (!this.started || this.gameOver) return;

    const dt = delta / 1000;
    const elapsed = this.time.now - this.startTimeMs;
    const now = this.time.now;

    const baseSpeed = WORLD_CONFIG.baseScrollSpeed * this.getSpeedMultiplier(elapsed);
    const boostMul = now < this.boostUntil ? 1.55 : 1.0;
    const speed = baseSpeed * boostMul;
    const pxStep = speed * dt;

    // Parallax scroll
    for (const layer of this.parallaxLayers) {
      layer.tile.tilePositionX += pxStep * layer.scrollFactor;
    }
    for (const layer of this.parallaxFadeLayers) {
      layer.tile.tilePositionX += pxStep * layer.scrollFactor;
    }

    // Distance accumulates in meters: 10 px = 1m
    this.scrollAccum += pxStep;
    const newDistance = Math.floor(this.scrollAccum / 10);
    if (newDistance !== this.distanceM) {
      this.distanceM = newDistance;
      this.distanceText.setText(`${this.distanceM}m`);
      this.checkMilestones();
      this.checkBiomeTransition();
    }

    // Gravity / vertical
    this.horiVy += HORI_CONFIG.gravity * dt;
    this.hori.y += this.horiVy * dt;
    const floorY = GAME_CONFIG.groundY - 80;
    if (this.hori.y >= floorY) {
      this.hori.y = floorY;
      if (!this.horiGrounded) {
        // Just landed
        this.horiGrounded = true;
        this.horiVy = 0;
        this.sound.play(SFX_KEYS.land, { volume: 0.4 });
        this.spawnDustPuff(this.hori.x, GAME_CONFIG.groundY - 4, 8, 0xcfc0a0);
        if (this.state === 'jumping') {
          this.state = 'running';
          this.hori.play(ANIM_KEYS.run, true);
        }
      }
    }

    // Duck transition
    if (this.state === 'running' && this.inputDuck && this.horiGrounded) {
      this.state = 'ducking';
      this.hori.setScale(HORI_CONFIG.scale_duck);
      this.hori.y = GAME_CONFIG.groundY - 60; // sit lower
      this.hori.play(ANIM_KEYS.idle, true);
    } else if (this.state === 'ducking' && !this.inputDuck) {
      this.state = 'running';
      this.hori.setScale(HORI_CONFIG.scale);
      this.hori.y = GAME_CONFIG.groundY - 80;
      this.hori.play(ANIM_KEYS.run, true);
    }

    // Move + check obstacles
    this.updateObstacles(pxStep);
    // Move + check coins
    this.updateCoins(pxStep, now);
    // Move + check powerups
    this.updatePowerups(pxStep);

    // Combo window decay
    if (this.combo > 0 && now > this.comboUntil) {
      this.combo = 0;
      this.comboText.setText('');
    }

    // Power-up visuals
    this.updateActiveEffects(now, dt);

    // Biome transition progress
    if (this.biomeTransitioning) this.updateBiomeTransition();
  }

  private getSpeedMultiplier(elapsedMs: number): number {
    const progress = Math.min(1, elapsedMs / DIFFICULTY.speedRampDurationMs);
    return 1 + (DIFFICULTY.speedMaxMultiplier - 1) * progress;
  }

  private getSpawnMultiplier(elapsedMs: number): number {
    const progress = Math.min(1, elapsedMs / DIFFICULTY.spawnRampDurationMs);
    return 1 - (1 - DIFFICULTY.spawnMinMultiplier) * progress;
  }

  // ================================================================
  // JUMP / INPUT
  // ================================================================

  private onJumpInput() {
    if (!this.started || this.gameOver) return;
    if (this.state === 'hurt') return;

    if (this.horiGrounded) {
      // First jump from ground
      this.horiVy = HORI_CONFIG.jumpVelocity;
      this.horiGrounded = false;
      this.canDoubleJump = true; // enable double jump after first jump
      this.state = 'jumping';
      this.hori.play(ANIM_KEYS.jump);
      this.sound.play(SFX_KEYS.jump, {
        volume: 0.5,
        rate: Phaser.Math.FloatBetween(0.92, 1.08),
      });
      this.spawnDustPuff(this.hori.x, GAME_CONFIG.groundY - 4, 6, 0xe0d2b4);
    } else if (this.canDoubleJump) {
      // Air double-jump
      this.horiVy = HORI_CONFIG.doubleJumpVelocity;
      this.canDoubleJump = false;
      this.hori.play(ANIM_KEYS.jump);
      this.sound.play(SFX_KEYS.jump, {
        volume: 0.42,
        rate: Phaser.Math.FloatBetween(1.25, 1.4),
      });
      this.spawnDoubleJumpSparkles();
      // Quick sprite spin for juice
      this.tweens.add({
        targets: this.hori,
        angle: { from: 0, to: 360 },
        duration: 420,
        ease: 'Cubic.easeOut',
        onComplete: () => this.hori.setAngle(0),
      });
    }
  }

  private spawnDoubleJumpSparkles() {
    const cx = this.hori.x;
    const cy = this.hori.y + 20;
    for (let i = 0; i < 14; i++) {
      const size = Phaser.Math.Between(4, 8);
      const color = Phaser.Math.RND.pick([0xfff6a3, 0xffd700, 0xffe77a, 0xffffff]);
      const sparkle = this.add.circle(cx, cy, size, color, 1).setDepth(14);
      const ang = (Math.PI * 2 * i) / 14 + Phaser.Math.FloatBetween(-0.2, 0.2);
      const dist = Phaser.Math.Between(50, 90);
      this.tweens.add({
        targets: sparkle,
        x: cx + Math.cos(ang) * dist,
        y: cy + Math.sin(ang) * dist + 40,
        alpha: 0,
        scale: 0,
        duration: Phaser.Math.Between(400, 600),
        ease: 'Cubic.easeOut',
        onComplete: () => sparkle.destroy(),
      });
    }
  }

  // ================================================================
  // OBSTACLES
  // ================================================================

  private scheduleNextObstacle() {
    if (this.gameOver) return;
    const elapsed = this.time.now - this.startTimeMs;
    const spawnMul = this.getSpawnMultiplier(elapsed);
    const delay = Phaser.Math.Between(
      WORLD_CONFIG.obstacleSpawnMin * spawnMul,
      WORLD_CONFIG.obstacleSpawnMax * spawnMul
    );
    this.obstacleSpawnTimer = this.time.delayedCall(delay, () => this.trySpawnObstacle());
  }

  private trySpawnObstacle() {
    if (this.gameOver) return;

    // Enforce minimum physical gap from rightmost existing obstacle.
    // If too close, wait briefly and retry — don't chain a separate schedule.
    const { width: W } = GAME_CONFIG;
    const spawnX = W + 80;

    let rightmost: ObstacleEntity | undefined;
    let rightmostX = -Infinity;
    for (const o of this.obstacles) {
      if (o.gfx.x > rightmostX) {
        rightmostX = o.gfx.x;
        rightmost = o;
      }
    }

    let requiredGap = WORLD_CONFIG.minObstacleGap;
    if (rightmost) {
      requiredGap += WORLD_CONFIG.extraGapAfter[rightmost.type] ?? 0;
    }

    if (rightmostX > -Infinity && spawnX - rightmostX < requiredGap) {
      // Too close — retry shortly
      this.obstacleSpawnTimer = this.time.delayedCall(300, () => this.trySpawnObstacle());
      return;
    }

    this.spawnObstacle();
    this.maybeSpawnCoinPattern();
    // Schedule next normal interval
    this.scheduleNextObstacle();
  }

  private pickObstacleType(): ObstacleType {
    const eligible = (
      Object.entries(OBSTACLES) as Array<[ObstacleType, typeof OBSTACLES.rock]>
    ).filter(([, spec]) => this.distanceM >= spec.unlockDistance);
    const total = eligible.reduce((s, [, spec]) => s + spec.spawnWeight, 0);
    let r = Phaser.Math.FloatBetween(0, total);
    for (const [type, spec] of eligible) {
      r -= spec.spawnWeight;
      if (r <= 0) return type;
    }
    return eligible[0][0];
  }

  private spawnObstacle() {
    const type = this.pickObstacleType();
    const spec = OBSTACLES[type];
    const { width: W, groundY } = GAME_CONFIG;

    const container = this.add.container(W + 80, 0).setDepth(15);
    const centerY = groundY - spec.groundOffset - spec.height / 2;
    container.y = centerY;

    // Draw based on type
    const g = this.add.graphics();
    if (type === 'rock') {
      // Chunky rounded rock with highlight
      g.fillStyle(0x6b4423, 1);
      g.fillRoundedRect(-spec.width / 2, -spec.height / 2, spec.width, spec.height, 12);
      g.fillStyle(0x8a5c30, 1);
      g.fillRoundedRect(
        -spec.width / 2 + 6,
        -spec.height / 2 + 6,
        spec.width - 12,
        spec.height * 0.35,
        8
      );
      g.fillStyle(0x4a2c16, 1);
      g.fillCircle(-spec.width / 4, spec.height / 6, 3);
      g.fillCircle(spec.width / 4 - 4, spec.height / 8, 4);
    } else if (type === 'spike') {
      // Tall cactus-like spike
      g.fillStyle(0x2e7a45, 1);
      g.fillRoundedRect(-spec.width / 2, -spec.height / 2, spec.width, spec.height, 14);
      g.fillStyle(0x3e9a55, 1);
      g.fillRoundedRect(
        -spec.width / 2 + 5,
        -spec.height / 2 + 5,
        spec.width - 10,
        spec.height - 10,
        10
      );
      // spines
      g.fillStyle(0x1e5a2d, 1);
      for (let i = 0; i < 4; i++) {
        const yOff = -spec.height / 2 + 12 + i * 22;
        g.fillTriangle(
          -spec.width / 2 - 3,
          yOff,
          -spec.width / 2,
          yOff - 4,
          -spec.width / 2,
          yOff + 4
        );
        g.fillTriangle(
          spec.width / 2 + 3,
          yOff,
          spec.width / 2,
          yOff - 4,
          spec.width / 2,
          yOff + 4
        );
      }
      // small "arm"
      g.fillStyle(0x2e7a45, 1);
      g.fillRoundedRect(spec.width / 2 - 4, -6, 16, 24, 6);
    } else if (type === 'bird') {
      // Flying bird silhouette (body + wings)
      const bodyY = 0;
      g.fillStyle(0x2a1a10, 1);
      g.fillEllipse(0, bodyY, spec.width * 0.55, spec.height * 0.6);
      // Wings
      g.fillStyle(0x3a2a20, 1);
      g.fillTriangle(-4, bodyY, -spec.width / 2, bodyY - spec.height / 2, -8, bodyY - 4);
      g.fillTriangle(4, bodyY, spec.width / 2, bodyY - spec.height / 2, 8, bodyY - 4);
      // Eye + beak
      g.fillStyle(0xffffff, 1);
      g.fillCircle(spec.width * 0.12, -3, 3);
      g.fillStyle(0xffaa44, 1);
      g.fillTriangle(spec.width * 0.22, 0, spec.width * 0.34, -2, spec.width * 0.22, 4);
    }
    container.add(g);

    // Flap wings for bird
    if (type === 'bird') {
      this.tweens.add({
        targets: container,
        scaleY: { from: 0.9, to: 1.1 },
        duration: 300,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    this.obstacles.push({
      type,
      gfx: container,
      width: spec.width,
      height: spec.height,
      hitboxShrinkX: 14,
      hitboxShrinkY: 12,
    });
  }

  private updateObstacles(pxStep: number) {
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const o = this.obstacles[i];
      o.gfx.x -= pxStep;
      if (o.gfx.x < -120) {
        o.gfx.destroy();
        this.obstacles.splice(i, 1);
        continue;
      }
      // AABB collision with hori
      if (
        this.collidesWithHori(o.gfx.x, o.gfx.y, o.width, o.height, o.hitboxShrinkX, o.hitboxShrinkY)
      ) {
        // Ducking allows passing under bird
        if (o.type === 'bird' && this.state === 'ducking') continue;
        this.handleHurt();
        return;
      }
    }
  }

  private collidesWithHori(
    ox: number,
    oy: number,
    ow: number,
    oh: number,
    sx: number,
    sy: number
  ): boolean {
    // Hori hitbox
    const horiW = 512 * this.hori.scaleX * 0.45;
    const horiH = 512 * this.hori.scaleY * 0.55;
    const hx = this.hori.x;
    const hy = this.hori.y;
    const ox1 = ox - ow / 2 + sx;
    const ox2 = ox + ow / 2 - sx;
    const oy1 = oy - oh / 2 + sy;
    const oy2 = oy + oh / 2 - sy;
    const hx1 = hx - horiW / 2;
    const hx2 = hx + horiW / 2;
    const hy1 = hy - horiH / 2;
    const hy2 = hy + horiH / 2;
    return hx1 < ox2 && hx2 > ox1 && hy1 < oy2 && hy2 > oy1;
  }

  // ================================================================
  // COINS
  // ================================================================

  private scheduleCoinSpawn() {
    // Coins also spawn from obstacle-pattern triggers (see maybeSpawnCoinPattern).
    // Additionally spawn a random pattern periodically if no obstacles nearby.
    this.time.addEvent({
      delay: 3200,
      loop: true,
      callback: () => {
        if (this.gameOver) return;
        if (Math.random() < 0.55) this.spawnCoinPattern();
      },
    });
  }

  private maybeSpawnCoinPattern() {
    // 55% chance to drop coin pattern alongside obstacle
    if (Math.random() < 0.55) {
      this.time.delayedCall(Phaser.Math.Between(200, 900), () => this.spawnCoinPattern());
    }
  }

  private spawnCoinPattern() {
    const pattern = Phaser.Math.RND.pick(COIN_PATTERNS);
    const { width: W, groundY } = GAME_CONFIG;
    const anchorX = W + Phaser.Math.Between(30, 180);
    const anchorY = groundY;
    for (const pt of pattern.points) {
      this.spawnCoin(anchorX + pt.dx, anchorY + pt.dy);
    }
  }

  private spawnCoin(x: number, y: number) {
    const container = this.add.container(x, y).setDepth(12);
    const g = this.add.graphics();
    this.drawCoin(g, COIN_CONFIG.size);
    container.add(g);
    // Spinning (fake via scaleX)
    this.tweens.add({
      targets: container,
      scaleX: { from: 1, to: -1 },
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    this.coins.push({ gfx: container, collected: false });
  }

  private drawCoin(g: Phaser.GameObjects.Graphics, size: number) {
    // Gold ring with inner star
    g.fillStyle(0xffc850, 1);
    g.fillCircle(0, 0, size / 2);
    g.fillStyle(0xffe77a, 1);
    g.fillCircle(0, 0, size / 2 - 3);
    g.fillStyle(0xe0a030, 1);
    // draw star in center
    const r = size / 2 - 6;
    const pts = 5;
    g.beginPath();
    for (let i = 0; i < pts * 2; i++) {
      const radius = i % 2 === 0 ? r : r * 0.4;
      const a = (Math.PI / pts) * i - Math.PI / 2;
      const px = Math.cos(a) * radius;
      const py = Math.sin(a) * radius;
      if (i === 0) g.moveTo(px, py);
      else g.lineTo(px, py);
    }
    g.closePath();
    g.fillPath();
  }

  private updateCoins(pxStep: number, now: number) {
    const magnetActive = now < this.magnetUntil;

    for (let i = this.coins.length - 1; i >= 0; i--) {
      const c = this.coins[i];
      if (c.collected) continue;

      // Scroll left
      c.gfx.x -= pxStep;

      // Magnet attraction
      if (magnetActive) {
        const dx = this.hori.x - c.gfx.x;
        const dy = this.hori.y - c.gfx.y;
        const dist = Math.hypot(dx, dy);
        if (dist < COIN_CONFIG.magnetRadius) {
          const pull = 900 * (0.016 + (1 - dist / COIN_CONFIG.magnetRadius) * 0.02);
          c.gfx.x += (dx / dist) * pull * 0.03;
          c.gfx.y += (dy / dist) * pull * 0.03;
        }
      }

      // Despawn
      if (c.gfx.x < -40) {
        c.gfx.destroy();
        this.coins.splice(i, 1);
        continue;
      }

      // Collect check
      const dx = c.gfx.x - this.hori.x;
      const dy = c.gfx.y - this.hori.y;
      if (Math.hypot(dx, dy) < 60) {
        this.collectCoin(c, now);
        this.coins.splice(i, 1);
      }
    }
  }

  private collectCoin(c: CoinEntity, now: number) {
    c.collected = true;
    const doubleActive = now < this.doubleUntil;
    const comboIdx = Math.min(this.combo, COMBO_CONFIG.multipliers.length - 1);
    const comboMul = COMBO_CONFIG.multipliers[comboIdx];
    const value = COIN_CONFIG.value * (doubleActive ? 2 : 1) * comboMul;
    const gained = Math.ceil(value);
    this.coinCount += gained;
    this.coinText.setText(`🪙 ${this.coinCount}`);

    // Pulse coin UI
    this.tweens.add({
      targets: this.coinText,
      scale: { from: 1, to: 1.2 },
      duration: 90,
      yoyo: true,
    });

    // Combo increment
    this.combo = Math.min(this.combo + 1, COMBO_CONFIG.maxDisplay);
    this.comboUntil = now + COMBO_CONFIG.window;
    if (this.combo >= 2) {
      this.comboText.setText(`x${comboMul} 콤보!`);
      this.tweens.add({
        targets: this.comboText,
        scale: { from: 1, to: 1.25 },
        duration: 120,
        yoyo: true,
      });
    }

    this.sound.play(SFX_KEYS.coin, {
      volume: 0.4,
      rate: Phaser.Math.FloatBetween(0.9 + this.combo * 0.05, 1.15 + this.combo * 0.05),
    });

    // Popup +N
    const popup = this.add
      .text(c.gfx.x, c.gfx.y, `+${gained}`, {
        fontSize: '26px',
        fontStyle: 'bold',
        color: '#ffd700',
        stroke: '#1a1a1a',
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(500);
    this.tweens.add({
      targets: popup,
      y: popup.y - 50,
      alpha: 0,
      duration: 500,
      onComplete: () => popup.destroy(),
    });

    // Sparkle burst
    for (let i = 0; i < 5; i++) {
      const s = this.add.circle(c.gfx.x, c.gfx.y, 4, 0xfff6a3, 1).setDepth(499);
      const ang = Phaser.Math.FloatBetween(0, Math.PI * 2);
      this.tweens.add({
        targets: s,
        x: c.gfx.x + Math.cos(ang) * 50,
        y: c.gfx.y + Math.sin(ang) * 50,
        alpha: 0,
        scale: 0,
        duration: 400,
        onComplete: () => s.destroy(),
      });
    }

    c.gfx.destroy();
  }

  // ================================================================
  // POWER-UPS
  // ================================================================

  private scheduleNextPowerup() {
    if (this.gameOver) return;
    const delay = Phaser.Math.Between(POWERUP_SPAWN_INTERVAL_MS.min, POWERUP_SPAWN_INTERVAL_MS.max);
    this.powerupSpawnTimer = this.time.delayedCall(delay, () => {
      this.spawnPowerup();
      if (!this.gameOver) this.scheduleNextPowerup();
    });
  }

  private spawnPowerup() {
    const pickType = () => {
      const total = Object.values(POWERUPS).reduce((s, p) => s + p.spawnWeight, 0);
      let r = Phaser.Math.FloatBetween(0, total);
      for (const [type, spec] of Object.entries(POWERUPS) as Array<
        [PowerUpType, typeof POWERUPS.magnet]
      >) {
        r -= spec.spawnWeight;
        if (r <= 0) return type;
      }
      return 'shield' as PowerUpType;
    };
    const type = pickType();
    const spec = POWERUPS[type];
    const { width: W, groundY } = GAME_CONFIG;
    const y = groundY - Phaser.Math.Between(140, 280);
    const container = this.add.container(W + 60, y).setDepth(13);
    // Glowing circle bg
    const glow = this.add.circle(0, 0, 38, spec.color, 0.35);
    const ring = this.add.circle(0, 0, 30, spec.color, 0.7);
    const text = this.add.text(0, 0, spec.emoji, { fontSize: '34px' }).setOrigin(0.5);
    container.add([glow, ring, text]);
    // Pulse
    this.tweens.add({
      targets: glow,
      scale: { from: 1, to: 1.25 },
      alpha: { from: 0.35, to: 0.1 },
      duration: 700,
      yoyo: true,
      repeat: -1,
    });
    // Bob
    this.tweens.add({
      targets: container,
      y: y - 12,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    this.powerups.push({ gfx: container, type });
  }

  private updatePowerups(pxStep: number) {
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const p = this.powerups[i];
      p.gfx.x -= pxStep;
      if (p.gfx.x < -60) {
        p.gfx.destroy();
        this.powerups.splice(i, 1);
        continue;
      }
      const dx = p.gfx.x - this.hori.x;
      const dy = p.gfx.y - this.hori.y;
      if (Math.hypot(dx, dy) < 60) {
        this.collectPowerup(p);
        this.powerups.splice(i, 1);
      }
    }
  }

  private collectPowerup(p: PowerUpEntity) {
    const spec = POWERUPS[p.type];
    const now = this.time.now;

    if (p.type === 'magnet') this.magnetUntil = now + spec.durationMs;
    if (p.type === 'boost') this.boostUntil = now + spec.durationMs;
    if (p.type === 'double') this.doubleUntil = now + spec.durationMs;
    if (p.type === 'shield') this.shieldActive = true;

    this.sound.play(SFX_KEYS.powerup, { volume: 0.55 });
    this.cameras.main.flash(200, 255, 255, 255, false);

    // Popup text
    const label = (
      {
        magnet: '🧲 자석!',
        shield: '🛡️ 방패!',
        boost: '👟 빨라진다!',
        double: '✨ 점수 2배!',
      } as const
    )[p.type];
    const popup = this.add
      .text(this.hori.x, this.hori.y - 120, label, {
        fontSize: '34px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: Phaser.Display.Color.IntegerToColor(spec.color).rgba,
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(500);
    this.tweens.add({
      targets: popup,
      y: popup.y - 80,
      alpha: 0,
      scale: 1.3,
      duration: 900,
      onComplete: () => popup.destroy(),
    });

    // UI icon
    this.addPowerupIcon(p.type);

    p.gfx.destroy();
  }

  private addPowerupIcon(type: PowerUpType) {
    // Remove existing if re-collected
    this.powerupIcons[type]?.destroy();

    const spec = POWERUPS[type];
    const count = Object.keys(this.powerupIcons).filter(
      (k) => this.powerupIcons[k as PowerUpType]
    ).length;
    const x = 40 + count * 70;
    const y = 130;
    const container = this.add.container(x + 26, y + 26).setDepth(1000);
    const bg = this.add.circle(0, 0, 28, spec.color, 0.85).setStrokeStyle(3, 0x1a1a1a);
    const txt = this.add.text(0, 0, spec.emoji, { fontSize: '28px' }).setOrigin(0.5);
    // Ring timer (only for timed ones)
    const isTimed = spec.durationMs > 0;
    const ring = this.add.graphics();
    ring.setDepth(1001);
    container.add([bg, txt, ring]);
    this.powerupIcons[type] = container;

    if (isTimed) {
      const endTime = this.time.now + spec.durationMs;
      const update = () => {
        const remaining = Math.max(0, endTime - this.time.now);
        const progress = remaining / spec.durationMs;
        ring.clear();
        ring.lineStyle(4, 0xffffff, 0.85);
        ring.beginPath();
        ring.arc(0, 0, 32, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
        ring.strokePath();
        if (remaining <= 0) {
          container.destroy();
          this.powerupIcons[type] = undefined;
          evt.remove();
        }
      };
      const evt = this.time.addEvent({ delay: 50, loop: true, callback: update });
    } else {
      // Shield: remove manually when hurt consumes it
    }
  }

  // ================================================================
  // ACTIVE EFFECTS (visuals per frame)
  // ================================================================

  private updateActiveEffects(now: number, dt: number) {
    // Shield aura
    if (this.shieldActive) {
      this.shieldAura?.setVisible(true);
      this.shieldAura?.clear();
      const r = 75 + Math.sin(now / 150) * 5;
      this.shieldAura?.lineStyle(3, 0x6aa8ff, 0.8);
      this.shieldAura?.strokeCircle(this.hori.x, this.hori.y, r);
      this.shieldAura?.fillStyle(0x6aa8ff, 0.12);
      this.shieldAura?.fillCircle(this.hori.x, this.hori.y, r - 2);
    } else {
      this.shieldAura?.setVisible(false);
    }

    // Magnet field
    if (now < this.magnetUntil) {
      this.magnetField?.setVisible(true);
      this.magnetField?.clear();
      const baseR = 80;
      const pulseR = baseR + Math.sin(now / 120) * 12;
      this.magnetField?.lineStyle(2, 0xff5555, 0.35);
      this.magnetField?.strokeCircle(this.hori.x, this.hori.y, pulseR);
      this.magnetField?.strokeCircle(this.hori.x, this.hori.y, pulseR * 1.4);
      this.magnetField?.strokeCircle(this.hori.x, this.hori.y, pulseR * 1.8);
    } else {
      this.magnetField?.setVisible(false);
    }

    // Boost trail (rainbow afterimages)
    if (now < this.boostUntil) {
      if (now - this.lastTrailMs > 45) {
        this.lastTrailMs = now;
        const img = this.add.image(this.hori.x, this.hori.y, SPRITE_KEYS.run);
        img.setScale(this.hori.scaleX);
        img.setAlpha(0.5);
        img.setTint(Phaser.Display.Color.RandomRGB(180, 255).color);
        img.setDepth(19);
        this.boostTrail.push(img);
        this.tweens.add({
          targets: img,
          alpha: 0,
          scale: this.hori.scaleX * 0.9,
          duration: 420,
          onComplete: () => {
            img.destroy();
            this.boostTrail = this.boostTrail.filter((i) => i !== img);
          },
        });
      }
    }
    void dt;
  }

  // ================================================================
  // HURT / GAME OVER
  // ================================================================

  private handleHurt() {
    if (this.gameOver) return;

    // Shield absorbs hit
    if (this.shieldActive) {
      this.shieldActive = false;
      this.powerupIcons.shield?.destroy();
      this.powerupIcons.shield = undefined;
      this.sound.play(SFX_KEYS.powerup, { volume: 0.4, rate: 0.8 });
      this.cameras.main.flash(200, 170, 200, 255);
      // Brief invulnerability — hide hori flashing
      this.tweens.add({
        targets: this.hori,
        alpha: { from: 1, to: 0.4 },
        duration: 120,
        yoyo: true,
        repeat: 4,
        onComplete: () => this.hori.setAlpha(1),
      });
      return;
    }

    this.gameOver = true;
    this.state = 'hurt';
    this.horiVy = 0;
    this.hori.play(ANIM_KEYS.hurt);
    this.sound.play(SFX_KEYS.hurt, { volume: 0.6 });
    this.cameras.main.shake(250, 0.012);
    this.spawnImpactParticles(this.hori.x + 40, this.hori.y);

    this.obstacleSpawnTimer?.remove();
    this.powerupSpawnTimer?.remove();
    this.runDustTimer?.remove();

    if (this.bgm?.isPlaying) {
      this.tweens.add({
        targets: this.bgm,
        volume: 0,
        duration: 800,
        onComplete: () => this.bgm?.stop(),
      });
    }

    // Save stats
    this.saveStats();

    // Delayed gameover UI
    this.time.delayedCall(700, () => this.showGameOverOverlay());
  }

  private showGameOverOverlay() {
    this.sound.play(SFX_KEYS.gameover, { volume: 0.6 });
    const { width: W, height: H } = GAME_CONFIG;
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.55).setDepth(500);

    const newBest = this.distanceM > this.stats.bestDistance;

    const title = newBest ? '🏆 신기록!' : '게임 오버';
    this.add
      .text(W / 2, H / 2 - 160, title, {
        fontSize: '68px',
        fontStyle: 'bold',
        color: newBest ? '#ffd700' : '#ffffff',
        stroke: '#1a1a1a',
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setDepth(501);

    const stats = [
      `🏃 달린 거리:  ${this.distanceM}m`,
      `🪙 모은 코인:  ${this.coinCount}개`,
      `🔥 최장 콤보:  x${Math.min(
        COMBO_CONFIG.multipliers[Math.min(this.combo, COMBO_CONFIG.multipliers.length - 1)],
        COMBO_CONFIG.multipliers[COMBO_CONFIG.multipliers.length - 1]
      )}`,
      `🌄 도달 바이옴:  ${BIOMES[this.currentBiomeIdx].name}`,
    ];
    stats.forEach((line, i) => {
      this.add
        .text(W / 2, H / 2 - 60 + i * 40, line, {
          fontSize: '26px',
          color: '#ffffff',
        })
        .setOrigin(0.5)
        .setDepth(501);
    });

    if (newBest) {
      // Celebration particles
      for (let i = 0; i < 30; i++) {
        this.time.delayedCall(i * 40, () => {
          const x = Phaser.Math.Between(0, W);
          const col = Phaser.Math.RND.pick([0xffd700, 0xff8c7a, 0x7bd77b, 0x6aa8ff]);
          const c = this.add.circle(x, -20, 6, col, 1).setDepth(502);
          this.tweens.add({
            targets: c,
            y: H + 20,
            angle: 360,
            duration: Phaser.Math.Between(1500, 2500),
            ease: 'Cubic.easeIn',
            onComplete: () => c.destroy(),
          });
        });
      }
    }

    const prompt = this.add
      .text(W / 2, H / 2 + 160, '탭해서 다시 시작', {
        fontSize: '26px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setDepth(501);
    this.tweens.add({
      targets: prompt,
      alpha: { from: 1, to: 0.4 },
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    this.input.keyboard?.once('keydown-SPACE', () => this.scene.restart());
    this.input.once('pointerdown', () => this.scene.restart());
  }

  // ================================================================
  // EFFECTS
  // ================================================================

  private spawnDustPuff(x: number, y: number, count: number, color: number) {
    for (let i = 0; i < count; i++) {
      const size = Phaser.Math.Between(6, 14);
      const dust = this.add.circle(x, y, size, color, 0.85).setDepth(15);
      this.tweens.add({
        targets: dust,
        x: x + Phaser.Math.Between(-60, 10),
        y: y + Phaser.Math.Between(-30, 0),
        scale: 0,
        alpha: 0,
        duration: Phaser.Math.Between(350, 550),
        ease: 'Cubic.easeOut',
        onComplete: () => dust.destroy(),
      });
    }
  }

  private spawnImpactParticles(x: number, y: number) {
    for (let i = 0; i < 12; i++) {
      const size = Phaser.Math.Between(6, 12);
      const color = Phaser.Math.RND.pick([0x6b4423, 0x8a5c30, 0xa67846]);
      const debris = this.add.rectangle(x, y, size, size, color).setDepth(100);
      const angle = Phaser.Math.FloatBetween(-Math.PI, 0);
      const speed = Phaser.Math.Between(150, 300);
      this.tweens.add({
        targets: debris,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed + 200,
        angle: Phaser.Math.Between(-180, 180),
        alpha: 0,
        duration: 600,
        ease: 'Cubic.easeOut',
        onComplete: () => debris.destroy(),
      });
    }
  }

  // ================================================================
  // MILESTONES
  // ================================================================

  private checkMilestones() {
    for (const m of MILESTONES_M) {
      if (this.distanceM >= m && !this.milestonesHit.has(m)) {
        this.milestonesHit.add(m);
        this.showMilestone(m);
      }
    }
  }

  private showMilestone(m: number) {
    this.sound.play(SFX_KEYS.milestone, { volume: 0.55 });
    const { width: W, height: H } = GAME_CONFIG;
    const text = this.add
      .text(W / 2, H / 2 - 40, `🎉 ${m}m 돌파!`, {
        fontSize: '56px',
        fontStyle: 'bold',
        color: '#ffd700',
        stroke: '#1a1a1a',
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(700);
    this.tweens.add({
      targets: text,
      alpha: { from: 0, to: 1 },
      scale: { from: 0.7, to: 1.2 },
      duration: 300,
      yoyo: true,
      hold: 900,
      onComplete: () => text.destroy(),
    });

    // Bonus coins
    this.coinCount += 10;
    this.coinText.setText(`🪙 ${this.coinCount}`);
  }

  // ================================================================
  // BIOME TRANSITION
  // ================================================================

  private checkBiomeTransition() {
    let targetIdx = 0;
    for (let i = 0; i < BIOMES.length; i++) {
      if (this.distanceM >= BIOMES[i].startDistanceM) targetIdx = i;
    }
    if (targetIdx !== this.currentBiomeIdx && !this.biomeTransitioning) {
      this.startBiomeTransition(targetIdx);
    }
  }

  private startBiomeTransition(newIdx: number) {
    this.pendingBiomeIdx = newIdx;
    this.biomeTransitioning = true;
    const newBiome = BIOMES[newIdx];

    // Build NEW parallax layers (transparent, tween in)
    this.parallaxFadeLayers = [];
    this.buildParallaxLayers(newBiome, this.parallaxFadeLayers, '-fade');
    this.parallaxFadeLayers.forEach((l) => l.tile.setAlpha(0));

    // New sky behind current
    this.skyFadeTop?.destroy();
    this.skyFadeTop = this.add.graphics().setDepth(-99);
    this.drawSkyGradient(this.skyFadeTop, newBiome);
    this.skyFadeTop.setAlpha(0);

    // Fade in new
    this.tweens.add({
      targets: [this.skyFadeTop, ...this.parallaxFadeLayers.map((l) => l.tile)],
      alpha: 1,
      duration: BIOME_TRANSITION_MS,
      ease: 'Sine.easeInOut',
    });
  }

  private updateBiomeTransition() {
    if (!this.biomeTransitioning) return;
    // Check if done (fade layers fully opaque)
    const allDone = this.parallaxFadeLayers.every((l) => l.tile.alpha >= 0.99);
    if (!allDone) return;

    // Swap — destroy old layers, make fade layers active
    for (const l of this.parallaxLayers) l.tile.destroy();
    this.parallaxLayers = this.parallaxFadeLayers;
    this.parallaxFadeLayers = [];

    // Swap sky
    this.skyTop.destroy();
    this.skyTop = this.skyFadeTop!;
    this.skyFadeTop = undefined;

    // Swap decor (sun/moon/stars)
    this.currentBiomeIdx = this.pendingBiomeIdx;
    this.drawSkyDecor(BIOMES[this.currentBiomeIdx]);
    this.biomeLabel.setText(BIOMES[this.currentBiomeIdx].name);

    this.biomeTransitioning = false;
  }

  // ================================================================
  // STORAGE
  // ================================================================

  private loadStats() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        this.stats = { ...DEFAULT_STATS, ...(JSON.parse(raw) as HoriRunStats) };
      } else {
        this.stats = { ...DEFAULT_STATS };
      }
    } catch {
      this.stats = { ...DEFAULT_STATS };
    }
  }

  private saveStats() {
    const updated: HoriRunStats = {
      bestDistance: Math.max(this.stats.bestDistance, this.distanceM),
      totalCoins: this.stats.totalCoins + this.coinCount,
      bestCoinsPerRun: Math.max(this.stats.bestCoinsPerRun, this.coinCount),
      runsPlayed: this.stats.runsPlayed + 1,
      bestCombo: Math.max(this.stats.bestCombo, this.combo),
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      this.stats = updated;
    } catch {
      /* ignore quota errors */
    }
  }
}
