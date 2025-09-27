"use client"

import React, { useEffect, useMemo, useState } from 'react'
import { RefreshCw, Eye, EyeOff, Download, Trash2 } from 'lucide-react'

type Quiz = { _id: string; title: string; subject: string; resultsAnnounced?: boolean; _createdAt?: string; createdAt?: string }

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
  questionOrder?: number[]
}

const AdminResults = ({ onLoadingChange }: { onLoadingChange?: (loading: boolean) => void }) => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [selectedQuiz, setSelectedQuiz] = useState<string>('')
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(false)
  const [working, setWorking] = useState<string | null>(null)
  const [selected, setSelected] = useState<Result | null>(null)
  const [quizDetail, setQuizDetail] = useState<any | null>(null)
  const [percent, setPercent] = useState<number | null>(null)
  const [grade, setGrade] = useState<string>('')
  const [rankInfo, setRankInfo] = useState<{ rank: number; total: number } | null>(null)

  const loadQuizzes = async () => {
    setLoading(true); onLoadingChange?.(true)
    try {
      const res = await fetch('/api/quizzes?limit=200', { cache: 'no-store' })
      const json = await res.json()
      if (json?.ok) setQuizzes(json.data)
    } finally { setLoading(false); onLoadingChange?.(false) }
  }

  const deleteOne = async (id: string) => {
    if (!id) return
    setWorking(id)
    try {
      const res = await fetch(`/api/quiz-results?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
      const j = await res.json()
      if (!j?.ok) throw new Error(j?.error || 'Failed to delete')
      setResults(prev => prev.filter(r => r._id !== id))
    } catch (e: any) {
      alert(e?.message || 'Delete failed')
    } finally { setWorking(null) }
  }

  const loadResults = async (quizId: string) => {
    if (!quizId) { setResults([]); return }
    setLoading(true); onLoadingChange?.(true)
    try {
      const res = await fetch(`/api/quiz-results?quizId=${encodeURIComponent(quizId)}&limit=500`, { cache: 'no-store' })
      const json = await res.json()
      if (json?.ok) setResults(json.data)
    } finally { setLoading(false); onLoadingChange?.(false) }
  }

  useEffect(() => { loadQuizzes() }, [])
  useEffect(() => { loadResults(selectedQuiz) }, [selectedQuiz])

  // Fetch quiz details when a result is selected (for detailed popup)
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

  // Compute percentage, grade and class rank
  useEffect(() => {
    const compute = async () => {
      if (!selected) { setPercent(null); setGrade(''); setRankInfo(null); return }
      const totalQ = selected.quiz?.totalQuestions ?? (Array.isArray(selected.answers) ? selected.answers.length : 0)
      if (totalQ > 0) {
        const pct = Math.round((selected.score / totalQ) * 100)
        setPercent(pct)
        const g = pct >= 85 ? 'A+' : pct >= 75 ? 'A' : pct >= 65 ? 'B' : pct >= 50 ? 'C' : pct >= 40 ? 'D' : 'F'
        setGrade(g)
      } else { setPercent(null); setGrade('') }

      try {
        const resp = await fetch(`/api/quiz-results?quizId=${encodeURIComponent(selected.quiz!._id)}&limit=500`, { cache: 'no-store' })
        const j = await resp.json()
        if (j?.ok && Array.isArray(j.data)) {
          const className = selected.className || selected.student?.admissionFor || ''
          const sameClass = j.data.filter((r: Result) => (r.className || r.student?.admissionFor || '') === className)
          const sorted = sameClass.sort((a: Result, b: Result) => (b.score || 0) - (a.score || 0))
          const idx = sorted.findIndex((r: Result) => r._id === selected._id)
          setRankInfo({ rank: idx >= 0 ? idx + 1 : sameClass.length, total: sameClass.length })
        } else { setRankInfo(null) }
      } catch { setRankInfo(null) }
    }
    compute()
  }, [selected])

  const toggleAnnounce = async (quizId: string, current: boolean|undefined) => {
    setWorking(quizId)
    try {
      await fetch('/api/quizzes', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: quizId, resultsAnnounced: !current }) })
      setQuizzes(prev => prev.map(q => q._id === quizId ? { ...q, resultsAnnounced: !current } : q))
    } finally { setWorking(null) }
  }

  const exportExcel = async () => {
    if (!selectedQuiz) return
    const quiz = quizzes.find(q => q._id === selectedQuiz)
    if (!quiz) return
    try {
      const ExcelJS = await import('exceljs')
      const fileSaver = await import('file-saver')
      const Workbook = (ExcelJS as any).Workbook || (ExcelJS as any).default?.Workbook
      const wb = new (ExcelJS as any).Workbook()
      const ws = wb.addWorksheet('Results')
      ws.columns = [
        { header: 'Student Name', key: 'studentName', width: 25 },
        { header: 'GR Number', key: 'studentGrNumber', width: 15 },
        { header: 'Roll Number', key: 'studentRollNumber', width: 15 },
        { header: 'Class', key: 'className', width: 10 },
        { header: 'Email', key: 'studentEmail', width: 25 },
        { header: 'Score', key: 'score', width: 10 },
        { header: 'Submitted At', key: 'submittedAt', width: 22 },
      ]
      for (const r of results) {
        ws.addRow({
          studentName: r.studentName || r.student?.fullName || '',
          studentGrNumber: r.studentGrNumber || r.student?.grNumber || '',
          studentRollNumber: r.studentRollNumber || '',
          className: r.className || r.student?.admissionFor || '',
          studentEmail: r.studentEmail || '',
          score: r.score,
          submittedAt: new Date(r.submittedAt || r._createdAt || '').toLocaleString(),
        })
      }
      const buffer = await wb.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      ;(fileSaver as any).saveAs(blob, `quiz_results_${quiz.title.replace(/\s+/g,'_')}.xlsx`)
    } catch (e) {
      alert('Failed to export Excel')
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base sm:text-lg font-bold text-gray-800">Quiz Results Control</h3>
          <button onClick={loadQuizzes} className="px-3 py-1.5 border rounded text-sm inline-flex items-center gap-2"><RefreshCw size={14}/> Refresh</button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Select Quiz</label>
            <select value={selectedQuiz} onChange={e=>setSelectedQuiz(e.target.value)} className="w-full border rounded px-3 py-2">
              <option value="">Select Quiz</option>
              {quizzes.map(q => <option key={q._id} value={q._id}>{q.title} ({q.subject})</option>)}
            </select>
          </div>
          {!!selectedQuiz && (
            <div className="flex items-end">
              <button onClick={()=>toggleAnnounce(selectedQuiz, quizzes.find(q=>q._id===selectedQuiz)?.resultsAnnounced)} disabled={working===selectedQuiz} className="px-4 py-2 border rounded inline-flex items-center gap-2">
                {quizzes.find(q=>q._id===selectedQuiz)?.resultsAnnounced ? <><EyeOff size={16}/> Hide Results</> : <><Eye size={16}/> Announce Results</>}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base sm:text-lg font-bold text-gray-800">Quiz Results</h3>
          <div className="flex items-center gap-2">
            <button onClick={exportExcel} disabled={!selectedQuiz || results.length===0} className="px-3 py-1.5 border rounded text-sm inline-flex items-center gap-2"><Download size={14}/> Export Excel</button>
          </div>
        </div>
        {!selectedQuiz ? (
          <div className="text-sm text-gray-500">Select a quiz to view results.</div>
        ) : loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-3 rounded border bg-gray-50 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3 mt-2"></div>
              </div>
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="text-sm text-gray-500">No results yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left bg-gray-50">
                  <th className="p-2">Student</th>
                  <th className="p-2">GR</th>
                  <th className="p-2">Roll</th>
                  <th className="p-2">Class</th>
                  <th className="p-2">Total Questions</th>
                  <th className="p-2">Score</th>
                  <th className="p-2">Submitted</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {results.map(r => (
                  <tr key={r._id} className="border-b hover:bg-gray-50 cursor-pointer" onClick={()=>setSelected(r)}>
                    <td className="p-2">{r.studentName || r.student?.fullName}</td>
                    <td className="p-2">{r.studentGrNumber || r.student?.grNumber}</td>
                    <td className="p-2">{r.studentRollNumber || ''}</td>
                    <td className="p-2">{r.className || r.student?.admissionFor}</td>
                    <td className="p-2">{r.quiz?.totalQuestions ?? (Array.isArray(r.answers) ? r.answers.length : '')}</td>
                    <td className="p-2">{r.score}</td>
                    <td className="p-2">{new Date(r.submittedAt || r._createdAt || '').toLocaleString()}</td>
                    <td className="p-2">
                      <button onClick={(e)=>{ e.stopPropagation(); deleteOne(r._id) }} disabled={working===r._id} className="px-2 py-1 text-xs border rounded text-red-600 inline-flex items-center gap-1"><Trash2 size={14}/> {working===r._id ? '...' : 'Delete'}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
                <div className="text-gray-500">Grade</div>
                <div className="font-semibold">{grade || '-'}</div>
              </div>
              <div>
                <div className="text-gray-500">Class Position</div>
                <div className="font-semibold">{rankInfo ? `${rankInfo.rank} of ${rankInfo.total}` : '-'}</div>
              </div>
            </div>
            {quizDetail?.questions?.length ? (
              <div className="mt-4">
                <h5 className="font-semibold mb-2">Question-wise Details</h5>
                <div className="space-y-3">
                  {(selected.answers || []).map((_, idx: number) => {
                    const origIdx = Array.isArray(selected.questionOrder) ? Number(selected.questionOrder[idx]) : idx
                    const baseQ = quizDetail.questions[origIdx]
                    if (!baseQ) return null
                    const chosen = Number(selected.answers?.[idx])
                    const correct = Number(baseQ.correctIndex)
                    const isCorrect = chosen === correct
                    return (
                      <div key={idx} className={`border rounded p-3 ${isCorrect ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                        <div className="font-medium">Q{idx+1}. {baseQ.question}</div>
                        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                          {baseQ.options.map((opt: string, oi: number) => (
                            <div key={oi} className={`px-2 py-1 rounded border ${oi===correct ? 'border-emerald-400 bg-emerald-100' : oi===chosen ? 'border-amber-400 bg-amber-100' : 'border-gray-200 bg-white'}`}>
                              {String.fromCharCode(65+oi)}. {opt}
                              {oi===correct ? ' (Correct)' : oi===chosen ? ' (Chosen)' : ''}
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

export default AdminResults
