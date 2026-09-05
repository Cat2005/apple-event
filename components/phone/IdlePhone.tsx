"use client";

import styles from "./IdlePhone.module.css";

type Props = {
  score: { correct: number; resolved: number } | undefined;
  onBrowse: () => void;
};

export function IdlePhone({ score, onBrowse }: Props) {
  return (
    <main className={styles.screen}>
      <div className={styles.pulse} aria-hidden />
      <p className={styles.waiting}>Waiting for the next question&hellip;</p>
      {score && score.resolved > 0 && (
        <p className={styles.tally}>
          You&rsquo;ve called <strong>{score.correct}</strong> of {score.resolved} right
        </p>
      )}
      <button className={styles.browse} onClick={onBrowse}>
        All questions
      </button>
    </main>
  );
}
