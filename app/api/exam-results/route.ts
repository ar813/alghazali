import { NextRequest, NextResponse } from 'next/server'
import serverClient from '@/sanity/lib/serverClient'

// This tells Next.js that this route is dynamic and should not be statically generated
export const dynamic = 'force-dynamic'

// Helpers
const gradeFromPercent = (pct: number) => pct >= 85 ? 'A+' : pct >= 75 ? 'A' : pct >= 65 ? 'B' : pct >= 50 ? 'C' : pct >= 40 ? 'D' : 'F'

// Compute aggregates for one student
function computeStudentAggregates(marks: number[], subjectsCount: number, maxPer: number, minPassPct: number) {
  const totalObtained = (marks || []).reduce((s: number, v: number) => s + Number(v || 0), 0)
  const totalMax = (subjectsCount || 0) * (maxPer || 0)
  const percentage = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : 0
  const grade = gradeFromPercent(percentage)
  const remarks = percentage >= (minPassPct || 40) ? 'Pass' : 'Fail'
  return { totalObtained, totalMax, percentage, grade, remarks }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const className = searchParams.get('className') || undefined
    const examTitle = searchParams.get('examTitle') || undefined
    const list = searchParams.get('list') || undefined // 'titles'

    // List past exam titles for a class
    if (list === 'titles') {
      if (!className) return NextResponse.json({ ok: true, titles: [] })
      const titles: string[] = await serverClient.fetch(
        `*[_type=="examResultSet" && className==$className]{examTitle} | order(examTitle asc)`,
        { className }
      )
      const unique = Array.from(new Set((titles || []).map((t: any) => t?.examTitle).filter(Boolean)))
      return NextResponse.json({ ok: true, titles: unique })
    }

    // Fetch a single exam set for class + examTitle
    if (className && examTitle) {
      const doc = await serverClient.fetch(
        `*[_type=="examResultSet" && className==$className && examTitle==$examTitle][0]{
          _id, examTitle, className, subjects, maxMarksPerSubject, minPassPercentage, minMarksPerSubject, createdAt,
          students[]{
            student->{ _id, fullName, fatherName, rollNumber, grNumber, admissionFor },
            studentName, fatherName, rollNumber, grNumber, marks, percentage, grade, remarks, createdAt
          }
        }`,
        { className, examTitle }
      )
      return NextResponse.json({ ok: true, data: doc || null })
    }

    // Fallback: list all exams (lightweight)
    const data = await serverClient.fetch(`*[_type=="examResultSet"]{ _id, examTitle, className, subjects, maxMarksPerSubject, minPassPercentage, minMarksPerSubject, createdAt } | order(createdAt desc)[0...100]`)
    return NextResponse.json({ ok: true, data })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Failed to fetch results' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.SANITY_API_WRITE_TOKEN) {
      return NextResponse.json({ ok: false, error: 'Server is missing SANITY_API_WRITE_TOKEN' }, { status: 500 })
    }
    const body = await req.json()
    const { studentId, className, examTitle, subjects, marks, maxMarksPerSubject, minPassPercentage, minMarksPerSubject, studentName, fatherName, rollNumber, grNumber } = body || {}

    if (!studentId || !className || !examTitle || !Array.isArray(subjects) || subjects.length === 0 || !Array.isArray(marks) || marks.length !== subjects.length) {
      return NextResponse.json({ ok: false, error: 'studentId, className, examTitle, subjects[] and marks[] (same length) are required' }, { status: 400 })
    }
    const maxPer = Number(maxMarksPerSubject)
    if (!maxPer || maxPer <= 0) {
      return NextResponse.json({ ok: false, error: 'maxMarksPerSubject must be a positive number' }, { status: 400 })
    }
    // Validation: marks should be numbers and <= maxPer
    const numericMarks = marks.map((m: any) => Number(m))
    for (const val of numericMarks) {
      if (Number.isNaN(val) || val < 0 || val > maxPer) {
        return NextResponse.json({ ok: false, error: 'Each mark must be between 0 and maxMarksPerSubject' }, { status: 400 })
      }
    }
    const passPct = Number(minPassPercentage) || 40
    const agg = computeStudentAggregates(numericMarks, subjects.length, maxPer, passPct)

    // Find or create the exam set document
    let doc = await serverClient.fetch(`*[_type=="examResultSet" && className==$className && examTitle==$examTitle][0]`, { className, examTitle })
    if (!doc) {
      doc = await serverClient.create({
        _type: 'examResultSet',
        className,
        examTitle,
        subjects,
        maxMarksPerSubject: maxPer,
        minPassPercentage: passPct,
        minMarksPerSubject: Number(minMarksPerSubject) || undefined,
        students: [],
        createdAt: new Date().toISOString(),
      })
    }

    // Upsert student inside students[] by student._ref
    const existing = await serverClient.fetch(
      `*[_type=="examResultSet" && _id==$id][0]{ students[]{ student->{_id}, _key } }`,
      { id: doc._id }
    )
    const found = (existing?.students || []).find((sr: any) => sr?.student?._id === studentId)
    if (found) {
      // update specific student object by _key
      const patch = await serverClient
        .patch(doc._id)
        .set({
          [`students[_key=="${found._key}"]`]: {
            student: { _type: 'reference', _ref: studentId },
            studentName, fatherName, rollNumber, grNumber,
            marks: numericMarks,
            percentage: agg.percentage,
            grade: agg.grade,
            remarks: agg.remarks,
            createdAt: new Date().toISOString(),
          },
        })
        .commit()
      return NextResponse.json({ ok: true, id: doc._id, updatedKey: found._key, res: patch })
    } else {
      const newStudent = {
        _type: 'studentResult',
        student: { _type: 'reference', _ref: studentId },
        studentName, fatherName, rollNumber, grNumber,
        marks: numericMarks,
        percentage: agg.percentage,
        grade: agg.grade,
        remarks: agg.remarks,
        createdAt: new Date().toISOString(),
      }
      const patch = await serverClient
        .patch(doc._id)
        .setIfMissing({ students: [] })
        .append('students', [newStudent as any])
        .commit()
      return NextResponse.json({ ok: true, id: doc._id, res: patch })
    }
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Failed to create result' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    if (!process.env.SANITY_API_WRITE_TOKEN) {
      return NextResponse.json({ ok: false, error: 'Server is missing SANITY_API_WRITE_TOKEN' }, { status: 500 })
    }
    const body = await req.json()
    const { id, studentId, patch, updateDoc } = body || {}
    if (!id) return NextResponse.json({ ok: false, error: 'id required' }, { status: 400 })

    // Update document-level fields (subjects, max/min, etc.)
    if (updateDoc) {
      const existing = await serverClient.fetch(`*[_type=="examResultSet" && _id==$id][0]`, { id })
      if (!existing) return NextResponse.json({ ok: false, error: 'Document not found' }, { status: 404 })
      const next: any = { ...updateDoc }
      const res = await serverClient.patch(id).set(next).commit()
      return NextResponse.json({ ok: true, res })
    }

    // Update one student's marks inside students[]
    if (!studentId || !patch) return NextResponse.json({ ok: false, error: 'studentId and patch required' }, { status: 400 })
    const existing = await serverClient.fetch(`*[_type=="examResultSet" && _id==$id][0]{ subjects, maxMarksPerSubject, minPassPercentage, students[]{ student->{_id}, _key } }`, { id })
    if (!existing) return NextResponse.json({ ok: false, error: 'Document not found' }, { status: 404 })
    const node = (existing.students || []).find((s: any) => s?.student?._id === studentId)
    
    // If student not found, create new entry instead of returning error
    if (!node) {
      const subjects = patch.subjects ?? existing.subjects
      const marks = (patch.marks ?? []).map((m: any) => Number(m))
      const maxPer = Number(patch.maxMarksPerSubject ?? existing.maxMarksPerSubject)
      if (!Array.isArray(subjects) || subjects.length === 0 || !Array.isArray(marks) || marks.length !== subjects.length || !maxPer) {
        return NextResponse.json({ ok: false, error: 'Invalid subjects/marks/maxMarksPerSubject' }, { status: 400 })
      }
      for (const v of marks) { if (Number.isNaN(v) || v < 0 || v > maxPer) return NextResponse.json({ ok: false, error: 'Each mark must be between 0 and maxMarksPerSubject' }, { status: 400 }) }
      const passPct = Number(patch.minPassPercentage ?? existing.minPassPercentage ?? 40)
      const agg = computeStudentAggregates(marks, subjects.length, maxPer, passPct)

      const newStudent = {
        _type: 'studentResult',
        student: { _type: 'reference', _ref: studentId },
        studentName: patch.studentName || '',
        fatherName: patch.fatherName || '',
        rollNumber: patch.rollNumber || '',
        grNumber: patch.grNumber || '',
        marks,
        percentage: agg.percentage,
        grade: agg.grade,
        remarks: agg.remarks,
        createdAt: new Date().toISOString(),
      }
      const res = await serverClient
        .patch(id)
        .setIfMissing({ students: [] })
        .append('students', [newStudent as any])
        .commit()
      return NextResponse.json({ ok: true, res, created: true })
    }

    const subjects = patch.subjects ?? existing.subjects
    const marks = (patch.marks ?? []).map((m: any) => Number(m))
    const maxPer = Number(patch.maxMarksPerSubject ?? existing.maxMarksPerSubject)
    if (!Array.isArray(subjects) || subjects.length === 0 || !Array.isArray(marks) || marks.length !== subjects.length || !maxPer) {
      return NextResponse.json({ ok: false, error: 'Invalid subjects/marks/maxMarksPerSubject' }, { status: 400 })
    }
    for (const v of marks) { if (Number.isNaN(v) || v < 0 || v > maxPer) return NextResponse.json({ ok: false, error: 'Each mark must be between 0 and maxMarksPerSubject' }, { status: 400 }) }
    const passPct = Number(patch.minPassPercentage ?? existing.minPassPercentage ?? 40)
    const agg = computeStudentAggregates(marks, subjects.length, maxPer, passPct)

    const res = await serverClient
      .patch(id)
      .set({
        [`students[_key=="${node._key}"]`]: {
          ...(patch.studentName ? { studentName: patch.studentName } : {}),
          ...(patch.fatherName ? { fatherName: patch.fatherName } : {}),
          ...(patch.rollNumber ? { rollNumber: patch.rollNumber } : {}),
          ...(patch.grNumber ? { grNumber: patch.grNumber } : {}),
          marks,
          percentage: agg.percentage,
          grade: agg.grade,
          remarks: agg.remarks,
          createdAt: new Date().toISOString(),
        },
      })
      .commit()
    return NextResponse.json({ ok: true, res })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Failed to update result' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    if (!process.env.SANITY_API_WRITE_TOKEN) {
      return NextResponse.json({ ok: false, error: 'Server is missing SANITY_API_WRITE_TOKEN' }, { status: 500 })
    }
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id') || undefined
    const className = searchParams.get('className') || undefined
    const examTitle = searchParams.get('examTitle') || undefined
    const studentId = searchParams.get('studentId') || undefined

    // Delete an entire exam document by id or by className+examTitle
    if (!studentId) {
      let docId = id
      if (!docId && className && examTitle) {
        const found = await serverClient.fetch(`*[_type=="examResultSet" && className==$className && examTitle==$examTitle][0]{_id}`, { className, examTitle })
        docId = found?._id
      }
      if (!docId) return NextResponse.json({ ok: false, error: 'Provide id or className+examTitle' }, { status: 400 })
      const res = await serverClient.delete(docId)
      return NextResponse.json({ ok: true, res })
    }

    // Remove a single student from students[]
    const doc = await serverClient.fetch(`*[_type=="examResultSet" && _id==$id][0]{ students[]{ student->{_id}, _key } }`, { id })
    if (!doc) return NextResponse.json({ ok: false, error: 'Document not found' }, { status: 404 })
    const node = (doc.students || []).find((s: any) => s?.student?._id === studentId)
    if (!node) return NextResponse.json({ ok: false, error: 'Student not found in this exam' }, { status: 404 })
    const res = await serverClient.patch(id!).unset([`students[_key=="${node._key}"]`]).commit()
    return NextResponse.json({ ok: true, res })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Failed to delete result' }, { status: 500 })
  }
}

