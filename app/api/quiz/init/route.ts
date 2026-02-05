import { NextRequest, NextResponse } from 'next/server'
import serverClient from '@/sanity/lib/serverClient'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
    try {
        if (!process.env.SANITY_API_WRITE_TOKEN) {
            return NextResponse.json({ ok: false, error: 'Server is missing SANITY_API_WRITE_TOKEN' }, { status: 500 })
        }

        const { quizId, studentId, questionOrder } = await req.json()

        if (!quizId || !studentId) {
            return NextResponse.json({ ok: false, error: 'quizId and studentId are required' }, { status: 400 })
        }

        // 1. Check for existing result
        const existing = await serverClient.fetch(
            `*[_type == "quizResult" && quiz._ref == $quizId && student._ref == $studentId][0]{
        _id,
        status,
        answers,
        questionOrder
      }`,
            { quizId, studentId }
        )

        if (existing) {
            if (existing.status === 'completed') {
                return NextResponse.json({ ok: false, alreadyCompleted: true, error: 'You have already submitted this quiz.' }, { status: 409 })
            }
            // If in-progress, return for resume
            return NextResponse.json({
                ok: true,
                resultId: existing._id,
                answers: existing.answers || [],
                questionOrder: existing.questionOrder || [],
                resumed: true
            })
        }

        // 2. Fetch student info for denormalization
        const student = await serverClient.fetch(`*[_type == "student" && _id == $id][0]{ fullName, grNumber, rollNumber, admissionFor, email }`, { id: studentId })

        // 3. Create new in-progress result
        const doc = await serverClient.create({
            _type: 'quizResult',
            quiz: { _type: 'reference', _ref: quizId },
            student: { _type: 'reference', _ref: studentId },
            status: 'in-progress',
            answers: [], // Start empty
            questionOrder: questionOrder || [],
            studentName: student?.fullName || undefined,
            studentGrNumber: student?.grNumber || undefined,
            studentRollNumber: student?.rollNumber || undefined,
            className: student?.admissionFor || undefined,
            studentEmail: student?.email || undefined,
            lastUpdated: new Date().toISOString()
        })

        return NextResponse.json({
            ok: true,
            resultId: doc._id,
            resumed: false
        })

    } catch (err: any) {
        console.error("Quiz Init Error:", err)
        return NextResponse.json({ ok: false, error: err?.message || 'Failed to initialize quiz' }, { status: 500 })
    }
}
