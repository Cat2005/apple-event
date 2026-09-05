"use client";

import { useEffect, useRef } from "react";

/** Admin panic button: when the nonce changes, every client reloads itself. */
export function useForceReload(nonce: number | undefined) {
  const seen = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (nonce === undefined) return;
    if (seen.current === undefined) {
      seen.current = nonce;
      return;
    }
    if (nonce !== seen.current) window.location.reload();
  }, [nonce]);
}
