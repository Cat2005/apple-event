"use client";

import { useEffect, useRef } from "react";
import styles from "./BouncingLogo.module.css";

const SPEED = 46; // px per second
const RATIO = 317 / 257; // public/apple-logo.png, cropped to its artwork

/** DVD-style bounce. Position lives in a ref so React never re-renders on a frame. */
export function BouncingLogo({ width = 150 }: { width?: number }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const logo = logoRef.current;
    if (!wrap || !logo) return;

    const state = { x: 60, y: 60, dx: 1, dy: 1 };
    let frame = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      const w = logo.offsetWidth;
      const h = logo.offsetHeight;
      const maxX = wrap.clientWidth - w;
      const maxY = wrap.clientHeight - h;

      state.x += state.dx * SPEED * dt;
      state.y += state.dy * SPEED * dt;

      if (state.x <= 0) (state.x = 0), (state.dx = 1);
      if (state.x >= maxX) (state.x = maxX), (state.dx = -1);
      if (state.y <= 0) (state.y = 0), (state.dy = 1);
      if (state.y >= maxY) (state.y = maxY), (state.dy = -1);

      logo.style.transform = `translate3d(${state.x}px, ${state.y}px, 0)`;
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className={styles.wrap} ref={wrapRef} aria-hidden>
      {/* Plain <img>: next/image would resample and soften the pixel art. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={logoRef}
        className={styles.logo}
        src="/apple-logo.png"
        alt=""
        width={width}
        height={Math.round(width * RATIO)}
      />
    </div>
  );
}
