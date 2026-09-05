"use client";

import { useConvex } from "convex/react";
import { useEffect, useState } from "react";
import styles from "./ConnectionDot.module.css";

/** So you can tell instantly whether a freeze is the app or the venue wifi. */
export function ConnectionDot({ label = false }: { label?: boolean }) {
  const convex = useConvex();
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const check = () => setOnline(convex.connectionState().isWebSocketConnected);
    check();
    const id = setInterval(check, 1500);
    return () => clearInterval(id);
  }, [convex]);

  return (
    <span className={styles.wrap} title={online ? "Connected" : "Reconnecting…"}>
      <span className={online ? styles.dot : `${styles.dot} ${styles.off}`} />
      {label && <span className={styles.label}>{online ? "Live" : "Reconnecting"}</span>}
    </span>
  );
}
