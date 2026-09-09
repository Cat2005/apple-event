"use client";

import styles from "./WifiQR.module.css";

/**
 * The wifi QR is a fixed image the host generated once, not something we encode
 * from event state — unlike JoinQR, which builds its code from event.joinUrl.
 */
export function WifiQR() {
  return (
    <div className={styles.wrap}>
      <span className={styles.label}>Scan for Wifi</span>
      <div className={styles.card}>
        {/* Plain <img>: next/image would resample and soften the QR modules. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={styles.qr} src="/wifi-qr.png" alt="QR code to join the wifi" />
      </div>
    </div>
  );
}
