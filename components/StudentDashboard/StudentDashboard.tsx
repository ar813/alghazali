import { Student } from '@/types/student';
import { Megaphone, ListChecks, CheckCircle2, Sparkles } from 'lucide-react';
import React, { useEffect, useState } from 'react'
import Image from 'next/image';
import ImageModal from '@/components/ImageModal/ImageModal'
import StudentCard from '@/components/StudentCard/StudentCard';

type QuizSummary = { _id: string; title: string; subject: string; createdAt?: string; _createdAt?: string }
type ResultSummary = { _id: string; score: number; submittedAt?: string; _createdAt?: string; quiz?: { _id: string; title: string; totalQuestions?: number } }
type NoticeSummary = { _id: string; title: string; createdAt?: string; _createdAt?: string }

const StudentDashboard = ({ data }: { data: Student }) => {
    const [imgOpen, setImgOpen] = useState(false)
    const [loading, setLoading] = useState(true)
    const [quizCount, setQuizCount] = useState(0)
    const [resultsCount, setResultsCount] = useState(0)
    const [noticesCount, setNoticesCount] = useState(0)
    const [recentQuizzes, setRecentQuizzes] = useState<QuizSummary[]>([])
    const [recentResults, setRecentResults] = useState<ResultSummary[]>([])
    const [recentNotices, setRecentNotices] = useState<NoticeSummary[]>([])

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
                setRecentQuizzes(qList.slice(0, 2))

                // Results (announced only)
                const rRes = await fetch(`/api/quiz-results?studentId=${encodeURIComponent(sid)}&limit=50`, { cache: 'no-store' })
                const rJson = await rRes.json()
                const rList: ResultSummary[] = (rJson?.ok ? rJson.data : []).filter((r: any) => r.quiz?.resultsAnnounced)
                setResultsCount(rList.length)
                setRecentResults(rList.slice(0, 2))

                // Notices targeted to all, class, or this student
                const np = new URLSearchParams()
                if (sid) np.set('studentId', sid)
                if (cls) np.set('className', cls)
                np.set('limit', '20')
                const nRes = await fetch(`/api/notices?${np.toString()}`, { cache: 'no-store' })
                const nJson = await nRes.json()
                const nList: NoticeSummary[] = nJson?.ok ? nJson.data : []
                setNoticesCount(nList.length)
                setRecentNotices(nList.slice(0, 2))
            } finally { setLoading(false) }
        }
        load()
    }, [data._id, data.admissionFor])

    const getInitial = (name?: string) => {
        if (!name) return 'A'
        const first = name.trim().charAt(0).toUpperCase()
        return first || 'A'
    }

    // Stat card config
    const statsConfig = [
        { title: 'Available Quizzes', value: quizCount, icon: ListChecks },
        { title: 'Announced Results', value: resultsCount, icon: CheckCircle2 },
        { title: 'Notices', value: noticesCount, icon: Megaphone },
    ];

    return (
        <div className="space-y-5 sm:space-y-6">
            {/* Welcome Section - Vercel Premium Dark Style */}
            <div className="relative bg-neutral-900 dark:bg-neutral-950 rounded-xl p-4 sm:p-5 text-white shadow-xl overflow-hidden border border-neutral-800">
                {/* Mesh Gradient Background */}
                <div className="absolute inset-0 bg-[#0a0a0a]" />
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[80%] bg-blue-600/10 rounded-full blur-[80px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[60%] bg-emerald-600/5 rounded-full blur-[60px]" />

                <div className="relative z-10 flex items-center justify-between">
                    <div>
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-neutral-400 text-[9px] font-bold uppercase tracking-widest mb-3">
                            <Sparkles size={10} />
                            Welcome Back
                        </div>
                        <h2 className="text-lg sm:text-xl font-bold tracking-tight mb-0.5">{data.fullName}</h2>
                        <p className="text-neutral-400 text-[10px] font-medium">{data.admissionFor} • Roll #{data.rollNumber} {data.session ? `• Session ${data.session}` : ''}</p>
                        <ImageModal open={imgOpen} src={data.photoUrl} alt={data.fullName} onClose={() => setImgOpen(false)} />
                    </div>
                    <div className="hidden sm:block">
                        {data.photoUrl ? (
                            <Image
                                src={data.photoUrl}
                                alt="Student Avatar"
                                width={84}
                                height={84}
                                className="max-h-16 md:max-h-20 w-auto object-contain rounded-lg border-2 border-white/10 shadow-lg cursor-zoom-in"
                                onClick={() => setImgOpen(true)}
                                title="Click to enlarge"
                            />
                        ) : (
                            <div className="h-16 w-16 md:h-20 md:w-20 rounded-lg bg-white/10 border-2 border-white/10 shadow-lg flex items-center justify-center text-xl md:text-2xl font-bold text-white">
                                {getInitial(data.fullName)}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Key Stats - Vercel Enterprise Style */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
                {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 animate-pulse">
                            <div className="flex items-start justify-between">
                                <div className="space-y-2">
                                    <div className="h-2 w-20 bg-neutral-200 dark:bg-neutral-700 rounded" />
                                    <div className="h-6 w-12 bg-neutral-200 dark:bg-neutral-700 rounded" />
                                </div>
                                <div className="w-9 h-9 rounded-lg bg-neutral-100 dark:bg-neutral-800" />
                            </div>
                        </div>
                    ))
                ) : (
                    statsConfig.map((stat, i) => (
                        <div key={i} className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-3.5 hover:border-blue-500/30 dark:hover:border-blue-400/30 transition-all duration-300 group">
                            <div className="flex items-start justify-between">
                                <div className="space-y-0.5">
                                    <p className="text-neutral-500 dark:text-neutral-400 text-[9px] font-bold uppercase tracking-widest">{stat.title}</p>
                                    <p className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white tracking-tight">
                                        {stat.value}
                                    </p>
                                </div>
                                <div className="w-8 h-8 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700 flex items-center justify-center transition-colors group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 group-hover:border-blue-100 dark:group-hover:border-blue-800">
                                    <stat.icon size={16} className="text-neutral-900 dark:text-neutral-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Recent Quizzes & Results */}
            <div className="grid sm:grid-cols-2 gap-4">
                {/* Recent Quizzes */}
                <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
                    <h3 className="text-[10px] font-black text-neutral-900 dark:text-white mb-3.5 flex items-center gap-2 uppercase tracking-[0.1em]">
                        <ListChecks size={14} className="text-blue-600 dark:text-blue-400" />
                        Quizzes
                    </h3>
                    {loading ? (
                        <div className="space-y-2">
                            {[...Array(2)].map((_, i) => (<div key={i} className="h-12 bg-neutral-100 dark:bg-neutral-800 rounded-lg animate-pulse" />))}
                        </div>
                    ) : recentQuizzes.length === 0 ? (
                        <div className="text-[11px] text-neutral-500 dark:text-neutral-400 py-3 text-center">No quizzes available.</div>
                    ) : (
                        <div className="space-y-2.5">
                            {recentQuizzes.map(q => (
                                <div key={q._id} className="p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-100 dark:border-neutral-700/50">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="font-bold text-neutral-900 dark:text-white text-[12px] truncate">{q.title}</div>
                                        <span className="px-1.5 py-0.5 text-[8px] rounded bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800 font-black uppercase tracking-wider">{q.subject}</span>
                                    </div>
                                    <div className="text-[9px] text-neutral-500 dark:text-neutral-400 mt-1 uppercase font-bold tracking-wider">{new Date((q as any).createdAt || (q as any)._createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent Results */}
                <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
                    <h3 className="text-[10px] font-black text-neutral-900 dark:text-white mb-3.5 flex items-center gap-2 uppercase tracking-[0.1em]">
                        <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" />
                        Results
                    </h3>
                    {loading ? (
                        <div className="space-y-2">
                            {[...Array(2)].map((_, i) => (<div key={i} className="h-12 bg-neutral-100 dark:bg-neutral-800 rounded-lg animate-pulse" />))}
                        </div>
                    ) : recentResults.length === 0 ? (
                        <div className="text-[11px] text-neutral-500 dark:text-neutral-400 py-3 text-center">No announced results.</div>
                    ) : (
                        <div className="space-y-2.5">
                            {recentResults.map(r => (
                                <div key={r._id} className="p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-100 dark:border-neutral-700/50">
                                    <div className="font-bold text-neutral-900 dark:text-white text-[12px] truncate">{r.quiz?.title}</div>
                                    <div className="flex items-center justify-between mt-1">
                                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-black uppercase tracking-wider">Score: {r.score}{typeof r.quiz?.totalQuestions === 'number' ? ` / ${r.quiz.totalQuestions}` : ''}</span>
                                        <span className="text-[9px] text-neutral-500 dark:text-neutral-400 font-bold tracking-wider">{new Date((r.submittedAt || r._createdAt)!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Recent Notice */}
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
                <h3 className="text-[10px] font-black text-neutral-900 dark:text-white mb-3.5 flex items-center gap-2 uppercase tracking-[0.1em]">
                    <Megaphone size={14} className="text-orange-600 dark:text-orange-400" />
                    Notice
                </h3>
                {loading ? (
                    <div className="h-16 bg-neutral-100 dark:bg-neutral-800 rounded-lg animate-pulse" />
                ) : (
                    recentNotices.length > 0 ? (
                        <div className="p-3.5 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-100 dark:border-neutral-700/50">
                            <div className="font-bold text-neutral-900 dark:text-white text-[12px] mb-1">{(recentNotices[0] as any).title}</div>
                            <p className="text-[11px] text-neutral-600 dark:text-neutral-400 leading-snug">{(recentNotices[0] as any).content}</p>
                        </div>
                    ) : (
                        <div className="text-[11px] text-neutral-500 dark:text-neutral-400 py-2 text-center">No notices.</div>
                    )
                )}
            </div>

            {/* Student ID Card */}
            <div className="mt-6 border-t border-neutral-200 dark:border-neutral-800 pt-6">
                <div className="flex items-center gap-2.5 mb-5">
                    <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center">
                        <Sparkles size={14} className="text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-neutral-900 dark:text-white tracking-tight">Student Identity Card</h3>
                        <p className="text-[10px] text-neutral-500 dark:text-neutral-400">Digital ID version</p>
                    </div>
                </div>
                <StudentCard student={data} />
            </div>
        </div>
    )
}

export default StudentDashboard