export const SPORTS = [
  "football",
  "basketball",
  "tennis",
  "baseball",
  "hockey",
  "cricket",
  "formula1",
  "mma",
  "esports",
] as const;

export type Sport = (typeof SPORTS)[number];

export const DIFFICULTIES = ["easy", "medium", "hard"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const QUIZ_TYPES = [
  "multiple-choice",
  "true-false",
  "guess-score",
  "guess-player",
  "timeline",
  "prediction",
] as const;
export type QuizType = (typeof QUIZ_TYPES)[number];

interface QuestionBase {
  id: string;
  sport: Sport;
  difficulty: Difficulty;
  /** Short explanation shown after answering. */
  explanation: string;
  /** Where the question came from: the AI generator or the local bank. */
  source: "ai" | "bank";
}

export interface MultipleChoiceQuestion extends QuestionBase {
  quizType: "multiple-choice";
  prompt: string;
  options: string[];
  correctIndex: number;
}

export interface TrueFalseQuestion extends QuestionBase {
  quizType: "true-false";
  statement: string;
  answer: boolean;
}

export interface GuessScoreQuestion extends QuestionBase {
  quizType: "guess-score";
  /** e.g. "UEFA Champions League Final 2005" */
  fixture: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
}

export interface GuessPlayerQuestion extends QuestionBase {
  quizType: "guess-player";
  /** Ordered from vague to obvious; revealed one at a time. */
  clues: string[];
  answer: string;
  /** Lowercase variants accepted as correct (surname, nickname...). */
  acceptableAnswers: string[];
}

export interface TimelineQuestion extends QuestionBase {
  quizType: "timeline";
  prompt: string;
  /** Events in correct chronological order. Shuffled client-side. */
  events: string[];
}

export interface PredictionQuestion extends QuestionBase {
  quizType: "prediction";
  /** Setup / situation the player must read. */
  scenario: string;
  prompt: string;
  options: string[];
  correctIndex: number;
}

export type Question =
  | MultipleChoiceQuestion
  | TrueFalseQuestion
  | GuessScoreQuestion
  | GuessPlayerQuestion
  | TimelineQuestion
  | PredictionQuestion;

export interface GenerateQuestionRequest {
  sport: Sport;
  difficulty: Difficulty;
  quizType?: QuizType;
  /** Prompts of recently asked questions, so the generator avoids repeats. */
  exclude?: string[];
  /** Prefer this sport more often (favorites personalization). */
  preferSport?: Sport;
}
