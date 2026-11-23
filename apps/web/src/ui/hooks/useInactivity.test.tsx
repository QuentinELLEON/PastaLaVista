import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { THRESHOLDS } from '../../adaptation/rules/thresholds.config';
import { useInactivity } from './useInactivity';

describe('useInactivity (RU6 : délai d’inactivité allongé en mode guidé)', () => {
  let now = 0;
  const onReset = vi.fn();
  beforeEach(() => {
    now = 0;
    onReset.mockReset();
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
  });
  afterEach(() => vi.useRealTimers());

  const run = (timeoutMs: number) =>
    renderHook(() =>
      useInactivity({
        timeoutMs,
        warningMs: THRESHOLDS.inactivity.warningMs,
        enabled: true,
        onReset,
        now: () => now,
      }),
    );

  function wait(ms: number) {
    now += ms;
    act(() => vi.advanceTimersByTime(1000));
  }

  it('standard : avertit après 30 s puis remet à zéro après l’avertissement', () => {
    const { result } = run(THRESHOLDS.inactivity.standardMs);
    wait(THRESHOLDS.inactivity.standardMs - 1000);
    expect(result.current.secondsLeft).toBeNull();
    wait(1000);
    expect(result.current.secondsLeft).toBe(THRESHOLDS.inactivity.warningMs / 1000);
    expect(onReset).not.toHaveBeenCalled();
    wait(THRESHOLDS.inactivity.warningMs);
    expect(onReset).toHaveBeenCalledOnce();
  });

  it('guidé : le même silence de 30 s ne déclenche rien (90 s)', () => {
    const { result } = run(THRESHOLDS.inactivity.guidedMs);
    wait(THRESHOLDS.inactivity.standardMs + THRESHOLDS.inactivity.warningMs);
    expect(result.current.secondsLeft).toBeNull();
    expect(onReset).not.toHaveBeenCalled();
    // 90 s de silence au total : l'avertissement apparaît enfin
    wait(
      THRESHOLDS.inactivity.guidedMs -
        (THRESHOLDS.inactivity.standardMs + THRESHOLDS.inactivity.warningMs),
    );
    expect(result.current.secondsLeft).not.toBeNull();
  });

  it('« Je suis là » annule l’avertissement', () => {
    const { result } = run(THRESHOLDS.inactivity.standardMs);
    wait(THRESHOLDS.inactivity.standardMs);
    expect(result.current.secondsLeft).not.toBeNull();
    act(() => result.current.stay());
    expect(result.current.secondsLeft).toBeNull();
    wait(THRESHOLDS.inactivity.standardMs - 1000);
    expect(onReset).not.toHaveBeenCalled();
  });

  it('inactif tant qu’aucune session n’est ouverte (écran d’accueil)', () => {
    const { result } = renderHook(() =>
      useInactivity({ timeoutMs: 1000, warningMs: 1000, enabled: false, onReset, now: () => now }),
    );
    wait(60_000);
    expect(result.current.secondsLeft).toBeNull();
    expect(onReset).not.toHaveBeenCalled();
  });
});
