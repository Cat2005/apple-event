"use client";

import { useMutation, useQuery } from "convex/react";
import { useEffect } from "react";
import { api } from "@/convex/_generated/api";
import { useForceReload } from "@/hooks/useForceReload";
import { useVoterId } from "@/hooks/useVoterId";
import { AddOption } from "./AddOption";
import { ChoiceVote } from "./ChoiceVote";
import { IdlePhone } from "./IdlePhone";
import { NumberVote } from "./NumberVote";
import { ResultFlash } from "./ResultFlash";
import styles from "./PhoneScreen.module.css";

export function PhoneScreen() {
  const voterId = useVoterId();
  const event = useQuery(api.event.get);
  const question = useQuery(api.questions.active);
  const join = useMutation(api.voters.join);

  useForceReload(event?.reloadNonce);

  useEffect(() => {
    if (voterId) void join({ voterId });
  }, [voterId, join]);

  const myVote = useQuery(
    api.votes.mine,
    voterId ? { voterId, questionId: question?._id } : "skip",
  );
  const score = useQuery(api.votes.myScore, voterId ? { voterId } : "skip");

  const cast = useMutation(api.votes.cast).withOptimisticUpdate((store, args) => {
    const key = { voterId: args.voterId, questionId: args.questionId };
    const current = store.getQuery(api.votes.mine, key);
    store.setQuery(api.votes.mine, key, {
      _id: current?._id ?? ("optimistic" as never),
      _creationTime: current?._creationTime ?? Date.now(),
      questionId: args.questionId,
      voterId: args.voterId,
      optionId: args.optionId,
      number: args.number,
      updatedAt: Date.now(),
    });
  });

  if (!voterId || event === undefined || question === undefined) {
    return <div className={styles.screen} />;
  }

  const showQuestion = event?.mode === "stream" && question !== null;
  if (!showQuestion) {
    return <IdlePhone score={score} />;
  }

  const locked = question.status === "resolved" || question.votingLocked;

  return (
    <main className={styles.screen}>
      <header className={styles.header}>
        <span className={styles.wordmark}>Apple Watch Party</span>
        {score && score.resolved > 0 && (
          <span className={styles.tally}>
            {score.correct}/{score.resolved} called
          </span>
        )}
      </header>

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

      {question.status === "resolved" && (
        <ResultFlash question={question} myVote={myVote ?? null} />
      )}
    </main>
  );
}
