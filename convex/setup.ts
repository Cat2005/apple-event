import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { getEvent, requireAdmin } from "./lib";

const SEED_QUESTIONS = [
  {
    kind: "choice" as const,
    text: "What will Apple call the foldable iPhone?",
    labels: ["iPhone Fold", "iPhone Flip", "iPhone Ultra", "iPhone X Fold"],
    allowGuestOptions: true,
  },
  {
    kind: "yesno" as const,
    text: "Will Apple announce a brand-new product category?",
    labels: ["Yes", "No"],
    allowGuestOptions: false,
  },
  {
    kind: "choice" as const,
    text: "Will the foldable iPhone have Face ID or Touch ID?",
    labels: ["Face ID", "Touch ID", "Both"],
    allowGuestOptions: false,
  },
  {
    kind: "number" as const,
    text: "How much will the iPhone 18 Pro cost?",
    labels: [],
    prefix: "$",
    allowGuestOptions: false,
  },
  {
    kind: "number" as const,
    text: "How much will the foldable iPhone cost?",
    labels: [],
    prefix: "$",
    allowGuestOptions: false,
  },
  {
    kind: "number" as const,
    text: "How many times will John Ternus say “AI”?",
    labels: [],
    suffix: "times",
    allowGuestOptions: false,
  },
];

/** Idempotent. Safe to re-run; it won't duplicate anything. */
export const init = mutation({
  args: { joinUrl: v.optional(v.string()) },
  handler: async (ctx, { joinUrl }) => {
    const existing = await getEvent(ctx);
    if (!existing) {
      await ctx.db.insert("event", {
        mode: "idle",
        streamMode: "embed",
        youtubeVideoId: "39BalPDuTo0",
        joinUrl: joinUrl ?? "http://localhost:3000",
        reloadNonce: 0,
      });
    } else if (joinUrl) {
      await ctx.db.patch(existing._id, { joinUrl });
    }

    const already = await ctx.db.query("questions").collect();
    if (already.length > 0) return { event: "ok", questions: already.length };

    let order = 1;
    for (const q of SEED_QUESTIONS) {
      await ctx.db.insert("questions", {
        kind: q.kind,
        text: q.text,
        options: q.labels.map((label, i) => ({ id: `o${i}`, label })),
        prefix: "prefix" in q ? q.prefix : undefined,
        suffix: "suffix" in q ? q.suffix : undefined,
        allowGuestOptions: q.allowGuestOptions,
        votingLocked: false,
        status: "draft",
        order: order++,
      });
    }
    return { event: "created", questions: SEED_QUESTIONS.length };
  },
});

/**
 * Wipes every vote and every joined device, and puts all questions back to
 * "draft". Run it after a rehearsal, right before guests arrive.
 */
export const reset = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    requireAdmin(token);

    for (const vote of await ctx.db.query("votes").collect()) await ctx.db.delete(vote._id);
    for (const voter of await ctx.db.query("voters").collect()) await ctx.db.delete(voter._id);

    for (const question of await ctx.db.query("questions").collect()) {
      await ctx.db.patch(question._id, {
        status: "draft",
        votingLocked: false,
        resolvedOptionId: undefined,
        resolvedNumber: undefined,
        resolvedLabel: undefined,
        options: question.options.filter((o) => !o.addedBy), // drop guest additions
      });
    }

    const event = await getEvent(ctx);
    if (event) await ctx.db.patch(event._id, { mode: "idle", activeQuestionId: undefined });

    return "reset";
  },
});
