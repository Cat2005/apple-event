"use client";

import { useState } from "react";
import styles from "./SpotifyDock.module.css";

/**
 * Hidden until you put the cursor in the bottom-right corner. Deliberately lives
 * only on the idle screen: pushing the first question unmounts it, which stops
 * the music without you having to do anything.
 */
export function SpotifyDock({ url }: { url: string | undefined }) {
  const [open, setOpen] = useState(false);
  const embed = toEmbedUrl(url);
  if (!embed) return null;

  return (
    <div
      className={styles.zone}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <div className={open ? `${styles.dock} ${styles.open}` : styles.dock}>
        <iframe
          className={styles.frame}
          src={embed}
          title="Playlist"
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"
          loading="lazy"
        />
      </div>
    </div>
  );
}

function toEmbedUrl(url: string | undefined) {
  if (!url) return null;
  const match = url.match(/open\.spotify\.com\/(playlist|album|track)\/([A-Za-z0-9]+)/);
  if (!match) return null;
  return `https://open.spotify.com/embed/${match[1]}/${match[2]}?utm_source=generator&theme=0`;
}
