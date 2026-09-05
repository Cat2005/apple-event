"use client";

import { useEffect, useState } from "react";

const KEY = "awp:voterId";

/** Anonymous, per-device, survives refresh and lock screen. No names, no accounts. */
export function useVoterId(): string | null {
  const [voterId, setVoterId] = useState<string | null>(null);

  useEffect(() => {
    let id = localStorage.getItem(KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(KEY, id);
    }
    setVoterId(id);
  }, []);

  return voterId;
}
