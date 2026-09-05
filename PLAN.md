# Apple Watch Party — Build Plan

Live prediction voting for the Apple Event livestream (Sept 9, YouTube video `39BalPDuTo0`).
~30–60 guests on their phones, one big screen, one admin (me/you).

**Constraints:** used once, for one night. Optimise for *reliability on the night* and
*speed of build*, not long-term maintainability. But keep files small and modular so we can
change things fast while building.

---

## 1. Three surfaces

| Route | Device | Purpose |
|---|---|---|
| `/` | guest phones | Join anonymously, vote, add options, see right/wrong |
| `/presenter` | the big screen | YouTube stream + live results + QR + idle logo screen |
| `/admin` | your phone or laptop | Question queue, push live, resolve, panic controls |

### Interaction model (Kahoot-style)
1. Presenter sits on the idle screen (bouncing logo + QR) while people arrive.
2. When the stream starts you switch to **Stream** — livestream up, rail holding on the QR.
3. You push a question live from admin → **every phone snaps to that question**.
4. People tap an option. Tapping a different one changes their vote — no confirm step.
5. Presenter bars update in real time as percentages.
6. Apple announces the real answer → you hit **Resolve** and pick the right option.
7. Correct option turns green, everything else greys out, voting locks.
8. Phones flash ✅ / ❌ and their private running tally ticks up.

---

## 2. Stack

- **Next.js (App Router)** — deployed on Vercel
- **Convex** — database + realtime subscriptions (new project, do **not** touch the existing `cards` projects)
- **CSS Modules** — one `.module.css` per component, no Tailwind
- **Self-hosted Inter** via `@fontsource-variable/inter` — no Google Fonts CDN call on the night
- **`qrcode`** npm, rendered in-page to SVG — no third-party QR service

> The only external network dependencies during the event are YouTube, Spotify, and Convex.
> Everything else is served from Vercel's edge.

---

## 3. Data model (Convex)

```ts
// event — single row, the global "what is on screen right now" state
event: {
  mode: "idle" | "stream",   // the stream and the question are independent
  activeQuestionId?: Id<"questions">,
  streamMode: "embed" | "dock",
  youtubeVideoId: string,      // "39BalPDuTo0"
  spotifyUrl?: string,
  joinUrl: string,             // encoded into the QR
}

// questions
questions: {
  kind: "choice" | "yesno" | "number",
  text: string,
  options: { id: string, label: string, guestAdded: boolean }[],  // empty for "number"
  allowGuestOptions: boolean,
  votingLocked: boolean,
  status: "draft" | "live" | "resolved",
  resolvedOptionId?: string | null,   // null = "none of these"
  resolvedNumber?: number,            // for kind: "number"
  order: number,
}

// votes — exactly one row per (question, voter), upserted on every change
votes: {
  questionId: Id<"questions">,
  voterId: string,
  optionId?: string,   // choice / yesno
  number?: number,     // number questions
  updatedAt: number,
}
  .index("by_question", ["questionId"])
  .index("by_question_voter", ["questionId", "voterId"])
  .index("by_voter", ["voterId"])

// voters — anonymous, one row per device, written once on first join
voters: { voterId: string, joinedAt: number }
  .index("by_voterId", ["voterId"])
```

`voterId` is a UUID generated on first visit and kept in `localStorage`. No names, no accounts,
no login. Refreshing or locking the phone keeps your identity and your votes.

### Two deliberate decisions for 60 concurrent phones

1. **Phones do not subscribe to live results.** They subscribe only to the active question and
   their own vote. If all 60 phones subscribed to the tally, every single vote would invalidate
   60 queries. Results live on the presenter screen only — which is also better as a party:
   you look *up* to see how the room is voting.
2. **No presence heartbeat.** A "who's currently online" ticker means constant writes from 60
   devices. Instead the idle screen shows a cumulative **"41 joined"**, which only changes when
   someone new arrives. Cheap, stable, and it's the number you actually want as a pre-flight check.

**Load test before anything else is polished:** run the sim at 60 voters and confirm we sit
comfortably inside the Convex free plan's limits. If we don't, we find out early and adjust.

---

## 4. Question types

### `choice` — multiple choice
Options list, tap one. Guests may add their own option (see below).
Resolve by picking an option, or **"none of these"** → everything greys out.

### `yesno`
Same machinery, fixed two options, different styling (big split Yes / No). Guest options disabled.

### `number` — closest guess
> "How many times will they say 'AI'?"

Phone shows a number input. Presenter shows a **number line**: one dot per guess, stacked where
they collide, with the median marked. On resolve you type the true number; the line snaps to
show it, the nearest dot(s) go green, and that device sees *"You were closest."*
Everyone else sees how far off they were.

### Guest-added options
- Appear **instantly** on all phones and the presenter — no approval queue.
- Deduped case-insensitively on trimmed text, so no three "Vision Pro 2"s.
- Capped: 40 characters, one addition per person per question, 8 options max per question.
- Admin can delete any option; deleting also clears the votes cast on it.

---

## 5. The presenter screen

