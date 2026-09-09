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

  const isIdle = event.mode === "idle";
  const isRailCollapsed = isIdle || event.layout === "fullscreen";

  return (
    <main
      className={`${styles.shell} ${isRailCollapsed ? styles.fullscreen : styles.docked}${
        isIdle ? ` ${styles.idle}` : ""
      }`}
      style={
        {
          "--rail-w": `${railWidth}px`,
        } as React.CSSProperties
      }
    >
      <div className={styles.streamViewport}>
        <StreamPane videoId={event.youtubeVideoId} />
      </div>
      <RailResizer width={railWidth} onChange={setRailWidth} collapsed={isRailCollapsed} />
      <div className={styles.railViewport} aria-hidden={isRailCollapsed}>
        <div className={styles.railInner}>
          <VotingRail
            question={question ?? null}
            results={results ?? null}
            joinUrl={event.joinUrl}
            joined={joined}
            showWifiQr={event.showWifiQr ?? false}
          />
        </div>
      </div>
      <div
        className={`${styles.fullscreenQr}${
          !isIdle && isRailCollapsed && event.showFullscreenQr
            ? ` ${styles.fullscreenQrVisible}`
            : ""
        }`}
        aria-hidden={isIdle || !isRailCollapsed || !event.showFullscreenQr}
      >
        <JoinQR url={event.joinUrl} />
      </div>
      <IdleScreen
        active={isIdle}
        joinUrl={event.joinUrl}
        spotifyUrl={event.spotifyUrl}
        joined={joined}
        showWifiQr={event.showWifiQr ?? false}
      />
    </main>
  );
}
