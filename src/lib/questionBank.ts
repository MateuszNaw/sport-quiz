import type { Difficulty, Question, QuizType, Sport } from "./types";

// Plain `Omit` collapses a discriminated union down to its common keys, which
// would erase the per-quizType fields (prompt/options/clues/...). Distribute
// it over each union member instead so BankEntry keeps its shape.
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
type BankEntry = DistributiveOmit<Question, "id" | "source">;

/**
 * Local fallback bank used when ANTHROPIC_API_KEY is not configured or the
 * AI request fails. Not exhaustive — the AI endpoint is the primary source.
 */
const BANK: BankEntry[] = [
  // ---------- Football ----------
  {
    sport: "football",
    difficulty: "easy",
    quizType: "multiple-choice",
    prompt: "Who won the FIFA World Cup in 2022?",
    options: ["France", "Argentina", "Brazil", "Croatia"],
    correctIndex: 1,
    explanation:
      "Argentina beat France on penalties after a 3-3 thriller in Qatar, with Messi lifting his first World Cup.",
  },
  {
    sport: "football",
    difficulty: "easy",
    quizType: "true-false",
    statement: "Manchester City won the UEFA Champions League in 2023.",
    answer: true,
    explanation:
      "City beat Inter Milan 1-0 in the 2023 final in Istanbul, completing the treble.",
  },
  {
    sport: "football",
    difficulty: "medium",
    quizType: "guess-score",
    fixture: "UEFA Champions League Final 2005 (before extra time)",
    homeTeam: "AC Milan",
    awayTeam: "Liverpool",
    homeScore: 3,
    awayScore: 3,
    explanation:
      "The 'Miracle of Istanbul': Liverpool came back from 3-0 down to draw 3-3 and won on penalties.",
  },
  {
    sport: "football",
    difficulty: "medium",
    quizType: "guess-player",
    clues: [
      "Brazilian attacking midfielder",
      "Played for Barcelona and AC Milan",
      "Won the Ballon d'Or in 2005",
      "Famous for his smile and no-look passes",
    ],
    answer: "Ronaldinho",
    acceptableAnswers: ["ronaldinho", "ronaldinho gaucho"],
    explanation:
      "Ronaldinho won the 2005 Ballon d'Or while at Barcelona, after starring for PSG and later AC Milan.",
  },
  {
    sport: "football",
    difficulty: "hard",
    quizType: "timeline",
    prompt: "Put these World Cup wins in chronological order (earliest first).",
    events: [
      "Brazil win in Mexico with Pelé (1970)",
      "Maradona's Argentina win in Mexico (1986)",
      "France win at home (1998)",
      "Spain's first title in South Africa (2010)",
    ],
    explanation: "1970 Brazil, 1986 Argentina, 1998 France, 2010 Spain.",
  },
  // ---------- Basketball ----------
  {
    sport: "basketball",
    difficulty: "easy",
    quizType: "multiple-choice",
    prompt: "Which NBA player is nicknamed 'King James'?",
    options: ["Kevin Durant", "Stephen Curry", "LeBron James", "James Harden"],
    correctIndex: 2,
    explanation: "LeBron James has carried the nickname since high school.",
  },
  {
    sport: "basketball",
    difficulty: "medium",
    quizType: "true-false",
    statement: "The Toronto Raptors won their first NBA title in 2019.",
    answer: true,
    explanation:
      "Led by Kawhi Leonard, the Raptors beat the Golden State Warriors in six games.",
  },
  {
    sport: "basketball",
    difficulty: "medium",
    quizType: "guess-player",
    clues: [
      "German power forward",
      "Spent his entire 21-year NBA career with one franchise",
      "2011 NBA Finals MVP",
      "Famous one-legged fadeaway",
    ],
    answer: "Dirk Nowitzki",
    acceptableAnswers: ["dirk nowitzki", "nowitzki", "dirk"],
    explanation:
      "Dirk Nowitzki led the Dallas Mavericks to the 2011 title over the Miami Heat.",
  },
  {
    sport: "basketball",
    difficulty: "hard",
    quizType: "timeline",
    prompt: "Order these NBA dynasties by when they began (earliest first).",
    events: [
      "Bill Russell's Celtics dominance (late 1950s)",
      "Showtime Lakers (1980s)",
      "Jordan's Bulls first three-peat (early 1990s)",
      "Warriors' Splash Brothers era (mid 2010s)",
    ],
    explanation:
      "Celtics (1957-69), Showtime Lakers (1980s), Bulls (1991-93), Warriors (2015-).",
  },
  // ---------- Tennis ----------
  {
    sport: "tennis",
    difficulty: "easy",
    quizType: "multiple-choice",
    prompt: "Who won the Wimbledon men's singles title in 2024?",
    options: ["Novak Djokovic", "Carlos Alcaraz", "Jannik Sinner", "Daniil Medvedev"],
    correctIndex: 1,
    explanation:
      "Carlos Alcaraz beat Novak Djokovic in straight sets in the 2024 final, defending his title.",
  },
  {
    sport: "tennis",
    difficulty: "medium",
    quizType: "true-false",
    statement: "Rafael Nadal has won more French Open titles than any other player.",
    answer: true,
    explanation: "Nadal's 14 Roland Garros titles are a record at a single Grand Slam.",
  },
  {
    sport: "tennis",
    difficulty: "hard",
    quizType: "guess-player",
    clues: [
      "Swiss player, but not Federer",
      "Known for a brutal one-handed backhand",
      "Won three Grand Slam titles",
      "Beat Djokovic in the 2015 French Open final",
    ],
    answer: "Stan Wawrinka",
    acceptableAnswers: ["stan wawrinka", "wawrinka", "stanislas wawrinka"],
    explanation:
      "Wawrinka won the 2014 Australian Open, 2015 French Open and 2016 US Open.",
  },
  // ---------- Baseball ----------
  {
    sport: "baseball",
    difficulty: "easy",
    quizType: "multiple-choice",
    prompt: "How many strikes make a strikeout in baseball?",
    options: ["Two", "Three", "Four", "Five"],
    correctIndex: 1,
    explanation: "Three strikes and the batter is out.",
  },
  {
    sport: "baseball",
    difficulty: "medium",
    quizType: "guess-player",
    clues: [
      "Japanese two-way superstar",
      "Pitches and hits at an elite level",
      "Signed a record contract with the Dodgers in 2023",
      "Nicknamed 'Shotime'",
    ],
    answer: "Shohei Ohtani",
    acceptableAnswers: ["shohei ohtani", "ohtani"],
    explanation:
      "Ohtani signed a 10-year, $700M deal with the Los Angeles Dodgers in December 2023.",
  },
  {
    sport: "baseball",
    difficulty: "hard",
    quizType: "true-false",
    statement: "The Chicago Cubs' 2016 World Series win ended a championship drought of over 100 years.",
    answer: true,
    explanation: "The Cubs had not won the World Series since 1908 — a 108-year drought.",
  },
  // ---------- Hockey ----------
  {
    sport: "hockey",
    difficulty: "easy",
    quizType: "multiple-choice",
    prompt: "Which trophy is awarded to the NHL playoff champion?",
    options: ["Vince Lombardi Trophy", "Stanley Cup", "Larry O'Brien Trophy", "Commissioner's Trophy"],
    correctIndex: 1,
    explanation: "The Stanley Cup is the oldest trophy in North American pro sports.",
  },
  {
    sport: "hockey",
    difficulty: "medium",
    quizType: "guess-player",
    clues: [
      "Canadian, nicknamed 'The Great One'",
      "Holds the NHL record for career points",
      "His #99 is retired league-wide",
    ],
    answer: "Wayne Gretzky",
    acceptableAnswers: ["wayne gretzky", "gretzky"],
    explanation:
      "Gretzky's 2,857 career points remain far ahead of anyone else in NHL history.",
  },
  {
    sport: "hockey",
    difficulty: "hard",
    quizType: "guess-score",
    fixture: "'Miracle on Ice', 1980 Olympics — USA vs USSR",
    homeTeam: "USA",
    awayTeam: "USSR",
    homeScore: 4,
    awayScore: 3,
    explanation:
      "The amateur US team upset the heavily favoured Soviets 4-3 in Lake Placid.",
  },
  // ---------- Cricket ----------
  {
    sport: "cricket",
    difficulty: "easy",
    quizType: "multiple-choice",
    prompt: "How many runs is a ball hit over the boundary on the full worth?",
    options: ["Four", "Five", "Six", "Eight"],
    correctIndex: 2,
    explanation: "Clearing the boundary without bouncing scores six runs.",
  },
  {
    sport: "cricket",
    difficulty: "medium",
    quizType: "guess-player",
    clues: [
      "Indian batting legend",
      "Nicknamed the 'Little Master'",
      "First player to score 100 international centuries",
    ],
    answer: "Sachin Tendulkar",
    acceptableAnswers: ["sachin tendulkar", "tendulkar", "sachin"],
    explanation:
      "Tendulkar scored exactly 100 international centuries across Tests and ODIs.",
  },
  {
    sport: "cricket",
    difficulty: "hard",
    quizType: "true-false",
    statement: "The 2019 Cricket World Cup final was decided by a Super Over.",
    answer: true,
    explanation:
      "England and New Zealand tied both the match and the Super Over; England won on boundary count.",
  },
  // ---------- Formula 1 ----------
  {
    sport: "formula1",
    difficulty: "easy",
    quizType: "multiple-choice",
    prompt: "Which team does the Italian flag-red livery traditionally belong to?",
    options: ["McLaren", "Ferrari", "Williams", "Red Bull"],
    correctIndex: 1,
    explanation: "Scuderia Ferrari has raced in 'rosso corsa' red since F1 began in 1950.",
  },
  {
    sport: "formula1",
    difficulty: "medium",
    quizType: "true-false",
    statement: "Max Verstappen won his first F1 world title in 2021 after a last-lap pass on Lewis Hamilton.",
    answer: true,
    explanation:
      "Verstappen passed Hamilton on the final lap of the Abu Dhabi Grand Prix to clinch the 2021 title.",
  },
  {
    sport: "formula1",
    difficulty: "hard",
    quizType: "timeline",
    prompt: "Order these F1 champions by their FIRST title (earliest first).",
    events: [
      "Ayrton Senna (1988)",
      "Michael Schumacher (1994)",
      "Fernando Alonso (2005)",
      "Lewis Hamilton (2008)",
    ],
    explanation: "Senna 1988, Schumacher 1994, Alonso 2005, Hamilton 2008.",
  },
  // ---------- MMA ----------
  {
    sport: "mma",
    difficulty: "easy",
    quizType: "multiple-choice",
    prompt: "What does 'UFC' stand for?",
    options: [
      "United Fighting Council",
      "Ultimate Fighting Championship",
      "Universal Fight Club",
      "Unified Fighting Circuit",
    ],
    correctIndex: 1,
    explanation: "The Ultimate Fighting Championship was founded in 1993.",
  },
  {
    sport: "mma",
    difficulty: "medium",
    quizType: "guess-player",
    clues: [
      "Irish fighter with a famous left hand",
      "First UFC fighter to hold titles in two divisions simultaneously",
      "Beat José Aldo in 13 seconds",
    ],
    answer: "Conor McGregor",
    acceptableAnswers: ["conor mcgregor", "mcgregor", "the notorious"],
    explanation:
      "McGregor held the featherweight and lightweight belts at the same time in 2016.",
  },
  {
    sport: "mma",
    difficulty: "hard",
    quizType: "true-false",
    statement: "Khabib Nurmagomedov retired from MMA with an undefeated record of 29-0.",
    answer: true,
    explanation: "Khabib retired in 2020 after defending his lightweight title against Justin Gaethje.",
  },
  // ---------- Esports ----------
  {
    sport: "esports",
    difficulty: "easy",
    quizType: "multiple-choice",
    prompt: "Which game is played at 'The International', one of the richest esports tournaments?",
    options: ["League of Legends", "Dota 2", "Counter-Strike", "Fortnite"],
    correctIndex: 1,
    explanation: "The International is Dota 2's flagship event, famous for record prize pools.",
  },
  {
    sport: "esports",
    difficulty: "medium",
    quizType: "guess-player",
    clues: [
      "South Korean League of Legends mid laner",
      "Widely called the greatest LoL player ever",
      "Multiple-time world champion with T1",
    ],
    answer: "Faker",
    acceptableAnswers: ["faker", "lee sang-hyeok", "lee sanghyeok"],
    explanation:
      "Faker (Lee Sang-hyeok) has won multiple World Championships with SK Telecom T1 / T1.",
  },
  {
    sport: "esports",
    difficulty: "hard",
    quizType: "timeline",
    prompt: "Order these esports milestones chronologically (earliest first).",
    events: [
      "StarCraft: Brood War pro scene booms in Korea (early 2000s)",
      "First League of Legends World Championship (2011)",
      "Dota 2's The International tops $20M prize pool (2016)",
      "First Fortnite World Cup (2019)",
    ],
    explanation:
      "Brood War era came first, then LoL Worlds 2011, TI's $20M pool in 2016, Fortnite World Cup 2019.",
  },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function entryKey(q: BankEntry): string {
  return (
    "prompt" in q ? q.prompt : "statement" in q ? q.statement : "fixture" in q ? q.fixture : q.answer
  ).toLowerCase();
}

/**
 * Pick a bank question, preferring exact sport+difficulty+type match and
 * progressively relaxing constraints so we always return something.
 *
 * The requested sport is never relaxed — serving a different sport than the
 * one the player picked is worse than repeating a question. `sessionExclude`
 * (questions already asked this game) is only relaxed as an absolute last
 * resort, while `exclude` (historical seen) is relaxed once the unseen pool
 * for the sport runs out.
 */
export function pickFromBank(
  sport: Sport,
  difficulty: Difficulty,
  quizType?: QuizType,
  exclude: string[] = [],
  sessionExclude: string[] = []
): Question {
  const excluded = new Set(exclude.map((e) => e.toLowerCase()));
  const thisRun = new Set(sessionExclude.map((e) => e.toLowerCase()));
  const notAsked = (q: BankEntry) => !excluded.has(entryKey(q));
  const notThisRun = (q: BankEntry) => !thisRun.has(entryKey(q));

  const tiers: ((q: BankEntry) => boolean)[] = [
    (q) => q.difficulty === difficulty && (!quizType || q.quizType === quizType) && notAsked(q),
    (q) => (!quizType || q.quizType === quizType) && notAsked(q),
    (q) => notAsked(q),
    // Historical repeats are OK once everything has been seen, but never
    // repeat a question from the current game.
    () => true,
  ];

  for (const tier of tiers) {
    const candidates = BANK.filter((q) => q.sport === sport && tier(q) && notThisRun(q));
    if (candidates.length > 0) {
      const chosen = shuffle(candidates)[0];
      return {
        ...chosen,
        id: crypto.randomUUID(),
        source: "bank",
      } as Question;
    }
  }
  // The sport's entire bank was asked this very game — repeat rather than fail.
  const chosen = shuffle(BANK.filter((q) => q.sport === sport))[0];
  return { ...chosen, id: crypto.randomUUID(), source: "bank" } as Question;
}
