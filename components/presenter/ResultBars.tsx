"use client";

import { Doc } from "@/convex/_generated/dataModel";
import styles from "./ResultBars.module.css";

type Props = {
  question: Doc<"questions">;
  counts: Record<string, number>;
  total: number;
};

export function ResultBars({ question, counts, total }: Props) {
  const resolved = question.status === "resolved";

  return (
    <ul className={styles.list}>
      {question.options.map((option) => {
        const count = counts[option.id] ?? 0;
        const pct = total === 0 ? 0 : Math.round((count / total) * 100);
        const correct = resolved && question.resolvedOptionId === option.id;
        const eliminated = resolved && !correct;

        return (
          <li
            key={option.id}
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
    </ul>
  );
}
