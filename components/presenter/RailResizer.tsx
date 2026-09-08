"use client";

import { useEffect, useState } from "react";
import { clampRail } from "@/hooks/useRailWidth";
import styles from "./RailResizer.module.css";

type Props = {
  width: number;
  onChange: (width: number) => void;
  collapsed?: boolean;
};

const STEP = 20;

/** Drag the divider between the stream and the voting rail. */
export function RailResizer({ width, onChange, collapsed = false }: Props) {
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (!dragging) return;

    const move = (event: PointerEvent) => onChange(window.innerWidth - event.clientX);
    const stop = () => setDragging(false);

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
    window.addEventListener("pointercancel", stop);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
      window.removeEventListener("pointercancel", stop);
    };
  }, [dragging, onChange]);

  return (
    <>
      <div
        className={`${styles.handle}${dragging ? ` ${styles.active}` : ""}${collapsed ? ` ${styles.collapsed}` : ""}`}
        style={{ right: collapsed ? 0 : width }}
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize the voting panel"
        aria-valuenow={width}
        aria-hidden={collapsed}
        tabIndex={collapsed ? -1 : 0}
        onPointerDown={(event) => {
          if (collapsed) return;
          event.preventDefault();
          setDragging(true);
        }}
        onKeyDown={(event) => {
          if (collapsed) return;
          if (event.key === "ArrowLeft") onChange(clampRail(width + STEP));
          if (event.key === "ArrowRight") onChange(clampRail(width - STEP));
        }}
      >
        <span className={styles.grip} />
        {dragging && <span className={styles.readout}>{width} px</span>}
      </div>

      {/* Covers the iframe: without it the YouTube frame swallows pointermove mid-drag. */}
      {dragging && <div className={styles.shield} />}
    </>
  );
}
