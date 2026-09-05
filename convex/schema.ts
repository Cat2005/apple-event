import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const option = v.object({
  id: v.string(),
  label: v.string(),
  addedBy: v.optional(v.string()), // set = a guest added it
});

export default defineSchema({
  // Single row. The global "what is on screen right now" state.
  event: defineTable({
    // "idle" = bouncing logo, pre-event. "stream" = livestream on screen; whether a
    // question sits beside it depends on activeQuestionId, which is independent.
    mode: v.union(v.literal("idle"), v.literal("stream")),
    activeQuestionId: v.optional(v.id("questions")),
    streamMode: v.union(v.literal("embed"), v.literal("dock")),
    youtubeVideoId: v.string(),
    spotifyUrl: v.optional(v.string()),
    joinUrl: v.string(),
    reloadNonce: v.number(), // bump to force every client to refresh
  }),

  questions: defineTable({
    kind: v.union(v.literal("choice"), v.literal("yesno"), v.literal("number")),
    text: v.string(),
    options: v.array(option), // empty for "number"
    prefix: v.optional(v.string()), // "$"
    suffix: v.optional(v.string()), // "times"
    allowGuestOptions: v.boolean(),
    votingLocked: v.boolean(),
    status: v.union(v.literal("draft"), v.literal("live"), v.literal("resolved")),
    resolvedOptionId: v.optional(v.union(v.string(), v.null())), // null = "none of these"
    resolvedLabel: v.optional(v.string()), // what it actually was, when no option matched
    resolvedNumber: v.optional(v.number()),
    order: v.number(),
  }).index("by_order", ["order"]),

  // Exactly one row per (question, voter). Upserted on every change of mind.
  votes: defineTable({
    questionId: v.id("questions"),
    voterId: v.string(),
    optionId: v.optional(v.string()),
    number: v.optional(v.number()),
    updatedAt: v.number(),
  })
    .index("by_question", ["questionId"])
    .index("by_question_voter", ["questionId", "voterId"])
    .index("by_voter", ["voterId"]),

  // Anonymous. One row per device, written once on first join.
  voters: defineTable({
    voterId: v.string(),
    joinedAt: v.number(),
  }).index("by_voterId", ["voterId"]),
});
