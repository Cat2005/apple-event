"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useForceReload } from "@/hooks/useForceReload";
import { useRailWidth } from "@/hooks/useRailWidth";
import { useWakeLock } from "@/hooks/useWakeLock";
import { RailResizer } from "./RailResizer";
import { IdleScreen } from "./IdleScreen";
import { StreamPane } from "./StreamPane";
import { VotingRail } from "./VotingRail";
import styles from "./PresenterScreen.module.css";

export function PresenterScreen() {
  const event = useQuery(api.event.get);
  const question = useQuery(api.questions.active);
  const results = useQuery(api.votes.results, { questionId: question?._id ?? undefined });
  const joined = useQuery(api.voters.count);
  const [railWidth, setRailWidth] = useRailWidth();

  useWakeLock();
  useForceReload(event?.reloadNonce);

  if (event === undefined) return <div className={styles.blank} />;
  if (event === null) {
    return <div className={styles.blank}>Not initialised — run `npx convex run setup:init`</div>;
  }

  // The stream and the question are independent: "stream" mode keeps the livestream
  // up whether or not a question is on screen.
  if (event.mode === "idle") {
    return <IdleScreen joinUrl={event.joinUrl} spotifyUrl={event.spotifyUrl} joined={joined} />;
  }

  const embedding = event.streamMode === "embed";

  return (
    <main
      className={embedding ? styles.split : styles.dock}
      style={
        embedding
          ? ({
              gridTemplateColumns: `1fr ${railWidth}px`,
              "--rail-w": `${railWidth}px`,
            } as React.CSSProperties)
          : undefined
      }
    >
      {embedding && <StreamPane videoId={event.youtubeVideoId} />}
      {embedding && <RailResizer width={railWidth} onChange={setRailWidth} />}
      <VotingRail
        question={question ?? null}
        results={results ?? null}
        joinUrl={event.joinUrl}
        joined={joined}
        wide={!embedding}
      />
    </main>
  );
}
