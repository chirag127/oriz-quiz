import { useCallback, useEffect, useRef, useState } from 'react'
import type { Card, Deck, Grade, Question } from '../lib/srs'
import { dueCards, newCard, schedule, scoreQuiz, shuffleQuestion } from '../lib/srs'
import { generateCards, generateQuiz, type FlashPair } from '../lib/generate'
import { allDecks, deleteDeck, getDeck, saveDeck } from '../lib/db'
import { deckToCsv, download, quizToJson, quizToText } from '../lib/export'
import { confettiBurst } from '../lib/confetti'

type Mode = 'quiz' | 'cards'
type Stage = 'setup' | 'loading' | 'quiz' | 'result' | 'review'

const uid = (): string =>
  (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`)

const SAMPLE = `The water cycle moves water through evaporation, condensation, precipitation, and collection. The sun heats water in oceans and lakes, turning it into vapor (evaporation). Vapor rises, cools, and forms clouds (condensation). When clouds get heavy, water falls as rain or snow (precipitation). Water collects in rivers, lakes, and groundwater, then the cycle repeats.`

export default function QuizApp() {
  const [mode, setMode] = useState<Mode>('quiz')
  const [stage, setStage] = useState<Stage>('setup')
  const [source, setSource] = useState('')
  const [count, setCount] = useState(8)
  const [difficulty, setDifficulty] = useState('medium')
  const [model, setModel] = useState('')
  const [models, setModels] = useState<string[]>([])
  const [error, setError] = useState('')
  const abortRef = useRef<AbortController | null>(null)

  // quiz state
  const [questions, setQuestions] = useState<Question[]>([])
  const [qi, setQi] = useState(0)
  const [chosen, setChosen] = useState<number[]>([])
  const [locked, setLocked] = useState(false)
  const [streak, setStreak] = useState(0)

  // deck / review state
  const [decks, setDecks] = useState<Deck[]>([])
  const [deck, setDeck] = useState<Deck | null>(null)
  const [reviewQueue, setReviewQueue] = useState<Card[]>([])
  const [flipped, setFlipped] = useState(false)

  useEffect(() => { allDecks().then(setDecks).catch(() => {}) }, [])

  const loadModels = useCallback(async () => {
    try {
      const { listModels } = await import('@chirag127/oz-ai')
      setModels(await listModels())
    } catch { /* AI optional */ }
  }, [])
  useEffect(() => { loadModels() }, [loadModels])

  const generate = useCallback(async () => {
    const text = source.trim() || SAMPLE
    setError('')
    setStage('loading')
    abortRef.current = new AbortController()
    try {
      if (mode === 'quiz') {
        const qs = await generateQuiz(text, {
          count, difficulty, model: model || undefined, signal: abortRef.current.signal,
        })
        setQuestions(qs.map(shuffleQuestion))
        setQi(0); setChosen([]); setLocked(false); setStreak(0)
        setStage('quiz')
      } else {
        const pairs = await generateCards(text, { count, difficulty, model: model || undefined, signal: abortRef.current.signal })
        const d: Deck = {
          id: uid(),
          title: text.slice(0, 40).replace(/\s+/g, ' ').trim() || 'Untitled deck',
          createdAt: Date.now(),
          cards: pairs.map((p: FlashPair) => newCard(uid(), p.front, p.back)),
        }
        await saveDeck(d)
        setDecks(await allDecks())
        startReview(d)
      }
    } catch (e) {
      setError(
        e instanceof Error && e.message === 'aborted'
          ? 'Cancelled.'
          : 'AI could not generate right now (all providers busy). Try again, pick another model, or use the sample.',
      )
      setStage('setup')
    }
  }, [source, mode, count, difficulty, model])

  // --- quiz flow ---
  function answer(idx: number) {
    if (locked) return
    const next = chosen.slice(); next[qi] = idx; setChosen(next)
    setLocked(true)
    const correct = idx === questions[qi].answer
    if (correct) {
      const s = streak + 1; setStreak(s)
      if (s >= 3) confettiBurst()
    } else setStreak(0)
  }
  function nextQuestion() {
    if (qi + 1 >= questions.length) { setStage('result'); if (scoreQuiz(questions, chosen).percent === 100) confettiBurst(200) }
    else { setQi(qi + 1); setLocked(false) }
  }

  // --- review flow ---
  function startReview(d: Deck) {
    const q = dueCards(d); setDeck(d)
    setReviewQueue(q.length ? q : d.cards.slice())
    setFlipped(false); setStage('review'); setError('')
  }
  async function gradeCard(g: Grade) {
    if (!deck || !reviewQueue.length) return
    const card = reviewQueue[0]
    const updated = schedule(card, g)
    const nextDeck: Deck = { ...deck, cards: deck.cards.map((c) => (c.id === card.id ? updated : c)) }
    await saveDeck(nextDeck)
    setDeck(nextDeck)
    setDecks(await allDecks())
    setReviewQueue(reviewQueue.slice(1))
    setFlipped(false)
  }
  async function removeDeck(id: string) {
    await deleteDeck(id); setDecks(await allDecks())
    if (deck?.id === id) { setDeck(null); setStage('setup') }
  }

  const result = stage === 'result' ? scoreQuiz(questions, chosen) : null

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-24">
      <ModeTabs mode={mode} setMode={(m) => { setMode(m); setStage('setup'); setError('') }} disabled={stage === 'loading'} />

      {stage === 'setup' && (
        <SetupPanel
          {...{ source, setSource, count, setCount, difficulty, setDifficulty, model, setModel, models, mode }}
          onGenerate={generate}
          error={error}
        />
      )}

      {stage === 'loading' && (
        <div className="slate mt-6 grid place-items-center gap-4 p-12 text-center">
          <div className="marker text-2xl text-[var(--chalk-yellow)] animate-pulse">thinking...</div>
          <p className="text-[var(--oz-muted)]">Writing your {mode === 'quiz' ? 'quiz' : 'flashcards'} with AI</p>
          <button className="option-btn slate px-4 py-2" onClick={() => abortRef.current?.abort()}>Cancel</button>
        </div>
      )}

      {stage === 'quiz' && questions[qi] && (
        <QuizView
          question={questions[qi]} index={qi} total={questions.length}
          chosen={chosen[qi]} locked={locked} streak={streak}
          onAnswer={answer} onNext={nextQuestion}
        />
      )}

      {stage === 'result' && result && (
        <ResultView result={result} questions={questions}
          onRetry={() => { setQi(0); setChosen([]); setLocked(false); setStreak(0); setStage('quiz') }}
          onNew={() => setStage('setup')}
        />
      )}

      {stage === 'review' && deck && (
        <ReviewView
          deck={deck} queue={reviewQueue} flipped={flipped}
          onFlip={() => setFlipped((f) => !f)} onGrade={gradeCard}
          onDone={() => setStage('setup')}
        />
      )}

      {stage === 'setup' && decks.length > 0 && (
        <SavedDecks decks={decks} onOpen={(d) => { getDeck(d.id).then((full) => full && startReview(full)) }} onDelete={removeDeck} />
      )}
    </div>
  )
}


function ModeTabs({ mode, setMode, disabled }: { mode: Mode; setMode: (m: Mode) => void; disabled: boolean }) {
  return (
    <div className="mt-6 flex gap-2" role="tablist" aria-label="Tool mode">
      {(['quiz', 'cards'] as Mode[]).map((m) => (
        <button key={m} role="tab" aria-selected={mode === m} disabled={disabled}
          onClick={() => setMode(m)}
          className={`marker rounded-t-xl border-2 px-5 py-2 text-lg transition ${
            mode === m ? 'border-[var(--chalk-yellow)] bg-[var(--oz-surface)] text-[var(--chalk-yellow)]'
              : 'border-transparent text-[var(--oz-muted)] hover:text-[var(--oz-fg)]'}`}>
          {m === 'quiz' ? 'MCQ Quiz' : 'Flashcards'}
        </button>
      ))}
    </div>
  )
}

function SetupPanel(p: any) {
  return (
    <section className="slate mt-0 grid gap-4 rounded-tl-none p-5 md:p-6">
      <label className="grid gap-2">
        <span className="marker text-[var(--chalk-yellow)]">Paste your notes or a topic</span>
        <textarea className="field min-h-40 w-full resize-y p-3" value={p.source}
          onChange={(e) => p.setSource(e.target.value)}
          placeholder="e.g. Paste a chapter, or type: 'The French Revolution causes and outcomes'" />
      </label>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="grid gap-1 text-sm">
          <span className="text-[var(--oz-muted)]">How many</span>
          <input type="number" min={3} max={30} value={p.count} className="field p-2"
            onChange={(e) => p.setCount(Math.max(3, Math.min(30, +e.target.value || 8)))} />
        </label>
        {p.mode === 'quiz' && (
          <label className="grid gap-1 text-sm">
            <span className="text-[var(--oz-muted)]">Difficulty</span>
            <select className="field p-2" value={p.difficulty} onChange={(e) => p.setDifficulty(e.target.value)}>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </label>
        )}
        <label className="grid gap-1 text-sm">
          <span className="text-[var(--oz-muted)]">AI model</span>
          <select className="field p-2" value={p.model} onChange={(e) => p.setModel(e.target.value)}>
            <option value="">Auto (failover)</option>
            {p.models.map((m: string) => <option key={m} value={m}>{m}</option>)}
          </select>
        </label>
      </div>
      {p.error && <p className="rounded-md border-2 border-[var(--oz-accent)] bg-[rgba(226,59,59,0.12)] p-3 text-sm">{p.error}</p>}
      <div className="flex flex-wrap items-center gap-3">
        <button className="buzzer px-8 py-3 text-lg" onClick={p.onGenerate}>
          {p.mode === 'quiz' ? 'Make quiz' : 'Make cards'}
        </button>
        <button className="marker text-[var(--chalk-blue)] underline" onClick={() => p.setSource('')}>Clear</button>
        <span className="text-xs text-[var(--oz-muted)]">Empty = uses a sample topic.</span>
      </div>
    </section>
  )
}

function QuizView(p: {
  question: Question; index: number; total: number; chosen?: number; locked: boolean; streak: number
  onAnswer: (i: number) => void; onNext: () => void
}) {
  return (
    <section className="slate mt-6 grid gap-5 p-5 md:p-7">
      <div className="flex items-center justify-between text-sm">
        <span className="marker text-[var(--chalk-yellow)]">Q{p.index + 1} / {p.total}</span>
        <span aria-live="polite" className="marker text-lg">
          {p.streak >= 2 && <span className="text-[var(--chalk-yellow)]">{'*'.repeat(Math.min(p.streak, 5))} {p.streak} streak!</span>}
        </span>
      </div>
      <h2 className="text-xl md:text-2xl">{p.question.q}</h2>
      <div className="grid gap-3">
        {p.question.options.map((opt, i) => {
          const isChosen = p.chosen === i
          const isCorrect = i === p.question.answer
          const cls = !p.locked ? '' : isCorrect ? 'option-correct' : isChosen ? 'option-wrong' : 'opacity-60'
          return (
            <button key={i} disabled={p.locked} onClick={() => p.onAnswer(i)}
              className={`option-btn slate flex items-center gap-3 p-3 text-left ${cls}`}>
              <span className="marker grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 border-[var(--oz-border)]">
                {String.fromCharCode(65 + i)}
              </span>
              <span>{opt}</span>
            </button>
          )
        })}
      </div>
      {p.locked && (
        <div className="grid gap-3">
          {p.question.explanation && (
            <p className="rounded-md border-l-4 border-[var(--chalk-blue)] bg-[rgba(0,0,0,0.2)] p-3 text-sm">
              <b className="marker text-[var(--chalk-blue)]">Why:</b> {p.question.explanation}
            </p>
          )}
          <button className="buzzer self-start px-6 py-2" onClick={p.onNext}>
            {p.index + 1 >= p.total ? 'See score' : 'Next'}
          </button>
        </div>
      )}
    </section>
  )
}

function ResultView(p: { result: ReturnType<typeof scoreQuiz>; questions: Question[]; onRetry: () => void; onNew: () => void }) {
  const grade = p.result.percent >= 90 ? 'Top of the class!' : p.result.percent >= 70 ? 'Solid work.' : p.result.percent >= 50 ? 'Keep studying.' : 'Back to the board.'
  return (
    <section className="slate mt-6 grid gap-5 p-6 text-center">
      <div className="chalk-underline mx-auto">
        <div className="marker text-6xl text-[var(--chalk-yellow)]">{p.result.percent}%</div>
      </div>
      <p className="text-lg">{p.result.correct} / {p.result.total} correct — <span className="marker">{grade}</span></p>
      {p.result.wrong.length > 0 && (
        <details className="text-left">
          <summary className="marker cursor-pointer text-[var(--chalk-blue)]">Review {p.result.wrong.length} missed</summary>
          <ul className="mt-3 grid gap-3">
            {p.result.wrong.map((w) => (
              <li key={w.index} className="slate p-3 text-sm">
                <p className="font-semibold">{w.question.q}</p>
                <p className="option-correct mt-1 rounded p-1">Correct: {w.question.options[w.question.answer]}</p>
                {w.question.explanation && <p className="mt-1 text-[var(--oz-muted)]">{w.question.explanation}</p>}
              </li>
            ))}
          </ul>
        </details>
      )}
      <div className="flex flex-wrap justify-center gap-3">
        <button className="buzzer px-6 py-2" onClick={p.onRetry}>Retry</button>
        <button className="option-btn slate px-5 py-2" onClick={() => download('quiz.txt', quizToText(p.questions), 'text/plain')}>Export TXT</button>
        <button className="option-btn slate px-5 py-2" onClick={() => download('quiz.json', quizToJson(p.questions), 'application/json')}>Export JSON</button>
        <button className="option-btn slate px-5 py-2" onClick={p.onNew}>New</button>
      </div>
    </section>
  )
}

function ReviewView(p: {
  deck: Deck; queue: Card[]; flipped: boolean
  onFlip: () => void; onGrade: (g: Grade) => void; onDone: () => void
}) {
  const card = p.queue[0]
  if (!card) {
    return (
      <section className="slate mt-6 grid gap-4 p-8 text-center">
        <div className="marker text-3xl text-[var(--chalk-yellow)]">Deck done!</div>
        <p>All due cards reviewed. Come back later — spaced repetition schedules the rest.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <button className="option-btn slate px-5 py-2" onClick={() => download(`${p.deck.title}.csv`, deckToCsv(p.deck), 'text/csv')}>Export CSV</button>
          <button className="buzzer px-6 py-2" onClick={p.onDone}>Done</button>
        </div>
      </section>
    )
  }
  return (
    <section className="mt-6 grid gap-4">
      <div className="flex items-center justify-between text-sm">
        <span className="marker text-[var(--chalk-yellow)]">{p.deck.title}</span>
        <span className="text-[var(--oz-muted)]">{p.queue.length} left</span>
      </div>
      <button className={`flip slate aspect-[3/2] w-full text-center text-xl ${p.flipped ? 'is-flipped' : ''}`}
        onClick={p.onFlip} aria-label="Flip card">
        <div className="flip-inner h-full">
          <div className="flip-face"><span>{card.front}</span></div>
          <div className="flip-face flip-back"><span className="text-[var(--chalk-yellow)]">{card.back}</span></div>
        </div>
      </button>
      {!p.flipped ? (
        <button className="buzzer mx-auto px-8 py-2" onClick={p.onFlip}>Show answer</button>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          {([['Again', 0], ['Hard', 3], ['Good', 4], ['Easy', 5]] as [string, Grade][]).map(([label, g]) => (
            <button key={label} className="option-btn slate py-3" onClick={() => p.onGrade(g)}>
              <span className="marker">{label}</span>
            </button>
          ))}
        </div>
      )}
      <button className="marker mx-auto text-[var(--chalk-blue)] underline" onClick={p.onDone}>Exit deck</button>
    </section>
  )
}

function SavedDecks({ decks, onOpen, onDelete }: { decks: Deck[]; onOpen: (d: Deck) => void; onDelete: (id: string) => void }) {
  return (
    <section className="mt-10 grid gap-3">
      <h2 className="chalk-underline marker w-fit text-2xl text-[var(--chalk-yellow)]">Saved decks</h2>
      <ul className="grid gap-2">
        {decks.map((d) => {
          const due = dueCards(d).length
          return (
            <li key={d.id} className="slate flex items-center justify-between gap-3 p-3">
              <button className="text-left" onClick={() => onOpen(d)}>
                <span className="font-semibold">{d.title}</span>
                <span className="ml-2 text-sm text-[var(--oz-muted)]">{d.cards.length} cards · {due} due</span>
              </button>
              <button className="option-btn slate px-3 py-1 text-sm" onClick={() => onDelete(d.id)} aria-label={`Delete ${d.title}`}>Delete</button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

