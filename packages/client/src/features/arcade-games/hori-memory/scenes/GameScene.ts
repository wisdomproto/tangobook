import * as Phaser from 'phaser';
import { GAME_CONFIG, CARD_KEYS, CardKey, SFX_KEYS, GRID } from '../config';

interface Card {
  container: Phaser.GameObjects.Container;
  face: Phaser.GameObjects.Image;
  back: Phaser.GameObjects.Graphics;
  key: CardKey;
  flipped: boolean;
  matched: boolean;
  row: number;
  col: number;
}

export class GameScene extends Phaser.Scene {
  private cards: Card[] = [];
  private flippedStack: Card[] = [];
  private moves = 0;
  private matches = 0;
  private movesText!: Phaser.GameObjects.Text;
  private bgm?: Phaser.Sound.BaseSound;
  private inputLocked = false;
  private gameWon = false;

  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    // Reset
    this.cards = [];
    this.flippedStack = [];
    this.moves = 0;
    this.matches = 0;
    this.inputLocked = false;
    this.gameWon = false;

    const { width: W, height: H } = GAME_CONFIG;

    // Soft warm gradient background (cream → peach)
    const bg = this.add.graphics();
    bg.fillGradientStyle(0xfff5e4, 0xfff5e4, 0xffdcc0, 0xffdcc0, 1);
    bg.fillRect(0, 0, W, H);

    // Title
    this.add
      .text(W / 2, 40, '🃏 짝 맞추기', {
        fontSize: '40px',
        fontStyle: 'bold',
        color: '#6b4423',
      })
      .setOrigin(0.5, 0);

    this.movesText = this.add
      .text(40, 44, '뒤집기: 0', {
        fontSize: '24px',
        color: '#6b4423',
      })
      .setOrigin(0, 0);

    // Mute button
    const muteBtn = this.add
      .text(W - 40, 44, this.sound.mute ? '🔇' : '🔊', {
        fontSize: '28px',
      })
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: true });
    muteBtn.on('pointerdown', () => {
      this.sound.mute = !this.sound.mute;
      muteBtn.setText(this.sound.mute ? '🔇' : '🔊');
    });

    // Build deck — 6 unique keys × 2 copies each = 12 cards
    const allKeys = Object.keys(CARD_KEYS) as CardKey[];
    const deckKeys: CardKey[] = [...allKeys, ...allKeys];
    Phaser.Utils.Array.Shuffle(deckKeys);

    // Lay out 4×3 grid
    const totalW = GRID.cols * GRID.cardWidth + (GRID.cols - 1) * GRID.gap;
    const totalH = GRID.rows * GRID.cardHeight + (GRID.rows - 1) * GRID.gap;
    const startX = (W - totalW) / 2 + GRID.cardWidth / 2;
    const startY = GRID.topOffset + GRID.cardHeight / 2;

    for (let r = 0; r < GRID.rows; r++) {
      for (let c = 0; c < GRID.cols; c++) {
        const idx = r * GRID.cols + c;
        const key = deckKeys[idx];
        const x = startX + c * (GRID.cardWidth + GRID.gap);
        const y = startY + r * (GRID.cardHeight + GRID.gap);
        this.createCard(x, y, key, r, c);
      }
    }

    // BGM
    if (!this.sound.get(SFX_KEYS.bgm)) {
      this.bgm = this.sound.add(SFX_KEYS.bgm, { loop: true, volume: 0.2 });
    } else {
      this.bgm = this.sound.get(SFX_KEYS.bgm);
    }
    if (!this.bgm.isPlaying) this.bgm.play();
  }

  private createCard(x: number, y: number, key: CardKey, row: number, col: number) {
    const container = this.add.container(x, y);

    // Card back (face-down appearance)
    const back = this.add.graphics();
    this.drawCardBack(back);
    container.add(back);

    // Card face (hori pose image), start hidden
    const face = this.add
      .image(0, 0, CARD_KEYS[key])
      .setDisplaySize(GRID.cardWidth * 0.85, GRID.cardHeight * 0.85)
      .setVisible(false);
    container.add(face);

    // Hit area
    container.setSize(GRID.cardWidth, GRID.cardHeight);
    container.setInteractive({ useHandCursor: true });

    const card: Card = { container, face, back, key, flipped: false, matched: false, row, col };
    container.on('pointerdown', () => this.onCardClick(card));
    this.cards.push(card);
  }

  private drawCardBack(g: Phaser.GameObjects.Graphics) {
    const w = GRID.cardWidth;
    const h = GRID.cardHeight;
    g.clear();
    // Background: coral gradient look (emulated with layered rects)
    g.fillStyle(0xff8c7a, 1);
    g.fillRoundedRect(-w / 2, -h / 2, w, h, 14);
    g.fillStyle(0xffa894, 0.5);
    g.fillRoundedRect(-w / 2 + 6, -h / 2 + 6, w - 12, h - 12, 10);
    // Decorative star pattern
    g.fillStyle(0xffd700, 0.9);
    this.drawStar(g, 0, -h / 4, 18, 5);
    this.drawStar(g, -w / 4, h / 6, 12, 5);
    this.drawStar(g, w / 4, h / 6, 12, 5);
    g.fillStyle(0xffffff, 0.6);
    g.fillCircle(-w / 4 + 6, -h / 4 + 6, 3);
    g.fillCircle(w / 4 + 4, h / 4 - 10, 3);
  }

  private drawStar(
    g: Phaser.GameObjects.Graphics,
    cx: number,
    cy: number,
    r: number,
    points: number
  ) {
    g.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? r : r * 0.45;
      const a = (Math.PI / points) * i - Math.PI / 2;
      const x = cx + Math.cos(a) * radius;
      const y = cy + Math.sin(a) * radius;
      if (i === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.closePath();
    g.fillPath();
  }

  private onCardClick(card: Card) {
    if (this.inputLocked || card.flipped || card.matched || this.gameWon) return;
    this.flipCard(card, true);
    this.sound.play(SFX_KEYS.flip, { volume: 0.35, rate: Phaser.Math.FloatBetween(0.9, 1.1) });
    this.flippedStack.push(card);

    if (this.flippedStack.length === 2) {
      this.moves += 1;
      this.movesText.setText(`뒤집기: ${this.moves}`);
      this.inputLocked = true;
      const [a, b] = this.flippedStack;
      if (a.key === b.key) {
        // Match
        this.time.delayedCall(350, () => {
          a.matched = true;
          b.matched = true;
          this.sound.play(SFX_KEYS.match, { volume: 0.5 });
          this.tweens.add({
            targets: [a.container, b.container],
            scale: { from: 1, to: 1.1 },
            duration: 180,
            yoyo: true,
            onComplete: () => {
              this.flippedStack = [];
              this.inputLocked = false;
              this.matches += 1;
              if (this.matches === 6) this.handleWin();
            },
          });
        });
      } else {
        // Mismatch — flip back
        this.time.delayedCall(900, () => {
          this.sound.play(SFX_KEYS.mismatch, { volume: 0.4 });
          this.flipCard(a, false);
          this.flipCard(b, false);
          this.flippedStack = [];
          this.inputLocked = false;
        });
      }
    }
  }

  private flipCard(card: Card, toFace: boolean) {
    card.flipped = toFace;
    // Half-flip: scaleX 1 → 0 (hide side) → set visibility → scaleX 0 → 1
    this.tweens.add({
      targets: card.container,
      scaleX: 0,
      duration: 140,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        card.face.setVisible(toFace);
        card.back.setVisible(!toFace);
        this.tweens.add({
          targets: card.container,
          scaleX: 1,
          duration: 140,
          ease: 'Cubic.easeOut',
        });
      },
    });
  }

  private handleWin() {
    this.gameWon = true;
    this.sound.play(SFX_KEYS.win, { volume: 0.7 });
    if (this.bgm?.isPlaying) {
      this.tweens.add({
        targets: this.bgm,
        volume: 0,
        duration: 1000,
        onComplete: () => this.bgm?.stop(),
      });
    }

    const { width: W, height: H } = GAME_CONFIG;
    this.time.delayedCall(500, () => {
      this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.5).setDepth(500);
      this.add
        .text(W / 2, H / 2 - 80, '🎉', { fontSize: '90px' })
        .setOrigin(0.5)
        .setDepth(501);
      this.add
        .text(W / 2, H / 2 - 10, '잘했어!', {
          fontSize: '64px',
          fontStyle: 'bold',
          color: '#ffffff',
        })
        .setOrigin(0.5)
        .setDepth(501);
      this.add
        .text(W / 2, H / 2 + 50, `뒤집기 ${this.moves}번 만에 성공`, {
          fontSize: '30px',
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
