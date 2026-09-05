"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";
import styles from "./JoinQR.module.css";

/** Rendered in-page — no third-party QR service in the critical path. */
export function JoinQR({ url }: { url: string }) {
  const [svg, setSvg] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    void QRCode.toString(url, {
      type: "svg",
      margin: 0,
      errorCorrectionLevel: "M",
      color: { dark: "#000000", light: "#ffffff" },
    }).then((out) => live && setSvg(out));
    return () => {
      live = false;
    };
  }, [url]);

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        {svg && <div className={styles.qr} dangerouslySetInnerHTML={{ __html: svg }} />}
      </div>
      <span className={styles.kicker}>Scan to vote</span>
    </div>
  );
}
