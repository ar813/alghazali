import { NextRequest, NextResponse } from 'next/server'
import serverClient from '@/sanity/lib/serverClient'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const quizId = searchParams.get('quizId') || undefined
    const studentId = searchParams.get('studentId') || undefined
    const limit = searchParams.get('limit') ? Math.min(200, Number(searchParams.get('limit'))) : 100

    const params: Record<string, any> = { limit }
    let query = `*[_type == "quizResult"] | order(coalesce(submittedAt, _createdAt) desc) [0...$limit]{
      _id, quiz->{_id, title, subject, resultsAnnounced, 'totalQuestions': coalesce(questionLimit, count(questions))}, student->{_id, fullName, grNumber, admissionFor}, answers, score, submittedAt, _createdAt,
      studentName, studentGrNumber, studentRollNumber, className, studentEmail
    }`

    if (quizId || studentId) {
      const whereParts: string[] = ['_type == "quizResult"']
      if (quizId) { whereParts.push('quiz._ref == $quizId'); params.quizId = quizId }
      if (studentId) { whereParts.push('student._ref == $studentId'); params.studentId = studentId }
      query = `*[$where] | order(coalesce(submittedAt, _createdAt) desc) [0...$limit]{
        _id, quiz->{_id, title, subject, resultsAnnounced, 'totalQuestions': coalesce(questionLimit, count(questions))}, student->{_id, fullName, grNumber, admissionFor}, answers, score, submittedAt, _createdAt,
        studentName, studentGrNumber, studentRollNumber, className, studentEmail
      }`.replace('$where', whereParts.join(' && '))
    }

    const data = await serverClient.fetch(query, params)
    return NextResponse.json({ ok: true, data })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Failed to fetch quiz results' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.SANITY_API_WRITE_TOKEN) {
      return NextResponse.json({ ok: false, error: 'Server is missing SANITY_API_WRITE_TOKEN' }, { status: 500 })
    }
    const body = await req.json()
    const { quizId, studentId, answers } = body || {}
    if (!quizId || !studentId || !Array.isArray(answers)) {
      return NextResponse.json({ ok: false, error: 'quizId, studentId and answers[] are required' }, { status: 400 })
    }

    // Prevent duplicate submissions for same quiz and student
    const existing = await serverClient.fetch(`*[_type=="quizResult" && quiz._ref == $quizId && student._ref == $studentId][0]{ _id }`, { quizId, studentId })
    if (existing?._id) {
      return NextResponse.json({ ok: false, error: 'You have already submitted this quiz.' }, { status: 409 })
    }

    // Fetch quiz to compute score
    const quiz = await serverClient.fetch(`*[_type=="quiz" && _id == $id][0]{ questions[]{ correctIndex } }`, { id: quizId }) as { questions?: { correctIndex: number }[] } | null
    const correct = (quiz?.questions || []).map(q => q.correctIndex)
    let score = 0
    let totalAnswered = 0
    const len = Math.min(correct.length, answers.length)
    for (let i = 0; i < len; i++) {
      const a = Number(answers[i])
      if (a >= 0) {
        totalAnswered++
        if (a === Number(correct[i])) score++
      }
    }

    // fetch student base info to denormalize
    const student = await serverClient.fetch(`*[_type=="student" && _id == $id][0]{ fullName, grNumber, rollNumber, admissionFor, email }`, { id: studentId })

    const doc = await serverClient.create({
      _type: 'quizResult',
      quiz: { _type: 'reference', _ref: quizId },
      student: { _type: 'reference', _ref: studentId },
      answers,
      score,
      submittedAt: new Date().toISOString(),
      studentName: student?.fullName || undefined,
      studentGrNumber: student?.grNumber || undefined,
      studentRollNumber: student?.rollNumber || undefined,
      className: student?.admissionFor || undefined,
      studentEmail: student?.email || undefined,
    })

    return NextResponse.json({ ok: true, id: doc._id, score, total: totalAnswered })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Failed to submit result' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    if (!process.env.SANITY_API_WRITE_TOKEN) {
      return NextResponse.json({ ok: false, error: 'Server is missing SANITY_API_WRITE_TOKEN' }, { status: 500 })
    }
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const quizId = searchParams.get('quizId')
    const all = searchParams.get('all') === 'true'

    if (id) {
      await serverClient.delete(id)
      return NextResponse.json({ ok: true })
    }

    if (all && quizId) {
      await serverClient.delete({ query: '*[_type == "quizResult" && quiz._ref == $quizId]', params: { quizId } } as any)
      return NextResponse.json({ ok: true, deleted: 'all' })
    }

    return NextResponse.json({ ok: false, error: 'Provide id to delete one or quizId & all=true to delete all' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Failed to delete quiz results' }, { status: 500 })
  }
}
