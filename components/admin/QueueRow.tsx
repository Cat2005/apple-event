"use client";

import { useMutation } from "convex/react";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { EditQuestion } from "./EditQuestion";
import s from "./adminControls.module.css";

type Props = {
  token: string;
  question: Doc<"questions">;
  onPush: () => void;
};

const KIND_LABEL = { choice: "Choice", yesno: "Yes/No", number: "Number" } as const;

export function QueueRow({ token, question, onPush }: Props) {
  const remove = useMutation(api.questions.remove);
  const [editing, setEditing] = useState(false);
  const status =
    question.status === "resolved" ? "✓ Resolved" : question.status === "live" ? "Asked" : null;

  return (
    <li className={s.card}>
      <div className={s.spread}>
        <span className={s.kicker}>{KIND_LABEL[question.kind]}</span>
        <span className={s.rowMeta}>
          {status && (
            <span
              className={`${s.statusBadge}${
                question.status === "resolved" ? ` ${s.resolvedBadge}` : ""
              }`}
            >
              {status}
            </span>
          )}
          <span className={s.meta}>#{question.order}</span>
        </span>
      </div>

      {editing ? (
        <EditQuestion token={token} question={question} onDone={() => setEditing(false)} />
      ) : (
        <>
          <p className={s.text}>{question.text}</p>

          <div className={s.row}>
            <button className={`${s.btn} ${s.primary}`} onClick={onPush}>
              {question.status === "resolved" ? "Display again" : "Push live"}
            </button>
            <button className={s.btn} onClick={() => setEditing(true)}>
              Edit
            </button>
            <button
              className={`${s.btn} ${s.bad}`}
              onClick={() => {
                if (confirm(`Delete "${question.text}"?`)) {
                  void remove({ token, questionId: question._id });
                }
              }}
            >
              Delete
            </button>
          </div>
        </>
      )}
    </li>
  );
}
