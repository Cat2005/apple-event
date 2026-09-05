"use client";

import { Doc } from "@/convex/_generated/dataModel";
import { buildHistogram, closestDistance } from "./bucketing";
import styles from "./Histogram.module.css";

type Props = {
  question: Doc<"questions">;
  numbers: number[];
};

export function Histogram({ question, numbers }: Props) {
  const answer = question.status === "resolved" ? question.resolvedNumber : undefined;
  const chart = buildHistogram(numbers, answer);

  if (!chart) return <p className={styles.empty}>No guesses yet.</p>;

  const { buckets, start, end, tallest } = chart;
  const at = (value: number) => ((value - start) / (end - start)) * 100;
  const nearest = answer !== undefined ? closestDistance(numbers, answer) : undefined;

  const sorted = [...numbers].sort((a, b) => a - b);
  const median = sorted[Math.floor((sorted.length - 1) / 2)];

  return (
    <div className={styles.wrap}>
      <div className={styles.plot}>
        <div className={styles.columns}>
          {buckets.map((bucket, i) => {
            // A bucket is a winner if it holds a guess as close as the closest one.
            const winning =
              answer !== undefined &&
              nearest !== undefined &&
              numbers.some(
                (n) =>
                  n >= bucket.start &&
                  (n < bucket.end || (i === buckets.length - 1 && n <= bucket.end)) &&
                  Math.abs(n - answer) === nearest,
              );

            return (
              <div key={bucket.start} className={styles.column}>
                <span className={styles.count}>{bucket.count > 0 ? bucket.count : ""}</span>
                <div
                  className={winning ? `${styles.bar} ${styles.winning}` : styles.bar}
                  style={{ height: `${tallest === 0 ? 0 : (bucket.count / tallest) * 100}%` }}
                />
              </div>
            );
          })}
        </div>

        {answer !== undefined && (
          <div className={styles.answer} style={{ left: `${at(answer)}%` }}>
            <span className={styles.answerLabel}>{format(answer, question)}</span>
          </div>
        )}

        <div className={styles.axis} />
      </div>

      <div className={styles.scale}>
        <span>{format(start, question)}</span>
        <span>{format(end, question)}</span>
      </div>

      <div className={styles.stats}>
        <Stat label="Guesses" value={String(numbers.length)} />
        <Stat label="Lowest" value={format(sorted[0], question)} />
        <Stat label="Median" value={format(median, question)} />
        <Stat label="Highest" value={format(sorted[sorted.length - 1], question)} />
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
  const rounded = Number.isInteger(value) ? value : Math.round(value * 100) / 100;
  return `${question.prefix ?? ""}${rounded.toLocaleString()}${question.suffix ? ` ${question.suffix}` : ""}`;
}
