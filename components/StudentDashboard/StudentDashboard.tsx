import { Student } from '@/types/student';
import { Megaphone, ListChecks, CheckCircle2 } from 'lucide-react';
import React, { useEffect, useState } from 'react'
import Image from 'next/image';
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
    // Removed GPA and Performance per requirement

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
                // GPA/Performance removed

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

    const getInitial = (name?: string) => {
        if (!name) return 'A'
        const first = name.trim().charAt(0).toUpperCase()
        return first || 'A'
    }

    return (
        <div className="space-y-8 ">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl sm:rounded-3xl p-5 sm:p-8 text-white shadow-xl sm:shadow-2xl">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-1 sm:mb-2">Welcome back, {data.fullName}! 👋</h3>
                        <p className="text-sm sm:text-base text-blue-100">Wishing you a productive day of learning.</p>
                        <ImageModal open={imgOpen} src={data.photoUrl} alt={data.fullName} onClose={() => setImgOpen(false)} />
        </div>
                    <div className="block">
                        {data.photoUrl ? (
                            <Image
                                src={data.photoUrl}
                                alt="Student Avatar"
                                width={96}
                                height={96}
                                className="max-h-16 w-auto sm:max-h-20 md:max-h-24 object-contain rounded-md border-2 sm:border-4 border-white/30 shadow-lg cursor-zoom-in"
                                onClick={() => setImgOpen(true)}
                                title="Click to enlarge"
                            />
                        ) : (
                            <div className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 rounded-full bg-white/20 border-2 sm:border-4 border-white/30 shadow-lg flex items-center justify-center text-xl sm:text-2xl md:text-3xl font-bold text-white">
                                {getInitial(data.fullName)}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Key Stats (GPA removed) */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
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
                {/* GPA card removed */}
            </div>

            {/* Recent Quizzes (Performance section removed) */}
            <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
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
                                    <div className="text-xs text-gray-500">{new Date((q as any).createdAt || (q as any)._createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short', hour12: true })}</div>
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
                                    <div className="text-xs text-gray-500">{new Date((r.submittedAt || r._createdAt)!).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short', hour12: true })}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 sm:p-6 shadow-md border border-white/20">
                <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
                    <Megaphone size={18} className="text-orange-600" /> Recent Notice
                </h3>
                {loading ? (
                    <div className="space-y-2">
                        {[...Array(3)].map((_,i)=>(<div key={i} className="h-10 bg-gray-100 rounded animate-pulse"/>))}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {recentNotices.length === 0 ? (
                            <div className="text-sm text-gray-500">No notices.</div>
                        ) : (
                            (() => {
                                const n: any = recentNotices[0]
                                return (
                                    <div className="p-2.5 bg-gray-50 rounded border">
                                        <div className="font-medium text-gray-800 text-sm mb-1">{n.title}</div>
                                        <div className="text-xs text-gray-500 mb-1">{new Date((n as any).createdAt || (n as any)._createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short', hour12: true })}</div>
                                        {n?.content ? (
                                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{(n as any).content}</p>
                                        ) : null}
                                    </div>
                                )
                            })()
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

export default StudentDashboard