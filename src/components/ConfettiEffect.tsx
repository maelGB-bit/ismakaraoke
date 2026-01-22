import { useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';

interface ConfettiEffectProps {
  trigger: boolean;
}

export function ConfettiEffect({ trigger }: ConfettiEffectProps) {
  const fireConfetti = useCallback(() => {
    const count = 200;
    const defaults = {
      origin: { y: 0.7 },
      zIndex: 9999,
    };

    function fire(particleRatio: number, opts: confetti.Options) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }

    fire(0.25, {
      spread: 26,
      startVelocity: 55,
      colors: ['#ff1493', '#00ffff', '#ffd700'],
    });

    fire(0.2, {
      spread: 60,
      colors: ['#ff1493', '#00ffff', '#ffd700'],
    });

    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8,
      colors: ['#ff1493', '#00ffff', '#ffd700'],
    });

    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2,
      colors: ['#ff1493', '#00ffff', '#ffd700'],
    });

    fire(0.1, {
      spread: 120,
      startVelocity: 45,
      colors: ['#ff1493', '#00ffff', '#ffd700'],
    });
  }, []);

  useEffect(() => {
    if (trigger) {
      fireConfetti();
    }
  }, [trigger, fireConfetti]);

  return null;
}
