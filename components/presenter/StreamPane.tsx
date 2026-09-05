"use client";

import styles from "./StreamPane.module.css";

export function StreamPane({ videoId }: { videoId: string }) {
  const src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=1&rel=0&modestbranding=1`;

  return (
    <section className={styles.pane}>
      <iframe
        className={styles.frame}
        src={src}
        title="Apple Event livestream"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </section>
  );
}