### Stream mode

Three states, driven by two independent switches — `mode` controls the livestream,
`activeQuestionId` controls whether a question sits beside it:

| `mode` | Active question | Screen |
|---|---|---|
| `idle` | — | Bouncing logo, title, QR. Pre-event. |
| `stream` | none | Livestream + rail holding on the QR. Most of the keynote. |
| `stream` | set | Livestream + question and live results. |

**Take off screen** in admin drops the question but leaves the stream running.

### Question mode
```
┌──────────────────────────────────┬───────────────┐
│                                  │  ▓▓ QR  join  │
│     YouTube live embed           ├───────────────┤
│     (~68% width)                 │  Question     │
│                                  │  ▇▇▇▇▇▇ 62%   │
│                                  │  ▇▇▇ 28%      │
│                                  │  ▇ 10%        │
└──────────────────────────────────┴───────────────┘
```
**The divider is draggable.** Grab the line between the stream and the rail and pull; a
readout shows the pixel width while you drag, and the value is remembered in `localStorage`
on that machine so it survives a reload. Range 180–760 px, default 440. Arrow keys nudge it
by 20 px once the handle has focus. A full-screen shield appears during the drag — without it
the YouTube iframe swallows the pointer and the drag dies halfway across.

Everything inside the rail scales with its width via a `--rail-w` custom property — padding,
question size, bar type and the QR all shrink together, so a narrow rail reads as deliberate
rather than cramped. At the 180 px minimum the question is 19 px and the QR 64 px.

The stream iframe is pinned to **16:9** rather than filling its pane. Handing YouTube a box
taller than the video lets it scale its own artwork to fill — which the pre-stream countdown
does, and it reads as cropped. At a fixed 16:9 it cannot crop anything. Measured:

| Screen | Rail | Video |
|---|---|---|
| 1920 × 1080 | 440 (default) | 1480 × 833 |
| 1920 × 1080 | 380 | 1540 × 866 |
| 1920 × 1080 | 320 | 1600 × 900 |
| 1920 × 1080 | 180 (min) | 1740 × 979 |

- Bars animate with a spring so a shifting vote is visible from across the room.
- Vote count shown alongside the percentage.
- On resolve: correct bar → green, others → dim grey, a subtle flash.

### Dock mode (fallback)
Admin toggle collapses the stream pane. `/presenter` becomes a **tall standalone rail**, and
you snap YouTube left / browser right with `Win`+`←` / `Win`+`→`. Same components, responsive CSS.

> **Embeddability is confirmed** — video `39BalPDuTo0` ("Apple Event — September 9", Apple)
> renders fine in a third-party iframe. Dock mode is pure insurance.

### Idle mode
- Pixellated rainbow Apple logo (`public/apple-logo.png`, supplied by Cat and cropped to its
  artwork so it bounces off the real screen edges) drifting DVD-style on true black
- "Apple Watch Party" title
- Join QR + short URL
- Cumulative "N joined" ticker (never decrements — see §3)
- **Spotify dock:** invisible until you move the mouse into a screen corner, then a minimal
  play/pause slides in. Driven by Spotify's iFrame API, so pushing the first question can
  auto-pause the music.

⚠️ **Spotify embeds only play full tracks if that browser is logged into a Spotify Premium
account.** Otherwise every song is a 30-second preview. This is a pre-flight step, not a code
problem — see the run-of-show checklist.

