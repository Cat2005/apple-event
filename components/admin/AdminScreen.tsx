"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ConnectionDot } from "@/components/common/ConnectionDot";
import { EventBar } from "./EventBar";
import { LiveQuestion } from "./LiveQuestion";
import { NewQuestion } from "./NewQuestion";
import { QueueRow } from "./QueueRow";
import styles from "./AdminScreen.module.css";

export function AdminScreen({ token }: { token: string }) {
  const event = useQuery(api.event.get);
  const questions = useQuery(api.questions.list, { token });
  const results = useQuery(api.votes.results, {
    questionId: event?.activeQuestionId ?? undefined,
  });
  const pushLive = useMutation(api.questions.pushLive);

  if (questions === undefined || event === undefined) {
    return <div className={styles.blank} />;
  }
  if (questions === null) {
    return <div className={styles.blank}>This link isn&rsquo;t right.</div>;
  }

  const live = questions.find((q) => q._id === event?.activeQuestionId) ?? null;

  return (
    <main className={styles.screen}>
      <header className={styles.top}>
        <h1 className={styles.heading}>Watch Party control</h1>
        <ConnectionDot label />
      </header>

      <EventBar token={token} event={event} />

      <section className={styles.section}>
        <h2 className={styles.subheading}>Questions</h2>
        <ul className={styles.queue}>
          {questions.map((question) =>
            question._id === live?._id ? (
              <LiveQuestion
                key={question._id}
                token={token}
                question={question}
                total={results?.total ?? 0}
                counts={results?.counts ?? {}}
              />
            ) : (
              <QueueRow
                key={question._id}
                token={token}
                question={question}
                onPush={() => void pushLive({ token, questionId: question._id })}
              />
            ),
          )}
        </ul>
      </section>

      <NewQuestion token={token} />
    </main>
  );
}
