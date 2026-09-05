"use client";

import { useMutation } from "convex/react";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import s from "./adminControls.module.css";

export function EventBar({ token, event }: { token: string; event: Doc<"event"> | null }) {
  const setMode = useMutation(api.event.setMode);
  const setStreamMode = useMutation(api.event.setStreamMode);
  const setSettings = useMutation(api.event.setSettings);
  const forceReload = useMutation(api.event.forceReload);
  const resetAll = useMutation(api.setup.reset);
  const [openSettings, setOpenSettings] = useState(false);
  const [joinUrl, setJoinUrl] = useState(event?.joinUrl ?? "");
  const [spotifyUrl, setSpotifyUrl] = useState(event?.spotifyUrl ?? "");

  if (!event) return null;

  return (
    <section className={s.card}>
      <div className={s.row}>
        <button
          className={event.mode === "idle" ? `${s.btn} ${s.on}` : s.btn}
          onClick={() => void setMode({ token, mode: "idle" })}
        >
          Idle screen
        </button>
        <button
          className={event.mode === "stream" ? `${s.btn} ${s.on}` : s.btn}
          onClick={() => void setMode({ token, mode: "stream" })}
        >
          Stream
        </button>
        <span style={{ flex: 1 }} />
        <button
          className={s.btn}
          onClick={() =>
            void setStreamMode({
              token,
              streamMode: event.streamMode === "embed" ? "dock" : "embed",
            })
          }
        >
          Stream: {event.streamMode}
        </button>
      </div>

      <div className={s.row}>
        <button className={s.btn} onClick={() => setOpenSettings((v) => !v)}>
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
        <>
          <div className={s.row}>
            <input
              className={s.input}
              value={joinUrl}
              placeholder="Join URL (goes in the QR)"
              onChange={(e) => setJoinUrl(e.target.value)}
            />
            <input
              className={s.input}
              value={spotifyUrl}
              placeholder="Spotify playlist URL"
              onChange={(e) => setSpotifyUrl(e.target.value)}
            />
            <button
              className={`${s.btn} ${s.primary}`}
              onClick={() => void setSettings({ token, joinUrl, spotifyUrl })}
            >
              Save
            </button>
          </div>

          {/* Kept behind Settings on purpose: a mis-tap here mid-event wipes the night. */}
          <div className={s.row}>
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
            <span className={s.meta}>Wipes test data. Questions are kept.</span>
          </div>
        </>
      )}
    </section>
  );
}
