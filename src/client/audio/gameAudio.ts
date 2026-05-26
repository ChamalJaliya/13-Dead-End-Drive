/**
 * gameAudio.ts
 * Procedural Web Audio FX — no external assets required.
 */

import type { TrapId } from '../../types/enums.js';
import { getTrapCinematic } from '../cinematics/trapCinematics.js';

export class GameAudio {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private muted = false;

  public ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.35;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.masterGain) {
      this.masterGain.gain.value = muted ? 0 : 0.35;
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  private playTone(
    freq: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume = 0.2,
  ): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || this.muted) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  }

  private playNoise(duration: number, volume = 0.15): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || this.muted) return;

    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.value = volume;
    src.connect(gain);
    gain.connect(this.masterGain);
    src.start();
  }

  public playDiceRoll(): void {
    this.playTone(180, 0.08, 'square', 0.12);
    setTimeout(() => this.playTone(240, 0.08, 'square', 0.12), 90);
  }

  public playMove(): void {
    this.playTone(420, 0.06, 'sine', 0.08);
  }

  public playCardDraw(): void {
    this.playTone(520, 0.1, 'triangle', 0.1);
    setTimeout(() => this.playTone(680, 0.12, 'triangle', 0.08), 80);
  }

  public playDetectiveStep(): void {
    this.playTone(90, 0.2, 'sawtooth', 0.15);
    this.playNoise(0.15, 0.08);
  }

  public playTrap(trapId: TrapId): void {
    const cfg = getTrapCinematic(trapId);
    switch (cfg.fallStyle) {
      case 'drop':
        this.playTone(120, 0.15, 'sawtooth', 0.2);
        setTimeout(() => {
          this.playNoise(0.35, 0.25);
          this.playTone(55, 0.4, 'square', 0.22);
        }, 280);
        break;
      case 'swing':
        this.playTone(200, 0.08, 'sawtooth', 0.15);
        setTimeout(() => this.playNoise(0.2, 0.2), 120);
        break;
      case 'tip':
        this.playTone(160, 0.12, 'triangle', 0.14);
        setTimeout(() => this.playNoise(0.25, 0.18), 150);
        break;
      case 'slide':
        this.playNoise(0.4, 0.12);
        this.playTone(70, 0.3, 'sawtooth', 0.18);
        break;
      case 'burst':
        this.playNoise(0.2, 0.22);
        this.playTone(300, 0.2, 'sawtooth', 0.2);
        setTimeout(() => this.playTone(80, 0.35, 'square', 0.2), 100);
        break;
      default:
        this.playNoise(0.3, 0.2);
    }
  }

  public playWin(): void {
    [523, 659, 784, 1047].forEach((f, i) => {
      setTimeout(() => this.playTone(f, 0.25, 'sine', 0.12), i * 120);
    });
  }

  public playUiClick(): void {
    this.playTone(640, 0.04, 'sine', 0.06);
  }
}
