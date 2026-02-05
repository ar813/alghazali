import { NextRequest, NextResponse } from 'next/server'
import serverClient from '@/sanity/lib/serverClient'

import { headers } from 'next/headers'
import { dbAdmin, authAdmin } from '@/lib/firebase-admin'

// Helper to verify Super Admin
async function isSuperAdmin() {
  try {
    const headersList = headers();
    const token = headersList.get('Authorization')?.replace('Bearer ', '');

    if (!token) return false;

    // Verify token using Firebase Admin SDK
    const decodedToken = await authAdmin.verifyIdToken(token);
    const uid = decodedToken.uid;

    // Check role in Firestore (Server-side check)
    const userDoc = await dbAdmin.collection('users').doc(uid).get();
    const userData = userDoc.data();

    return userData?.role === 'super_admin';
  } catch (error) {
    console.error("Auth Verification Error:", error);
    return false;
  }
}

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const quizId = searchParams.get('quizId') || undefined
    const studentId = searchParams.get('studentId') || undefined
    const limit = searchParams.get('limit') ? Math.min(200, Number(searchParams.get('limit'))) : 100
    const session = searchParams.get('session')

    // Session Logic for Quiz Results: Filter by the SESSION OF THE QUIZ
    const quizSessionFilter = `($session == null || quiz->session == $session || (!defined(quiz->session) && $session == "2025-2026"))`

    const params: Record<string, any> = { limit, session }
    let query = `*[_type == "quizResult" && ${quizSessionFilter}] | order(coalesce(submittedAt, _createdAt) desc) [0...$limit]{
      _id, quiz->{_id, title, subject, resultsAnnounced, session, 'totalQuestions': coalesce(questionLimit, count(questions))}, student->{_id, fullName, grNumber, admissionFor}, answers, score, submittedAt, _createdAt,
      studentName, studentGrNumber, studentRollNumber, className, studentEmail, questionOrder
    }`

    if (quizId || studentId) {
      const whereParts: string[] = ['_type == "quizResult"', quizSessionFilter]
      if (quizId) { whereParts.push('quiz._ref == $quizId'); params.quizId = quizId }
      if (studentId) { whereParts.push('student._ref == $studentId'); params.studentId = studentId }
      query = `*[$where] | order(coalesce(submittedAt, _createdAt) desc) [0...$limit]{
        _id, quiz->{_id, title, subject, resultsAnnounced, session, 'totalQuestions': coalesce(questionLimit, count(questions))}, student->{_id, fullName, grNumber, admissionFor}, answers, score, submittedAt, _createdAt,
        studentName, studentGrNumber, studentRollNumber, className, studentEmail, questionOrder
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
    const { quizId, studentId, answers, questionOrder } = body || {}
    if (!quizId || !studentId || !Array.isArray(answers)) {
      return NextResponse.json({ ok: false, error: 'quizId, studentId and answers[] are required' }, { status: 400 })
    }

    // Check for existing result (could be in-progress)
    const existing = await serverClient.fetch(`*[_type=="quizResult" && quiz._ref == $quizId && student._ref == $studentId][0]{ _id, status }`, { quizId, studentId })

    if (existing?.status === 'completed') {
      return NextResponse.json({ ok: false, error: 'You have already submitted this quiz.' }, { status: 409 })
    }

    // Fetch quiz to compute score
    const quiz = await serverClient.fetch(`*[_type=="quiz" && _id == $id][0]{ questions[]{ correctIndex } }`, { id: quizId }) as { questions?: { correctIndex: number }[] } | null
    const correct = (quiz?.questions || []).map(q => q.correctIndex)
    const order: number[] | null = Array.isArray(questionOrder) ? questionOrder.map((x: any) => Number(x)) : null

    let score = 0
    let totalAnswered = 0
    const len = Math.min(answers.length, order ? order.length : correct.length)
    for (let i = 0; i < len; i++) {
      const a = Number(answers[i])
      if (a >= 0) {
        totalAnswered++
        const origIdx = order ? order[i] : i
        const corr = Number(correct[origIdx] ?? -1)
        if (a === corr) score++
      }
    }

    const student = await serverClient.fetch(`*[_type=="student" && _id == $id][0]{ fullName, grNumber, rollNumber, admissionFor, email }`, { id: studentId })

    let resultDoc;
    if (existing?._id) {
      // Update existing in-progress document
      resultDoc = await serverClient
        .patch(existing._id)
        .set({
          status: 'completed',
          answers,
          score,
          submittedAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
          questionOrder: order || undefined
        })
        .commit()
    } else {
      // Create new completed document (fallback for cases where init wasn't called)
      resultDoc = await serverClient.create({
        _type: 'quizResult',
        quiz: { _type: 'reference', _ref: quizId },
        student: { _type: 'reference', _ref: studentId },
        status: 'completed',
        answers,
        score,
        submittedAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        studentName: student?.fullName || undefined,
        studentGrNumber: student?.grNumber || undefined,
        studentRollNumber: student?.rollNumber || undefined,
        className: student?.admissionFor || undefined,
        studentEmail: student?.email || undefined,
        questionOrder: order || undefined,
      })
    }

    return NextResponse.json({ ok: true, id: resultDoc._id, score, total: totalAnswered })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Failed to submit result' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    if (!process.env.SANITY_API_WRITE_TOKEN) {
      return NextResponse.json({ ok: false, error: 'Server is missing SANITY_API_WRITE_TOKEN' }, { status: 500 })
    }

    // Security Check
    const allowed = await isSuperAdmin();
    if (!allowed) {
      return NextResponse.json({ ok: false, error: 'Access Denied: Super Admin privileges required.' }, { status: 403 })
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
