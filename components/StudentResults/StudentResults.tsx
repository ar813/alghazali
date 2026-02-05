"use client"

import React, { useEffect, useState } from 'react'
import { RefreshCw, Trophy, BarChart3, Award, Target } from 'lucide-react'
import {
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useDisclosure
} from "@chakra-ui/react"
import { toast } from "sonner"

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

const StudentResults = ({ studentId }: { studentId: string }) => {
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<Result | null>(null)
  const [quizDetail, setQuizDetail] = useState<any | null>(null)
  const [rankInfo, setRankInfo] = useState<{ rank: number; total: number } | null>(null)
  const [percent, setPercent] = useState<number | null>(null)
  const [grade, setGrade] = useState<string>('')
  const [passFail, setPassFail] = useState<'Pass' | 'Fail' | ''>('')
  const { isOpen, onOpen, onClose } = useDisclosure()

  const formatDateTime = (iso?: string) => {
    const d = new Date(iso || '')
    return d.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short', hour12: true })
  }

  const load = React.useCallback(async (isManual = false) => {
    setLoading(true)
    if (isManual) toast.loading("Checking for new results...", { id: "refresh-results" });
    try {
      const res = await fetch(`/api/quiz-results?studentId=${encodeURIComponent(studentId)}&limit=200`, { cache: 'no-store' })
      const json = await res.json()
      if (json?.ok) {
        const list = (json.data as Result[]).filter(r => r.quiz?.resultsAnnounced)
        setResults(list)
        if (isManual) toast.success("Results updated", { id: "refresh-results" });
      } else {
        if (isManual) toast.error("Failed to update results", { id: "refresh-results" });
      }
    } catch {
      if (isManual) toast.error("Network error updating results", { id: "refresh-results" });
    } finally { setLoading(false) }
  }, [studentId])

  useEffect(() => { load() }, [load])

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

  useEffect(() => {
    const compute = async () => {
      if (!selected) { setPercent(null); setPassFail(''); setRankInfo(null); setGrade(''); return }
      const totalQ = selected.quiz?.totalQuestions ?? (Array.isArray(selected.answers) ? selected.answers.length : 0)
      if (totalQ > 0) {
        const pct = Math.round((selected.score / totalQ) * 100)
        setPercent(pct)
        setPassFail(pct >= 40 ? 'Pass' : 'Fail')
        const g = pct >= 85 ? 'A+' : pct >= 75 ? 'A' : pct >= 65 ? 'B' : pct >= 50 ? 'C' : pct >= 40 ? 'D' : 'F'
        setGrade(g)
      } else {
        setPercent(null); setPassFail(''); setGrade('')
      }

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

  const getScoreColor = (pct: number | null) => {
    if (pct === null) return 'text-neutral-600'
    if (pct >= 80) return 'text-emerald-600 dark:text-emerald-400'
    if (pct >= 60) return 'text-blue-600 dark:text-blue-400'
    if (pct >= 40) return 'text-orange-600 dark:text-orange-400'
    return 'text-red-600 dark:text-red-400'
  }

  const handleSelectRes = (r: Result) => {
    setSelected(r);
    onOpen();
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header - Vercel Style */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-[34px] h-[34px] rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center">
            <BarChart3 size={15} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h3 className="text-[13px] font-bold text-neutral-900 dark:text-white tracking-tight">Quiz Results</h3>
            <p className="text-[9px] text-neutral-500 dark:text-neutral-400 font-medium uppercase tracking-wider">{results.length} result{results.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <button
          onClick={() => load(true)}
          disabled={loading}
          className="px-2.5 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg text-[11px] font-black uppercase tracking-widest text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all duration-200 inline-flex items-center gap-1.5 disabled:opacity-50"
        >
          <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {loading && results.length === 0 ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 animate-pulse h-16" />
          ))}
        </div>
      ) : results.length === 0 ? (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-8 text-center">
          <p className="text-neutral-500 dark:text-neutral-400 text-xs">No announced results yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {results.map(r => {
            const totalQ = r.quiz?.totalQuestions ?? (Array.isArray(r.answers) ? r.answers.length : 0)
            const pct = totalQ > 0 ? Math.round((r.score / totalQ) * 100) : null
            return (
              <button
                key={r._id}
                onClick={() => handleSelectRes(r)}
                className="w-full text-left bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-3 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all duration-200"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-neutral-900 dark:text-white text-[12px] mb-0.5">{r.quiz?.title}</h4>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-1.5 py-0.5 text-[8px] rounded bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800 font-black uppercase tracking-wider">{r.quiz?.subject}</span>
                      <span className="text-[9px] text-neutral-500 dark:text-neutral-400 font-bold uppercase tracking-widest">{formatDateTime(r.submittedAt || r._createdAt).split(',')[0]}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className={`text-[15px] font-black tracking-tighter ${getScoreColor(pct)}`}>
                      {r.score}/{totalQ}
                    </div>
                    {pct !== null && (
                      <div className="text-[9px] text-neutral-400 dark:text-neutral-500 font-black tracking-[0.1em] uppercase">{pct}%</div>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="lg">
        <DrawerOverlay backdropFilter="blur(3px)" bg="blackAlpha.300" />
        <DrawerContent bg="white" borderRadius="none" borderLeft="1px solid" borderColor="neutral.200" _dark={{ bg: "neutral.900", borderColor: "neutral.800" }}>
          <DrawerCloseButton top="4" right="4" size="sm" />
          <DrawerHeader borderBottomWidth="1px" borderColor="neutral.100" _dark={{ borderColor: "neutral.800" }} py="4">
            <h4 className="text-[15px] font-black text-neutral-900 dark:text-white tracking-tight">{selected?.quiz?.title}</h4>
            <p className="text-[9px] text-neutral-400 font-bold uppercase tracking-[0.1em] mt-0.5">{selected?.quiz?.subject}</p>
          </DrawerHeader>

          <DrawerBody p="4">
            {selected && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { label: 'Score', icon: Target, val: `${selected.score}/${selected.quiz?.totalQuestions || '-'}` },
                    { label: 'Percent', icon: BarChart3, val: percent != null ? `${percent}%` : '-' },
                    { label: 'Grade', icon: Award, val: grade || '-' },
                    { label: 'Rank', icon: Trophy, val: rankInfo ? `${rankInfo.rank}/${rankInfo.total}` : '-' }
                  ].map((s, i) => (
                    <div key={i} className="bg-neutral-50 dark:bg-neutral-800/40 rounded-lg p-2.5 border border-neutral-100 dark:border-neutral-800/50">
                      <div className="flex items-center gap-1.5 text-neutral-400 text-[8px] font-black uppercase tracking-widest mb-0.5">
                        <s.icon size={10} /> {s.label}
                      </div>
                      <div className={`text-base font-black tracking-tight ${i < 2 ? getScoreColor(percent) : 'text-neutral-900 dark:text-white'}`}>{s.val}</div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between p-3 bg-neutral-900 rounded-lg border border-neutral-800">
                  <span className={`px-2.5 py-0.5 rounded text-[8px] font-black uppercase tracking-[0.2em] ${passFail === 'Pass' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                    {passFail || 'PENDING'}
                  </span>
                  <span className="text-[9px] text-neutral-500 font-bold uppercase tracking-wider">{formatDateTime(selected.submittedAt || selected._createdAt)}</span>
                </div>

                {quizDetail?.questions?.length ? (
                  <div className="space-y-3">
                    <h5 className="text-[9px] font-black text-neutral-400 uppercase tracking-[0.3em]">Breakdown</h5>
                    <div className="space-y-3">
                      {(selected.answers || []).map((_, idx: number) => {
                        const origIdx = Array.isArray(selected.questionOrder) ? Number(selected.questionOrder[idx]) : idx
                        const baseQ = quizDetail.questions[origIdx]
                        if (!baseQ) return null
                        const chosen = Number(selected.answers?.[idx])
                        const correct = Number(baseQ.correctIndex)
                        const isCorrect = chosen === correct
                        return (
                          <div key={idx} className={`rounded-xl p-3.5 border ${isCorrect ? 'bg-emerald-50/20 border-emerald-100 dark:border-emerald-900/30' : 'bg-red-50/20 border-red-100 dark:border-red-900/30'}`}>
                            <div className="font-bold text-neutral-900 dark:text-white text-[11px] mb-2.5 leading-relaxed">
                              <span className="text-neutral-400 mr-1.5 opacity-50 font-black">#{idx + 1}</span>
                              {baseQ.question}
                            </div>
                            <div className="space-y-1.5">
                              {baseQ.options.map((opt: string, oi: number) => {
                                const isCorrectOpt = oi === correct
                                const isChosenOpt = oi === chosen
                                return (
                                  <div
                                    key={oi}
                                    className={`px-3 py-2 rounded-lg border-l-2 text-[10px] font-bold transition-colors ${isCorrectOpt
                                      ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-500 text-emerald-800 dark:text-emerald-200'
                                      : isChosenOpt
                                        ? 'bg-red-50 dark:bg-red-900/30 border-red-500 text-red-800 dark:text-red-200'
                                        : 'bg-white dark:bg-neutral-800/40 border-transparent text-neutral-500'
                                      }`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <span>{String.fromCharCode(65 + oi)}. {opt}</span>
                                      {isCorrectOpt && <span className="text-[8px] font-black uppercase tracking-widest opacity-60">CORRECT</span>}
                                      {isChosenOpt && !isCorrectOpt && <span className="text-[8px] font-black uppercase tracking-widest opacity-60">CHOSEN</span>}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </div>
  )
}

export default StudentResults
