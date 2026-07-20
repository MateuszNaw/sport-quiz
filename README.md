# SportIQ

### Sports trivia built for tournament prep — infinite by design

**SportIQ** is a fast, competitive sports quiz for fans who want to sharpen their knowledge before a tournament — or settle the score with friends. Every round feels different: pick from three randomly drawn sports, face six question formats, and climb through three difficulty tiers.

Built with Sportradar-grade sports DNA. **AI generates fresh questions on demand**, so the quiz never runs out — endless mode can go forever.

---

## Infinite questions, forever

SportIQ is not a fixed deck you eventually memorize. With an Anthropic API key configured, every request can mint a **new, validated question** live:

- **Endless mode** — Play until *you* stop. There is no last question.
- **AI as the primary source** — Claude generates sport-specific trivia calibrated to easy / medium / hard.
- **Curated bank as backup** — Seeded packs in MongoDB keep the app playable offline or if the API is unavailable.
- **Anti-repeat memory** — Recent prompts and in-session questions are excluded, so long sessions stay novel.

Train for hours before a tournament final. Host an all-night league night. The question supply does not cap out.

---

## Why SportIQ

Tournament week is chaos — fixtures, form, history, and hot takes everywhere. SportIQ turns that noise into deliberate practice:

| Goal | How SportIQ helps |
| --- | --- |
| **Warm up before match day** | Daily challenge — the same 10 questions for everyone, every UTC day |
| **Train like a specialist** | Easy → Medium → Hard, with points that reward deeper knowledge |
| **Stay sharp across sports** | Nine sports in rotation so you’re never stuck in one bubble |
| **Compete with your crew** | Private leagues, leaderboards, and shareable head-to-head challenges |
| **Never run out of material** | Endless mode + AI generation — questions for as long as you play |

---

## Features

### Play your way

- **Category draw** — Before every question, choose from **3 randomly offered sports** (out of nine).
- **Six formats** — Multiple choice, true/false, guess the score, guess the player (progressive clues), timeline ordering, and prediction scenarios.
- **Three difficulties** — Easy (100 pts), Medium (200 pts), Hard (300 pts).
- **Modes** — Classic 10-question rounds, **Today’s daily challenge**, and **Endless** (AI keeps dealing forever).
- **Head-to-head challenges** — Share a link after a round and dare someone to beat your score.

### Compete & progress

- **Accounts & profiles** — Sign up, track history, set favorite sport / club / player.
- **XP & levels** — Career score feeds progression so every correct answer counts.
- **Achievements** — Milestones for streaks, sport expertise, perfect rounds, and more.
- **Global leaderboard** — See who sits at the top this week and all-time.
- **Private leagues** — Create a league, share a join code, react and comment on the board.

### Fair scoring

- Streak bonus (+10% per consecutive correct, up to +50%)
- Partial credit for close score guesses, timeline positions, and fewer revealed player clues
- Speed bonuses for quick, confident answers

### Always more to ask

- **Live AI generation** — `POST /api/question` calls Anthropic (Claude) to produce a typed, validated question for any sport × difficulty × format combo.
- **Seeded bank fallback** — Curated JSON packs in MongoDB so play never hard-fails.
- **No cheap repeats** — Soft `exclude` + hard `sessionExclude` keep marathon sessions feeling new.

---

## Sports covered

Football · Basketball · Tennis · Baseball · Ice Hockey · Cricket · Formula 1 · MMA · Esports

---

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | [Next.js](https://nextjs.org/) 16 (App Router) |
| UI | React 19, Tailwind CSS 4, Phosphor Icons |
| Data | MongoDB Atlas (`sportiq` database by default) |
| Infinite AI | Anthropic Claude via `ANTHROPIC_API_KEY` — generates questions forever |

---

## Getting started

```bash
npm install
cp .env.example .env.local   # set MONGODB_URI + ANTHROPIC_API_KEY for infinite play
npm run seed                 # upload curated questions into MongoDB (fallback bank)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Keep secrets in `.env.local` — it is gitignored. Users, stats, leagues, and the question bank live in MongoDB. Set `ANTHROPIC_API_KEY` to unlock unlimited AI-generated questions.

### Environment

| Variable | Required | Purpose |
| --- | --- | --- |
| `MONGODB_URI` | Yes | Atlas connection string |
| `ANTHROPIC_API_KEY` | Recommended | Live AI generation — enables truly infinite Endless mode |
| `SESSION_SECRET` | No | Override default session signing secret |

Without an API key the app still runs on the curated bank; with a key, **AI can keep creating new questions indefinitely**.

---

## How a round works

1. Choose **Easy**, **Medium**, or **Hard** (or jump into Daily / Endless).
2. Each question offers **three random sports** — pick one.
3. Answer in whatever format appears (MCQ, timeline, guess-the-player…).
4. In Endless mode, AI deals the next question — again and again — until you quit.
5. Build a streak, rack up points, then share a challenge or climb your league table.

Perfect for office brackets, watch-party warm-ups, and anyone who wants to walk into tournament season already match-fit.

---

## API

### `POST /api/question`

Mint a fresh question for any sport, difficulty, and format. Call it as often as you like — AI generation does not run dry.

```json
{
  "sport": "football",
  "difficulty": "hard",
  "quizType": "multiple-choice",
  "exclude": ["Who won the FIFA World Cup in 2022?"]
}
```

| Field | Required | Values |
| --- | --- | --- |
| `sport` | Yes | `football` \| `basketball` \| `tennis` \| `baseball` \| `hockey` \| `cricket` \| `formula1` \| `mma` \| `esports` |
| `difficulty` | Yes | `easy` \| `medium` \| `hard` |
| `quizType` | No | `multiple-choice` \| `true-false` \| `guess-score` \| `guess-player` \| `timeline` \| `prediction` (random if omitted) |
| `exclude` | No | Prompts of recently asked questions to avoid repeats |
| `sessionExclude` | No | Hard exclude list for the current game session |
| `preferSport` | No | Bias toward a favorite sport |

Response: `{ "question": { …typed payload, "source": "ai" | "bank" } }`

---

## Project scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |
| `npm run seed` | Seed MongoDB from the curated question packs |

---

## License

Private — all rights reserved.
