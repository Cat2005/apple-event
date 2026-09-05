"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { Doc } from "@/convex/_generated/dataModel";
import styles from "./ResultBars.module.css";

type Props = {
  question: Doc<"questions">;
  counts: Record<string, number>;
  total: number;
};

// useLayoutEffect warns during SSR; the presenter is client-rendered anyway.
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function ResultBars({ question, counts, total }: Props) {
  const resolved = question.status === "resolved";
  // Resolved with no matching option: nobody was right, and the real answer is
  // shown on its own row rather than hidden in the admin panel.
  const actualAnswer = resolved && !question.resolvedOptionId ? question.resolvedLabel : undefined;

  // Most popular first. Array.sort is stable, so options level on votes keep
  // their original order instead of flickering past each other.
  const ranked = [...question.options].sort(
    (a, b) => (counts[b.id] ?? 0) - (counts[a.id] ?? 0),
  );

  const rows = useRef(new Map<string, HTMLLIElement>());
  const lastTop = useRef(new Map<string, number>());

  useIsomorphicLayoutEffect(() => {
    const next = new Map<string, number>();

    rows.current.forEach((el, id) => {
      const top = el.getBoundingClientRect().top;
      next.set(id, top);

      const previous = lastTop.current.get(id);
      if (previous === undefined || Math.abs(previous - top) < 0.5) return;

      // FLIP: jump back to where the row was, then release it to glide into
      // place. Done synchronously rather than in requestAnimationFrame, which
      // is frozen while the tab is in the background — there the row would
      // simply snap, instead of sticking mid-animation.
      el.style.transition = "none";
      el.style.transform = `translateY(${previous - top}px)`;
      void el.offsetHeight; // force reflow so the jump is committed
      el.style.transition = "transform 560ms cubic-bezier(0.22, 1, 0.36, 1)";
      el.style.transform = "";
    });

    lastTop.current = next;
  });

  return (
    <ul className={styles.list}>
      {ranked.map((option) => {
        const count = counts[option.id] ?? 0;
        const pct = total === 0 ? 0 : Math.round((count / total) * 100);
        const correct = resolved && question.resolvedOptionId === option.id;
        const eliminated = resolved && !correct;

        return (
          <li
            key={option.id}
            ref={(el) => {
              if (el) rows.current.set(option.id, el);
              else rows.current.delete(option.id);
            }}
            className={[styles.row, correct ? styles.correct : "", eliminated ? styles.eliminated : ""]
              .filter(Boolean)
              .join(" ")}
          >
            <div className={styles.fill} style={{ width: `${pct}%` }} />
            <div className={styles.content}>
              <span className={styles.label}>
                {option.label}
                {option.addedBy && <span className={styles.added} title="Added by a guest" />}
              </span>
              <span className={styles.numbers}>
                <span className={styles.pct}>{pct}%</span>
                <span className={styles.count}>{count}</span>
              </span>
            </div>
          </li>
        );
      })}

      {actualAnswer && (
        <li className={`${styles.row} ${styles.correct} ${styles.actual}`}>
          <div className={styles.fill} style={{ width: "100%" }} />
          <div className={styles.content}>
            <span className={styles.label}>{actualAnswer}</span>
            <span className={styles.numbers}>
              <span className={styles.nobody}>nobody</span>
            </span>
          </div>
        </li>
      )}
    </ul>
  );
}
