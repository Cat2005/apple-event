"use client";

import { useCallback, useEffect, useState } from "react";

const KEY = "awp:railWidth";

export const MIN_RAIL = 180;
export const MAX_RAIL = 760;
export const DEFAULT_RAIL = 440;

export function clampRail(width: number) {
  if (!Number.isFinite(width)) return DEFAULT_RAIL;
  return Math.min(MAX_RAIL, Math.max(MIN_RAIL, Math.round(width)));
}

/**
 * Per-machine display preference, so the width you settle on during setup is
 * still there after a reload. Never fails the render if storage is unavailable.
 */
export function useRailWidth() {
  const [width, setWidth] = useState(DEFAULT_RAIL);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(KEY);
      if (stored !== null) setWidth(clampRail(Number(stored)));
    } catch {
      // Private window, blocked storage — the default is fine.
    }
  }, []);

  const update = useCallback((next: number) => {
    const clamped = clampRail(next);
    setWidth(clamped);
    try {
      localStorage.setItem(KEY, String(clamped));
    } catch {
      // Not worth failing a drag over.
    }
  }, []);

  return [width, update] as const;
}
