"use client";

import { useMutation } from "convex/react";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import s from "./adminControls.module.css";

export function EventBar({ token, event }: { token: string; event: Doc<"event"> | null }) {
  const setMode = useMutation(api.event.setMode);
  const setLayout = useMutation(api.event.setLayout);
  const setSettings = useMutation(api.event.setSettings);
  const forceReload = useMutation(api.event.forceReload);
  const resetAll = useMutation(api.setup.reset);
  const [openSettings, setOpenSettings] = useState(false);
  const [joinUrl, setJoinUrl] = useState(event?.joinUrl ?? "");
  const [spotifyUrl, setSpotifyUrl] = useState(event?.spotifyUrl ?? "");

  if (!event) return null;

  const isIdle = event.mode === "idle";

  return (
    <section className={s.card}>
      <div className={s.controlGrid}>
        <fieldset className={s.controlGroup}>
          <legend className={s.controlLabel}>Screen</legend>
          <div className={s.segmented}>
            <button
              className={event.mode === "idle" ? `${s.segment} ${s.on}` : s.segment}
              aria-pressed={event.mode === "idle"}
              onClick={() => void setMode({ token, mode: "idle" })}
            >
              Idle
            </button>
            <button
              className={event.mode === "stream" ? `${s.segment} ${s.on}` : s.segment}
              aria-pressed={event.mode === "stream"}
              onClick={() => void setMode({ token, mode: "stream" })}
            >
              Stream
            </button>
          </div>
          <span className={s.controlHint}>
            {isIdle ? "Shows the waiting screen." : "Shows the livestream."}
          </span>
        </fieldset>

        <fieldset className={s.controlGroup} disabled={isIdle}>
          <legend className={s.controlLabel}>Sidebar</legend>
          <div className={s.segmented}>
            <button
              className={event.layout === "dock" ? `${s.segment} ${s.on}` : s.segment}
              aria-pressed={event.layout === "dock"}
              onClick={() => void setLayout({ token, layout: "dock" })}
            >
              Show
            </button>
            <button
              className={event.layout === "fullscreen" ? `${s.segment} ${s.on}` : s.segment}
              aria-pressed={event.layout === "fullscreen"}
              onClick={() => void setLayout({ token, layout: "fullscreen" })}
            >
              Hide
            </button>
          </div>
          <label className={s.checkRow}>
            <input
              className={s.checkInput}
              type="checkbox"
              checked={event.showFullscreenQr ?? false}
              onChange={(e) =>
                void setSettings({ token, showFullscreenQr: e.target.checked })
              }
            />
            <span>
              <span className={s.checkTitle}>Show QR when hidden</span>
              <span className={s.checkHint}>Pins the join code over the stream.</span>
            </span>
          </label>
          {isIdle && <span className={s.controlHint}>Available while streaming.</span>}
        </fieldset>
      </div>

      <div className={s.actionRow}>
        <button
          className={openSettings ? `${s.btn} ${s.on}` : s.btn}
          aria-expanded={openSettings}
          onClick={() => setOpenSettings((v) => !v)}
        >
          Settings
        </button>
        <button
          className={`${s.btn} ${s.bad}`}
          onClick={() => {
            if (confirm("Reload every connected phone and screen?")) void forceReload({ token });
          }}
        >
          Reload everyone
        </button>
      </div>

      {openSettings && (
        <div className={s.settingsPanel}>
          <div className={s.fieldGrid}>
            <label className={s.field}>
              <span className={s.fieldLabel}>Join URL</span>
              <input
                className={s.input}
                type="url"
                inputMode="url"
                value={joinUrl}
                placeholder="https://example.com/join"
                onChange={(e) => setJoinUrl(e.target.value)}
              />
              <span className={s.fieldHint}>Encoded into the guest QR code.</span>
            </label>
            <label className={s.field}>
              <span className={s.fieldLabel}>Spotify playlist</span>
              <input
                className={s.input}
                type="url"
                inputMode="url"
                value={spotifyUrl}
                placeholder="https://open.spotify.com/playlist/…"
                onChange={(e) => setSpotifyUrl(e.target.value)}
              />
              <span className={s.fieldHint}>Optional music for the idle screen.</span>
            </label>
          </div>

          <div className={s.settingsActions}>
            <button
              className={`${s.btn} ${s.primary}`}
              onClick={() => void setSettings({ token, joinUrl, spotifyUrl })}
            >
              Save settings
            </button>
          </div>

          {/* Kept behind Settings on purpose: a mis-tap here mid-event wipes the night. */}
          <div className={s.dangerZone}>
            <div>
              <span className={s.dangerTitle}>Reset event data</span>
              <span className={s.fieldHint}>Wipes test data. Questions are kept.</span>
            </div>
            <button
              className={`${s.btn} ${s.bad}`}
              onClick={() => {
                const ok = confirm(
                  "Start over?\n\n" +
                    "• deletes every vote\n" +
                    "• resets the joined count to zero\n" +
                    "• removes guest-added options\n" +
                    "• puts every question back to unasked\n\n" +
                    "Your questions themselves are kept.",
                );
                if (ok) void resetAll({ token });
              }}
            >
              Reset all votes
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
