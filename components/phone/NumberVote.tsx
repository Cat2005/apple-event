"use client";

import { useEffect, useState } from "react";
import { Doc } from "@/convex/_generated/dataModel";
import styles from "./NumberVote.module.css";

type Props = {
  question: Doc<"questions">;
  myNumber: number | undefined;
  locked: boolean;
  onSubmit: (number: number) => void;
};

export function NumberVote({ question, myNumber, locked, onSubmit }: Props) {
  const [draft, setDraft] = useState("");

  // Reset when the question changes, but never clobber what they're typing.
  useEffect(() => {
    setDraft(myNumber !== undefined ? String(myNumber) : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question._id]);

  const parsed = Number(draft);
  const valid = draft.trim() !== "" && Number.isFinite(parsed) && parsed >= 0;
  const submitted = myNumber !== undefined && parsed === myNumber;

  return (
    <form
      className={styles.form}
      onSubmit={(e) => {
        e.preventDefault();
        if (valid && !locked) onSubmit(parsed);
      }}
    >
      <div className={styles.field}>
        {question.prefix && <span className={styles.affix}>{question.prefix}</span>}
        <input
          className={styles.input}
          type="number"
          inputMode="decimal"
          placeholder="—"
          value={draft}
          disabled={locked}
          onChange={(e) => setDraft(e.target.value)}
          aria-label={question.text}
        />
        {question.suffix && <span className={styles.affix}>{question.suffix}</span>}
      </div>

      {!locked && (
        <button type="submit" className={styles.submit} disabled={!valid || submitted}>
          {submitted ? "Locked in" : myNumber !== undefined ? "Change my guess" : "Lock it in"}
        </button>
      )}

      {myNumber !== undefined && (
        <p className={styles.current}>
          Your guess: {question.prefix}
          {myNumber.toLocaleString()} {question.suffix}
        </p>
      )}
    </form>
  );
}
