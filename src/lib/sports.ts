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
  ImageIcon,
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
  /** Soft-palette per-sport identity color. */
  color: string;
}

export const SPORT_META: Record<Sport, SportMeta> = {
  football: { id: "football", label: "Football", icon: SoccerBallIcon, color: "#9BE7C4" },
  basketball: { id: "basketball", label: "Basketball", icon: BasketballIcon, color: "#FFBFA3" },
  tennis: { id: "tennis", label: "Tennis", icon: TennisBallIcon, color: "#A8E6A3" },
  baseball: { id: "baseball", label: "Baseball", icon: BaseballIcon, color: "#FF9E9E" },
  hockey: { id: "hockey", label: "Ice Hockey", icon: HockeyIcon, color: "#7CC6FE" },
  cricket: { id: "cricket", label: "Cricket", icon: CricketIcon, color: "#7DD3C0" },
  formula1: { id: "formula1", label: "Formula 1", icon: SteeringWheelIcon, color: "#FFE599" },
  mma: { id: "mma", label: "MMA", icon: HandFistIcon, color: "#CDB4FF" },
  esports: { id: "esports", label: "Esports", icon: GameControllerIcon, color: "#E8A0D0" },
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
    color: "var(--color-peach)",
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

export const QUIZ_TYPE_META: Record<QuizType, { label: string; icon: Icon; color: string }> = {
  "multiple-choice": { label: "Multiple Choice", icon: ListChecksIcon, color: "#7CC6FE" },
  "true-false": { label: "True / False", icon: ScalesIcon, color: "#9BE7C4" },
  "guess-score": { label: "Guess the Score", icon: HashIcon, color: "#FFBFA3" },
  "guess-player": { label: "Guess the Player", icon: DetectiveIcon, color: "#CDB4FF" },
  timeline: { label: "Timeline", icon: ClockCounterClockwiseIcon, color: "#FFE599" },
  "image-quiz": { label: "Image Quiz", icon: ImageIcon, color: "#A8E6A3" },
  prediction: { label: "Prediction", icon: CompassIcon, color: "#FF9E9E" },
};
