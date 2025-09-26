'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

type Quiz = {
  _id: string
  title: string
  subject: string
  questions: { question: string; options: string[]; correctIndex: number; difficulty?: 'easy'|'medium'|'hard' }[]
  resultsAnnounced?: boolean
  durationMinutes?: number
  questionLimit?: number
}

export default function QuizPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [loading, setLoading] = useState(true)
  const [answers, setAnswers] = useState<number[]>([])
  const [orderedQuestions, setOrderedQuestions] = useState<Quiz['questions']>([])
  const [current, setCurrent] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [studentId, setStudentId] = useState<string>('')
  const [timeLeft, setTimeLeft] = useState<number | null>(null) // seconds (counts down only after start)
  const [initialSeconds, setInitialSeconds] = useState<number | null>(null)
  const [timeUp, setTimeUp] = useState<boolean>(false)
  const [acceptedChecked, setAcceptedChecked] = useState<boolean>(false)
  const [started, setStarted] = useState<boolean>(false)
  const [starting, setStarting] = useState<boolean>(false)
  const [nextLoading, setNextLoading] = useState<boolean>(false)
  const [toasts, setToasts] = useState<{ id: number; type: 'info'|'success'|'warning'|'error'; text: string }[]>([])

  const id = params.id

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/quizzes?id=${encodeURIComponent(id)}`, { cache: 'no-store' })
        const json = await res.json()
        if (json?.ok && json.data && mounted) {
          const qz: Quiz = json.data
          setQuiz(qz)
          // Build difficulty-based randomized order: cycle E -> M -> H, pulling from shuffled pools
          const qs = Array.isArray(qz.questions) ? qz.questions.slice() : []
          const limit = Math.max(1, Math.min(qs.length, (qz.questionLimit || qs.length)))
          const easy = qs.filter(q => (q.difficulty || 'easy') === 'easy').sort(() => Math.random() - 0.5)
          const med = qs.filter(q => (q.difficulty || 'easy') === 'medium').sort(() => Math.random() - 0.5)
          const hard = qs.filter(q => (q.difficulty || 'easy') === 'hard').sort(() => Math.random() - 0.5)
          const sequence: ('easy'|'medium'|'hard')[] = []
          for (let i = 0; i < limit; i++) {
            const mod = i % 3
            sequence.push(mod === 0 ? 'easy' : mod === 1 ? 'medium' : 'hard')
          }
          const out: Quiz['questions'] = []
          for (const slot of sequence) {
            let picked: any = null
            if (slot === 'easy' && easy.length) picked = easy.shift()
            else if (slot === 'medium' && med.length) picked = med.shift()
            else if (slot === 'hard' && hard.length) picked = hard.shift()
            if (!picked) {
              // fallback: pick from any available pool
              const pools = [easy, med, hard].filter(p => p.length)
              if (pools.length) picked = pools[Math.floor(Math.random()*pools.length)].shift()
            }
            if (picked) out.push(picked)
            if (out.length >= limit) break
          }
          // If still short due to empty pools, pull any leftovers randomly until limit
          if (out.length < limit) {
            const leftovers = [...easy, ...med, ...hard].sort(() => Math.random() - 0.5)
            while (out.length < limit && leftovers.length) out.push(leftovers.shift() as any)
          }
          setOrderedQuestions(out)
          setAnswers(new Array(out.length).fill(-1))
          setCurrent(0)
          // Setup countdown initial value. Timer will start after user clicks Continue.
          if (qz.durationMinutes && qz.durationMinutes > 0) {
            setInitialSeconds(qz.durationMinutes * 60)
          } else {
            setInitialSeconds(null)
          }
        }
      } catch (e: any) {
        if (mounted) setError(e?.message || 'Failed to load quiz')
      } finally { if (mounted) setLoading(false) }
    }
    load()
    return () => { mounted = false }
  }, [id])

  // Load studentId from localStorage and check if already submitted
  useEffect(() => {
    const sess = typeof window !== 'undefined' ? localStorage.getItem('studentSession') : null
    const sid = typeof window !== 'undefined' ? (localStorage.getItem('studentId') || '') : ''
    if (!sid && sess) {
      // Keep behavior similar to previous flow; we will still prompt on submit if missing
    } else if (sid) {
      setStudentId(sid)
      // Check existing submission
      fetch(`/api/quiz-results?quizId=${encodeURIComponent(id)}&studentId=${encodeURIComponent(sid)}&limit=1`, { cache: 'no-store' })
        .then(r => r.json())
        .then(j => { if (j?.ok && Array.isArray(j.data) && j.data.length > 0) setSubmitted(true) })
        .catch(()=>{})
    }
  }, [id])

  const canSubmit = useMemo(() => orderedQuestions.length > 0 && answers.length === orderedQuestions.length && answers.every(a => a >= 0 && a < 4), [orderedQuestions, answers])

  const pushToast = (text: string, type: 'info'|'success'|'warning'|'error'='info') => {
    const id = Date.now() + Math.random()
    setToasts(t => [...t, { id, type, text }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 2500)
  }

  const submit = async () => {
    const studentSession = typeof window !== 'undefined' ? localStorage.getItem('studentSession') : null
    if (!studentSession) { alert('Please login from Student Portal to take the quiz.'); router.push('/student-portal'); return }
    const { bFormOrCnic, grNumber } = JSON.parse(studentSession)

    // Ensure we have studentId
    let sid = studentId || (typeof window !== 'undefined' ? (localStorage.getItem('studentId') || '') : '')
    if (!sid) {
      sid = prompt('Enter your Student ID (from portal) to submit results:') || ''
      if (sid) try { localStorage.setItem('studentId', sid) } catch {}
    }
    if (!sid) { alert('Student ID is required to submit the quiz.'); return }

    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/quiz-results', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ quizId: id, studentId: sid, answers }) })
      const json = await res.json()
      if (!json?.ok) throw new Error(json?.error || 'Failed to submit')
      setSubmitted(true)
      try { await document.exitFullscreen?.() } catch {}
    } catch (e: any) {
      setError(e?.message || 'Failed to submit results')
    } finally { setSubmitting(false) }
  }

  // Countdown tick and auto-submit
  useEffect(() => {
    if (!started) return
    if (submitted) return
    if (timeLeft == null) return
    if (timeLeft <= 0) {
      setTimeUp(true)
      submit()
      return
    }
    const t = window.setTimeout(() => setTimeLeft(s => (s == null ? s : s - 1)), 1000)
    return () => window.clearTimeout(t)
  }, [timeLeft, submitted, started])

  // Start timer when user clicks Continue (if duration is set)
  useEffect(() => {
    if (started && timeLeft == null && typeof initialSeconds === 'number') {
      setTimeLeft(initialSeconds)
    }
  }, [started, initialSeconds, timeLeft])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading quiz...</p>
        </div>
      </div>
    )
  }

  if (!quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Quiz not found.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Sticky, stylish Header */}
      <header className="sticky top-0 bg-white/80 backdrop-blur z-30 border-b">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="w-2 h-6 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-sm"/>
              <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 truncate">{quiz.title}</h1>
            </div>
            <div className="text-xs sm:text-sm text-gray-600">Subject: {quiz.subject}</div>
          </div>
          {typeof timeLeft === 'number' && started && !submitted && (
            <div className="text-sm font-semibold text-gray-900 bg-gray-100 px-2 py-1 rounded">
              ⏱ {Math.floor(timeLeft/60).toString().padStart(2,'0')}:{(timeLeft%60).toString().padStart(2,'0')}
            </div>
          )}
        </div>
        <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"/>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Toasts */}
        <div className="fixed top-16 right-4 z-40 space-y-2">
          {toasts.map(t => (
            <div key={t.id} className={`px-3 py-2 rounded shadow text-sm ${t.type==='success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : t.type==='warning' ? 'bg-amber-50 text-amber-800 border border-amber-200' : t.type==='error' ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-gray-50 text-gray-800 border border-gray-200'}`}>{t.text}</div>
          ))}
        </div>
        {/* Terms & Conditions Pre-screen */}
        {/* Centered wrapper below header (stack children vertically) */}
        <div className="min-h-[calc(100vh-120px)] flex flex-col items-center justify-center">
        {!started && !submitted && (
          <div className="border rounded-2xl p-6 sm:p-8 bg-white shadow-lg w-full max-w-2xl">
            <h2 className="text-lg font-semibold mb-3">Terms & Conditions</h2>
            <ul className="list-disc pl-6 text-sm text-gray-700 space-y-2">
              <li>Do not refresh, navigate away, or close the tab during the quiz.</li>
              <li>Each question has a single correct answer. Select carefully.</li>
              <li>Timer will auto-submit when time completes.</li>
              <li>Use your own knowledge. External help is not allowed.</li>
            </ul>
            <div className="mt-4 flex items-center gap-2">
              <input id="agree" type="checkbox" className="h-4 w-4" onChange={(e)=>setAcceptedChecked(e.target.checked)} />
              <label htmlFor="agree" className="text-sm text-gray-700">I have read and agree to the terms.</label>
            </div>
            <div className="mt-4">
              <button
                onClick={async ()=>{
                  if (!acceptedChecked || starting) return
                  setStarting(true)
                  try { await document.documentElement.requestFullscreen?.() } catch {}
                  setTimeout(() => {
                    setStarted(true)
                    setStarting(false)
                    if (typeof initialSeconds === 'number') setTimeLeft(initialSeconds)
                    pushToast('Quiz started', 'success')
                  }, 1000)
                }}
                disabled={!acceptedChecked || starting}
                className="px-5 py-2 bg-indigo-600 text-white rounded disabled:opacity-50 inline-flex items-center gap-2"
              >
                {starting && <span className="inline-block w-4 h-4 border-2 border-white/70 border-t-transparent rounded-full animate-spin"/>}
                <span>Continue</span>
              </button>
            </div>
          </div>
        )}

        {submitted ? (
            <div className="w-full max-w-2xl">
              <div className="border rounded-2xl p-6 sm:p-8 bg-white shadow-lg text-center">
                <div className="text-2xl font-bold text-gray-900 mb-2">Quiz Submitted</div>
                <div className="text-gray-700">{timeUp ? 'Time up. Your answers have been submitted.' : 'Quiz submitted. Please wait until results are announced.'}</div>
                <div className="mt-5">
                  <button onClick={() => (pushToast('Returning to dashboard...', 'info'), router.push('/student-portal'))} className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded shadow inline-flex items-center gap-2">
                    Go to Dashboard
                  </button>
                </div>
              </div>
            </div>
          ) : started ? (
            <>
              {orderedQuestions.length > 0 && (
                <div className="w-full max-w-3xl">
                  <div className="space-y-6">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div>Question {current + 1} of {orderedQuestions.length}</div>
                    <div className="flex items-center gap-2">
                      <span className="inline-block h-2 w-2 rounded-full bg-emerald-400"></span>
                      <span className="capitalize">{orderedQuestions[current]?.difficulty || 'easy'}</span>
                    </div>
                  </div>
                  <div className="border rounded-2xl p-6 bg-gray-50">
                    <div className="font-semibold text-gray-800 mb-4 text-lg">Q{current + 1}. {orderedQuestions[current].question}</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {orderedQuestions[current].options.map((opt, oi) => (
                        <label key={oi} className={`flex items-center gap-2 border rounded-xl px-3 py-3 cursor-pointer transition ${answers[current] === oi ? 'bg-indigo-50 border-indigo-300 ring-1 ring-indigo-300' : 'hover:bg-gray-100'}`}>
                          <input type="radio" className="mt-0.5" name={`q-${current}`} checked={answers[current] === oi} onChange={() => setAnswers(a => a.map((v, idx) => idx===current ? oi : v))} />
                          <span>{String.fromCharCode(65+oi)}. {opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  </div>
                </div>
              )}

              <div className="mt-6 flex items-center justify-between w-full max-w-3xl">
                <button onClick={() => router.back()} className="px-4 py-2 border rounded">Back</button>
                <div>
                  {submitted ? (
                    <button onClick={() => router.push('/student-portal')} className="px-4 py-2 bg-indigo-600 text-white rounded">Go to Dashboard</button>
                  ) : current < orderedQuestions.length - 1 ? (
                    <div className="flex items-center gap-2">
                      <button onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current===0} className="px-4 py-2 border rounded disabled:opacity-50">Previous</button>
                      <button onClick={() => {
                        if (answers[current] < 0 || nextLoading) return
                        setNextLoading(true)
                        setTimeout(() => {
                          setCurrent(c => Math.min(orderedQuestions.length - 1, c + 1))
                          setNextLoading(false)
                          pushToast('Answer saved', 'success')
                        }, 300)
                      }} disabled={answers[current] < 0 || nextLoading} className="px-4 py-2 bg-indigo-600 text-white rounded disabled:opacity-50 inline-flex items-center gap-2">
                        {nextLoading && <span className="inline-block w-4 h-4 border-2 border-white/70 border-t-transparent rounded-full animate-spin"/>}
                        <span>Next</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current===0} className="px-4 py-2 border rounded disabled:opacity-50">Previous</button>
                      <button onClick={submit} disabled={!canSubmit || submitting} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">{submitting ? 'Submitting...' : 'Submit'}</button>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 w-full max-w-3xl">
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div className="h-2 bg-indigo-500" style={{ width: `${((current+1)/Math.max(1, orderedQuestions.length))*100}%` }}></div>
                </div>
              </div>
            </>
          ) : null}

        </div>

        {error && <div className="mt-4 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded">{error}</div>}
      </main>
    </div>
  )
}
