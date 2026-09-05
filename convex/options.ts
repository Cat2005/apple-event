import { v } from "convex/values";
import { mutation } from "./_generated/server";
import {
  MAX_LABEL_LENGTH,
  MAX_OPTIONS,
  canVote,
  labelKey,
  nextOptionId,
  requireAdmin,
  requireQuestion,
  tidyLabel,
  votesForQuestion,
} from "./lib";

/**
 * Guest-added options appear instantly — no approval queue. Guarded by caps
 * rather than moderation so the screen can't be flooded: one per person per
 * question, 8 options total, 40 characters, deduped case-insensitively.
 */
export const add = mutation({
  args: { voterId: v.string(), questionId: v.id("questions"), label: v.string() },
  handler: async (ctx, { voterId, questionId, label }) => {
    const question = await requireQuestion(ctx, questionId);
    if (!question.allowGuestOptions || !canVote(question)) return;

    const tidied = tidyLabel(label);
    if (!tidied) throw new Error("Type something first");
    if (label.trim().length > MAX_LABEL_LENGTH) {
      throw new Error(`Keep it under ${MAX_LABEL_LENGTH} characters`);
    }
    if (question.options.length >= MAX_OPTIONS) throw new Error("This question is full");
    if (question.options.some((o) => labelKey(o.label) === labelKey(tidied))) {
      throw new Error("That's already on the list");
    }
    if (question.options.some((o) => o.addedBy === voterId)) {
      throw new Error("You've already added one to this question");
    }

    const id = nextOptionId(question.options);
    await ctx.db.patch(questionId, {
      options: [...question.options, { id, label: tidied, addedBy: voterId }],
    });
    return id;
  },
});

/** Fix a label without disturbing the votes already cast on it. */
export const rename = mutation({
  args: {
    token: v.string(),
    questionId: v.id("questions"),
    optionId: v.string(),
    label: v.string(),
  },
  handler: async (ctx, { token, questionId, optionId, label }) => {
    requireAdmin(token);
    const question = await requireQuestion(ctx, questionId);
    const tidied = tidyLabel(label);
    if (!tidied) throw new Error("Give it a label");
    await ctx.db.patch(questionId, {
      options: question.options.map((o) => (o.id === optionId ? { ...o, label: tidied } : o)),
    });
  },
});

/** Deleting an option also clears every vote cast on it. */
export const remove = mutation({
  args: { token: v.string(), questionId: v.id("questions"), optionId: v.string() },
  handler: async (ctx, { token, questionId, optionId }) => {
    requireAdmin(token);
    const question = await requireQuestion(ctx, questionId);
    await ctx.db.patch(questionId, {
      options: question.options.filter((o) => o.id !== optionId),
    });
    for (const vote of await votesForQuestion(ctx, questionId)) {
      if (vote.optionId === optionId) await ctx.db.delete(vote._id);
    }
  },
});
