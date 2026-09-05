"use client";

import { useMutation } from "convex/react";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import s from "./adminControls.module.css";

type Kind = "choice" | "yesno" | "number";

export function NewQuestion({ token }: { token: string }) {
  const create = useMutation(api.questions.create);
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<Kind>("choice");
  const [text, setText] = useState("");
  const [options, setOptions] = useState("");
  const [prefix, setPrefix] = useState("");
  const [suffix, setSuffix] = useState("");
  const [allowGuestOptions, setAllow] = useState(true);

  if (!open) {
    return (
      <button className={`${s.btn} ${s.primary}`} onClick={() => setOpen(true)}>
        + New question
      </button>
    );
  }

  const submit = async () => {
    await create({
      token,
      kind,
      text,
      options: options.split("\n").map((o) => o.trim()).filter(Boolean),
      prefix: prefix || undefined,
      suffix: suffix || undefined,
      allowGuestOptions,
    });
    setText("");
    setOptions("");
    setOpen(false);
  };

  return (
    <section className={s.card}>
      <div className={s.row}>
        {(["choice", "yesno", "number"] as Kind[]).map((k) => (
          <button
            key={k}
            className={kind === k ? `${s.btn} ${s.on}` : s.btn}
            onClick={() => setKind(k)}
          >
            {k === "yesno" ? "Yes/No" : k === "number" ? "Number" : "Choice"}
          </button>
        ))}
      </div>

      <input
        className={s.input}
        value={text}
        placeholder="Question"
        onChange={(e) => setText(e.target.value)}
      />

      {kind === "choice" && (
        <>
          <textarea
            className={s.input}
            style={{ minHeight: 96, padding: "10px 12px", resize: "vertical" }}
            value={options}
            placeholder={"One option per line"}
            onChange={(e) => setOptions(e.target.value)}
          />
          <label className={s.row} style={{ fontSize: 14, color: "var(--text-dim)" }}>
            <input
              type="checkbox"
              checked={allowGuestOptions}
              onChange={(e) => setAllow(e.target.checked)}
            />
            Let guests add their own
          </label>
        </>
      )}

      {kind === "number" && (
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
        <button className={`${s.btn} ${s.primary}`} disabled={!text.trim()} onClick={() => void submit()}>
          Add to queue
        </button>
        <button className={s.btn} onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
    </section>
  );
}
