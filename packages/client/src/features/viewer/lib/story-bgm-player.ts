/** Two reusable media elements: same cue continues, new cue fades in after play succeeds. */
type Deck = {
  audio: HTMLAudioElement;
  weight: number;
};

export class StoryBgmPlayer {
  private decks: Deck[] = [];
  private desired = '';
  private enabled = true;
  private playing = false;
  private disposed = false;
  private epoch = 0;
  private timer?: ReturnType<typeof setInterval>;
  private pending?: Deck;

  constructor(
    private volume: number,
    private onPlaying: (playing: boolean) => void,
    private fadeMs = 1800
  ) {}

  private stopFade() {
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
  }
  private report() {
    this.playing = this.enabled && this.decks.some((d) => d.weight > 0 && !d.audio.paused);
    if (!this.disposed) this.onPlaying(this.playing);
  }
  private apply() {
    for (const d of this.decks) {
      const level = Math.max(0, Math.min(1, d.weight * this.volume));
      d.audio.volume = level;
    }
  }
  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    this.apply();
  }

  /** Retry a policy-blocked first play during a reading gesture; preserve user mute. */
  unlock() {
    if (this.disposed || !this.enabled || !this.desired || this.pending || this.playing) return;
    void this.start(this.desired);
  }

  setUrl(url?: string) {
    const next = url || '';
    if (next === this.desired) return;
    this.desired = next;
    this.epoch++;
    this.stopFade();
    this.pending = undefined;
    if (!next) {
      for (const d of this.decks) {
        d.audio.pause();
        d.weight = 0;
      }
      this.apply();
      this.report();
      return;
    }
    if (!this.decks.length) {
      this.decks = [0, 1].map(() => {
        const audio = new Audio();
        audio.loop = true;
        audio.preload = 'auto';
        audio.src = next;
        return { audio, weight: 0 };
      });
    }
    if (this.enabled) void this.start(next);
  }

  private async start(url: string) {
    const epoch = ++this.epoch;
    this.stopFade();
    const target =
      this.decks.find((d) => d.audio.getAttribute('src') === url && d.weight > 0) ||
      [...this.decks].sort((a, b) => a.weight - b.weight)[0];
    if (!target) return;
    if (target.audio.getAttribute('src') !== url) {
      target.audio.pause();
      target.weight = 0;
      target.audio.src = url;
    }
    this.pending = target;
    this.apply();
    try {
      await target.audio.play();
    } catch {
      if (epoch === this.epoch) {
        this.pending = undefined;
        this.report();
      }
      return; // Existing audible cue remains available when the new asset fails.
    }
    if (this.disposed || epoch !== this.epoch || !this.enabled) {
      if (target !== this.pending && target.weight === 0) target.audio.pause();
      return;
    }
    this.pending = undefined;
    const from = this.decks.map((d) => d.weight);
    if (!this.decks.some((d) => d.weight > 0 && !d.audio.paused)) {
      target.weight = 1;
      this.apply();
      this.report();
      return;
    }
    const began = Date.now();
    this.playing = true;
    this.onPlaying(true);
    this.timer = setInterval(() => {
      const progress = Math.min(1, (Date.now() - began) / this.fadeMs);
      this.decks.forEach((d, i) => {
        d.weight = from[i] + ((d === target ? 1 : 0) - from[i]) * progress;
      });
      this.apply();
      if (progress === 1) {
        this.stopFade();
        for (const d of this.decks) if (d !== target) d.audio.pause();
        this.report();
      }
    }, 25);
  }

  toggle() {
    if (!this.desired || this.disposed) return;
    if (this.playing || this.pending) {
      this.enabled = false;
      this.epoch++;
      this.pending = undefined;
      this.stopFade();
      for (const d of this.decks) d.audio.pause();
      this.report();
    } else {
      this.enabled = true;
      void this.start(this.desired);
    }
  }
  dispose() {
    this.disposed = true;
    this.epoch++;
    this.stopFade();
    for (const d of this.decks) {
      d.audio.pause();
      d.audio.src = '';
    }
    this.decks = [];
  }
}
