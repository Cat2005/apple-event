/**
 * Simulated guests. Each one is a real Convex websocket client, so this is both
 * a behaviour test and a genuine load test.
 *
 *   npx tsx scripts/sim.ts --voters 8
 *   npx tsx scripts/sim.ts --voters 60 --scenario stampede
 *
 * Scenarios:
 *   normal    join over ~8s, vote once, some change their minds   (default)
 *   stampede  everyone joins and votes at once
 *   flapping  everyone changes their vote every second or two
 *   chaos     flapping + guests adding their own options
 *
 * Leave it running and push questions from the admin panel — the sims follow along.
 */
import { readFileSync } from "fs";
import { ConvexClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import type { Doc } from "../convex/_generated/dataModel";

type Scenario = "normal" | "stampede" | "flapping" | "chaos";

const args = process.argv.slice(2);
const flag = (name: string) => {
  const i = args.indexOf(name);
  return i === -1 ? undefined : args[i + 1];
};

const VOTERS = Number(flag("--voters") ?? 8);
const SCENARIO = (flag("--scenario") ?? "normal") as Scenario;
const RUN = Math.random().toString(36).slice(2, 7);

const GUEST_OPTIONS = [
  "iPhone Bendy", "iPhone Origami", "iPhone Clamshell", "iPhone Fold Pro",
  "iPhone Duo", "The Fold", "iPhone Air Fold", "iFold",
];

const CONVEX_URL = readEnv("NEXT_PUBLIC_CONVEX_URL");

function readEnv(key: string) {
  const raw = readFileSync(".env.local", "utf8");
  const line = raw.split("\n").find((l) => l.startsWith(`${key}=`));
  if (!line) throw new Error(`${key} missing from .env.local`);
  return line.slice(key.length + 1).trim();
}

const rand = (min: number, max: number) => min + Math.random() * (max - min);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const pick = <T,>(items: T[]) => items[Math.floor(Math.random() * items.length)];

function guessFor(question: Doc<"questions">) {
  if (question.prefix === "$") return Math.round(rand(699, 2599) / 50) * 50 - 1;
  return Math.round(rand(0, 30));
}

async function voter(index: number) {
  const client = new ConvexClient(CONVEX_URL);
  const voterId = `sim-${RUN}-${index}`;

  if (SCENARIO !== "stampede") await sleep(rand(0, 8000));
  await client.mutation(api.voters.join, { voterId });

  let currentId: string | null = null;
  let busy = false;

  client.onUpdate(api.questions.active, {}, (question) => {
    if (!question || question._id === currentId) return;
    currentId = question._id;
    if (busy) return;
    busy = true;
    void participate(client, voterId, question, index).finally(() => {
      busy = false;
    });
  });

  return client;
}

async function participate(
  client: ConvexClient,
  voterId: string,
  question: Doc<"questions">,
  index: number,
) {
  const startedOn = question._id;

  if (SCENARIO !== "stampede") await sleep(rand(600, 5200));
  await cast(client, voterId, question);

  if (SCENARIO === "chaos" && question.allowGuestOptions && Math.random() < 0.25) {
    await sleep(rand(1000, 4000));
    try {
      await client.mutation(api.options.add, {
        voterId,
        questionId: question._id,
        label: pick(GUEST_OPTIONS),
      });
      log(`voter ${index} added an option`);
    } catch {
      // Hit a cap or a duplicate — exactly what the caps are for.
    }
  }

  const changes = SCENARIO === "flapping" || SCENARIO === "chaos" ? 8 : Math.random() < 0.35 ? 2 : 0;
  for (let i = 0; i < changes; i++) {
    await sleep(rand(900, 3500));
    const latest = await client.query(api.questions.active, {});
    if (!latest || latest._id !== startedOn) return; // moved on to a new question
    await cast(client, voterId, latest);
  }
}

async function cast(client: ConvexClient, voterId: string, question: Doc<"questions">) {
  if (question.kind === "number") {
    await client.mutation(api.votes.cast, {
      voterId,
      questionId: question._id,
      number: guessFor(question),
    });
  } else if (question.options.length > 0) {
    await client.mutation(api.votes.cast, {
      voterId,
      questionId: question._id,
      optionId: pick(question.options).id,
    });
  }
}

function log(message: string) {
  process.stdout.write(`${new Date().toLocaleTimeString()}  ${message}\n`);
}

async function main() {
  log(`${VOTERS} simulated guests · scenario "${SCENARIO}" · ${CONVEX_URL}`);
  const clients = await Promise.all(
    Array.from({ length: VOTERS }, (_, i) => voter(i)),
  );
  log(`all ${clients.length} connected — push a question from the admin panel`);

  const shutdown = async () => {
    log("closing…");
    await Promise.all(clients.map((c) => c.close()));
    process.exit(0);
  };
  process.on("SIGINT", () => void shutdown());
}

void main();
