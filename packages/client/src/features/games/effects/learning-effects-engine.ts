import * as Phaser from 'phaser';
import type { LearningEffect } from './learning-effects';

/** One transparent, input-free scene. Two compact atlases and generated fallback textures. */
export async function createLearningEffectsEngine(parent: HTMLElement) {
  let resolveReady!: () => void;
  const ready = new Promise<void>((resolve) => {
    resolveReady = resolve;
  });
  class EffectsScene extends Phaser.Scene {
    private objects = new Set<Phaser.GameObjects.GameObject>();
    preload() {
      this.load.image('learning-cute-atlas', '/images/effects/learning-cute-atlas-v2.webp');
      this.load.image('learning-cute-companion', '/images/effects/learning-cute-companion-v1.webp');
    }
    create() {
      if (this.textures.exists('learning-cute-atlas')) {
        const texture = this.textures.get('learning-cute-atlas');
        const image = texture.getSourceImage() as HTMLImageElement;
        const w = Math.floor(image.width / 2),
          h = Math.floor(image.height / 2);
        ['bubble', 'spark', 'brush', 'heart'].forEach((name, i) =>
          texture.add(name, 0, (i % 2) * w, Math.floor(i / 2) * h, w, h)
        );
      }
      for (const [name, color] of [
        ['mint', 0x81bea0],
        ['peach', 0xf2ab82],
        ['honey', 0xf0ca76],
      ] as const) {
        const shape = this.add.graphics();
        shape.fillStyle(color).fillCircle(48, 48, 36);
        shape.fillStyle(0xffffff, 0.45).fillEllipse(36, 33, 23, 13);
        shape.generateTexture(`learning-${name}`, 96, 96);
        shape.destroy();
      }
      if (this.textures.exists('learning-cute-companion')) {
        const texture = this.textures.get('learning-cute-companion');
        const image = texture.getSourceImage() as HTMLImageElement;
        const w = Math.floor(image.width / 2),
          h = Math.floor(image.height / 2);
        ['flower', 'note', 'leaf', 'ribbon'].forEach((name, i) =>
          texture.add(name, 0, (i % 2) * w, Math.floor(i / 2) * h, w, h)
        );
      }
      resolveReady();
    }
    clearEffects() {
      this.tweens.killAll();
      this.time.removeAllEvents();
      this.objects.forEach((object) => object.destroy());
      this.objects.clear();
    }
    private keep<T extends Phaser.GameObjects.GameObject>(object: T): T {
      this.objects.add(object);
      this.time.delayedCall(1500, () => {
        this.objects.delete(object);
        object.destroy();
      });
      return object;
    }
    private puff(name: string, x: number, y: number, size: number) {
      if (!this.textures.exists(`learning-${name}`)) return null;
      return this.keep(this.add.image(x, y, `learning-${name}`).setDisplaySize(size, size));
    }
    private hop(x: number, y: number, size: number, count: number, height: number) {
      for (let i = 0; i < count; i++) {
        const side = i % 2 ? 1 : -1;
        const startX = x + side * size * 0.42;
        const startY = y - size * 0.3 + (i > 1 ? size * 0.14 : 0);
        const puff = this.puff(
          ['mint', 'peach', 'honey'][i % 3],
          startX,
          startY,
          count > 3 ? 28 : 21
        );
        if (!puff) continue;
        const state = { p: 0 },
          sx = puff.scaleX,
          sy = puff.scaleY;
        this.tweens.add({
          targets: state,
          p: 1,
          delay: i * 45,
          duration: 680,
          ease: 'Sine.Out',
          onUpdate: () => {
            const p = state.p,
              bounce = Math.sin(p * Math.PI);
            puff.setPosition(startX + side * p * size * 0.2, startY - bounce * height);
            puff.setScale(sx * (1 + bounce * 0.15), sy * (0.7 + bounce * 0.45));
            puff.setAlpha(p < 0.5 ? 1 : (1 - p) * 2);
          },
        });
      }
    }
    private sprite(name: string, x: number, y: number, size: number) {
      const atlas = ['flower', 'note', 'leaf', 'ribbon'].includes(name)
        ? 'learning-cute-companion'
        : 'learning-cute-atlas';
      if (!this.textures.exists(atlas)) return this.puff('mint', x, y, size * 0.45);
      return this.keep(this.add.image(x, y, atlas, name).setDisplaySize(size, size));
    }
    private swirl(x: number, y: number, size: number, delay = 0, direction = 1) {
      const brush = this.sprite('brush', x, y, size * 1.95);
      if (!brush) return;
      const state = { p: 0 },
        sx = brush.scaleX,
        sy = brush.scaleY;
      brush.setAlpha(0);
      this.tweens.add({
        targets: state,
        p: 1,
        delay,
        duration: 980,
        ease: 'Sine.InOut',
        onUpdate: () => {
          const p = state.p;
          brush.setAngle(direction * (p * 175 - 70));
          brush.setScale(sx * (0.75 + p * 0.5), sy * (0.75 + p * 0.5));
          brush.setAlpha(Math.sin(p * Math.PI) * 0.65);
        },
      });
    }
    private dance(x: number, y: number, size: number, count: number, hearts = false) {
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const sprite = this.sprite(
          hearts && i % 3 === 0 ? 'heart' : i % 2 ? 'spark' : 'bubble',
          x,
          y,
          32 + (i % 3) * 9
        );
        if (!sprite) continue;
        const state = { p: 0 },
          sx = sprite.scaleX,
          sy = sprite.scaleY;
        sprite.setAlpha(0);
        this.tweens.add({
          targets: state,
          p: 1,
          delay: (i % 4) * 55,
          duration: 1000,
          ease: 'Sine.InOut',
          onUpdate: () => {
            const p = state.p,
              swell = Math.sin(p * Math.PI),
              theta = angle + p * Math.PI * 0.8;
            const radius = size * (0.38 + swell * 0.36);
            sprite.setPosition(
              x + Math.cos(theta) * radius,
              y + Math.sin(theta) * radius * 0.8 - swell * 12
            );
            sprite.setScale(sx * (0.3 + swell * 0.9), sy * (0.3 + swell * 1.1));
            sprite.setAngle(Math.sin(p * Math.PI * 2) * 25).setAlpha(Math.min(1, swell * 2));
          },
        });
      }
    }
    private check(x: number, y: number) {
      const line = this.keep(this.add.graphics()).setPosition(x, y);
      const state = { p: 0 };
      this.tweens.add({
        targets: state,
        p: 1,
        delay: 150,
        duration: 550,
        ease: 'Sine.Out',
        onUpdate: () => {
          const p = state.p;
          line.clear().lineStyle(5, 0x4e9973, 1).beginPath().moveTo(-13, 0);
          if (p < 0.35) line.lineTo(-13 + (p / 0.35) * 11, (p / 0.35) * 10);
          else
            line
              .lineTo(-2, 10)
              .lineTo(-2 + ((p - 0.35) / 0.65) * 23, 10 - ((p - 0.35) / 0.65) * 30);
          line.strokePath();
        },
        onComplete: () => {
          this.tweens.add({ targets: line, alpha: 0, y: y - 8, delay: 120, duration: 260 });
        },
      });
    }
    private grow(name: string, x: number, y: number, size: number, delay = 0) {
      const sprite = this.sprite(name, x, y, size);
      if (!sprite) return;
      const sx = sprite.scaleX,
        sy = sprite.scaleY;
      sprite.setScale(sx * 0.1, sy * 0.1).setAlpha(0);
      this.tweens.add({
        targets: sprite,
        scaleX: sx * 1.18,
        scaleY: sy * 1.18,
        alpha: 1,
        delay,
        duration: 360,
        ease: 'Back.Out',
        onComplete: () => {
          this.tweens.add({
            targets: sprite,
            scaleX: sx * 0.8,
            scaleY: sy * 0.8,
            y: y - 14,
            alpha: 0,
            delay: 160,
            duration: 420,
            ease: 'Sine.InOut',
          });
        },
      });
    }
    private garden(x: number, y: number, size: number, count = 5) {
      for (let i = 0; i < count; i++) {
        const angle = -Math.PI * 0.9 + (i / (count - 1)) * Math.PI * 0.8;
        const px = x + Math.cos(angle) * size * 0.64,
          py = y + Math.sin(angle) * size * 0.65;
        this.grow('flower', px, py, 46 + (i % 2) * 9, i * 55);
        this.grow('leaf', px + (i % 2 ? 18 : -18), py + 24, 27, i * 55 + 80);
      }
    }
    private heartWave(x: number, y: number, size: number) {
      for (let i = 0; i < 7; i++) {
        const px = x + (i - 3) * size * 0.2,
          py = y + size * 0.35 + Math.cos(i) * 10;
        const heart = this.sprite('heart', px, py, 26 + (i % 3) * 7);
        if (!heart) continue;
        const sx = heart.scaleX,
          sy = heart.scaleY;
        heart.setScale(sx * 0.2, sy * 0.2).setAlpha(0);
        this.tweens.add({
          targets: heart,
          y: py - size * 0.75,
          scaleX: sx,
          scaleY: sy,
          alpha: 1,
          delay: i * 45,
          duration: 460,
          ease: 'Sine.Out',
          onComplete: () => {
            this.tweens.add({
              targets: heart,
              alpha: 0,
              scaleX: sx * 0.6,
              scaleY: sy * 0.6,
              duration: 330,
            });
          },
        });
      }
    }
    play(effect: LearningEffect) {
      const { kind, bounds } = effect;
      this.cameras.main.setViewport(bounds.x, bounds.y, bounds.width, bounds.height);
      const x = Math.max(0, Math.min(bounds.width, effect.x - bounds.x));
      const y = Math.max(0, Math.min(bounds.height, effect.y - bounds.y));
      if (this.objects.size > 80) this.clearEffects();
      const size = Math.min(effect.size, kind === 'complete' ? 190 : 170);
      if (kind === 'trace') {
        const dot = this.sprite('bubble', x, y, 15);
        if (dot)
          this.tweens.add({
            targets: dot,
            alpha: 0,
            scaleX: dot.scaleX * 0.2,
            scaleY: dot.scaleY * 0.2,
            y: y - 6,
            duration: 280,
          });
        return;
      }
      if (kind === 'retry') {
        // Encouraging small wobble, without a failure stamp or full-screen flash.
        for (const side of [-1, 1]) {
          const dot = this.puff('peach', x + side * size * 0.45, y + size * 0.35, 19);
          if (dot)
            this.tweens.add({
              targets: dot,
              x: dot.x + side * 10,
              y: dot.y + 8,
              alpha: 0,
              duration: 440,
              ease: 'Sine.Out',
            });
        }
        return;
      }
      if (kind === 'tap') {
        this.hop(x, y, size, 3, 24);
        return;
      }
      if (kind === 'listen') {
        for (const side of [-1, 1])
          for (let i = 0; i < 3; i++) {
            const wave = this.keep(
              this.add.graphics().lineStyle(4 - i, i % 2 ? 0xf2ab82 : 0x81bea0, 0.8)
            );
            wave
              .beginPath()
              .arc(
                0,
                0,
                size * (0.52 + i * 0.11),
                side > 0 ? -0.5 : Math.PI - 0.5,
                side > 0 ? 0.5 : Math.PI + 0.5
              )
              .strokePath();
            wave.setPosition(x, y);
            this.tweens.add({
              targets: wave,
              scale: 1.22,
              alpha: 0,
              delay: i * 110,
              duration: 650,
            });
          }
        for (let i = 0; i < 3; i++)
          this.grow('note', x + (i - 1) * size * 0.65, y - size * 0.15, 34, i * 120);
        return;
      }
      if (kind === 'match') {
        for (const side of [-1, 1]) {
          const heart = this.sprite('heart', x + side * size * 0.68, y + size * 0.2, 52);
          if (!heart) continue;
          const state = { p: 0 };
          this.tweens.add({
            targets: state,
            p: 1,
            duration: 800,
            ease: 'Sine.InOut',
            onUpdate: () => {
              const p = state.p;
              heart.setPosition(
                x + side * size * 0.68 * Math.cos(p * Math.PI * 0.5),
                y + Math.sin(p * Math.PI * 2) * size * 0.25 - p * size * 0.3
              );
              heart
                .setAngle(side * Math.sin(p * Math.PI) * 20)
                .setAlpha(p < 0.7 ? 1 : (1 - p) / 0.3);
            },
          });
        }
        this.grow('heart', x, y - size * 0.5, 62, 450);
        this.hop(x, y, size, 4, 38);
        return;
      }
      if (kind === 'blend') {
        for (const side of [-1, 1]) {
          const ribbon = this.sprite(
            side < 0 ? 'ribbon' : 'brush',
            x + side * size * 0.7,
            y,
            size * 1.2
          );
          if (!ribbon) continue;
          ribbon.setAngle(side * 70);
          this.tweens.add({
            targets: ribbon,
            x,
            y: y - size * 0.05,
            angle: side * -40,
            duration: 600,
            ease: 'Back.InOut',
            onComplete: () => {
              this.tweens.add({
                targets: ribbon,
                alpha: 0,
                scaleX: ribbon.scaleX * 0.6,
                scaleY: ribbon.scaleY * 0.6,
                duration: 350,
              });
            },
          });
        }
        this.grow('spark', x, y - size * 0.48, 52, 450);
        return;
      }
      if (kind === 'reveal') {
        for (const side of [-1, 1]) {
          this.grow('leaf', x + side * size * 0.5, y + size * 0.2, 42);
          this.grow('spark', x + side * size * 0.45, y - size * 0.4, 47, 120);
        }
        this.grow('flower', x, y - size * 0.57, 60, 240);
        return;
      }
      if (kind === 'letter' || kind === 'word') {
        // Hand-drawn curved underline grows once; it never changes the writing mask.
        const line = this.keep(this.add.graphics()).setPosition(x, y + size * 0.5);
        const state = { p: 0 };
        this.tweens.add({
          targets: state,
          p: 1,
          duration: 450,
          onUpdate: () => {
            line.clear().lineStyle(5, 0x81bea0, 0.85).beginPath();
            for (let i = 0; i <= 30 * state.p; i++) {
              const t = i / 30,
                px = (t - 0.5) * size * 1.25,
                py = Math.sin(t * Math.PI) * 12;
              if (i === 0) line.moveTo(px, py);
              else line.lineTo(px, py);
            }
            line.strokePath();
          },
          onComplete: () => {
            this.tweens.add({ targets: line, alpha: 0, delay: 330, duration: 320 });
          },
        });
        if (kind === 'letter') this.garden(x, y, size, 3);
        else {
          for (let i = 0; i < 5; i++)
            this.grow(
              i % 2 ? 'spark' : 'bubble',
              x + (i - 2) * size * 0.27,
              y + size * 0.55,
              32,
              i * 75
            );
          this.heartWave(x, y - size * 0.1, size * 0.8);
        }
        return;
      }
      if (kind === 'streak') {
        for (let i = 0; i < 3; i++) {
          this.grow(
            'flower',
            x + (i - 1) * size * 0.45,
            y - size * (0.38 + (i === 1 ? 0.18 : 0)),
            58,
            i * 160
          );
          this.grow('leaf', x + (i - 1) * size * 0.45 + 22, y - size * 0.12, 32, i * 160 + 70);
        }
        this.hop(x, y, size, 6, 45);
        return;
      }
      if (kind === 'complete') {
        this.garden(x, y, size, 6);
        this.heartWave(x, y + size * 0.25, size * 1.1);
        for (const side of [-1, 1])
          this.grow('spark', x + side * size * 0.68, y + size * 0.25, 62, 220);
        return;
      }
      if (effect.variant === 1) this.garden(x, y, size);
      else if (effect.variant === 2) this.heartWave(x, y, size);
      else {
        this.swirl(x, y, size);
        this.swirl(x, y, size * 0.86, 160, -1);
        this.dance(x, y, size, 10, true);
      }
      this.check(x, Math.max(24, y - size * 0.55));
    }
  }

  const scene = new EffectsScene({ key: 'learning-effects' });
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    transparent: true,
    width: innerWidth,
    height: innerHeight,
    antialias: true,
    audio: { noAudio: true },
    input: { mouse: false, touch: false, keyboard: false },
    banner: false,
    fps: { target: 60, forceSetTimeOut: false },
    scene: [scene],
  });
  let destroyed = false,
    idle: ReturnType<typeof setTimeout> | undefined;
  let deadline: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      ready,
      new Promise<never>((_, reject) => {
        deadline = setTimeout(() => reject(new Error('Effects renderer timed out')), 6000);
      }),
    ]);
  } catch (error) {
    game.destroy(true);
    game.step(0, 0);
    throw error;
  } finally {
    clearTimeout(deadline);
  }
  game.loop.sleep();
  parent.dataset.effectsState = 'idle';
  const clear = () => {
    if (destroyed) return;
    clearTimeout(idle);
    scene.clearEffects();
    game.loop.sleep();
    parent.dataset.effectsState = 'idle';
  };
  game.events.on(Phaser.Core.Events.RESUME, clear);
  return {
    play(effect: LearningEffect) {
      if (destroyed || document.hidden) return;
      parent.dataset.effectsState = 'playing';
      game.loop.wake();
      scene.play(effect);
      clearTimeout(idle);
      idle = setTimeout(clear, 1600);
    },
    resize() {
      if (!destroyed) {
        clear();
        game.scale.resize(innerWidth, innerHeight);
      }
    },
    clear,
    destroy() {
      clear();
      destroyed = true;
      game.destroy(true);
      game.step(0, 0);
    },
  };
}
