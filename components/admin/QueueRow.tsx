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

  return (
    <li className={s.card}>
      <div className={s.spread}>
        <span className={s.kicker}>
          {KIND_LABEL[question.kind]}
          {question.status === "resolved" && " · resolved"}
          {question.status === "live" && " · asked"}
        </span>
        <span className={s.meta}>#{question.order}</span>
      </div>

      {editing ? (
        <EditQuestion token={token} question={question} onDone={() => setEditing(false)} />
      ) : (
        <>
          <p className={s.text}>{question.text}</p>

          <div className={s.row}>
            <button className={`${s.btn} ${s.primary}`} onClick={onPush}>
              Push live
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
