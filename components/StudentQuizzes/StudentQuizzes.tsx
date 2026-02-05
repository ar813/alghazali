"use client"

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PlayCircle, CheckCircle2, BookOpen, RefreshCw } from 'lucide-react'
import { toast } from "sonner"

type Quiz = {
  _id: string
  title: string
  subject: string
  targetType: 'all' | 'class' | 'student'
  className?: string
  resultsAnnounced?: boolean
  createdAt?: string
  _createdAt?: string
  questions?: { difficulty?: 'easy' | 'medium' | 'hard' }[]
}

type Result = { _id: string; score: number; quiz?: { _id: string }; student?: { _id: string } }

const StudentQuizzes = ({ studentId, className }: { studentId: string; className?: string }) => {
  const router = useRouter()
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<Record<string, Result | null>>({})

  const load = React.useCallback(async (isManual = false) => {
    setLoading(true)
    if (isManual) toast.loading("Fetching latest quizzes...", { id: "refresh-quizzes" });
    try {
      const params = new URLSearchParams()
      if (studentId) params.set('studentId', studentId)
      if (className) params.set('className', className!)
      params.set('limit', '100')
      const res = await fetch(`/api/quizzes?${params.toString()}`, { cache: 'no-store' })
      const json = await res.json()
      if (json?.ok) {
        const list: Quiz[] = json.data
        setQuizzes(list)
        // prefetch results for this student
        const res2 = await fetch(`/api/quiz-results?studentId=${encodeURIComponent(studentId)}&limit=200`, { cache: 'no-store' })
        const j2 = await res2.json()
        if (j2?.ok) {
          const map: Record<string, Result> = {}
          for (const r of j2.data as Result[]) {
            if (r.quiz?._id) map[r.quiz._id] = r
          }
          setResults(map)
        }
        if (isManual) toast.success("Quizzes updated", { id: "refresh-quizzes" });
      } else {
        if (isManual) toast.error("Failed to load quizzes", { id: "refresh-quizzes" });
      }
    } catch {
      if (isManual) toast.error("Network error loading quizzes", { id: "refresh-quizzes" });
    } finally { setLoading(false) }
  }, [studentId, className])

  useEffect(() => { load() }, [load])

  // Seeded RNG for per-student variance and fairness
  const seededShuffle = (arr: Quiz[], seedStr: string) => {
    const h = (() => {
      let h = 2166136261 >>> 0
      for (let i = 0; i < seedStr.length; i++) { h ^= seedStr.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0 }
      return h >>> 0
    })()
    let t = h
    const rand = () => {
      t += 0x6D2B79F5
      let r = Math.imul(t ^ (t >>> 15), 1 | t)
      r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296
    }
    const copy = [...arr]
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1))
        ;[copy[i], copy[j]] = [copy[j], copy[i]]
    }
    return copy
  }

  const randomized = useMemo(() => {
    if (!quizzes || quizzes.length === 0) return [] as Quiz[]
    // derive predominant difficulty for each quiz
    const bucket: Record<'easy' | 'medium' | 'hard', Quiz[]> = { easy: [], medium: [], hard: [] }
    const seed = `${studentId}|${new Date().toDateString()}`
    const withLevels = quizzes.map(q => {
      const qs = q.questions || []
      const counts: Record<'easy' | 'medium' | 'hard', number> = { easy: 0, medium: 0, hard: 0 }
      for (const qq of qs) {
        const key: 'easy' | 'medium' | 'hard' = (qq?.difficulty === 'medium' ? 'medium' : qq?.difficulty === 'hard' ? 'hard' : 'easy')
        counts[key]++
      }
      const level = counts.hard > counts.medium && counts.hard > counts.easy ? 'hard' : counts.medium > counts.easy ? 'medium' : 'easy'
      return { q, level: level as 'easy' | 'medium' | 'hard' }
    })
    for (const item of withLevels) bucket[item.level].push(item.q)
    // seeded shuffle within buckets
    const e = seededShuffle(bucket.easy, seed + ':e')
    const m = seededShuffle(bucket.medium, seed + ':m')
    const h = seededShuffle(bucket.hard, seed + ':h')
    // interleave E->M->H pattern for balanced distribution
    const out: Quiz[] = []
    let i = 0
    while (e.length || m.length || h.length) {
      const mod = i % 3
      if (mod === 0 && e.length) out.push(e.shift()!)
      else if (mod === 1 && m.length) out.push(m.shift()!)
      else if (mod === 2 && h.length) out.push(h.shift()!)
      else {
        const pools = [e, m, h].filter(p => p.length)
        if (!pools.length) break
        const idx = Math.floor((i + quizzes.length) % pools.length)
        out.push(pools[idx].shift()!)
      }
      i++
    }
    return out
  }, [quizzes, studentId])

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header - Vercel Style */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center">
            <BookOpen size={18} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white tracking-tight">Available Quizzes</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">{quizzes.length} quiz{quizzes.length !== 1 ? 'zes' : ''} available</p>
          </div>
        </div>
        <button
          onClick={() => load(true)}
          disabled={loading}
          className="px-3.5 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-700 hover:shadow-md transition-all duration-200 inline-flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 animate-pulse">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-1/3" />
                  <div className="h-3 bg-neutral-100 dark:bg-neutral-800 rounded w-2/3" />
                </div>
                <div className="w-20 h-8 bg-neutral-100 dark:bg-neutral-800 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : quizzes.length === 0 ? (
        /* Empty State */
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
            <BookOpen size={28} className="text-neutral-400" />
          </div>
          <p className="text-neutral-600 dark:text-neutral-400 text-sm">No quizzes available.</p>
        </div>
      ) : (
        /* Quizzes List */
        <div className="space-y-4">
          {randomized.map(q => {
            const completed = !!results[q._id]
            return (
              <div
                key={q._id}
                className={`bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 hover:shadow-lg hover:border-neutral-300 dark:hover:border-neutral-700 transition-all duration-300 ${completed ? 'border-l-4 border-l-emerald-500 dark:border-l-emerald-400' : ''}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <h4 className="font-bold text-neutral-900 dark:text-white text-base truncate max-w-[18rem]">{q.title}</h4>
                      <span className="px-2 py-0.5 text-[10px] rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800 font-bold uppercase tracking-wider">{q.subject}</span>
                      {completed && (
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                          <CheckCircle2 size={14} />
                          Submitted
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">{new Date((q as Quiz).createdAt || (q as Quiz)._createdAt || '').toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short', hour12: true })}</div>
                  </div>
                  <div className="flex-shrink-0">
                    {completed ? (
                      <span className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold border border-emerald-100 dark:border-emerald-800">Completed</span>
                    ) : (
                      <button
                        onClick={() => {
                          const btn = document.getElementById(`start-btn-${q._id}`)
                          if (btn) btn.innerHTML = '<span class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span> Starting...'
                          router.push(`/quiz/${q._id}`)
                        }}
                        id={`start-btn-${q._id}`}
                        className="px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl inline-flex items-center gap-2 text-sm font-semibold hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors shadow-sm hover:shadow-md min-w-[120px] justify-center"
                      >
                        <PlayCircle size={16} />
                        Start Quiz
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default StudentQuizzes
