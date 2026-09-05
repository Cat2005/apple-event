"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";

/**
 * Casting a vote, with the phone updating before the server answers — a tap has
 * to feel instant on venue wifi. Convex rolls the optimistic value back on its
 * own if the mutation is rejected.
 */
export function useCastVote() {
  return useMutation(api.votes.cast).withOptimisticUpdate((store, args) => {
    const key = { voterId: args.voterId };
    const current = store.getQuery(api.votes.mine, key);
    if (current === undefined) return;

    const existing = current.find((vote) => vote.questionId === args.questionId);
    const updated: Doc<"votes"> = {
      _id: existing?._id ?? (`optimistic-${args.questionId}` as Doc<"votes">["_id"]),
      _creationTime: existing?._creationTime ?? Date.now(),
      questionId: args.questionId,
      voterId: args.voterId,
      optionId: args.optionId,
      number: args.number,
      updatedAt: Date.now(),
    };

    store.setQuery(api.votes.mine, key, [
      ...current.filter((vote) => vote.questionId !== args.questionId),
      updated,
    ]);
  });
}
