"use client";

import { BouncingLogo } from "./BouncingLogo";
import { JoinQR } from "./JoinQR";
import { SpotifyDock } from "./SpotifyDock";
import styles from "./IdleScreen.module.css";

type Props = {
  active: boolean;
  joinUrl: string;
  spotifyUrl: string | undefined;
  joined: number | undefined;
};

export function IdleScreen({ active, joinUrl, spotifyUrl, joined }: Props) {
  return (
    <div
      className={`${styles.screen}${active ? ` ${styles.active}` : ""}`}
      aria-hidden={!active}
    >
      <BouncingLogo active={active} />

      <div className={styles.centre}>
        <h1 className={styles.title}>Apple Watch Party</h1>
        {joined !== undefined && (
          <p className={styles.joined}>
            <strong>{joined}</strong> {joined === 1 ? "person" : "people"} joined
          </p>
        )}
      </div>

      <div className={styles.corner}>
        <JoinQR url={joinUrl} />
      </div>

      {active ? <SpotifyDock url={spotifyUrl} /> : null}
    </div>
  );
}
