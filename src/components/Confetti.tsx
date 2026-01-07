import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";

interface ConfettiProps {
  duration?: number; // Duration in milliseconds
  onComplete?: () => void;
}

export const Confetti = ({ duration = 8000, onComplete }: ConfettiProps) => {
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const end = Date.now() + duration;

    const colors = ["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff", "#ffa500", "#ff69b4"];

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: colors,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      } else {
        onComplete?.();
      }
    };

    frame();

    // Also fire some big bursts
    const burstInterval = setInterval(() => {
      confetti({
        particleCount: 50,
        spread: 100,
        origin: { x: Math.random(), y: Math.random() * 0.5 },
        colors: colors,
      });
    }, 1500);

    return () => {
      clearInterval(burstInterval);
    };
  }, [duration, onComplete]);

  return null;
};
