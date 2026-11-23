import { describe, expect, it } from 'vitest';
import { detectDevice, type DeviceSignals } from './deviceDetection';
import { SignalCollector } from './signalCollector';

const base: DeviceSignals = {
  pathname: '/',
  kioskModeConfigured: false,
  kioskIdFromQr: null,
  coarsePointer: false,
  viewportWidth: 1280,
  override: null,
};

describe('detectDevice', () => {
  it('le mode borne configuré l’emporte sur la taille d’écran', () => {
    const result = detectDevice({
      ...base,
      kioskModeConfigured: true,
      coarsePointer: true,
      viewportWidth: 390,
    });
    expect(result).toEqual({ device: 'kiosk', reason: 'kiosk-mode' });
  });

  it('un identifiant de borne dans l’URL (QR code) signifie : smartphone', () => {
    const result = detectDevice({ ...base, kioskIdFromQr: 'kiosk-01', viewportWidth: 1920 });
    expect(result).toEqual({ device: 'smartphone', reason: 'kiosk-id-in-url' });
  });

  it('la route explicite décide avant la taille d’écran', () => {
    expect(
      detectDevice({ ...base, pathname: '/kiosk/menu', viewportWidth: 390, coarsePointer: true })
        .device,
    ).toBe('kiosk');
    expect(detectDevice({ ...base, pathname: '/m/menu', viewportWidth: 1920 }).device).toBe(
      'smartphone',
    );
  });

  it('sans route : tactile ET étroit = smartphone, un écran étroit seul ne suffit pas', () => {
    expect(detectDevice({ ...base, coarsePointer: true, viewportWidth: 390 })).toEqual({
      device: 'smartphone',
      reason: 'touch-and-narrow',
    });
    expect(detectDevice({ ...base, coarsePointer: false, viewportWidth: 390 })).toEqual({
      device: 'kiosk',
      reason: 'default',
    });
  });

  it('la surcharge de développement passe avant tout', () => {
    expect(detectDevice({ ...base, kioskModeConfigured: true, override: 'smartphone' })).toEqual({
      device: 'smartphone',
      reason: 'override',
    });
  });
});

describe('SignalCollector', () => {
  function makeCollector() {
    let now = 0;
    const collector = new SignalCollector(() => now);
    return { collector, advance: (ms: number) => (now += ms) };
  }

  it('mesure le délai entre actions relativement à la référence de l’écran', () => {
    const { collector, advance } = makeCollector();
    collector.enterScreen('compose');
    advance(25_000);
    collector.recordAction();
    advance(5000);
    collector.recordAction();
    expect(collector.snapshot().actionDelays).toEqual([
      { delayMs: 25_000, referenceMs: 10_000 },
      { delayMs: 5000, referenceMs: 10_000 },
    ]);
  });

  it('ne garde que la fenêtre des dernières actions', () => {
    const { collector, advance } = makeCollector();
    for (let i = 0; i < 7; i += 1) {
      advance(1000);
      collector.recordAction();
    }
    expect(collector.snapshot().actionDelays).toHaveLength(4);
  });

  it('distingue actions, retours et taps ratés selon la cible du tap', () => {
    const { collector } = makeCollector();
    document.body.innerHTML =
      '<div id="dead"></div><button id="ok">ok</button><button id="back" data-signal="back">retour</button><div data-dev-tools><p id="dev"></p></div>';
    const target = (id: string) => document.getElementById(id);
    collector.handlePointerTarget(target('dead'));
    collector.handlePointerTarget(target('ok'));
    collector.handlePointerTarget(target('back'));
    collector.handlePointerTarget(target('dev'));
    const snapshot = collector.snapshot();
    expect(snapshot.missedTaps).toBe(1);
    expect(snapshot.backAndForth).toBe(1);
    expect(snapshot.actionDelays).toHaveLength(2);
  });

  it('reset efface les signaux de la session et notifie les abonnés', () => {
    const { collector } = makeCollector();
    let notified = 0;
    collector.subscribe(() => (notified += 1));
    collector.recordMissedTap();
    collector.reset();
    expect(collector.snapshot().missedTaps).toBe(0);
    expect(notified).toBe(2);
  });
});
