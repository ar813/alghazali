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
}

const AdminResults = ({ onLoadingChange }: { onLoadingChange?: (loading: boolean) => void }) => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [selectedQuiz, setSelectedQuiz] = useState<string>('')
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(false)
  const [working, setWorking] = useState<string | null>(null)

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
                  <tr key={r._id} className="border-b">
                    <td className="p-2">{r.studentName || r.student?.fullName}</td>
                    <td className="p-2">{r.studentGrNumber || r.student?.grNumber}</td>
                    <td className="p-2">{r.studentRollNumber || ''}</td>
                    <td className="p-2">{r.className || r.student?.admissionFor}</td>
                    <td className="p-2">{r.quiz?.totalQuestions ?? (Array.isArray(r.answers) ? r.answers.length : '')}</td>
                    <td className="p-2">{r.score}</td>
                    <td className="p-2">{new Date(r.submittedAt || r._createdAt || '').toLocaleString()}</td>
                    <td className="p-2">
                      <button onClick={()=>deleteOne(r._id)} disabled={working===r._id} className="px-2 py-1 text-xs border rounded text-red-600 inline-flex items-center gap-1"><Trash2 size={14}/> {working===r._id ? '...' : 'Delete'}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminResults
