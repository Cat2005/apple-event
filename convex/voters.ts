import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Called once per device on first visit. Deliberately not a heartbeat: a live
 * presence ticker would mean constant writes from 60 phones for a number that
 * flickers. A cumulative count only changes when someone new actually arrives.
 */
export const join = mutation({
  args: { voterId: v.string() },
  handler: async (ctx, { voterId }) => {
    const existing = await ctx.db
      .query("voters")
      .withIndex("by_voterId", (q) => q.eq("voterId", voterId))
      .unique();
    if (existing) return;
    await ctx.db.insert("voters", { voterId, joinedAt: Date.now() });
  },
});

export const count = query({
  args: {},
  handler: async (ctx) => (await ctx.db.query("voters").collect()).length,
});
