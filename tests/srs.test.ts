import { describe, expect, it } from 'vitest'
import { dueCards, newCard, schedule, scoreQuiz, shuffle, shuffleQuestion, type Deck, type Question } from '../src/lib/srs'

const q = (): Question => ({ q: 'x', options: ['a', 'b', 'c', 'd'], answer: 2, explanation: 'e' })

describe('schedule (SM-2)', () => {
  it('resets reps + interval on a fail (grade < 3)', () => {
    const c = { ...newCard('1', 'f', 'b'), reps: 5, interval: 40 }
    const r = schedule(c, 1, 0)
    expect(r.reps).toBe(0)
    expect(r.interval).toBe(1)
  })
  it('first success interval = 1 day, second = 6', () => {
    let c = newCard('1', 'f', 'b', 0)
    c = schedule(c, 4, 0)
    expect(c.interval).toBe(1)
    c = schedule(c, 4, 0)
    expect(c.interval).toBe(6)
  })
  it('ease never drops below 1.3', () => {
    let c = newCard('1', 'f', 'b')
    for (let i = 0; i < 10; i++) c = schedule(c, 3)
    expect(c.ease).toBeGreaterThanOrEqual(1.3)
  })
  it('does not mutate input', () => {
    const c = newCard('1', 'f', 'b')
    const before = { ...c }
    schedule(c, 5)
    expect(c).toEqual(before)
  })
})

describe('dueCards', () => {
  it('returns only cards due at now, soonest first', () => {
    const d: Deck = {
      id: 'd', title: 't', createdAt: 0,
      cards: [
        { ...newCard('a', '', ''), due: 100 },
        { ...newCard('b', '', ''), due: 50 },
        { ...newCard('c', '', ''), due: 999 },
      ],
    }
    expect(dueCards(d, 200).map((c) => c.id)).toEqual(['b', 'a'])
  })
})

describe('scoreQuiz', () => {
  it('scores correct/percent and collects wrong', () => {
    const qs = [q(), q(), q()]
    const r = scoreQuiz(qs, [2, 0, 2])
    expect(r.correct).toBe(2)
    expect(r.percent).toBe(67)
    expect(r.wrong).toHaveLength(1)
    expect(r.wrong[0].index).toBe(1)
  })
  it('handles skipped (-1) and empty quiz', () => {
    expect(scoreQuiz([q()], []).wrong[0].chosen).toBe(-1)
    expect(scoreQuiz([], []).percent).toBe(0)
  })
})

describe('shuffle', () => {
  it('keeps all elements, seeded rng deterministic', () => {
    const seq = [0.9, 0.1, 0.5, 0.3]
    let i = 0
    const rng = () => seq[i++ % seq.length]
    const out = shuffle([1, 2, 3, 4], rng)
    expect(out.slice().sort()).toEqual([1, 2, 3, 4])
  })
})

describe('shuffleQuestion', () => {
  it('answer index still points at the correct option', () => {
    const original = q()
    const correctText = original.options[original.answer]
    for (let i = 0; i < 20; i++) {
      const s = shuffleQuestion(original)
      expect(s.options[s.answer]).toBe(correctText)
      expect(s.options.slice().sort()).toEqual(original.options.slice().sort())
    }
  })
})
