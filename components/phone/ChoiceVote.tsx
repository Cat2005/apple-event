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
        const selected = option.id === selectedId;
        const correct = resolved && question.resolvedOptionId === option.id;
        const eliminated = resolved && !correct;

        return (
          <li key={option.id}>
            <button
              type="button"
              disabled={locked}
              aria-pressed={selected}
              className={[
                styles.option,
                selected ? styles.selected : "",
                correct ? styles.correct : "",
                eliminated ? styles.eliminated : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => onSelect(option.id)}
            >
              <span className={styles.label}>{option.label}</span>
              {selected && <span className={styles.check} aria-hidden />}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
