import { NextResponse } from 'next/server'
import serverClient from '@/sanity/lib/serverClient'

export async function GET() {
  try {
    const [
      totalStudents,
      admissionsLast365,
      totalQuizzes,
      resultsLast30,
      totalNotices,
    ] = await Promise.all([
      serverClient.fetch<number>('count(*[_type == "student"])'),
      serverClient.fetch<number>(
        'count(*[_type == "student" && dateTime(_createdAt) >= dateTime(now()) - 60*60*24*365])'
      ),
      serverClient.fetch<number>('count(*[_type == "quiz"])'),
      serverClient.fetch<number>(
        'count(*[_type == "quizResult" && dateTime(coalesce(submittedAt, _createdAt)) >= dateTime(now()) - 60*60*24*30])'
      ),
      serverClient.fetch<number>('count(*[_type == "notice"])'),
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
