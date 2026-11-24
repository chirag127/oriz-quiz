import { describe, expect, it } from 'vitest'
import { cardPrompt, extractJson, parseCards, parseQuiz, quizPrompt } from '../src/lib/generate'

describe('extractJson', () => {
  it('parses bare JSON', () => {
    expect(extractJson('{"a":1}')).toEqual({ a: 1 })
  })
  it('strips ```json fences', () => {
    expect(extractJson('```json\n{"a":2}\n```')).toEqual({ a: 2 })
  })
  it('ignores leading prose', () => {
    expect(extractJson('Here you go: {"a":3} enjoy')).toEqual({ a: 3 })
  })
  it('throws when no object', () => {
    expect(() => extractJson('no json here')).toThrow()
  })
})

describe('parseQuiz', () => {
  it('keeps valid questions, drops malformed', () => {
    const data = {
      questions: [
        { q: 'good', options: ['a', 'b', 'c', 'd'], answer: 1, explanation: 'e' },
        { q: 'bad-answer', options: ['a', 'b'], answer: 9 },
        { q: 'no-options', answer: 0 },
      ],
    }
    const out = parseQuiz(data)
    expect(out).toHaveLength(1)
    expect(out[0].q).toBe('good')
  })
  it('throws when none valid', () => {
    expect(() => parseQuiz({ questions: [{ q: 'x' }] })).toThrow()
  })
  it('throws when questions missing', () => {
    expect(() => parseQuiz({})).toThrow('missing questions')
  })
})

describe('parseCards', () => {
  it('keeps well-formed pairs', () => {
    const out = parseCards({ cards: [{ front: 'f', back: 'b' }, { front: '', back: 'x' }] })
    expect(out).toHaveLength(1)
  })
  it('throws when none valid', () => {
    expect(() => parseCards({ cards: [] })).toThrow()
  })
})

describe('prompts', () => {
  it('quizPrompt embeds count + difficulty + source', () => {
    const p = quizPrompt('MATTER', 5, 'hard')
    expect(p).toContain('5')
    expect(p).toContain('hard')
    expect(p).toContain('MATTER')
  })
  it('cardPrompt embeds count + source', () => {
    expect(cardPrompt('WATER', 7)).toContain('7')
  })
})

describe('malformed AI records', () => {
  it('skips null, primitive and array quiz entries without losing valid questions', () => {
    const valid = { q: 'good', options: ['a', 'b'], answer: 1 }
    expect(parseQuiz({ questions: [null, undefined, 3, 'bad', [], valid] }))
      .toEqual([{ ...valid, explanation: undefined }])
  })

  it('rejects fractional, non-finite and out-of-range answer indices', () => {
    for (const answer of [0.5, NaN, Infinity, -1, 2]) {
      expect(() => parseQuiz({ questions: [{ q: 'bad', options: ['a', 'b'], answer }] }))
        .toThrow('no valid questions parsed')
    }
  })

  it('accepts both integer answer boundaries', () => {
    for (const answer of [0, 1]) {
      expect(parseQuiz({ questions: [{ q: 'valid', options: ['a', 'b'], answer }] })[0].answer)
        .toBe(answer)
    }
  })

  it('skips null, primitive and array flashcard entries', () => {
    expect(parseCards({ cards: [null, undefined, 3, 'bad', [], { front: 'f', back: 'b' }] }))
      .toEqual([{ front: 'f', back: 'b' }])
  })

  it('reports validation errors when only malformed entries remain', () => {
    expect(() => parseQuiz({ questions: [null] })).toThrow('no valid questions parsed')
    expect(() => parseCards({ cards: [null] })).toThrow('no valid cards parsed')
  })
})
