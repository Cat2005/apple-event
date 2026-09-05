"use client";

import { Doc } from "@/convex/_generated/dataModel";
import { useCastVote } from "@/hooks/useCastVote";
import { AddOption } from "./AddOption";
import { ChoiceVote } from "./ChoiceVote";
import { NumberVote } from "./NumberVote";
import { ResultFlash } from "./ResultFlash";
import styles from "./VoteControls.module.css";

type Props = {
  voterId: string;
  question: Doc<"questions">;
  myVote: Doc<"votes"> | null;
};

/** The voting UI for one question — shared by the live view and the browse sheet. */
export function VoteControls({ voterId, question, myVote }: Props) {
  const cast = useCastVote();
  const locked = question.status === "resolved" || question.votingLocked;

  return (
    <div className={styles.wrap}>
      <h1 className={styles.question}>{question.text}</h1>

      {question.kind === "number" ? (
        <NumberVote
          question={question}
          myNumber={myVote?.number}
          locked={locked}
          onSubmit={(number) => void cast({ voterId, questionId: question._id, number })}
        />
      ) : (
        <ChoiceVote
          question={question}
          selectedId={myVote?.optionId}
          locked={locked}
          onSelect={(optionId) => void cast({ voterId, questionId: question._id, optionId })}
        />
      )}

      {question.allowGuestOptions && !locked && (
        <AddOption voterId={voterId} questionId={question._id} />
      )}

      {question.status === "resolved" && <ResultFlash question={question} myVote={myVote} />}

      {question.votingLocked && question.status !== "resolved" && (
        <p className={styles.note}>Voting is closed on this one.</p>
      )}
    </div>
  );
}
