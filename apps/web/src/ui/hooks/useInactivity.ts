import { useCallback, useEffect, useRef, useState } from 'react';

const CHECK_INTERVAL_MS = 1000;
const MS_PER_SECOND = 1000;

interface Options {
  /** Durée sans interaction avant l'avertissement (30 s en standard, 90 s en mode guidé : règle RU6). */
  timeoutMs: number;
  /** Durée de l'avertissement avant la remise à zéro. */
  warningMs: number;
  enabled: boolean;
  onReset: () => void;
  now?: () => number;
}

/** Remise à zéro de la borne après inactivité, précédée d'un avertissement (écran public : ne rien laisser affiché). */
export function useInactivity({ timeoutMs, warningMs, enabled, onReset, now = Date.now }: Options) {
  // L'horloge est lue via une référence : une nouvelle fonction à chaque rendu ne doit pas relancer l'effet
  const nowRef = useRef(now);
  nowRef.current = now;
  const lastActivity = useRef(now());
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const resetRef = useRef(onReset);
  resetRef.current = onReset;

  const touch = useCallback(() => {
    lastActivity.current = nowRef.current();
    setSecondsLeft(null);
  }, []);

  useEffect(() => {
    if (!enabled) {
      setSecondsLeft(null);
      return;
    }
    lastActivity.current = nowRef.current();
    const events = ['pointerdown', 'keydown'] as const;
    const onActivity = () => {
      // Pendant l'avertissement, seul le bouton « Je suis là » compte : un tap perdu ne prolonge pas la session
      if (document.querySelector('[data-inactivity-warning]')) return;
      lastActivity.current = nowRef.current();
    };
    events.forEach((name) => document.addEventListener(name, onActivity, true));
    const id = window.setInterval(() => {
      const idle = nowRef.current() - lastActivity.current;
      if (idle >= timeoutMs + warningMs) {
        setSecondsLeft(null);
        resetRef.current();
      } else if (idle >= timeoutMs) {
        setSecondsLeft(Math.ceil((timeoutMs + warningMs - idle) / MS_PER_SECOND));
      } else {
        setSecondsLeft(null);
      }
    }, CHECK_INTERVAL_MS);
    return () => {
      events.forEach((name) => document.removeEventListener(name, onActivity, true));
      window.clearInterval(id);
    };
  }, [enabled, timeoutMs, warningMs]);

  return { secondsLeft, stay: touch };
}
