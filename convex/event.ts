import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getEvent, requireAdmin, requireEvent } from "./lib";

export const get = query({
  args: {},
  handler: async (ctx) => await getEvent(ctx),
});

export const setMode = mutation({
  args: { token: v.string(), mode: v.union(v.literal("idle"), v.literal("stream")) },
  handler: async (ctx, { token, mode }) => {
    requireAdmin(token);
    const event = await requireEvent(ctx);
    await ctx.db.patch(event._id, { mode });
  },
});

export const setStreamMode = mutation({
  args: { token: v.string(), streamMode: v.union(v.literal("embed"), v.literal("dock")) },
  handler: async (ctx, { token, streamMode }) => {
    requireAdmin(token);
    const event = await requireEvent(ctx);
    await ctx.db.patch(event._id, { streamMode });
  },
});

export const setSettings = mutation({
  args: {
    token: v.string(),
    youtubeVideoId: v.optional(v.string()),
    spotifyUrl: v.optional(v.string()),
    joinUrl: v.optional(v.string()),
  },
  handler: async (ctx, { token, ...settings }) => {
    requireAdmin(token);
    const event = await requireEvent(ctx);
    const patch = Object.fromEntries(
      Object.entries(settings).filter(([, value]) => value !== undefined),
    );
    await ctx.db.patch(event._id, patch);
  },
});

/** Take the question off screen but leave the stream up. */
export const clearQuestion = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    requireAdmin(token);
    const event = await requireEvent(ctx);
    await ctx.db.patch(event._id, { activeQuestionId: undefined });
  },
});

/** Panic button: every connected client watches this and reloads when it changes. */
export const forceReload = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    requireAdmin(token);
    const event = await requireEvent(ctx);
    await ctx.db.patch(event._id, { reloadNonce: event.reloadNonce + 1 });
  },
});
