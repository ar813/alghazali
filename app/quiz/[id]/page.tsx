'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Timer,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  Loader2,
  ShieldCheck,
  CheckCircle,
  CloudCheck,
  Layout,
  Camera
} from 'lucide-react'
import { toast } from 'sonner'

const ProctorCamera = () => {
  const [status, setStatus] = useState<'pending' | 'success' | 'error'>('pending')
  const [errDetail, setErrDetail] = useState<string>('')
  const videoRef = React.useRef<HTMLVideoElement>(null)

  const startCamera = async () => {
    setStatus('pending')
    let stream: MediaStream | null = null
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("SECURE_CONTEXT_REQUIRED")
      }

      console.log("Requesting USER MEDIA...")
      stream = await navigator.mediaDevices.getUserMedia({
        video: true, // Simplified constraints
        audio: false
      })

      console.log("STREAM ACQUIRED:", stream.id)

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        // Explicitly call play to ensure it starts
        try {
          await videoRef.current.play()
          console.log("VIDEO PLAYBACK STARTED")
          setStatus('success')
          setErrDetail('')
        } catch (playErr) {
          console.error("PLAYBACK FAILED:", playErr)
          throw playErr
        }
      }
    } catch (err: any) {
      console.error("Detailed Camera Error:", err)
      setErrDetail(err.name || err.message || "ERROR")
      setStatus('error')
    }
  }

  useEffect(() => {
    startCamera()
    return () => {
      // Cleanup is handled by the browser tracks naturally but fine to stop explicitly if needed
    }
  }, [])

  return (
    <div className="fixed top-24 right-5 z-[9999] w-40 sm:w-48 aspect-video rounded-xl overflow-hidden border-2 border-white/20 shadow-2xl bg-black select-none transition-all duration-500 ring-1 ring-white/10">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-full object-cover grayscale transition-opacity duration-700 ${status === 'success' ? 'opacity-90' : 'opacity-0'}`}
      />

      {status !== 'success' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-900/90 gap-1.5 px-3 text-center backdrop-blur-sm">
          {status === 'pending' ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="animate-spin text-blue-500" size={24} />
              <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest">Accessing Camera...</span>
            </div>
          ) : (
            <>
              <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center mb-1">
                <Camera className="text-red-500" size={16} />
              </div>
              <span className="text-[8px] font-black text-white uppercase tracking-tight leading-tight">
                {errDetail === 'NotAllowedError' ? 'Access Denied' :
                  errDetail === 'NotFoundError' ? 'No Camera Found' :
                    'Security Block'}
              </span>
              <p className="text-[6px] text-white/50 font-medium leading-normal max-w-[120px]">
                {errDetail === 'NotAllowedError' ? 'Please click the camera icon in your browser address bar to allow access.' :
                  'Connect a camera or check system permissions.'}
              </p>
              <button
                onClick={startCamera}
                className="mt-1 px-3 py-1 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full text-[7px] font-bold text-white transition-all pointer-events-auto active:scale-95"
              >
                REQUEST CAMERA
              </button>
            </>
          )}
        </div>
      )}

      <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/10">
        <div className={`w-1.5 h-1.5 rounded-full ${status === 'success' ? 'bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]' : 'bg-neutral-500'}`} />
        <span className="text-[8px] font-black text-white uppercase tracking-widest leading-loose">
          {status === 'success' ? 'LIVE REC' : 'OFFLINE'}
        </span>
      </div>
    </div>
  )
}

type Quiz = {
  _id: string
  title: string
  subject: string
  examKey?: string
  questions: { question: string; options: string[]; correctIndex: number; difficulty?: 'easy' | 'medium' | 'hard' }[]
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
  const [questionOrder, setQuestionOrder] = useState<number[]>([])
  const [current, setCurrent] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [studentId, setStudentId] = useState<string>('')
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [initialSeconds, setInitialSeconds] = useState<number | null>(null)
  const [timeUp, setTimeUp] = useState<boolean>(false)
  const [acceptedChecked, setAcceptedChecked] = useState<boolean>(false)
  const [started, setStarted] = useState<boolean>(false)
  const [starting, setStarting] = useState<boolean>(false)
  const [examKeyInput, setExamKeyInput] = useState<string>('')
  const [examKeyValidated, setExamKeyValidated] = useState<boolean>(false)
  const [resultId, setResultId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const id = params.id

  // 1. Initial Load: Quiz & Session
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        // Get Quiz
        const res = await fetch(`/api/quizzes?id=${encodeURIComponent(id)}`, { cache: 'no-store' })
        const json = await res.json()
        if (!json?.ok || !json.data) throw new Error('Quiz not found')
        const qz: Quiz = json.data
        setQuiz(qz)

        // Get Student Session
        const sessStr = localStorage.getItem('studentSession')
        if (!sessStr) {
          toast.error("Please login to continue")
          router.push('/student-portal')
          return
        }
        const sess = JSON.parse(sessStr)
        const sid = sess._id
        if (!sid) throw new Error('Invalid session')
        setStudentId(sid)

        // Set Duration
        if (qz.durationMinutes) setInitialSeconds(qz.durationMinutes * 60)

      } catch (err: any) {
        setError(err.message)
        toast.error(err.message)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [id, router])

  // 2. Start/Resume Quiz Initialization
  const handleStart = async () => {
    if (!acceptedChecked || starting) return

    // Request fullscreen immediately to stay in user gesture context
    try {
      const el = document.documentElement;
      const requestMethod = el.requestFullscreen || (el as any).webkitRequestFullscreen || (el as any).mozRequestFullScreen || (el as any).msRequestFullscreen;
      if (requestMethod) {
        await requestMethod.call(el);
      }
    } catch (e) { console.warn("Fullscreen blocked", e); }

    setStarting(true)

    try {
      // 1. Prepare Question Order if it's a fresh start
      const newOrder: number[] = []
      if (quiz) {
        const qs = Array.isArray(quiz.questions) ? quiz.questions.slice() : []
        const limit = Math.max(1, Math.min(qs.length, (quiz.questionLimit || qs.length)))

        // Randomization logic (same as before but encapsulated)
        const easy = qs.filter(q => (q.difficulty || 'easy') === 'easy').sort(() => Math.random() - 0.5)
        const med = qs.filter(q => (q.difficulty || 'easy') === 'medium').sort(() => Math.random() - 0.5)
        const hard = qs.filter(q => (q.difficulty || 'easy') === 'hard').sort(() => Math.random() - 0.5)

        const out: Quiz['questions'] = []
        for (let i = 0; i < limit; i++) {
          const mod = i % 3
          let picked = (mod === 0 ? easy.shift() : mod === 1 ? med.shift() : hard.shift())
          if (!picked) picked = [easy, med, hard].find(p => p.length)?.shift()
          if (picked) {
            out.push(picked)
            newOrder.push(quiz.questions.indexOf(picked))
          }
        }
      }

      // 2. Call Init API
      const res = await fetch('/api/quiz/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId: id, studentId, questionOrder: newOrder })
      })
      const json = await res.json()

      if (!json.ok) {
        if (json.alreadyCompleted) {
          setSubmitted(true)
          return
        }
        throw new Error(json.error || 'Failed to initialize quiz')
      }

      // 3. Setup Quiz State based on resumed status
      setResultId(json.resultId)
      if (json.resumed) {
        // Resuming: Use existing order and answers
        const savedOrder = json.questionOrder as number[]
        const savedAnswers = json.answers as number[]
        const mappedQuestions = savedOrder.map(idx => quiz!.questions[idx])

        setOrderedQuestions(mappedQuestions)
        setQuestionOrder(savedOrder)

        // Fill answers, ensuring full length
        const fullAnswers = new Array(mappedQuestions.length).fill(-1)
        savedAnswers.forEach((val, i) => { if (i < fullAnswers.length) fullAnswers[i] = val })
        setAnswers(fullAnswers)

        toast.success("Progress resumed")
      } else {
        // Fresh Start: Use generated order
        const mappedQuestions = newOrder.map(idx => quiz!.questions[idx])
        setOrderedQuestions(mappedQuestions)
        setQuestionOrder(newOrder)
        setAnswers(new Array(mappedQuestions.length).fill(-1))
      }

      // 4. Start Quiz
      setStarted(true)
      if (initialSeconds) setTimeLeft(initialSeconds)

    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setStarting(false)
    }
  }

  // 3. Real-time Answer Save
  const handleAnswer = async (qIdx: number, aIdx: number) => {
    if (!resultId) return

    // Update local state first for instant feedback
    const newAnswers = [...answers]
    newAnswers[qIdx] = aIdx
    setAnswers(newAnswers)

    setSaving(true)
    try {
      const res = await fetch('/api/quiz/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resultId, answers: newAnswers })
      })
      if (!(await res.json()).ok) throw new Error('Failed to save')
    } catch (err) {
      console.error("Auto-save failed", err)
      // We don't block the UI for auto-save failures
    } finally {
      setTimeout(() => setSaving(false), 500)
    }
  }

  // 4. Final Submission
  const submit = React.useCallback(async () => {
    if (submitting || submitted) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/quiz-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId: id, studentId, answers, questionOrder })
      })
      const json = await res.json()
      if (!json?.ok) throw new Error(json?.error || 'Failed to submit')

      setSubmitted(true)
      toast.success("Quiz submitted successfully!")
      try { await document.exitFullscreen() } catch { }
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }, [id, studentId, answers, questionOrder, submitting, submitted])

  // 5. Timer Logic
  useEffect(() => {
    if (!started || submitted || timeLeft == null) return
    if (timeLeft <= 0) {
      setTimeUp(true)
      submit()
      return
    }
    const timer = setInterval(() => setTimeLeft(prev => (prev ? prev - 1 : 0)), 1000)
    return () => clearInterval(timer)
  }, [started, submitted, timeLeft, submit])

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const validateExamKey = () => {
    const expected = (quiz?.examKey || '').trim()
    if (!expected || expected === examKeyInput.trim()) {
      setExamKeyValidated(true)
      toast.success('Key matched successfully')
    } else {
      toast.error('Invalid Exam Key. Please check and try again.')
    }
  }

  // UI Components
  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-neutral-100 rounded-full animate-pulse" />
        <div className="absolute inset-0 w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
      <p className="mt-4 text-sm font-medium text-neutral-500 tracking-wide">INITIALIZING ASSESSMENT</p>
    </div>
  )

  if (error || !quiz) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6">
      <div className="p-4 rounded-2xl bg-red-50 text-red-600 border border-red-100 max-w-md text-center">
        <AlertCircle className="mx-auto mb-3" size={32} />
        <p className="font-semibold">{error || "Assessment not found"}</p>
        <button onClick={() => router.back()} className="mt-4 text-sm underline decoration-red-200 hover:decoration-red-600 transition-all">Go Back</button>
      </div>
    </div>
  )

  // 1. Initial State: Exam Key / Instructions
  if (!started && !submitted) return (
    <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white rounded-[2rem] shadow-2xl shadow-neutral-200/50 border border-neutral-100 overflow-hidden transform transition-all">
        {/* Header Decor */}
        <div className="h-2 w-full bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-500" />

        <div className="p-5 sm:p-7">
          {!examKeyValidated ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                  <ShieldCheck className="text-blue-600" size={18} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-neutral-900 tracking-tight">Security Check</h2>
                  <p className="text-neutral-500 text-[11px]">Enter key to unlock assessment</p>
                </div>
              </div>

              <div className="relative group">
                <input
                  type="password"
                  value={examKeyInput}
                  onChange={(e) => setExamKeyInput(e.target.value)}
                  className="w-full h-12 bg-neutral-50 border border-neutral-100 rounded-xl px-4 text-base font-medium tracking-widest focus:bg-white focus:border-blue-500 transition-all outline-none"
                  placeholder="••••••••"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => router.back()} className="flex-1 h-12 rounded-xl text-neutral-500 text-sm font-semibold hover:bg-neutral-100 transition-all">Cancel</button>
                <button onClick={validateExamKey} className="flex-[2] h-12 bg-neutral-900 text-white rounded-xl text-sm font-bold hover:shadow-lg active:scale-95 transition-all">Unlock Assessment</button>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <Layout size={18} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-neutral-900 tracking-tight">Instructions</h2>
                  <p className="text-neutral-500 text-[11px]">Review terms before starting</p>
                </div>
              </div>

              <div className="grid gap-2.5">
                {[
                  "No refresh or window switching allowed.",
                  "Timer will continue even if you disconnect.",
                  "Answers are saved automatically in real-time.",
                  "Auto-submission occurs when time expires."
                ].map((text, i) => (
                  <div key={i} className="flex gap-3 p-3 rounded-xl bg-neutral-50 border border-neutral-100 text-neutral-700">
                    <CheckCircle className="text-blue-500 mt-0.5 flex-shrink-0" size={16} />
                    <p className="text-xs font-medium leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>

              <label className="flex items-center gap-3 p-3.5 border border-neutral-100 rounded-xl cursor-pointer hover:border-blue-400 transition-all select-none group">
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${acceptedChecked ? 'bg-blue-600 border-blue-600' : 'border-neutral-200 group-hover:border-blue-300'}`}>
                  {acceptedChecked && <CheckCircle2 className="text-white" size={12} />}
                </div>
                <input type="checkbox" className="hidden" checked={acceptedChecked} onChange={(e) => setAcceptedChecked(e.target.checked)} />
                <span className="text-sm font-semibold text-neutral-700">I am ready to proceed</span>
              </label>

              <button
                onClick={handleStart}
                disabled={!acceptedChecked || starting}
                className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-base shadow-lg shadow-blue-600/10 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {starting ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    <span>Preparing Environment...</span>
                  </>
                ) : (
                  <span>Start Assessment</span>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  // 2. Completion State
  if (submitted) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
      <div className="w-24 h-24 rounded-full bg-emerald-50 flex items-center justify-center mb-8 relative">
        <CheckCircle2 className="text-emerald-600 animate-in zoom-in duration-500" size={48} />
        <div className="absolute inset-0 rounded-full border-2 border-emerald-200 animate-ping opacity-25" />
      </div>
      <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight mb-3">Assessment Completed!</h1>
      <p className="text-neutral-500 max-w-md mx-auto leading-relaxed">
        {timeUp ? "Your time expired and your progress was automatically submitted." : "Your responses have been successfully recorded and saved."}
      </p>

      <div className="mt-12 flex flex-col sm:flex-row gap-4 w-full max-w-sm">
        <button
          onClick={() => { localStorage.clear(); router.push('/student-portal') }}
          className="flex-1 h-14 border border-neutral-200 rounded-2xl font-semibold text-neutral-600 hover:bg-neutral-50 transition-all"
        >
          Logout
        </button>
        <button
          onClick={() => router.push('/student-portal')}
          className="flex-[1.5] h-14 bg-neutral-900 text-white rounded-2xl font-bold shadow-xl shadow-black/5 hover:bg-black active:scale-[0.98] transition-all"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  )

  // 3. Quiz Taking State
  return (
    <div className="min-h-screen bg-white select-none">
      {/* Sticky Premium Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-neutral-100">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
              {quiz.title.charAt(0)}
            </div>
            <div className="hidden sm:block">
              <h4 className="font-bold text-neutral-900 leading-tight">{quiz.title}</h4>
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest">{quiz.subject}</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 px-4 py-2 bg-neutral-100 rounded-xl">
              {saving ? (
                <div className="flex items-center gap-2 text-neutral-400 animate-pulse">
                  <Loader2 size={14} className="animate-spin" />
                  <span className="text-[10px] font-bold uppercase">Saving...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-emerald-600">
                  <CloudCheck size={14} />
                  <span className="text-[10px] font-bold uppercase">Live Sync</span>
                </div>
              )}
            </div>

            {timeLeft !== null && (
              <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all ${timeLeft < 60 ? 'bg-red-50 border-red-200 text-red-600 animate-pulse' : 'bg-neutral-50 border-neutral-100 text-neutral-900'}`}>
                <Timer size={18} />
                <span className="font-mono font-bold text-lg tabular-nums">{formatTime(timeLeft)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Real-time Progress Bar */}
        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-neutral-100">
          <div
            className="h-full bg-blue-600 transition-all duration-700 ease-out"
            style={{ width: `${((current + 1) / orderedQuestions.length) * 100}%` }}
          />
        </div>
      </nav>

      {/* Proctoring Simulation Camera */}
      {started && !submitted && <ProctorCamera />}

      <main className="max-w-2xl mx-auto px-6 py-6">
        <div className="space-y-12">
          {/* Question Meta */}
          <div className="flex items-center justify-between">
            <div className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-wider">
              Question {current + 1} of {orderedQuestions.length}
            </div>
            <div className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${orderedQuestions[current]?.difficulty === 'hard' ? 'bg-red-50 text-red-600' :
              orderedQuestions[current]?.difficulty === 'medium' ? 'bg-amber-50 text-amber-600' :
                'bg-emerald-50 text-emerald-600'
              }`}>
              Level: {orderedQuestions[current]?.difficulty || 'easy'}
            </div>
          </div>

          {/* Question Text */}
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-1 underline-offset-4 duration-500">
            <h2 className="text-lg sm:text-xl font-bold text-neutral-900 leading-[1.5] tracking-tight">
              {orderedQuestions[current].question}
            </h2>

            {/* Options Grid */}
            <div className="grid grid-cols-1 gap-3">
              {orderedQuestions[current].options.map((option, idx) => {
                const isSelected = answers[current] === idx
                return (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(current, idx)}
                    className={`group relative flex items-center gap-3.5 p-3.5 rounded-xl border text-left transition-all duration-200 ${isSelected
                      ? 'bg-blue-50/30 border-blue-400'
                      : 'bg-white border-neutral-100 hover:border-neutral-200 hover:bg-neutral-50/50'
                      }`}
                  >
                    <div className={`w-7 h-7 rounded-md flex items-center justify-center font-bold text-xs transition-all ${isSelected ? 'bg-blue-600 text-white shadow-sm' : 'bg-neutral-100 text-neutral-400 group-hover:bg-neutral-200'
                      }`}>
                      {String.fromCharCode(65 + idx)}
                    </div>

                    <span className={`text-[14px] font-medium flex-1 text-left ${isSelected ? 'text-blue-900' : 'text-neutral-700'}`}>
                      {option}
                    </span>

                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white animate-in zoom-in duration-300">
                        <ChevronRight size={12} />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Sticky/Floating Controls */}
          <div className="pt-8 flex items-center justify-between gap-4 border-t border-neutral-100">
            <button
              onClick={() => setCurrent(p => Math.max(0, p - 1))}
              disabled={current === 0}
              className="px-5 py-3 rounded-xl font-bold text-neutral-500 hover:bg-neutral-100 disabled:opacity-30 disabled:hover:bg-transparent transition-all flex items-center gap-2 text-sm"
            >
              <ChevronLeft size={18} />
              Previous
            </button>

            {current < orderedQuestions.length - 1 ? (
              <button
                onClick={() => setCurrent(p => p + 1)}
                disabled={answers[current] === -1}
                className="px-6 py-3 bg-neutral-900 text-white rounded-xl font-bold hover:shadow-lg active:scale-[0.98] transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
              >
                Continue
                <ChevronRight size={18} />
              </button>
            ) : (
              <button
                onClick={submit}
                disabled={answers.some(a => a === -1) || submitting}
                className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-blue-600/10 active:scale-[0.98] transition-all disabled:opacity-30 disabled:shadow-none flex items-center gap-2 text-sm"
              >
                {submitting ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Finalizing...
                  </>
                ) : (
                  <>
                    Complete & Submit
                    <ChevronRight size={18} />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
