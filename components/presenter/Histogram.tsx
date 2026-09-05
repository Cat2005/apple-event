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
  const width = buckets[0].end - buckets[0].start;
  const at = (value: number) => ((value - start) / (end - start)) * 100;
  const nearest = answer !== undefined ? closestDistance(numbers, answer) : undefined;
  const mean = numbers.reduce((sum, n) => sum + n, 0) / numbers.length;

  // Thin the axis labels until they stop colliding.
  const labelEvery = Math.ceil(buckets.length / 9);

  return (
    <div className={styles.wrap}>
      <div className={styles.plot}>
        <div className={styles.columns}>
          {buckets.map((bucket, i) => {
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

      {/* The number line: one slot per bar, so a label sits under its own bar. */}
      <div className={styles.ticks}>
        {buckets.map((bucket, i) => (
          <span key={bucket.start} className={styles.tick}>
            {i % labelEvery === 0 ? axisLabel(bucket.start, width, question) : ""}
          </span>
        ))}
      </div>

      <p className={styles.mean}>
        <span className={styles.meanLabel}>Mean</span>
        <span className={styles.meanValue}>{format(round(mean), question)}</span>
      </p>
    </div>
  );
}

function round(value: number) {
  return Math.round(value * 10) / 10;
}

/** Compact enough to sit under a narrow bar: 1200 becomes 1.2k. */
function axisLabel(value: number, width: number, question: Doc<"questions">) {
  const compact =
    Math.abs(value) >= 1000
      ? `${round(value / 1000)}k`
      : String(width < 1 ? round(value) : Math.round(value));
  return `${question.prefix ?? ""}${compact}`;
}

function format(value: number, question: Doc<"questions">) {
  return `${question.prefix ?? ""}${value.toLocaleString()}${question.suffix ? ` ${question.suffix}` : ""}`;
}
