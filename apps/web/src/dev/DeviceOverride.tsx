import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Device } from '@pastalavista/shared';

interface DeviceOverrideValue {
  override: Device | null;
  setOverride: (device: Device | null) => void;
}

const DeviceOverrideContext = createContext<DeviceOverrideValue>({
  override: null,
  setOverride: () => undefined,
});

/** Surcharge de l'appareil détecté (démonstration) : sans effet tant que le panneau de debug ne l'utilise pas. */
export function DeviceOverrideProvider({ children }: { children: ReactNode }) {
  const [override, setOverride] = useState<Device | null>(null);
  const value = useMemo(() => ({ override, setOverride }), [override]);
  return <DeviceOverrideContext.Provider value={value}>{children}</DeviceOverrideContext.Provider>;
}

export function useDeviceOverride(): DeviceOverrideValue {
  return useContext(DeviceOverrideContext);
}
