import type { Icon } from "@phosphor-icons/react";
import {
  BasketballIcon,
  ClockCounterClockwiseIcon,
  FireIcon,
  ShieldCheckIcon,
  SoccerBallIcon,
  TargetIcon,
} from "@phosphor-icons/react/ssr";
import type { UserStats } from "./models";

export interface Achievement {
  id: string;
  label: string;
  description: string;
  icon: Icon;
  check: (stats: UserStats) => boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "century",
    label: "100 Correct Answers",
    description: "Answer 100 questions correctly across every game.",
    icon: TargetIcon,
    check: (s) => s.correctAnswers >= 100,
  },
  {
    id: "ten-day-streak",
    label: "10-Day Streak",
    description: "Play SportIQ on 10 consecutive days.",
    icon: FireIcon,
    check: (s) => s.dayStreak >= 10,
  },
  {
    id: "football-expert",
    label: "Football Expert",
    description: "Answer 20 football questions correctly.",
    icon: SoccerBallIcon,
    check: (s) => (s.perSport.football?.correct ?? 0) >= 20,
  },
  {
    id: "nba-guru",
    label: "NBA Guru",
    description: "Answer 20 basketball questions correctly.",
    icon: BasketballIcon,
    check: (s) => (s.perSport.basketball?.correct ?? 0) >= 20,
  },
  {
    id: "never-wrong",
    label: "Never Wrong",
    description: "Finish a round with a perfect, 100% accurate score.",
    icon: ShieldCheckIcon,
    check: (s) => s.perfectRounds >= 1,
  },
  {
    id: "history-master",
    label: "History Master",
    description: "Correctly order 10 timeline questions.",
    icon: ClockCounterClockwiseIcon,
    check: (s) => s.timelinePerfectCount >= 10,
  },
];

export function getAchievement(id: string): Achievement | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}

/** Returns achievements that just became true and weren't already unlocked. */
export function evaluateAchievements(stats: UserStats, alreadyUnlocked: string[]): Achievement[] {
  const unlocked = new Set(alreadyUnlocked);
  return ACHIEVEMENTS.filter((a) => !unlocked.has(a.id) && a.check(stats));
}
