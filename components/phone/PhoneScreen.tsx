"use client";

import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "@/convex/_generated/api";
import { useForceReload } from "@/hooks/useForceReload";
import { useVoterId } from "@/hooks/useVoterId";
import { IdlePhone } from "./IdlePhone";
import { QuestionSheet } from "./QuestionSheet";
import { VoteControls } from "./VoteControls";
import styles from "./PhoneScreen.module.css";

export function PhoneScreen() {
  const voterId = useVoterId();
  const event = useQuery(api.event.get);
  const question = useQuery(api.questions.active);
  const join = useMutation(api.voters.join);
  const [browsing, setBrowsing] = useState(false);

  useForceReload(event?.reloadNonce);

  useEffect(() => {
    if (voterId) void join({ voterId });
  }, [voterId, join]);

  const votes = useQuery(api.votes.mine, voterId ? { voterId } : "skip");
  const score = useQuery(api.votes.myScore, voterId ? { voterId } : "skip");

  if (!voterId || event === undefined || question === undefined) {
    return <div className={styles.screen} />;
  }

  const sheet = browsing && (
    <QuestionSheet
      voterId={voterId}
      votes={votes ?? []}
      activeQuestionId={event?.activeQuestionId}
      onClose={() => setBrowsing(false)}
    />
  );

  const showQuestion = event?.mode === "stream" && question !== null;
  if (!showQuestion) {
    return (
      <>
        <IdlePhone score={score} onBrowse={() => setBrowsing(true)} />
        {sheet}
      </>
    );
  }

  const myVote = votes?.find((vote) => vote.questionId === question._id) ?? null;

  return (
    <>
      <main className={styles.screen}>
        <header className={styles.header}>
          <span className={styles.wordmark}>Apple Watch Party</span>
          {score && score.resolved > 0 && (
            <span className={styles.tally}>
              {score.correct}/{score.resolved} called
            </span>
          )}
        </header>

        <VoteControls voterId={voterId} question={question} myVote={myVote} />

        <button className={styles.browse} onClick={() => setBrowsing(true)}>
          All questions
        </button>
      </main>
      {sheet}
    </>
  );
}
