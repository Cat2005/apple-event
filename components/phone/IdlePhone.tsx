"use client";

import styles from "./IdlePhone.module.css";

export function IdlePhone({ score }: { score: { correct: number; resolved: number } | undefined }) {
  return (
    <main className={styles.screen}>
      <div className={styles.pulse} aria-hidden />
      <p className={styles.waiting}>Waiting for the next question…</p>
      {score && score.resolved > 0 && (
        <p className={styles.tally}>
          You&rsquo;ve called <strong>{score.correct}</strong> of {score.resolved} right
        </p>
      )}
    </main>
  );
}
