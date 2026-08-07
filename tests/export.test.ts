import { describe, expect, it } from 'vitest'
import { deckToCsv, quizToJson, quizToText } from '../src/lib/export'
import { newCard, type Deck, type Question } from '../src/lib/srs'

const deck: Deck = {
  id: 'd', title: 't', createdAt: 0,
  cards: [newCard('1', 'Front, one', 'Back "quote"'), newCard('2', 'F2', 'B2')],
}
const qs: Question[] = [{ q: 'Q1', options: ['a', 'b'], answer: 1, explanation: 'because b' }]

describe('deckToCsv', () => {
  it('has header + escapes commas/quotes', () => {
    const csv = deckToCsv(deck)
    expect(csv.split('\n')[0]).toBe('front,back')
    expect(csv).toContain('"Front, one"')
    expect(csv).toContain('"Back ""quote"""')
  })
})

describe('quizToText', () => {
  it('renders lettered options + answer key', () => {
    const txt = quizToText(qs)
    expect(txt).toContain('1. Q1')
    expect(txt).toContain('A. a')
    expect(txt).toContain('Answer: B')
    expect(txt).toContain('because b')
  })
})

describe('quizToJson', () => {
  it('round-trips', () => {
    expect(JSON.parse(quizToJson(qs)).questions[0].q).toBe('Q1')
  })
})
