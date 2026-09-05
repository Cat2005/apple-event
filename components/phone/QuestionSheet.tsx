"use client";

import { useQuery } from "convex/react";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { VoteControls } from "./VoteControls";
import styles from "./QuestionSheet.module.css";

type Props = {
  voterId: string;
  votes: Doc<"votes">[];
  activeQuestionId: Id<"questions"> | undefined;
  onClose: () => void;
};

export function QuestionSheet({ voterId, votes, activeQuestionId, onClose }: Props) {
  const questions = useQuery(api.questions.all);
  const [openId, setOpenId] = useState<Id<"questions"> | null>(null);

  const voteFor = (id: Id<"questions">) => votes.find((v) => v.questionId === id) ?? null;
  const open = questions?.find((q) => q._id === openId) ?? null;

  return (
    <div className={styles.sheet}>
      <header className={styles.header}>
        <button className={styles.back} onClick={() => (open ? setOpenId(null) : onClose())}>
          {open ? "← All questions" : "← Back"}
        </button>
      </header>

      {open ? (
        <div className={styles.detail}>
          <VoteControls voterId={voterId} question={open} myVote={voteFor(open._id)} />
        </div>
      ) : (
        <ul className={styles.list}>
          {questions?.map((question) => {
            const vote = voteFor(question._id);
            const resolved = question.status === "resolved";

            return (
              <li key={question._id}>
                <button
                  className={styles.row}
                  onClick={() => setOpenId(question._id)}
                  disabled={resolved && !vote}
                >
                  <span className={styles.text}>{question.text}</span>
                  <span className={styles.meta}>
                    <span className={vote ? styles.answered : styles.unanswered}>
                      {summarise(question, vote)}
                    </span>
                    {question._id === activeQuestionId && (
                      <span className={styles.badge}>On screen</span>
                    )}
                    {resolved && <span className={styles.badge}>Closed</span>}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function summarise(question: Doc<"questions">, vote: Doc<"votes"> | null) {
  if (!vote) return "Not answered";
  if (question.kind === "number" && vote.number !== undefined) {
    return `${question.prefix ?? ""}${vote.number.toLocaleString()}${question.suffix ? ` ${question.suffix}` : ""}`;
  }
  return question.options.find((o) => o.id === vote.optionId)?.label ?? "Answered";
}
