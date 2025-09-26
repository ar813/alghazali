"use client"

import React, { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'

type Result = {
  _id: string
  quiz?: { _id: string; title: string; subject?: string; resultsAnnounced?: boolean; totalQuestions?: number }
  student?: { _id: string; fullName: string; grNumber?: string; admissionFor?: string }
  studentName?: string
  studentGrNumber?: string
  studentRollNumber?: string
  className?: string
  studentEmail?: string
  answers: number[]
  score: number
  submittedAt?: string
  _createdAt?: string
}

const StudentResults = ({ studentId }: { studentId: string }) => {
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<Result | null>(null)
  const [quizDetail, setQuizDetail] = useState<any | null>(null)
  const [rankInfo, setRankInfo] = useState<{ rank: number; total: number } | null>(null)
  const [percent, setPercent] = useState<number | null>(null)
  const [grade, setGrade] = useState<string>('')
  const [passFail, setPassFail] = useState<'Pass'|'Fail'|''>('')

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/quiz-results?studentId=${encodeURIComponent(studentId)}&limit=200`, { cache: 'no-store' })
      const json = await res.json()
      if (json?.ok) {
        const list = (json.data as Result[]).filter(r => r.quiz?.resultsAnnounced)
        setResults(list)
      }
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [studentId])

  // Fetch quiz details when a result is selected
  useEffect(() => {
    const fetchQuiz = async () => {
      if (!selected?.quiz?._id) { setQuizDetail(null); return }
      try {
        const res = await fetch(`/api/quizzes?id=${encodeURIComponent(selected.quiz._id)}`, { cache: 'no-store' })
        const json = await res.json()
        if (json?.ok) setQuizDetail(json.data)
        else setQuizDetail(null)
      } catch { setQuizDetail(null) }
    }
    fetchQuiz()
  }, [selected])

  // Compute percentage, pass/fail, and class rank
  useEffect(() => {
    const compute = async () => {
      if (!selected) { setPercent(null); setPassFail(''); setRankInfo(null); setGrade(''); return }
      const totalQ = selected.quiz?.totalQuestions ?? (Array.isArray(selected.answers) ? selected.answers.length : 0)
      if (totalQ > 0) {
        const pct = Math.round((selected.score / totalQ) * 100)
        setPercent(pct)
        setPassFail(pct >= 40 ? 'Pass' : 'Fail')
        // Simple grade mapping
        const g = pct >= 85 ? 'A+' : pct >= 75 ? 'A' : pct >= 65 ? 'B' : pct >= 50 ? 'C' : pct >= 40 ? 'D' : 'F'
        setGrade(g)
      } else {
        setPercent(null); setPassFail(''); setGrade('')
      }

      // Rank among same class for this quiz
      try {
        const resp = await fetch(`/api/quiz-results?quizId=${encodeURIComponent(selected.quiz!._id)}&limit=500`, { cache: 'no-store' })
        const j = await resp.json()
        if (j?.ok && Array.isArray(j.data)) {
          const className = selected.className || selected.student?.admissionFor || ''
          const sameClass = j.data.filter((r: Result) => (r.className || r.student?.admissionFor || '') === className)
          const sorted = sameClass.sort((a: Result, b: Result) => (b.score || 0) - (a.score || 0))
          const idx = sorted.findIndex((r: Result) => r._id === selected._id)
          setRankInfo({ rank: idx >= 0 ? idx + 1 : sameClass.length, total: sameClass.length })
        } else {
          setRankInfo(null)
        }
      } catch { setRankInfo(null) }
    }
    compute()
  }, [selected])

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800">Quiz Results</h3>
          <button onClick={load} className="px-3 py-1.5 border rounded text-sm inline-flex items-center gap-2"><RefreshCw size={14}/> Refresh</button>
        </div>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-3 rounded border bg-gray-50 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3 mt-2"></div>
              </div>
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="text-sm text-gray-500">No announced results yet.</div>
        ) : (
          <div className="space-y-3">
            {results.map(r => (
              <button key={r._id} onClick={()=>setSelected(r)} className="w-full text-left p-3 rounded border bg-gray-50 hover:bg-gray-100 transition">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-gray-800">{r.quiz?.title}</div>
                  <div className="text-sm text-gray-700">Score: {r.score} / {r.quiz?.totalQuestions ?? (Array.isArray(r.answers) ? r.answers.length : '')}</div>
                </div>
                <div className="text-xs text-gray-500">{new Date(r.submittedAt || r._createdAt || '').toLocaleString()}</div>
              </button>
            ))}
          </div>
        )}
      </div>
      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-5 max-h-[85vh] overflow-auto">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-lg font-bold">{selected.quiz?.title}</h4>
              <button onClick={()=>setSelected(null)} className="px-2 py-1 rounded border">Close</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-gray-500">Student</div>
                <div className="font-semibold">{selected.studentName || selected.student?.fullName || '-'}</div>
              </div>
              <div>
                <div className="text-gray-500">GR</div>
                <div className="font-semibold">{selected.studentGrNumber || selected.student?.grNumber || '-'}</div>
              </div>
              <div>
                <div className="text-gray-500">Class</div>
                <div className="font-semibold">{selected.className || selected.student?.admissionFor || '-'}</div>
              </div>
              <div>
                <div className="text-gray-500">Email</div>
                <div className="font-semibold">{selected.studentEmail || '-'}</div>
              </div>
              <div>
                <div className="text-gray-500">Subject</div>
                <div className="font-semibold">{selected.quiz?.subject || '-'}</div>
              </div>
              <div>
                <div className="text-gray-500">Total Questions</div>
                <div className="font-semibold">{selected.quiz?.totalQuestions ?? (Array.isArray(selected.answers) ? selected.answers.length : '-')}</div>
              </div>
              <div>
                <div className="text-gray-500">Score</div>
                <div className="font-semibold">{selected.score}</div>
              </div>
              <div>
                <div className="text-gray-500">Submitted</div>
                <div className="font-semibold">{new Date(selected.submittedAt || selected._createdAt || '').toLocaleString()}</div>
              </div>
              <div>
                <div className="text-gray-500">Percentage</div>
                <div className="font-semibold">{percent != null ? `${percent}%` : '-'}</div>
              </div>
              <div>
                <div className="text-gray-500">Status</div>
                <div className={`font-semibold ${passFail==='Pass' ? 'text-emerald-700' : passFail==='Fail' ? 'text-red-700' : ''}`}>{passFail || '-'}</div>
              </div>
              <div>
                <div className="text-gray-500">Class Position</div>
                <div className="font-semibold">{rankInfo ? `${rankInfo.rank} of ${rankInfo.total}` : '-'}</div>
              </div>
              <div>
                <div className="text-gray-500">Grade</div>
                <div className="font-semibold">{grade || '-'}</div>
              </div>
            </div>

            {/* Detailed breakdown */}
            {quizDetail?.questions?.length ? (
              <div className="mt-4">
                <h5 className="font-semibold mb-2">Question-wise Details</h5>
                <div className="space-y-3">
                  {quizDetail.questions.slice(0, selected.answers?.length || quizDetail.questions.length).map((q: any, idx: number) => {
                    const chosen = Number(selected.answers?.[idx])
                    const correct = Number(q.correctIndex)
                    const isCorrect = chosen === correct
                    return (
                      <div key={idx} className={`border rounded p-3 ${isCorrect ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                        <div className="font-medium">Q{idx+1}. {q.question}</div>
                        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                          {q.options.map((opt: string, oi: number) => (
                            <div key={oi} className={`px-2 py-1 rounded border ${oi===correct ? 'border-emerald-400 bg-emerald-100' : oi===chosen ? 'border-amber-400 bg-amber-100' : 'border-gray-200 bg-white'}`}>
                              {String.fromCharCode(65+oi)}. {opt}
                              {oi===correct ? ' (Correct)' : oi===chosen ? ' (Your choice)' : ''}
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}

export default StudentResults
