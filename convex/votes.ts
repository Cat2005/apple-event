import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { canVote, requireQuestion, votesForQuestion } from "./lib";

export const cast = mutation({
  args: {
    voterId: v.string(),
    questionId: v.id("questions"),
    optionId: v.optional(v.string()),
    number: v.optional(v.number()),
  },
  handler: async (ctx, { voterId, questionId, optionId, number }) => {
    const question = await requireQuestion(ctx, questionId);
    if (!canVote(question)) return; // locked or resolved — silently ignore, never error at a guest

    if (question.kind === "number") {
      if (number === undefined || !Number.isFinite(number)) throw new Error("Need a number");
    } else if (!question.options.some((o) => o.id === optionId)) {
      return; // option was deleted out from under them
    }

    const existing = await ctx.db
      .query("votes")
      .withIndex("by_question_voter", (q) => q.eq("questionId", questionId).eq("voterId", voterId))
      .unique();

    const fields = { optionId, number, updatedAt: Date.now() };
    if (existing) await ctx.db.patch(existing._id, fields);
    else await ctx.db.insert("votes", { questionId, voterId, ...fields });
  },
});

/**
 * Everything this device has voted on. One subscription per phone that only
 * re-fires on that phone's own writes — cheaper than a per-question query and
 * it powers the browse sheet as well as the live question.
 */
export const mine = query({
  args: { voterId: v.string() },
  handler: async (ctx, { voterId }) =>
    await ctx.db
      .query("votes")
      .withIndex("by_voter", (q) => q.eq("voterId", voterId))
      .collect(),
});

/** Presenter only. Phones never subscribe to this — see PLAN.md §3. */
export const results = query({
  args: { questionId: v.optional(v.id("questions")) },
  handler: async (ctx, { questionId }) => {
    if (!questionId) return null;
    const votes = await votesForQuestion(ctx, questionId);
    const counts: Record<string, number> = {};
    const numbers: number[] = [];
    for (const vote of votes) {
      if (vote.optionId) counts[vote.optionId] = (counts[vote.optionId] ?? 0) + 1;
      if (vote.number !== undefined) numbers.push(vote.number);
    }
    numbers.sort((a, b) => a - b);
    return { total: votes.length, counts, numbers };
  },
});

/** A device's own private tally. No names, no leaderboard, no one else sees it. */
export const myScore = query({
  args: { voterId: v.string() },
  handler: async (ctx, { voterId }) => {
    const votes = await ctx.db
      .query("votes")
      .withIndex("by_voter", (q) => q.eq("voterId", voterId))
      .collect();

    let correct = 0;
    let resolved = 0;
    for (const vote of votes) {
      const question = await ctx.db.get(vote.questionId);
      if (!question || question.status !== "resolved") continue;
      resolved++;
      if (question.kind === "number") {
        const others = await votesForQuestion(ctx, question._id);
        if (isClosest(vote.number, question.resolvedNumber, others)) correct++;
      } else if (vote.optionId === question.resolvedOptionId) {
        correct++;
      }
    }
    return { correct, resolved };
  },
});

function isClosest(
  guess: number | undefined,
  answer: number | undefined,
  all: { number?: number }[],
) {
  if (guess === undefined || answer === undefined) return false;
  const best = Math.min(
    ...all.filter((v) => v.number !== undefined).map((v) => Math.abs(v.number! - answer)),
  );
  return Math.abs(guess - answer) === best;
}
