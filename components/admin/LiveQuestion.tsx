"use client";

import { useMutation } from "convex/react";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import s from "./adminControls.module.css";

type Props = {
  token: string;
  question: Doc<"questions">;
  total: number;
  counts: Record<string, number>;
};

export function LiveQuestion({ token, question, total, counts }: Props) {
  const resolve = useMutation(api.questions.resolve);
  const unresolve = useMutation(api.questions.unresolve);
  const setLocked = useMutation(api.questions.setLocked);
  const clearVotes = useMutation(api.questions.clearVotes);
  const removeOption = useMutation(api.options.remove);
  const clearQuestion = useMutation(api.event.clearQuestion);
  const [answer, setAnswer] = useState("");
  const [otherOpen, setOtherOpen] = useState(false);
  const [otherLabel, setOtherLabel] = useState("");

  const resolved = question.status === "resolved";

  return (
    <section className={`${s.card} ${s.live}`}>
      <div className={s.spread}>
        <span className={s.kicker}>On screen</span>
        <span className={s.meta}>
          {total} {total === 1 ? "vote" : "votes"}
        </span>
      </div>

      <p className={s.text}>{question.text}</p>

      {question.kind === "number" ? (
        <div className={s.row}>
          <input
            className={s.input}
            type="number"
            inputMode="decimal"
            placeholder={`Actual answer${question.prefix ? ` (${question.prefix})` : ""}`}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
          />
          <button
            className={`${s.btn} ${s.good}`}
            disabled={answer.trim() === ""}
            onClick={() => void resolve({ token, questionId: question._id, number: Number(answer) })}
          >
            Resolve
          </button>
        </div>
      ) : (
        <div className={s.row}>
          {question.options.map((option) => (
            <span key={option.id} className={s.row}>
              <button
                className={
                  resolved && question.resolvedOptionId === option.id ? `${s.btn} ${s.good}` : s.btn
                }
                onClick={() => void resolve({ token, questionId: question._id, optionId: option.id })}
              >
                {option.label} · {counts[option.id] ?? 0}
              </button>
              {option.addedBy && (
                <button
                  className={`${s.btn} ${s.bad}`}
                  title="Delete this guest-added option"
                  onClick={() =>
                    void removeOption({ token, questionId: question._id, optionId: option.id })
                  }
                >
                  ×
                </button>
              )}
            </span>
          ))}
          {otherOpen ? (
            <>
              <input
                className={s.input}
                autoFocus
                placeholder="What was it actually?"
                value={otherLabel}
                onChange={(e) => setOtherLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && otherLabel.trim()) {
                    void resolve({
                      token,
                      questionId: question._id,
                      optionId: null,
                      label: otherLabel,
                    });
                    setOtherOpen(false);
                  }
                }}
              />
              <button
                className={`${s.btn} ${s.good}`}
                onClick={() => {
                  void resolve({
                    token,
                    questionId: question._id,
                    optionId: null,
                    label: otherLabel,
                  });
                  setOtherOpen(false);
                }}
              >
                Resolve
              </button>
              <button className={s.btn} onClick={() => setOtherOpen(false)}>
                Cancel
              </button>
            </>
          ) : (
            <button className={s.btn} onClick={() => setOtherOpen(true)}>
              None of these
            </button>
          )}
        </div>
      )}

      <div className={s.row}>
        <button
          className={question.votingLocked ? `${s.btn} ${s.on}` : s.btn}
          onClick={() =>
            void setLocked({ token, questionId: question._id, locked: !question.votingLocked })
          }
        >
          {question.votingLocked ? "Voting locked" : "Lock voting"}
        </button>
        {resolved && (
          <button className={s.btn} onClick={() => void unresolve({ token, questionId: question._id })}>
            Un-resolve
          </button>
        )}
        <button className={s.btn} onClick={() => void clearQuestion({ token })}>
          Take off screen
        </button>
        <button
          className={`${s.btn} ${s.bad}`}
          onClick={() => {
            if (confirm("Delete every vote on this question?")) {
              void clearVotes({ token, questionId: question._id });
            }
          }}
        >
          Clear votes
        </button>
      </div>
    </section>
  );
}
