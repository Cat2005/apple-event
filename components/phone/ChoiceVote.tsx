"use client";

import { Doc } from "@/convex/_generated/dataModel";
import styles from "./ChoiceVote.module.css";

type Props = {
  question: Doc<"questions">;
  selectedId: string | undefined;
  locked: boolean;
  onSelect: (optionId: string) => void;
};

export function ChoiceVote({ question, selectedId, locked, onSelect }: Props) {
  const resolved = question.status === "resolved";
  const isYesNo = question.kind === "yesno";

  return (
    <ul className={isYesNo ? styles.listSplit : styles.list}>
      {question.options.map((option) => {
        const picked = option.id === selectedId;
        // Exactly one state class per option. Stacking "selected" with
        // "correct"/"eliminated" left the winner up to the cascade, and it
        // resolved wrongly — white text on a white box after a question closed.
        const state = !resolved
          ? picked
            ? styles.selected
            : ""
          : question.resolvedOptionId === option.id
            ? styles.correct
            : picked
              ? styles.wrongPick
              : styles.eliminated;

        return (
          <li key={option.id}>
            <button
              type="button"
              disabled={locked}
              aria-pressed={picked}
              className={[styles.option, state].filter(Boolean).join(" ")}
              onClick={() => onSelect(option.id)}
            >
              <span className={styles.label}>{option.label}</span>
              {picked && <span className={styles.check} aria-hidden />}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
