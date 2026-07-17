import type { Icon } from "@phosphor-icons/react";
import {
  BaseballIcon,
  BasketballIcon,
  ClockCounterClockwiseIcon,
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
  /** Locked per-sport identity color. Functional category coding, not a page accent. */
  color: string;
}

export const SPORT_META: Record<Sport, SportMeta> = {
  football: { id: "football", label: "Football", icon: SoccerBallIcon, color: "#7bd88f" },
  basketball: { id: "basketball", label: "Basketball", icon: BasketballIcon, color: "#eab64f" },
  tennis: { id: "tennis", label: "Tennis", icon: TennisBallIcon, color: "#8fd14f" },
  baseball: { id: "baseball", label: "Baseball", icon: BaseballIcon, color: "#e8685f" },
  hockey: { id: "hockey", label: "Ice Hockey", icon: HockeyIcon, color: "#5aa9e8" },
  cricket: { id: "cricket", label: "Cricket", icon: CricketIcon, color: "#4fd1c5" },
  formula1: { id: "formula1", label: "Formula 1", icon: SteeringWheelIcon, color: "#e8752e" },
  mma: { id: "mma", label: "MMA", icon: HandFistIcon, color: "#b85ae8" },
  esports: { id: "esports", label: "Esports", icon: GameControllerIcon, color: "#e85aae" },
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

export const QUIZ_TYPE_META: Record<QuizType, { label: string; icon: Icon }> = {
  "multiple-choice": { label: "Multiple Choice", icon: ListChecksIcon },
  "true-false": { label: "True / False", icon: ScalesIcon },
  "guess-score": { label: "Guess the Score", icon: HashIcon },
  "guess-player": { label: "Guess the Player", icon: DetectiveIcon },
  timeline: { label: "Timeline", icon: ClockCounterClockwiseIcon },
};
