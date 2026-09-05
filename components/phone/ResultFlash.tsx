"use client";

import { Doc } from "@/convex/_generated/dataModel";
import styles from "./ResultFlash.module.css";

type Props = {
  question: Doc<"questions">;
  myVote: Doc<"votes"> | null;
};

export function ResultFlash({ question, myVote }: Props) {
  const { headline, detail, right } = summarise(question, myVote);

  return (
    <div className={right ? `${styles.flash} ${styles.right}` : styles.flash} role="status">
      <span className={styles.headline}>{headline}</span>
      {detail && <span className={styles.detail}>{detail}</span>}
    </div>
  );
}

function summarise(question: Doc<"questions">, myVote: Doc<"votes"> | null) {
  if (!myVote) return { headline: "You sat this one out", detail: null, right: false };

  if (question.kind === "number") {
    const answer = question.resolvedNumber;
    if (answer === undefined || myVote.number === undefined) {
      return { headline: "Answered", detail: null, right: false };
    }
    const off = Math.abs(myVote.number - answer);
    return {
      headline: off === 0 ? "Exactly right" : `You were ${format(off, question)} off`,
      detail: `You said ${format(myVote.number, question)} — it was ${format(answer, question)}`,
      right: off === 0,
    };
  }

  const correct = myVote.optionId === question.resolvedOptionId;
  const answer = question.options.find((o) => o.id === question.resolvedOptionId);
  const actual = answer?.label ?? question.resolvedLabel;
  return {
    headline: correct ? "Called it" : "Not this time",
    detail: actual ? `The answer was ${actual}` : "None of the options were right",
    right: correct,
  };
}

function format(value: number, question: Doc<"questions">) {
  return `${question.prefix ?? ""}${value.toLocaleString()}${question.suffix ? ` ${question.suffix}` : ""}`;
}
