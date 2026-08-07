// AI generation — build prompts, parse JSON out of an LLM response. Pure/parse
// fns are unit-tested; the network call lives in generate().
import type { Question } from './srs'

export interface FlashPair {
  front: string
  back: string
}

const QUIZ_SYSTEM =
  'You are a rigorous quiz author. Reply with ONLY valid JSON, no prose, no code fences. ' +
  'Shape: {"questions":[{"q":string,"options":[string,string,string,string],"answer":number,"explanation":string}]}. ' +
  '"answer" is the 0-based index of the correct option. Exactly 4 options each. ' +
  'Explanations are one sentence and say WHY the answer is right.'

const CARD_SYSTEM =
  'You are a flashcard author. Reply with ONLY valid JSON, no prose, no code fences. ' +
  'Shape: {"cards":[{"front":string,"back":string}]}. Front = a prompt/term, back = concise answer.'

export function quizPrompt(source: string, count: number, difficulty: string): string {
  return `Create ${count} ${difficulty} multiple-choice questions from the material below. Cover distinct facts; avoid trivially-easy or duplicate questions.\n\nMATERIAL:\n${source}`
}

export function cardPrompt(source: string, count: number): string {
  return `Create ${count} flashcards from the material below. One idea per card. Keep backs short.\n\nMATERIAL:\n${source}`
}

/** Strip code fences / leading prose and pull the first JSON object out. */
export function extractJson(raw: string): unknown {
  let s = raw.trim()
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fence) s = fence[1].trim()
  const start = s.indexOf('{')
  const end = s.lastIndexOf('}')
  if (start === -1 || end === -1 || end < start) throw new Error('no JSON object in response')
  return JSON.parse(s.slice(start, end + 1))
}

/** Validate + normalize the quiz JSON into Question[]. Throws on bad shape. */
export function parseQuiz(data: unknown): Question[] {
  const arr = (data as { questions?: unknown })?.questions
  if (!Array.isArray(arr)) throw new Error('missing questions[]')
  const out: Question[] = []
  for (const it of arr) {
    const q = it as Partial<Question>
    if (
      typeof q.q === 'string' &&
      Array.isArray(q.options) &&
      q.options.length >= 2 &&
      q.options.every((o) => typeof o === 'string') &&
      typeof q.answer === 'number' &&
      q.answer >= 0 &&
      q.answer < q.options.length
    ) {
      out.push({
        q: q.q,
        options: q.options,
        answer: q.answer,
        explanation: typeof q.explanation === 'string' ? q.explanation : undefined,
      })
    }
  }
  if (!out.length) throw new Error('no valid questions parsed')
  return out
}

export function parseCards(data: unknown): FlashPair[] {
  const arr = (data as { cards?: unknown })?.cards
  if (!Array.isArray(arr)) throw new Error('missing cards[]')
  const out: FlashPair[] = []
  for (const it of arr) {
    const c = it as Partial<FlashPair>
    if (typeof c.front === 'string' && typeof c.back === 'string' && c.front && c.back)
      out.push({ front: c.front, back: c.back })
  }
  if (!out.length) throw new Error('no valid cards parsed')
  return out
}

export interface GenOptions {
  count: number
  difficulty: string
  model?: string
  signal?: AbortSignal
}

/** Generate quiz questions via oz-ai. Lazy-imports the AI package. */
export async function generateQuiz(source: string, opts: GenOptions): Promise<Question[]> {
  const { complete } = await import('@chirag127/oz-ai')
  const raw = await complete(quizPrompt(source, opts.count, opts.difficulty), {
    system: QUIZ_SYSTEM,
    model: opts.model,
    signal: opts.signal,
    temperature: 0.4,
  })
  return parseQuiz(extractJson(raw))
}

/** Generate flashcards via oz-ai. */
export async function generateCards(source: string, opts: GenOptions): Promise<FlashPair[]> {
  const { complete } = await import('@chirag127/oz-ai')
  const raw = await complete(cardPrompt(source, opts.count), {
    system: CARD_SYSTEM,
    model: opts.model,
    signal: opts.signal,
    temperature: 0.4,
  })
  return parseCards(extractJson(raw))
}

/** Explain why a specific answer is correct (used when the deck lacks one). */
export async function explainAnswer(question: Question, model?: string): Promise<string> {
  const { complete } = await import('@chirag127/oz-ai')
  const correct = question.options[question.answer]
  return complete(
    `Question: ${question.q}\nCorrect answer: ${correct}\nExplain in ONE sentence why this is correct.`,
    { system: 'You are a concise tutor. One sentence, no preamble.', model },
  )
}
