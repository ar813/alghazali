import { NextRequest, NextResponse } from 'next/server'
import serverClient from '@/sanity/lib/serverClient'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const studentId = searchParams.get('studentId') || undefined
    const className = searchParams.get('className') || undefined
    const id = searchParams.get('id') || undefined
    const limit = searchParams.get('limit') ? Math.min(100, Number(searchParams.get('limit'))) : 50

    if (id) {
      const data = await serverClient.fetch(`*[_type=="quiz" && _id == $id][0]{
        _id, title, subject, targetType, className, resultsAnnounced, durationMinutes, questionLimit,
        student->{_id, fullName},
        questions[]{ question, options, correctIndex, difficulty },
        createdAt, _createdAt
      }`, { id })
      return NextResponse.json({ ok: true, data })
    }

    const params: Record<string, any> = { limit }
    let query: string
    if (!className && !studentId) {
      query = `*[_type == "quiz"] | order(coalesce(createdAt, _createdAt) desc) [0...$limit]{
        _id, title, subject, targetType, className, resultsAnnounced, durationMinutes, questionLimit,
        student->{_id, fullName},
        questions[]{ question, options, correctIndex, difficulty },
        createdAt, _createdAt
      }`
    } else {
      const whereParts: string[] = ['_type == "quiz"']
      const conditions: string[] = [`targetType == 'all'`]
      if (className) { conditions.push(`(targetType == 'class' && className == $className)`); params.className = className }
      if (studentId) { conditions.push(`(targetType == 'student' && defined(student) && student._ref == $studentId)`); params.studentId = studentId }
      whereParts.push(`(${conditions.join(' || ')})`)
      query = `*[$where] | order(coalesce(createdAt, _createdAt) desc) [0...$limit]{
        _id, title, subject, targetType, className, resultsAnnounced, durationMinutes, questionLimit,
        student->{_id, fullName},
        questions[]{ question, options, correctIndex, difficulty },
        createdAt, _createdAt
      }`.replace('$where', whereParts.join(' && '))
    }

    const data = await serverClient.fetch(query, params)
    return NextResponse.json({ ok: true, data })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Failed to fetch quizzes' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.SANITY_API_WRITE_TOKEN) {
      return NextResponse.json({ ok: false, error: 'Server is missing SANITY_API_WRITE_TOKEN' }, { status: 500 })
    }
    const body = await req.json()
    const { title, subject, targetType, className, studentId, questions, durationMinutes, questionLimit } = body || {}
    if (!title || !subject || !targetType || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ ok: false, error: 'title, subject, targetType and at least one question are required' }, { status: 400 })
    }
    if (typeof questionLimit !== 'number' || !(questionLimit >= 1 && questionLimit <= 200)) {
      return NextResponse.json({ ok: false, error: 'questionLimit (Total Questions) is required and must be between 1 and 200' }, { status: 400 })
    }
    if (targetType === 'class' && !className) {
      return NextResponse.json({ ok: false, error: 'className is required for class target' }, { status: 400 })
    }
    if (targetType === 'student' && !studentId) {
      return NextResponse.json({ ok: false, error: 'studentId is required for student target' }, { status: 400 })
    }

    const doc: any = {
      _type: 'quiz',
      title,
      subject,
      targetType,
      className: className || undefined,
      resultsAnnounced: false,
      createdAt: new Date().toISOString(),
      questions: questions.map((q: any) => ({ question: q.question, options: q.options, correctIndex: q.correctIndex, difficulty: q.difficulty || 'easy' })),
      durationMinutes: typeof durationMinutes === 'number' ? durationMinutes : undefined,
      questionLimit,
    }
    if (targetType === 'student') doc.student = { _type: 'reference', _ref: studentId }

    const created = await serverClient.create(doc)
    return NextResponse.json({ ok: true, id: created._id })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Failed to create quiz' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    if (!process.env.SANITY_API_WRITE_TOKEN) {
      return NextResponse.json({ ok: false, error: 'Server is missing SANITY_API_WRITE_TOKEN' }, { status: 500 })
    }
    const body = await req.json()
    const { id, ...rest } = body || {}
    if (!id) return NextResponse.json({ ok: false, error: 'id is required' }, { status: 400 })

    const patch: any = {}
    for (const k of ['title','subject','targetType','className','resultsAnnounced','durationMinutes','questionLimit'] as const) {
      if (k in rest) patch[k] = (rest as any)[k]
    }
    if ('studentId' in rest) patch.student = rest.studentId ? { _type: 'reference', _ref: rest.studentId } : undefined
    if ('questions' in rest && Array.isArray(rest.questions)) patch.questions = rest.questions.map((q: any) => ({ question: q.question, options: q.options, correctIndex: q.correctIndex, difficulty: q.difficulty || 'easy' }))

    await serverClient.patch(id).set(patch).commit()
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Failed to update quiz' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    if (!process.env.SANITY_API_WRITE_TOKEN) {
      return NextResponse.json({ ok: false, error: 'Server is missing SANITY_API_WRITE_TOKEN' }, { status: 500 })
    }
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ ok: false, error: 'id is required' }, { status: 400 })

    // Cascade delete related results first
    await serverClient.delete({ query: '*[_type == "quizResult" && quiz._ref == $quizId]', params: { quizId: id } } as any)
    // Then delete the quiz itself
    await serverClient.delete(id)
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Failed to delete quiz' }, { status: 500 })
  }
}
