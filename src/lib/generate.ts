import {
  DIFFICULTIES,
  QUIZ_TYPES,
  SPORTS,
  type Difficulty,
  type Question,
  type QuizType,
  type Sport,
} from "./types";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-5";

const DIFFICULTY_GUIDE: Record<Difficulty, string> = {
  easy: "A famous fact or moment that any casual fan of the sport would know (e.g. 'Who won the FIFA World Cup in 2022?').",
  medium:
    "Requires following the sport closely: specific finals, key performers, notable records (e.g. 'Who scored the winning goal in the 2010 Champions League Final?').",
  hard: "Expert-level trivia: obscure stats, specific tournament details, deep history (e.g. 'Which defender completed the most interceptions during EURO 2016?').",
};

const TYPE_SCHEMAS: Record<QuizType, string> = {
  "multiple-choice": `{
  "quizType": "multiple-choice",
  "prompt": string,               // the question
  "options": string[4],           // exactly 4 plausible options
  "correctIndex": number,         // 0-3
  "explanation": string           // 1-2 sentences of context
}`,
  "true-false": `{
  "quizType": "true-false",
  "statement": string,            // a factual statement, true or subtly false
  "answer": boolean,
  "explanation": string
}`,
  "guess-score": `{
  "quizType": "guess-score",
  "fixture": string,              // competition + stage + year, e.g. "UEFA Champions League Final 2005"
  "homeTeam": string,
  "awayTeam": string,
  "homeScore": number,            // the real final score
  "awayScore": number,
  "explanation": string
}`,
  "guess-player": `{
  "quizType": "guess-player",
  "clues": string[3-4],           // ordered vague -> obvious, do NOT include the name
  "answer": string,               // full name
  "acceptableAnswers": string[],  // lowercase accepted variants incl. surname/nickname
  "explanation": string
}`,
  timeline: `{
  "quizType": "timeline",
  "prompt": string,               // e.g. "Put these events in chronological order"
  "events": string[4],            // in CORRECT chronological order, each mentioning its era/year
  "explanation": string
}`,
  "image-quiz": `{
  "quizType": "image-quiz",
  "prompt": string,
  "imageUrl": string,             // must be a real public https URL to a photo
  "imageCaption": string,
  "options": string[4],
  "correctIndex": number,
  "explanation": string
}`,
  prediction: `{
  "quizType": "prediction",
  "scenario": string,             // the setup
  "prompt": string,               // "What happens next?" style
  "options": string[4],
  "correctIndex": number,
  "explanation": string
}`,
};

function extractJson(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON object in model response");
  return JSON.parse(text.slice(start, end + 1));
}

