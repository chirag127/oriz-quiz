// SM-2 spaced-repetition + quiz scoring — pure functions, no side effects.

export interface Card {
  id: string
  front: string
  back: string
  // SM-2 state
  ease: number // easiness factor, >= 1.3
  interval: number // days until next review
  reps: number // successful reps in a row
  due: number // epoch ms of next review
}

export interface Deck {
  id: string
  title: string
  createdAt: number
  cards: Card[]
}

export interface Question {
  q: string
  options: string[]
  answer: number // index into options
  explanation?: string
}

export type Grade = 0 | 1 | 2 | 3 | 4 | 5

const DAY = 86_400_000

/**
 * SM-2 update. grade 0-5 (>=3 = recalled). Returns a NEW card; input untouched.
 * https://super-memory.com/english/ol/sm2.htm
 */
export function schedule(card: Card, grade: Grade, now = Date.now()): Card {
  let { ease, interval, reps } = card
  if (grade < 3) {
    reps = 0
    interval = 1
  } else {
    reps += 1
    if (reps === 1) interval = 1
    else if (reps === 2) interval = 6
    else interval = Math.round(interval * ease)
    ease = ease + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02))
    if (ease < 1.3) ease = 1.3
  }
  return { ...card, ease, interval, reps, due: now + interval * DAY }
}

export function newCard(id: string, front: string, back: string, now = Date.now()): Card {
  return { id, front, back, ease: 2.5, interval: 0, reps: 0, due: now }
}

/** Cards due for review at `now`, soonest first. */
export function dueCards(deck: Deck, now = Date.now()): Card[] {
  return deck.cards.filter((c) => c.due <= now).sort((a, b) => a.due - b.due)
}

export interface QuizResult {
  correct: number
  total: number
  percent: number
  wrong: { index: number; chosen: number; question: Question }[]
}

/** Score a set of answers (index chosen per question; -1 = skipped). */
export function scoreQuiz(questions: Question[], chosen: number[]): QuizResult {
  const wrong: QuizResult['wrong'] = []
  let correct = 0
  questions.forEach((question, index) => {
    if (chosen[index] === question.answer) correct += 1
    else wrong.push({ index, chosen: chosen[index] ?? -1, question })
  })
  const total = questions.length
  return { correct, total, percent: total ? Math.round((correct / total) * 100) : 0, wrong }
}

/** Fisher-Yates shuffle — returns a new array. */
export function shuffle<T>(arr: readonly T[], rng: () => number = Math.random): T[] {
  const out = arr.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/** Shuffle a question's options, keeping `answer` pointing at the right one. */
export function shuffleQuestion(q: Question, rng: () => number = Math.random): Question {
  const paired = q.options.map((text, i) => ({ text, correct: i === q.answer }))
  const mixed = shuffle(paired, rng)
  return {
    ...q,
    options: mixed.map((p) => p.text),
    answer: mixed.findIndex((p) => p.correct),
  }
}
