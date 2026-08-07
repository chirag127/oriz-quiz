// Export helpers — pure string builders (unit-tested) + a browser download.
import type { Deck, Question } from './srs'

const esc = (v: string): string => `"${v.replace(/"/g, '""')}"`

/** Flashcards -> CSV (front,back) — Anki/Quizlet friendly. */
export function deckToCsv(deck: Deck): string {
  const rows = deck.cards.map((c) => `${esc(c.front)},${esc(c.back)}`)
  return ['front,back', ...rows].join('\n')
}

/** Quiz -> plain-text answer key. */
export function quizToText(questions: Question[]): string {
  return questions
    .map((q, i) => {
      const opts = q.options.map((o, j) => `  ${String.fromCharCode(65 + j)}. ${o}`).join('\n')
      const key = `  Answer: ${String.fromCharCode(65 + q.answer)}`
      const why = q.explanation ? `\n  Why: ${q.explanation}` : ''
      return `${i + 1}. ${q.q}\n${opts}\n${key}${why}`
    })
    .join('\n\n')
}

export function quizToJson(questions: Question[]): string {
  return JSON.stringify({ questions }, null, 2)
}

/** Trigger a client-side download via oz-file. */
export async function download(filename: string, content: string, type: string): Promise<void> {
  const { downloadBlob } = await import('@chirag127/oz-file')
  downloadBlob(new Blob([content], { type }), filename)
}
