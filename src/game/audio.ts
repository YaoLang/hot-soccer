import { MatchEvent } from './types';

class ArcadeSoundEngine {
  private ctx: AudioContext | null = null;
  private muted = false;

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    return this.muted;
  }

  public unlock(): void {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public playEvents(events: MatchEvent[]): void {
    if (this.muted || events.length === 0) return;
    for (let i = 0; i < events.length; i++) {
      this.play(events[i]);
    }
  }

  public play(event: MatchEvent): void {
    if (this.muted) return;
    if (!this.ctx) this.unlock();
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running') return;

    const now = ctx.currentTime;
    const pitchJitter = 0.92 + Math.random() * 0.16;

    switch (event) {
      case 'kick': {
        this.tone(ctx, now, 'triangle', 150 * pitchJitter, 55, 0.09, 0.25);
        break;
      }
      case 'pass': {
        this.tone(ctx, now, 'sine', 210 * pitchJitter, 90, 0.07, 0.18);
        break;
      }
      case 'bounce': {
        this.tone(ctx, now, 'sine', 120 * pitchJitter, 65, 0.05, 0.12);
        break;
      }
      case 'tackle': {
        this.noiseBurst(ctx, now, 0.11, 0.16, 480);
        this.tone(ctx, now, 'sawtooth', 110, 45, 0.1, 0.14);
        break;
      }
      case 'stun': {
        this.tone(ctx, now, 'square', 460, 140, 0.16, 0.18);
        break;
      }
      case 'save': {
        this.tone(ctx, now, 'triangle', 260, 120, 0.12, 0.22);
        break;
      }
      case 'post_clang': {
        this.tone(ctx, now, 'triangle', 980, 740, 0.26, 0.24);
        this.tone(ctx, now, 'sine', 1480, 1180, 0.22, 0.14);
        break;
      }
      case 'super_shot': {
        this.tone(ctx, now, 'sawtooth', 320, 80, 0.28, 0.28);
        this.tone(ctx, now + 0.03, 'square', 680, 220, 0.22, 0.16);
        this.noiseBurst(ctx, now, 0.24, 0.22, 1200);
        break;
      }
      case 'whistle': {
        this.tone(ctx, now, 'sine', 2650, 2850, 0.14, 0.12);
        this.tone(ctx, now + 0.16, 'sine', 2780, 2600, 0.22, 0.13);
        break;
      }
      case 'goal': {
        // Fanfare + crowd burst
        this.noiseBurst(ctx, now, 0.7, 0.18, 900);
        this.tone(ctx, now, 'square', 523.25, 523.25, 0.11, 0.16);
        this.tone(ctx, now + 0.12, 'square', 659.25, 659.25, 0.11, 0.16);
        this.tone(ctx, now + 0.24, 'square', 783.99, 783.99, 0.12, 0.16);
        this.tone(ctx, now + 0.37, 'square', 1046.5, 1046.5, 0.34, 0.2);
        break;
      }
    }
  }

  private tone(
    ctx: AudioContext,
    startTime: number,
    type: OscillatorType,
    startFreq: number,
    endFreq: number,
    duration: number,
    gainLevel: number
  ): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(startFreq, startTime);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), startTime + duration);

    gain.gain.setValueAtTime(gainLevel, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.01);
  }

  private noiseBurst(
    ctx: AudioContext,
    startTime: number,
    duration: number,
    gainLevel: number,
    filterFreq: number
  ): void {
    const sampleCount = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, sampleCount, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < sampleCount; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(filterFreq, startTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(gainLevel, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start(startTime);
  }
}

export const soundEngine = new ArcadeSoundEngine();
