"use client";

import { Doc } from "@/convex/_generated/dataModel";
import styles from "./NumberLine.module.css";

type Props = {
  question: Doc<"questions">;
  numbers: number[];
};

export function NumberLine({ question, numbers }: Props) {
  if (numbers.length === 0) {
    return <p className={styles.empty}>No guesses yet.</p>;
  }

  const answer = question.status === "resolved" ? question.resolvedNumber : undefined;
  const points = [...numbers, ...(answer !== undefined ? [answer] : [])];
  const lo = Math.min(...points);
  const hi = Math.max(...points);
  const pad = (hi - lo || Math.max(1, Math.abs(hi) * 0.1)) * 0.12;
  const min = lo - pad;
  const max = hi + pad;
  const at = (value: number) => ((value - min) / (max - min)) * 100;

  const closest =
    answer === undefined
      ? undefined
      : Math.min(...numbers.map((n) => Math.abs(n - answer)));

  // Stack repeated guesses upwards instead of hiding them behind each other.
  const seen = new Map<number, number>();
  const dots = [...numbers].sort((a, b) => a - b).map((value) => {
    const depth = seen.get(value) ?? 0;
    seen.set(value, depth + 1);
    const isClosest = closest !== undefined && Math.abs(value - answer!) === closest;
    return { value, depth, isClosest };
  });

  const median = dots[Math.floor((dots.length - 1) / 2)].value;

  return (
    <div className={styles.wrap}>
      <div className={styles.plot}>
        {dots.map((dot, i) => (
          <span
            key={i}
            className={dot.isClosest ? `${styles.dot} ${styles.closestDot}` : styles.dot}
            style={{ left: `${at(dot.value)}%`, bottom: `${dot.depth * 15}px` }}
          />
        ))}

        {answer !== undefined && (
          <div className={styles.answer} style={{ left: `${at(answer)}%` }}>
            <span className={styles.answerLabel}>{format(answer, question)}</span>
          </div>
        )}

        <div className={styles.axis} />
      </div>

      <div className={styles.stats}>
        <Stat label="Guesses" value={String(numbers.length)} />
        <Stat label="Lowest" value={format(Math.min(...numbers), question)} />
        <Stat label="Median" value={format(median, question)} />
        <Stat label="Highest" value={format(Math.max(...numbers), question)} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.stat}>
      <span className={styles.statLabel}>{label}</span>
      <span className={styles.statValue}>{value}</span>
    </div>
  );
}

function format(value: number, question: Doc<"questions">) {
  return `${question.prefix ?? ""}${value.toLocaleString()}${question.suffix ? ` ${question.suffix}` : ""}`;
}
