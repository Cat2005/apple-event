import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getEvent, isAdmin, requireAdmin, requireEvent, requireQuestion, votesForQuestion } from "./lib";

const kind = v.union(v.literal("choice"), v.literal("yesno"), v.literal("number"));

/** What every phone subscribes to. Deliberately excludes the tally. */
export const active = query({
  args: {},
  handler: async (ctx) => {
    const event = await getEvent(ctx);
    if (!event?.activeQuestionId) return null;
    return await ctx.db.get(event.activeQuestionId);
  },
});

/**
 * Every question, for the phone's browse sheet. Guests can vote on any of them
 * at any time; resolved ones come back locked. Small payload (a dozen rows) and
 * it only re-fires when a question actually changes.
 */
export const all = query({
  args: {},
  handler: async (ctx) => await ctx.db.query("questions").withIndex("by_order").collect(),
});

export const list = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    // Fails soft: a wrong link gets an empty result, not a crashed page.
    if (!isAdmin(token)) return null;
    return await ctx.db.query("questions").withIndex("by_order").collect();
  },
});

export const create = mutation({
  args: {
    token: v.string(),
    kind,
    text: v.string(),
    options: v.optional(v.array(v.string())),
    prefix: v.optional(v.string()),
    suffix: v.optional(v.string()),
    allowGuestOptions: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    requireAdmin(args.token);
    const last = await ctx.db.query("questions").withIndex("by_order").order("desc").first();
    const labels = args.kind === "yesno" ? ["Yes", "No"] : (args.options ?? []);
    return await ctx.db.insert("questions", {
      kind: args.kind,
      text: args.text,
      options: args.kind === "number" ? [] : labels.map((label, i) => ({ id: `o${i}`, label })),
      prefix: args.prefix,
      suffix: args.suffix,
      allowGuestOptions: args.kind === "choice" && (args.allowGuestOptions ?? false),
      votingLocked: false,
      status: "draft",
      order: (last?.order ?? 0) + 1,
    });
  },
});

export const update = mutation({
  args: {
    token: v.string(),
    questionId: v.id("questions"),
    text: v.optional(v.string()),
    prefix: v.optional(v.string()),
    suffix: v.optional(v.string()),
    allowGuestOptions: v.optional(v.boolean()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, { token, questionId, ...fields }) => {
    requireAdmin(token);
    await requireQuestion(ctx, questionId);
    const patch = Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== undefined));
    await ctx.db.patch(questionId, patch);
  },
});

export const remove = mutation({
  args: { token: v.string(), questionId: v.id("questions") },
  handler: async (ctx, { token, questionId }) => {
    requireAdmin(token);
    const event = await requireEvent(ctx);
    if (event.activeQuestionId === questionId) {
      await ctx.db.patch(event._id, { activeQuestionId: undefined });
    }
    for (const vote of await votesForQuestion(ctx, questionId)) await ctx.db.delete(vote._id);
    await ctx.db.delete(questionId);
  },
});

/**
 * Put a question on the big screen. Re-pushing a locked or resolved question is
 * intentional: it's how a long-running question (e.g. "how many times will he
 * say AI") comes back at the end of the night for its reveal.
 */
export const pushLive = mutation({
  args: { token: v.string(), questionId: v.id("questions") },
  handler: async (ctx, { token, questionId }) => {
    requireAdmin(token);
    const event = await requireEvent(ctx);
    const question = await requireQuestion(ctx, questionId);
    if (question.status === "draft") await ctx.db.patch(questionId, { status: "live" });
    await ctx.db.patch(event._id, { activeQuestionId: questionId, mode: "stream" });
  },
});

export const setLocked = mutation({
  args: { token: v.string(), questionId: v.id("questions"), locked: v.boolean() },
  handler: async (ctx, { token, questionId, locked }) => {
    requireAdmin(token);
    await requireQuestion(ctx, questionId);
    await ctx.db.patch(questionId, { votingLocked: locked });
  },
});

/** Works whether or not the question is currently on screen. */
export const resolve = mutation({
  args: {
    token: v.string(),
    questionId: v.id("questions"),
    optionId: v.optional(v.union(v.string(), v.null())),
    number: v.optional(v.number()),
  },
  handler: async (ctx, { token, questionId, optionId, number }) => {
    requireAdmin(token);
    const question = await requireQuestion(ctx, questionId);
    if (question.kind === "number") {
      if (number === undefined) throw new Error("A number question needs a number to resolve");
      await ctx.db.patch(questionId, { status: "resolved", votingLocked: true, resolvedNumber: number });
      return;
    }
    if (optionId === undefined) throw new Error("Pick an option, or null for 'none of these'");
    if (optionId !== null && !question.options.some((o) => o.id === optionId)) {
      throw new Error("That option is not on this question");
    }
    await ctx.db.patch(questionId, { status: "resolved", votingLocked: true, resolvedOptionId: optionId });
  },
});

export const unresolve = mutation({
  args: { token: v.string(), questionId: v.id("questions") },
  handler: async (ctx, { token, questionId }) => {
    requireAdmin(token);
    await requireQuestion(ctx, questionId);
    await ctx.db.patch(questionId, {
      status: "live",
      votingLocked: false,
      resolvedOptionId: undefined,
      resolvedNumber: undefined,
    });
  },
});

export const clearVotes = mutation({
  args: { token: v.string(), questionId: v.id("questions") },
  handler: async (ctx, { token, questionId }) => {
    requireAdmin(token);
    for (const vote of await votesForQuestion(ctx, questionId)) await ctx.db.delete(vote._id);
  },
});
