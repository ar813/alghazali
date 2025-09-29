import { Student } from '@/types/student';
import { Megaphone, ListChecks, CheckCircle2, BarChart3 } from 'lucide-react';
import React, { useEffect, useState } from 'react'
import ImageModal from '@/components/ImageModal/ImageModal'

type QuizSummary = { _id: string; title: string; subject: string; createdAt?: string; _createdAt?: string }
type ResultSummary = { _id: string; score: number; submittedAt?: string; _createdAt?: string; quiz?: { _id: string; title: string; totalQuestions?: number } }
type NoticeSummary = { _id: string; title: string; createdAt?: string; _createdAt?: string }

const StudentDashboard = ({data}:{data: Student}) => {
    const [imgOpen, setImgOpen] = useState(false)
    const [loading, setLoading] = useState(true)
    const [quizCount, setQuizCount] = useState(0)
    const [resultsCount, setResultsCount] = useState(0)
    const [noticesCount, setNoticesCount] = useState(0)
    const [recentQuizzes, setRecentQuizzes] = useState<QuizSummary[]>([])
    const [recentResults, setRecentResults] = useState<ResultSummary[]>([])
    const [recentNotices, setRecentNotices] = useState<NoticeSummary[]>([])
    const [gpa, setGpa] = useState<number | null>(null)
    const [scoreSeries, setScoreSeries] = useState<number[]>([])

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true)
                const sid = String(data._id)
                const cls = String(data.admissionFor || '')

                // Quizzes available to this student
                const qp = new URLSearchParams()
                if (sid) qp.set('studentId', sid)
                if (cls) qp.set('className', cls)
                qp.set('limit', '20')
                const qRes = await fetch(`/api/quizzes?${qp.toString()}`, { cache: 'no-store' })
                const qJson = await qRes.json()
                const qList: QuizSummary[] = qJson?.ok ? qJson.data : []
                setQuizCount(qList.length)
                setRecentQuizzes(qList.slice(0, 3))

                // Results (announced only)
                const rRes = await fetch(`/api/quiz-results?studentId=${encodeURIComponent(sid)}&limit=50`, { cache: 'no-store' })
                const rJson = await rRes.json()
                const rList: ResultSummary[] = (rJson?.ok ? rJson.data : []).filter((r: any) => r.quiz?.resultsAnnounced)
                setResultsCount(rList.length)
                setRecentResults(rList.slice(0, 3))
                // Compute GPA and series from up to 8 latest results
                const latest = rList.slice(0, 8)
                const percentages = latest.map((r) => {
                    const tq = Number(r.quiz?.totalQuestions || 0)
                    if (!tq) return null
                    const pct = Math.max(0, Math.min(100, (r.score / tq) * 100))
                    return pct
                }).filter((v): v is number => v !== null)
                setScoreSeries(percentages)
                if (percentages.length > 0) {
                    const avg = percentages.reduce((a, b) => a + b, 0) / percentages.length
                    const mapped = Math.min(4, Math.max(0, avg / 25)) // 100% => 4.0
                    setGpa(Number(mapped.toFixed(2)))
                } else {
                    setGpa(null)
                }

                // Notices targeted to all, class, or this student
                const np = new URLSearchParams()
                if (sid) np.set('studentId', sid)
                if (cls) np.set('className', cls)
                np.set('limit', '20')
                const nRes = await fetch(`/api/notices?${np.toString()}`, { cache: 'no-store' })
                const nJson = await nRes.json()
                const nList: NoticeSummary[] = nJson?.ok ? nJson.data : []
                setNoticesCount(nList.length)
                setRecentNotices(nList.slice(0, 3))
            } finally { setLoading(false) }
        }
        load()
    }, [data._id, data.admissionFor])

    return (
        <div className="space-y-8 ">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl sm:rounded-3xl p-5 sm:p-8 text-white shadow-xl sm:shadow-2xl">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-1 sm:mb-2">Welcome back, {data.fullName}! 👋</h3>
                        <p className="text-sm sm:text-base text-blue-100">Wishing you a productive day of learning.</p>
                    </div>
                    <div className="block">
                        <img
                            src={data.photoUrl}
                            alt="Student Avatar"
                            className="max-h-16 w-auto sm:max-h-20 md:max-h-24 object-contain rounded-md border-2 sm:border-4 border-white/30 shadow-lg cursor-zoom-in"
                            onClick={() => data.photoUrl && setImgOpen(true)}
                            title="Click to enlarge"
                        />
                    </div>
                </div>
            </div>

            {/* Key Stats + GPA */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 sm:p-6 shadow-md border border-white/20">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center mb-3`}><ListChecks size={18} className="text-white"/></div>
                    <div className="text-2xl font-bold text-gray-800">{loading ? '—' : quizCount}</div>
                    <div className="text-xs text-gray-600">Available Quizzes</div>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 sm:p-6 shadow-md border border-white/20">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-3`}><CheckCircle2 size={18} className="text-white"/></div>
                    <div className="text-2xl font-bold text-gray-800">{loading ? '—' : resultsCount}</div>
                    <div className="text-xs text-gray-600">Announced Results</div>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 sm:p-6 shadow-md border border-white/20">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-rose-600 flex items-center justify-center mb-3`}><Megaphone size={18} className="text-white"/></div>
                    <div className="text-2xl font-bold text-gray-800">{loading ? '—' : noticesCount}</div>
                    <div className="text-xs text-gray-600">Notices</div>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 sm:p-6 shadow-md border border-white/20">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center mb-3`}><BarChart3 size={18} className="text-white"/></div>
                    <div className="text-2xl font-bold text-gray-800">{loading ? '—' : (gpa ?? '—')}</div>
                    <div className="text-xs text-gray-600">GPA (est.)</div>
                </div>
            </div>

            {/* Performance Sparkline + Recent Items */}
            <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 sm:p-6 shadow-md border border-white/20">
                    <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
                        <BarChart3 size={18} className="text-indigo-600" /> Performance (last results)
                    </h3>
                    {loading ? (
                        <div className="h-24 bg-gray-100 rounded animate-pulse" />
                    ) : scoreSeries.length === 0 ? (
                        <div className="text-sm text-gray-500">No results to show performance.</div>
                    ) : (
                        <Sparkline data={scoreSeries} />
                    )}
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 sm:p-6 shadow-md border border-white/20">
                    <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
                        <ListChecks size={18} className="text-blue-600" /> Recent Quizzes
                    </h3>
                    {loading ? (
                        <div className="space-y-2">
                            {[...Array(3)].map((_,i)=>(<div key={i} className="h-10 bg-gray-100 rounded animate-pulse"/>))}
                        </div>
                    ) : recentQuizzes.length === 0 ? (
                        <div className="text-sm text-gray-500">No quizzes available.</div>
                    ) : (
                        <div className="space-y-2">
                            {recentQuizzes.map(q => (
                                <div key={q._id} className="p-2.5 bg-gray-50 rounded border">
                                    <div className="font-medium text-gray-800 text-sm">{q.title} <span className="text-xs text-gray-500">({q.subject})</span></div>
                                    <div className="text-xs text-gray-500">{new Date((q as any).createdAt || (q as any)._createdAt).toLocaleString()}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 sm:p-6 shadow-md border border-white/20">
                    <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
                        <CheckCircle2 size={18} className="text-emerald-600" /> Recent Results
                    </h3>
                    {loading ? (
                        <div className="space-y-2">
                            {[...Array(3)].map((_,i)=>(<div key={i} className="h-10 bg-gray-100 rounded animate-pulse"/>))}
                        </div>
                    ) : recentResults.length === 0 ? (
                        <div className="text-sm text-gray-500">No announced results yet.</div>
                    ) : (
                        <div className="space-y-2">
                            {recentResults.map(r => (
                                <div key={r._id} className="p-2.5 bg-gray-50 rounded border">
                                    <div className="font-medium text-gray-800 text-sm">{r.quiz?.title}</div>
                                    <div className="text-xs text-gray-600">Score: {r.score}{typeof r.quiz?.totalQuestions === 'number' ? ` / ${r.quiz.totalQuestions}` : ''}</div>
                                    <div className="text-xs text-gray-500">{new Date((r.submittedAt || r._createdAt)!).toLocaleString()}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 sm:p-6 shadow-md border border-white/20">
                <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
                    <Megaphone size={18} className="text-orange-600" /> Notices & Upcoming Events
                </h3>
                {loading ? (
                    <div className="space-y-2">
                        {[...Array(3)].map((_,i)=>(<div key={i} className="h-10 bg-gray-100 rounded animate-pulse"/>))}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {/* Recent notices */}
                        {recentNotices.length === 0 ? (
                            <div className="text-sm text-gray-500">No notices.</div>
                        ) : recentNotices.map(n => (
                            <div key={n._id} className="p-2.5 bg-gray-50 rounded border">
                                <div className="font-medium text-gray-800 text-sm">{n.title}</div>
                                <div className="text-xs text-gray-500">{new Date((n as any).createdAt || (n as any)._createdAt).toLocaleString()}</div>
                            </div>
                        ))}
                        {/* Upcoming events (from notices API shape: isEvent, eventDate) */}
                        {(() => {
                            const today = new Date()
                            const events = (recentNotices as any[]).filter(x => x?.isEvent && x?.eventDate).map(x => ({
                                id: x._id,
                                title: x.title,
                                when: new Date(x.eventDate)
                            })).filter(e => e.when >= new Date(today.getFullYear(), today.getMonth(), today.getDate()))
                              .sort((a,b)=>a.when.getTime()-b.when.getTime())
                              .slice(0,3)
                            if (events.length === 0) return null
                            return (
                                <div className="pt-2 border-t mt-2">
                                    <div className="text-sm font-semibold text-gray-700 mb-2">Upcoming Events</div>
                                    <div className="space-y-2">
                                        {events.map(e => (
                                            <div key={e.id} className="p-2.5 bg-amber-50 rounded border border-amber-200">
                                                <div className="font-medium text-amber-800 text-sm">{e.title}</div>
                                                <div className="text-xs text-amber-700">{e.when.toLocaleString()}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )
                        })()}
                    </div>
                )}
            </div>

            <ImageModal open={imgOpen} src={data.photoUrl} alt={data.fullName} onClose={() => setImgOpen(false)} />
        </div>
    )
}

// Lightweight sparkline component using SVG
function Sparkline({ data }: { data: number[] }) {
    const width = 360
    const height = 80
    const pad = 8
    const n = data.length
    const xs = (i: number) => pad + (i * (width - 2 * pad)) / Math.max(1, n - 1)
    const min = 0, max = 100
    const ys = (v: number) => height - pad - ((v - min) * (height - 2 * pad)) / (max - min)
    const path = data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${xs(i)} ${ys(v)}`).join(' ')
    const last = data[n - 1]
    return (
        <div className="flex flex-col gap-2">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-24">
                <rect x={0} y={0} width={width} height={height} rx={8} className="fill-gray-50" />
                <path d={path} className="stroke-indigo-600 fill-none" strokeWidth={2} />
                {data.map((v, i) => (
                    <circle key={i} cx={xs(i)} cy={ys(v)} r={2} className="fill-indigo-600" />
                ))}
            </svg>
            <div className="text-xs text-gray-600">Scores: {data.map(d => `${Math.round(d)}%`).join(' • ')}</div>
            <div className="text-xs text-gray-700 font-medium">Last: {Math.round(last)}%</div>
        </div>
    )
}

export default StudentDashboard