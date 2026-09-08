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
import { JoinQR } from "./JoinQR";
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

  const isRailCollapsed = event.layout === "fullscreen";

  return (
    <main
      className={`${styles.shell} ${isRailCollapsed ? styles.fullscreen : styles.docked}`}
      style={
        {
          "--rail-w": `${railWidth}px`,
        } as React.CSSProperties
      }
    >
      <StreamPane videoId={event.youtubeVideoId} />
      <RailResizer width={railWidth} onChange={setRailWidth} collapsed={isRailCollapsed} />
      <div className={styles.railViewport} aria-hidden={isRailCollapsed}>
        <div className={styles.railInner}>
          <VotingRail
            question={question ?? null}
            results={results ?? null}
            joinUrl={event.joinUrl}
            joined={joined}
          />
        </div>
      </div>
      <div
        className={`${styles.fullscreenQr}${
          isRailCollapsed && event.showFullscreenQr ? ` ${styles.fullscreenQrVisible}` : ""
        }`}
        aria-hidden={!isRailCollapsed || !event.showFullscreenQr}
      >
        <JoinQR url={event.joinUrl} />
      </div>
    </main>
  );
}