### Reliability touches
- **Screen Wake Lock** so the display never sleeps mid-event
- **Connection dot** — a small indicator so you instantly know whether a freeze is the app or the venue wifi
- Presenter auto-recovers on reconnect (Convex does this natively; we just don't fight it)

---

## 6. The phone screen

- Same true-black palette so it doesn't blind anyone in a dark room
- **Optimistic vote updates** — the tap registers instantly even on bad wifi, then reconciles
- Idle state: "Waiting for the next question…" + your private tally *("You've called 5 of 7 right")*
- Post-resolve flash: ✅ / ❌ with what the answer was
- Add-option field inline under the options when enabled
- No scrolling, no chrome, one thumb

---

## 7. Admin

Responsive — write the questions on a laptop beforehand, drive the night from your phone.

- **Passphrase gate**, verified server-side in Convex against an env var (not just a secret URL —
  otherwise one curious guest resolves your questions for you). Passphrase cached in `localStorage`.
- **Question queue** — reorder, edit, duplicate, push live. Live question is pinned at the top.
- **Add a question mid-event** — big obvious button, works on the phone
- **Resolve** — pick the correct option, or "none of these", or type the true number
- **Live controls** — lock/unlock voting, delete a guest-added option
- **Event controls** — idle ↔ question, stream mode toggle, YouTube video ID, Spotify URL
- **Panic panel** — clear votes on a question, un-resolve, force-reload every connected client
- **Reset all votes** — inside Settings (deliberately: a mis-tap mid-event would wipe the night).
  Deletes every vote, zeroes the joined count, drops guest-added options, returns every question
  to unasked. The questions themselves survive.

---

## 8. File structure

Nothing over ~300 lines.

```
app/
  layout.tsx  providers.tsx  globals.css
  page.tsx                    → phone
  presenter/page.tsx
  admin/page.tsx
convex/
  schema.ts
  event.ts       mode, stream settings, singleton helpers
  questions.ts   CRUD, pushLive, resolve, lock
  votes.ts       castVote, results
  options.ts     addOption, deleteOption
  admin.ts       passphrase check
components/
  phone/      PhoneScreen · ChoiceVote · NumberVote · AddOption · ResultFlash · IdlePhone
  presenter/  PresenterScreen · StreamPane · VotingRail · QuestionCard · ResultBars ·
              NumberLine · IdleScreen · BouncingLogo · SpotifyDock · JoinQR
  admin/      AdminScreen · PassphraseGate · QuestionQueue · QuestionEditor ·
              LiveControls · EventControls · PanicPanel
  common/     ConnectionDot · Bar · Button
hooks/
  useVoterId · useWakeLock · useConnection · useLocalScore
styles/
  tokens.css   every colour, size and spacing value lives here
scripts/
  sim.ts       simulated voters
tests/
  *.test.ts    convex-test + vitest over the mutations
```

---

## 9. Design

Minimalist, Linear/Apple. True black, one accent, lots of negative space, no gradients.

```css
--bg:          #000000
--surface:     #0d0d0f
--border:      rgba(255,255,255,0.10)
--text:        #f5f5f7
--text-dim:    #86868b   /* Apple grey */
--accent:      #30d158   /* correct */
--eliminated:  #3a3a3c   /* greyed-out options */
```

- **Inter Variable**, self-hosted. (SF Pro isn't on Windows, so Inter is what actually renders —
  which is the point of choosing it.)
- Presenter type is big: question at 44–56px so it reads across a room.
- The only motion is bars springing and the logo bouncing. Nothing else moves.

---

## 10. Testing

### Simulated voters
```bash
npx tsx scripts/sim.ts --voters 60
```
Spawns N real Convex clients that join, vote, change their minds, and add options on random
delays. Open `/presenter` and watch it move. Scenarios:

| Scenario | What it proves |
|---|---|
| `--voters 3` | The basic case — three people vote, presenter updates live |
| `--voters 60 --scenario stampede` | 60 phones joining at once, mid-question |
| `--scenario flapping` | People rapidly changing votes — no double-counting, no flicker |
| `--scenario chaos` | Votes + option adds + deletes interleaved |

### Unit tests
`convex-test` + vitest over the mutations: vote upsert never double-counts, resolve locks
voting, dedupe works, deleting an option clears its votes, percentages always sum to 100.

### Run-of-show checklist (printed, followed in order on the night)
1. Log into **Spotify Premium** in the event browser
2. Open `/presenter`, press `F11`
3. Confirm the YouTube embed plays — **click once to unmute** (browsers block unmuted autoplay)
4. Drag the divider until the picture and the rail both look right on the TV
5. Open `/control/<token>` on your phone
6. Scan the QR yourself and cast a test vote
7. **Settings → Reset all votes** to clear the test
8. Switch to **Stream** as the keynote starts
9. Watch the "N joined" ticker as people arrive
10. Push Q1

---

## 11. Build order

Not scheduled — just the order things have to happen in. Each step ends somewhere shippable.

- [x] **Scaffold** — Next.js + Convex project `apple-watch-party`, tokens, self-hosted Inter
- [x] **Core loop** — schema, phone voting, presenter bars, admin push/resolve
- [x] **Load test** — 60 simultaneous clients, all voted, presenter kept up
- [x] **Event shell** — bouncing logo, QR, YouTube embed, dock toggle, Spotify dock, wake lock
- [x] **Question types** — choice, Yes/No, closest-number + number line
- [x] **Panic controls** — reload everyone, clear votes, un-resolve, `setup:reset`
- [ ] **Deploy to Vercel** and point the QR at the real URL
- [ ] **Optimistic phone updates** verified on a throttled connection
- [ ] **Dress rehearsal** on the actual Windows machine + TV
- [ ] **More questions**

---

## 12. Running it

```bash
npm run dev                                   # http://localhost:3000
npx tsx scripts/sim.ts --voters 8             # fake guests, follows whatever you push
npx tsx scripts/sim.ts --voters 60 --scenario stampede
npx convex run setup:reset '{"token":"<ADMIN_TOKEN>"}'   # wipe votes before guests arrive
```

| Surface | URL |
|---|---|
| Phone | `/` |
| Presenter | `/presenter` |
| Admin | `/control/<ADMIN_TOKEN>` |

`ADMIN_TOKEN` lives in `.env.local` and on the Convex deployment. Convex project
`apple-watch-party`, dev deployment `valuable-lion-455`.

**Event start: 9 September, 18:00** (confirmed off the YouTube stream page).

---

## 13. Open questions

- **URL** — plain `something.vercel.app`, or a domain? It's in the QR, so shorter is better.
- **Spotify playlist link** — one field in admin Settings.
- **More questions** — six is a thin evening; a dozen makes it flow.
