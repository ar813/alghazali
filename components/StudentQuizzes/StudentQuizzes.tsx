"use client"

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Loader2, PlayCircle, CheckCircle2 } from 'lucide-react'

type Quiz = {
  _id: string
  title: string
  subject: string
  targetType: 'all' | 'class' | 'student'
  className?: string
  resultsAnnounced?: boolean
  createdAt?: string
  _createdAt?: string
  questions?: { difficulty?: 'easy'|'medium'|'hard' }[]
}

type Result = { _id: string; score: number; quiz?: { _id: string }; student?: { _id: string } }

const StudentQuizzes = ({ studentId, className }: { studentId: string; className?: string }) => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<Record<string, Result | null>>({})

  const load = async () => {
    setLoading(true)
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
      }
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [studentId, className, load])

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
    const bucket: Record<'easy'|'medium'|'hard', Quiz[]> = { easy: [], medium: [], hard: [] }
    const seed = `${studentId}|${new Date().toDateString()}`
    const withLevels = quizzes.map(q => {
      const qs = q.questions || []
      const counts: Record<'easy'|'medium'|'hard', number> = { easy: 0, medium: 0, hard: 0 }
      for (const qq of qs) {
        const key: 'easy'|'medium'|'hard' = (qq?.difficulty === 'medium' ? 'medium' : qq?.difficulty === 'hard' ? 'hard' : 'easy')
        counts[key]++
      }
      const level = counts.hard > counts.medium && counts.hard > counts.easy ? 'hard' : counts.medium > counts.easy ? 'medium' : 'easy'
      return { q, level: level as 'easy'|'medium'|'hard' }
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
    <div className="max-w-4xl mx-auto">
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800">Available Quizzes</h3>
          <button onClick={load} className="px-3 py-1.5 border rounded text-sm">Refresh</button>
        </div>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-4 rounded-xl border bg-gray-50 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3 mt-2"></div>
              </div>
            ))}
          </div>
        ) : quizzes.length === 0 ? (
          <div className="text-sm text-gray-500">No quizzes available.</div>
        ) : (
          <div className="space-y-3">
            {randomized.map(q => (
              <div key={q._id} className="p-4 rounded-xl border bg-white/70">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="font-semibold text-gray-800 truncate max-w-[16rem]">{q.title}</div>
                      <span className="px-2 py-0.5 text-xs rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">{q.subject}</span>
                      {results[q._id] && (
                        <span className="inline-flex items-center gap-1 text-emerald-700 text-xs"><CheckCircle2 size={14}/> Submitted</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{new Date((q as any).createdAt || (q as any)._createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short', hour12: true })}</div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {results[q._id] ? (
                      <span className="text-xs text-emerald-700">Completed</span>
                    ) : (
                      <Link href={`/quiz/${q._id}`} className="px-3 py-1.5 bg-blue-600 text-white rounded inline-flex items-center gap-2 text-sm"><PlayCircle size={16}/> Start</Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default StudentQuizzes
