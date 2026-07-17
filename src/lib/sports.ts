import type { Icon } from "@phosphor-icons/react";
import {
  BaseballIcon,
  BasketballIcon,
  ClockCounterClockwiseIcon,
  CompassIcon,
  CricketIcon,
  DetectiveIcon,
  FlameIcon,
  GameControllerIcon,
  HandFistIcon,
  HashIcon,
  HockeyIcon,
  ListChecksIcon,
  ScalesIcon,
  SkullIcon,
  SmileyIcon,
  SoccerBallIcon,
  SteeringWheelIcon,
  TennisBallIcon,
} from "@phosphor-icons/react/ssr";
import type { Difficulty, QuizType, Sport } from "./types";

export interface SportMeta {
  id: Sport;
  label: string;
  icon: Icon;
  /** Per-sport identity color: saturated, used only on small icons. */
  color: string;
}

export const SPORT_META: Record<Sport, SportMeta> = {
  football: { id: "football", label: "Football", icon: SoccerBallIcon, color: "#0f9152" },
  basketball: { id: "basketball", label: "Basketball", icon: BasketballIcon, color: "#e06a13" },
  tennis: { id: "tennis", label: "Tennis", icon: TennisBallIcon, color: "#84a80b" },
  baseball: { id: "baseball", label: "Baseball", icon: BaseballIcon, color: "#d33d4e" },
  hockey: { id: "hockey", label: "Ice Hockey", icon: HockeyIcon, color: "#0284c7" },
  cricket: { id: "cricket", label: "Cricket", icon: CricketIcon, color: "#0d9488" },
  formula1: { id: "formula1", label: "Formula 1", icon: SteeringWheelIcon, color: "#c07207" },
  mma: { id: "mma", label: "MMA", icon: HandFistIcon, color: "#7c3aed" },
  esports: { id: "esports", label: "Esports", icon: GameControllerIcon, color: "#d6357f" },
};

export const DIFFICULTY_META: Record<
  Difficulty,
  { label: string; points: number; color: string; description: string; icon: Icon; intensity: number }
> = {
  easy: {
    label: "Easy",
    points: 100,
    color: "var(--color-easy)",
    description: "Famous moments every fan knows",
    icon: SmileyIcon,
    intensity: 1,
  },
  medium: {
    label: "Medium",
    points: 200,
    color: "var(--color-medium)",
    description: "For fans who follow the game closely",
    icon: FlameIcon,
    intensity: 2,
  },
  hard: {
    label: "Hard",
    points: 300,
    color: "var(--color-hard)",
    description: "Deep cuts, stats and trivia for experts",
    icon: SkullIcon,
    intensity: 3,
  },
};

/** Format icons stay one color (accent) — the format is a label, not a category. */
export const QUIZ_TYPE_META: Record<QuizType, { label: string; icon: Icon; color: string }> = {
  "multiple-choice": { label: "Multiple Choice", icon: ListChecksIcon, color: "var(--color-accent)" },
  "true-false": { label: "True / False", icon: ScalesIcon, color: "var(--color-accent)" },
  "guess-score": { label: "Guess the Score", icon: HashIcon, color: "var(--color-accent)" },
  "guess-player": { label: "Guess the Player", icon: DetectiveIcon, color: "var(--color-accent)" },
  timeline: { label: "Timeline", icon: ClockCounterClockwiseIcon, color: "var(--color-accent)" },
  prediction: { label: "Prediction", icon: CompassIcon, color: "var(--color-accent)" },
};
