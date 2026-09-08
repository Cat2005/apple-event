"use client";

import { useMutation } from "convex/react";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { cleanError } from "@/components/common/cleanError";
import s from "./adminControls.module.css";

// Mirrors the caps in convex/lib.ts. Kept here so the form can stop you before
// the server has to.
const MAX_OPTIONS = 8;
const MAX_LABEL = 40;

type Props = {
  token: string;
  question: Doc<"questions">;
  onDone: () => void;
};

/** A draft row. A null id means it isn't on the question yet. */
type Row = { id: string | null; label: string };

/**
 * Edits a question in place. Options go through the per-option mutations rather
 * than a wholesale rewrite, so renaming keeps the votes already cast and only a
 * real deletion throws them away.
 */
export function EditQuestion({ token, question, onDone }: Props) {
  const update = useMutation(api.questions.update);
  const renameOption = useMutation(api.options.rename);
  const addOption = useMutation(api.options.addAsHost);
  const removeOption = useMutation(api.options.remove);

  const [text, setText] = useState(question.text);
  const [prefix, setPrefix] = useState(question.prefix ?? "");
  const [suffix, setSuffix] = useState(question.suffix ?? "");
  const [allowGuestOptions, setAllow] = useState(question.allowGuestOptions);
  const [rows, setRows] = useState<Row[]>(question.options.map((o) => ({ ...o })));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Yes/No keeps its two options: you can reword them, not add or drop them.
  const listEditable = question.kind === "choice";

  const setRow = (index: number, label: string) =>
    setRows(rows.map((row, i) => (i === index ? { ...row, label } : row)));

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      // Deletions first — they make room under the option cap for the additions.
      for (const option of question.options) {
        if (!rows.some((row) => row.id === option.id)) {
          await removeOption({ token, questionId: question._id, optionId: option.id });
        }
      }
      for (const row of rows) {
        const before = question.options.find((o) => o.id === row.id);
        if (row.id === null) {
          if (row.label.trim()) {
            await addOption({ token, questionId: question._id, label: row.label });
          }
        } else if (before && before.label !== row.label.trim()) {
          await renameOption({
            token,
            questionId: question._id,
            optionId: row.id,
            label: row.label,
          });
        }
      }
      await update({
        token,
        questionId: question._id,
        text: text.trim(),
        allowGuestOptions,
        // Only number questions carry these, and "" is how you clear one.
        ...(question.kind === "number" ? { prefix, suffix } : {}),
      });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? cleanError(err.message) : "Couldn't save that");
      setSaving(false);
    }
  };

  return (
    <div className={s.stack}>
      <input
        className={s.input}
        value={text}
        placeholder="Question"
        onChange={(e) => setText(e.target.value)}
      />

      {question.kind !== "number" &&
        rows.map((row, i) => (
          <div key={row.id ?? `new-${i}`} className={s.row}>
            <input
              className={s.input}
              maxLength={MAX_LABEL}
              value={row.label}
              placeholder="Option"
              onChange={(e) => setRow(i, e.target.value)}
            />
            {listEditable && (
              <button
                className={`${s.btn} ${s.bad}`}
                title={
                  row.id === null
                    ? "Discard this option"
                    : "Delete this option and every vote on it"
                }
                onClick={() => setRows(rows.filter((_, j) => j !== i))}
              >
                ×
              </button>
            )}
          </div>
        ))}

      {listEditable && rows.length < MAX_OPTIONS && (
        <button className={s.btn} onClick={() => setRows([...rows, { id: null, label: "" }])}>
          + Add option
        </button>
      )}

      {question.kind === "choice" && (
        <label className={s.row} style={{ fontSize: 14, color: "var(--text-dim)" }}>
          <input
            type="checkbox"
            checked={allowGuestOptions}
            onChange={(e) => setAllow(e.target.checked)}
          />
          Let guests add their own
        </label>
      )}

      {question.kind === "number" && (
        <div className={s.row}>
          <input
            className={s.input}
            value={prefix}
            placeholder="Prefix, e.g. $"
            onChange={(e) => setPrefix(e.target.value)}
          />
          <input
            className={s.input}
            value={suffix}
            placeholder="Suffix, e.g. times"
            onChange={(e) => setSuffix(e.target.value)}
          />
        </div>
      )}

      <div className={s.row}>
        <button
          className={`${s.btn} ${s.primary}`}
          disabled={saving || !text.trim()}
          onClick={() => void save()}
        >
          {saving ? "Saving…" : "Save"}
        </button>
        <button className={s.btn} disabled={saving} onClick={onDone}>
          Cancel
        </button>
      </div>

      {error && <p className={s.error}>{error}</p>}
    </div>
  );
}
