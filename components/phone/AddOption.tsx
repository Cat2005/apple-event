"use client";

import { useMutation } from "convex/react";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import styles from "./AddOption.module.css";

const MAX = 40;

export function AddOption({
  voterId,
  questionId,
}: {
  voterId: string;
  questionId: Id<"questions">;
}) {
  const add = useMutation(api.options.add);
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (done) return <p className={styles.done}>Added to the board.</p>;

  if (!open) {
    return (
      <button type="button" className={styles.trigger} onClick={() => setOpen(true)}>
        + Add your own
      </button>
    );
  }

  return (
    <form
      className={styles.form}
      onSubmit={async (e) => {
        e.preventDefault();
        setError(null);
        try {
          await add({ voterId, questionId, label });
          setDone(true);
        } catch (err) {
          setError(err instanceof Error ? cleanError(err.message) : "Couldn't add that");
        }
      }}
    >
      <input
        className={styles.input}
        autoFocus
        maxLength={MAX}
        value={label}
        placeholder="Your own answer"
        onChange={(e) => setLabel(e.target.value)}
      />
      <button type="submit" className={styles.submit} disabled={!label.trim()}>
        Add
      </button>
      {error && <p className={styles.error}>{error}</p>}
    </form>
  );
}

/** Convex wraps thrown errors; show the humans just the message we wrote. */
function cleanError(message: string) {
  const match = message.match(/Uncaught Error:\s*(.*?)(\n|$)/);
  return (match?.[1] ?? message).trim();
}
