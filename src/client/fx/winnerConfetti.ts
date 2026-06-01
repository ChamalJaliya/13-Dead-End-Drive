/**
 * winnerConfetti.ts
 * Local-winner celebration bursts via canvas-confetti.
 */

import confetti from 'canvas-confetti';

const MUTE_STORAGE_KEY = 'ded-audio-muted';

function isReducedMotion(): boolean {
  if (typeof window === 'undefined') return true;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function isMuted(): boolean {
  if (typeof localStorage === 'undefined') return false;
  return localStorage.getItem(MUTE_STORAGE_KEY) === '1';
}

function isMobileViewport(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(max-width: 768px)').matches;
}

export function fireWinnerConfetti(): void {
  if (typeof window === 'undefined') return;
  if (isReducedMotion() || isMuted()) return;

  const particleCount = isMobileViewport() ? 60 : 120;

  void confetti({
    particleCount,
    spread: 70,
    origin: { y: 0.65 },
    colors: ['#fbbf24', '#f59e0b', '#fcd34d', '#fde68a'],
    disableForReducedMotion: true,
  });

  setTimeout(() => {
    void confetti({
      particleCount: Math.floor(particleCount * 0.6),
      spread: 100,
      origin: { x: 0.2, y: 0.7 },
      colors: ['#fbbf24', '#f59e0b'],
      disableForReducedMotion: true,
    });
  }, 200);

  setTimeout(() => {
    void confetti({
      particleCount: Math.floor(particleCount * 0.6),
      spread: 100,
      origin: { x: 0.8, y: 0.7 },
      colors: ['#fcd34d', '#fde68a'],
      disableForReducedMotion: true,
    });
  }, 400);
}
