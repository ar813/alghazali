import { NextResponse } from 'next/server'
import serverClient from '@/sanity/lib/serverClient'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const session = searchParams.get('session')

    // Session logic: Check session match OR if searching for default session (2024-2025), include docs with no session.
    // For queries where we pass $session
    const sessionFilter = `($session == null || session == $session || (!defined(session) && $session == "2024-2025"))`

    // For joining quiz logic: session could be on quiz or result? Ideally on quiz.
    // Quiz Result query: quiz->session == $session
    // But backward compat: (!defined(quiz->session) && $session == "2024-2025")
    const quizSessionFilter = `($session == null || quiz->session == $session || (!defined(quiz->session) && $session == "2024-2025"))`

    const params = { session }

    const [
      totalStudents,
      admissionsLast365,
      totalQuizzes,
      resultsLast30,
      totalNotices,
    ] = await Promise.all([
      serverClient.fetch<number>(`count(*[_type == "student" && ${sessionFilter}])`, params),
      serverClient.fetch<number>(
        `count(*[_type == "student" && ${sessionFilter} && dateTime(_createdAt) >= dateTime(now()) - 60*60*24*365])`,
        params
      ),
      serverClient.fetch<number>(`count(*[_type == "quiz" && ${sessionFilter}])`, params),
      serverClient.fetch<number>(
        `count(*[_type == "quizResult" && ${quizSessionFilter} && dateTime(coalesce(submittedAt, _createdAt)) >= dateTime(now()) - 60*60*24*30])`,
        params
      ),
      serverClient.fetch<number>(`count(*[_type == "notice" && ${sessionFilter}])`, params),
    ])

    return NextResponse.json({
      ok: true,
      data: {
        totalStudents,
        admissionsLast365,
        totalQuizzes,
        resultsLast30,
        totalNotices,
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to fetch stats from Sanity',
        details: error?.message || String(error),
      },
      { status: 500 }
    )
  }
}
