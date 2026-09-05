"use client";

import { Doc } from "@/convex/_generated/dataModel";
import { ConnectionDot } from "@/components/common/ConnectionDot";
import { JoinQR } from "./JoinQR";
import { Histogram } from "./Histogram";
import { ResultBars } from "./ResultBars";
import styles from "./VotingRail.module.css";

type Props = {
  question: Doc<"questions"> | null;
  results: { total: number; counts: Record<string, number>; numbers: number[] } | null;
  joinUrl: string;
  joined: number | undefined;
  wide: boolean;
};

export function VotingRail({ question, results, joinUrl, joined, wide }: Props) {
  const total = results?.total ?? 0;

  return (
    <section className={wide ? `${styles.rail} ${styles.wide}` : styles.rail}>
      <header className={styles.header}>
        <JoinQR url={joinUrl} />
      </header>

      <div className={styles.body}>
        {question ? (
          <>
            <h1 className={styles.question}>{question.text}</h1>

            {question.kind === "number" ? (
              <Histogram question={question} numbers={results?.numbers ?? []} />
            ) : (
              <ResultBars question={question} counts={results?.counts ?? {}} total={total} />
            )}
          </>
        ) : (
          <div className={styles.holding}>
            <h1 className={styles.holdingTitle}>Apple Watch Party</h1>
            <p className={styles.holdingText}>Scan the code — first question coming up.</p>
          </div>
        )}
      </div>

      <footer className={styles.footer}>
        <span>
          {question && `${total} ${total === 1 ? "vote" : "votes"} · `}
          {joined !== undefined && `${joined} joined`}
        </span>
        <span className={styles.state}>
          {!question
            ? "Waiting"
            : question.status === "resolved"
              ? "Resolved"
              : question.votingLocked
                ? "Voting closed"
                : "Voting open"}
          <ConnectionDot />
        </span>
      </footer>
    </section>
  );
}
