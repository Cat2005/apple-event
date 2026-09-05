import { Doc, Id } from "./_generated/dataModel";
import { MutationCtx, QueryCtx } from "./_generated/server";

export const MAX_OPTIONS = 8;
export const MAX_LABEL_LENGTH = 40;

export async function getEvent(ctx: QueryCtx | MutationCtx) {
  return await ctx.db.query("event").first();
}

export async function requireEvent(ctx: MutationCtx) {
  const event = await getEvent(ctx);
  if (!event) throw new Error("Not initialised — run `npx convex run setup:init`");
  return event;
}

/**
 * The admin surface lives at a secret path. The same token gates every write
 * from that surface, checked here on the server so guessing the URL isn't enough.
 */
export function isAdmin(token: string) {
  return Boolean(process.env.ADMIN_TOKEN) && token === process.env.ADMIN_TOKEN;
}

export function requireAdmin(token: string) {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) throw new Error("ADMIN_TOKEN is not set on this Convex deployment");
  if (token !== expected) throw new Error("Not authorised");
}

export async function requireQuestion(ctx: QueryCtx | MutationCtx, id: Doc<"questions">["_id"]) {
  const question = await ctx.db.get(id);
  if (!question) throw new Error("No such question");
  return question;
}

export function canVote(question: Doc<"questions">) {
  return question.status !== "resolved" && !question.votingLocked;
}

/** Avoids crypto in mutations; unique within a question because mutations serialise. */
export function nextOptionId(existing: Doc<"questions">["options"]) {
  return `o${existing.length}-${Date.now().toString(36)}`;
}

export function tidyLabel(label: string) {
  return label.trim().replace(/\s+/g, " ").slice(0, MAX_LABEL_LENGTH);
}

export function labelKey(label: string) {
  return tidyLabel(label).toLowerCase();
}

export async function votesForQuestion(ctx: QueryCtx | MutationCtx, questionId: Id<"questions">) {
  return await ctx.db
    .query("votes")
    .withIndex("by_question", (q) => q.eq("questionId", questionId))
    .collect();
}