function validateQuestion(raw: unknown, sport: Sport, difficulty: Difficulty): Question {
  const q = raw as Record<string, unknown>;
  const quizType = q.quizType as QuizType;
  if (!QUIZ_TYPES.includes(quizType)) throw new Error(`Invalid quizType: ${q.quizType}`);
  if (typeof q.explanation !== "string") throw new Error("Missing explanation");

  const base = {
    id: crypto.randomUUID(),
    sport,
    difficulty,
    explanation: q.explanation,
    source: "ai" as const,
  };

  switch (quizType) {
    case "multiple-choice": {
      if (
        typeof q.prompt !== "string" ||
        !Array.isArray(q.options) ||
        q.options.length !== 4 ||
        !q.options.every((o) => typeof o === "string") ||
        typeof q.correctIndex !== "number" ||
        q.correctIndex < 0 ||
        q.correctIndex > 3
      )
        throw new Error("Invalid multiple-choice payload");
      return { ...base, quizType, prompt: q.prompt, options: q.options, correctIndex: q.correctIndex };
    }
    case "true-false": {
      if (typeof q.statement !== "string" || typeof q.answer !== "boolean")
        throw new Error("Invalid true-false payload");
      return { ...base, quizType, statement: q.statement, answer: q.answer };
    }
    case "guess-score": {
      if (
        typeof q.fixture !== "string" ||
        typeof q.homeTeam !== "string" ||
        typeof q.awayTeam !== "string" ||
        typeof q.homeScore !== "number" ||
        typeof q.awayScore !== "number"
      )
        throw new Error("Invalid guess-score payload");
      return {
        ...base,
        quizType,
        fixture: q.fixture,
        homeTeam: q.homeTeam,
        awayTeam: q.awayTeam,
        homeScore: q.homeScore,
        awayScore: q.awayScore,
      };
    }
    case "guess-player": {
      if (
        !Array.isArray(q.clues) ||
        q.clues.length < 2 ||
        !q.clues.every((c) => typeof c === "string") ||
        typeof q.answer !== "string" ||
        !Array.isArray(q.acceptableAnswers) ||
        !q.acceptableAnswers.every((a) => typeof a === "string")
      )
        throw new Error("Invalid guess-player payload");
      const acceptable = [...new Set([q.answer.toLowerCase(), ...q.acceptableAnswers.map((a) => a.toLowerCase())])];
      return { ...base, quizType, clues: q.clues, answer: q.answer, acceptableAnswers: acceptable };
    }
    case "timeline": {
      if (
        typeof q.prompt !== "string" ||
        !Array.isArray(q.events) ||
        q.events.length < 3 ||
        !q.events.every((e) => typeof e === "string")
      )
        throw new Error("Invalid timeline payload");
      return { ...base, quizType, prompt: q.prompt, events: q.events };
    }
    case "image-quiz": {
      if (
        typeof q.prompt !== "string" ||
        typeof q.imageUrl !== "string" ||
        !Array.isArray(q.options) ||
        q.options.length !== 4 ||
        typeof q.correctIndex !== "number"
      )
        throw new Error("Invalid image-quiz payload");
      return {
        ...base,
        quizType,
        prompt: q.prompt,
        imageUrl: q.imageUrl,
        imageCaption: typeof q.imageCaption === "string" ? q.imageCaption : undefined,
        options: q.options as string[],
        correctIndex: q.correctIndex,
      };
    }
    case "prediction": {
      if (
        typeof q.scenario !== "string" ||
        typeof q.prompt !== "string" ||
        !Array.isArray(q.options) ||
        q.options.length !== 4 ||
        typeof q.correctIndex !== "number"
      )
        throw new Error("Invalid prediction payload");
      return {
        ...base,
        quizType,
        scenario: q.scenario,
        prompt: q.prompt,
        options: q.options as string[],
        correctIndex: q.correctIndex,
      };
    }
  }
}

export function isAiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/**
 * Generate a quiz question with the Anthropic API. Throws if the key is
 * missing or the response is unusable — callers fall back to the local bank.
 */
export async function generateWithAi(
  sport: Sport,
  difficulty: Difficulty,
  quizType: QuizType,
  exclude: string[] = []
): Promise<Question> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
  if (!SPORTS.includes(sport)) throw new Error(`Unknown sport: ${sport}`);
  if (!DIFFICULTIES.includes(difficulty)) throw new Error(`Unknown difficulty: ${difficulty}`);

  const avoid =
    exclude.length > 0
      ? `\nDo NOT repeat or closely paraphrase any of these recently asked questions:\n${exclude
          .slice(-20)
          .map((e) => `- ${e}`)
          .join("\n")}`
      : "";

  const prompt = `You are a sports trivia writer. Generate ONE ${difficulty} question about ${sport}.

Difficulty calibration: ${DIFFICULTY_GUIDE[difficulty]}

Question format: "${quizType}". Respond with ONLY a JSON object matching this schema exactly (no markdown, no commentary):
${TYPE_SCHEMAS[quizType]}

Rules:
- The question must be factually accurate and verifiable.
- Wrong options must be plausible for the difficulty level.
- Vary eras, competitions and regions — don't always use the most famous example.${avoid}`;

  const res = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      temperature: 1,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${body.slice(0, 300)}`);
  }

  const data = (await res.json()) as { content: { type: string; text?: string }[] };
  const text = data.content?.find((b) => b.type === "text")?.text;
  if (!text) throw new Error("Empty model response");

  return validateQuestion(extractJson(text), sport, difficulty);
}
