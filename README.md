# SportIQ — AI Sports Quiz

A Next.js sports trivia game. Before every question you pick one of **3 randomly drawn sports categories**, then answer questions in one of five formats, generated live by the Anthropic API according to your chosen difficulty.

## Features

- **Category draw**: 3 random sports offered before every question (out of 9: football, basketball, tennis, baseball, hockey, cricket, Formula 1, MMA, esports).
- **5 quiz formats**: multiple choice, true/false, guess the score, guess the player (progressive clues), timeline ordering.
- **3 difficulty levels**: easy (100 pts), medium (200 pts), hard (300 pts), with difficulty-calibrated AI prompts.
- **AI question generation**: `POST /api/question` calls the Anthropic API (Claude) to generate a fresh, validated question; recently asked questions are excluded to avoid repeats.
- **Fallback bank**: works fully offline with a built-in question bank when no API key is set.
- **Scoring**: streak bonus (+10% per consecutive correct, max +50%), partial credit for close score guesses, timeline positions, and fewer revealed clues.
- **Modes**: 10-question quiz per difficulty, plus Endless Mode.

## Getting started

```bash
npm install
cp .env.example .env.local   # set MONGODB_URI (required); ANTHROPIC_API_KEY optional
npm run seed                 # upload curated questions into MongoDB
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Users, stats, leagues, and the question bank live in MongoDB Atlas (`sportiq` database by default). Keep secrets in `.env.local` — it is gitignored.

## API

`POST /api/question`

```json
{
  "sport": "football",
  "difficulty": "hard",
  "quizType": "multiple-choice",
  "exclude": ["Who won the FIFA World Cup in 2022?"]
}
```

- `sport` (required): `football | basketball | tennis | baseball | hockey | cricket | formula1 | mma | esports`
- `difficulty` (required): `easy | medium | hard`
- `quizType` (optional, random if omitted): `multiple-choice | true-false | guess-score | guess-player | timeline`
- `exclude` (optional): prompts of recently asked questions to avoid repeats

Response: `{ "question": { ...typed question payload, "source": "ai" | "bank" } }`
