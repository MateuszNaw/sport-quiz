import type { Icon } from "@phosphor-icons/react";
import {
  BasketballIcon,
  ClockCounterClockwiseIcon,
  FireIcon,
  LightningIcon,
  MedalIcon,
  ShieldCheckIcon,
  SoccerBallIcon,
  SwordIcon,
  TargetIcon,
  TennisBallIcon,
  TrophyIcon,
} from "@phosphor-icons/react/ssr";
import type { UserStats } from "./models";
import { levelFromXp } from "./xp";

export interface Achievement {
  id: string;
  label: string;
  description: string;
  icon: Icon;
  /** Soft-palette accent for unlocked badge icons. */
  color: string;
  check: (stats: UserStats) => boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "century",
    label: "100 Correct Answers",
    description: "Answer 100 questions correctly across every game.",
    icon: TargetIcon,
    color: "#7CC6FE",
    check: (s) => s.correctAnswers >= 100,
  },
  {
    id: "five-hundred",
    label: "500 Correct Answers",
    description: "Reach 500 career correct answers.",
    icon: TrophyIcon,
    color: "#FFE599",
    check: (s) => s.correctAnswers >= 500,
  },
  {
    id: "ten-day-streak",
    label: "10-Day Streak",
    description: "Play SportIQ on 10 consecutive days.",
    icon: FireIcon,
    color: "#FFBFA3",
    check: (s) => s.dayStreak >= 10,
  },
  {
    id: "football-expert",
    label: "Football Expert",
    description: "Answer 20 football questions correctly.",
    icon: SoccerBallIcon,
    color: "#9BE7C4",
    check: (s) => (s.perSport.football?.correct ?? 0) >= 20,
  },
  {
    id: "nba-guru",
    label: "NBA Guru",
    description: "Answer 20 basketball questions correctly.",
    icon: BasketballIcon,
    color: "#FFBFA3",
    check: (s) => (s.perSport.basketball?.correct ?? 0) >= 20,
  },
  {
    id: "tennis-ace",
    label: "Tennis Ace",
    description: "Answer 20 tennis questions correctly.",
    icon: TennisBallIcon,
    color: "#A8E6A3",
    check: (s) => (s.perSport.tennis?.correct ?? 0) >= 20,
  },
  {
    id: "never-wrong",
    label: "Never Wrong",
    description: "Finish a round with a perfect, 100% accurate score.",
    icon: ShieldCheckIcon,
    color: "#7CC6FE",
    check: (s) => s.perfectRounds >= 1,
  },
  {
    id: "perfectionist",
    label: "Perfectionist",
    description: "Finish 5 perfect rounds.",
    icon: MedalIcon,
    color: "#CDB4FF",
    check: (s) => s.perfectRounds >= 5,
  },
  {
    id: "history-master",
    label: "History Master",
    description: "Correctly order 10 timeline questions.",
    icon: ClockCounterClockwiseIcon,
    color: "#FFE599",
    check: (s) => s.timelinePerfectCount >= 10,
  },
  {
    id: "speed-demon",
    label: "Speed Demon",
    description: "Earn the speed bonus on 25 answers.",
    icon: LightningIcon,
    color: "#FF9E9E",
    check: (s) => (s.speedBonusCount ?? 0) >= 25,
  },
  {
    id: "challenger",
    label: "Challenger",
    description: "Win 3 friend challenges.",
    icon: SwordIcon,
    color: "#CDB4FF",
    check: (s) => (s.challengesWon ?? 0) >= 3,
  },
  {
    id: "level-five",
    label: "Rising Star",
    description: "Reach player level 5.",
    icon: FireIcon,
    color: "#FFBFA3",
    check: (s) => levelFromXp(s.xp ?? s.totalScore) >= 5,
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
