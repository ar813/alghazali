import { NextRequest, NextResponse } from 'next/server'
import { client } from '@/sanity/lib/client'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const studentId = searchParams.get('studentId')

    if (!studentId) {
      return NextResponse.json({ ok: false, error: 'studentId is required' }, { status: 400 })
    }

    // Fetch all exam results for the student
    const query = `
      *[_type=="examResultSet" && count(students[student._ref == $studentId]) > 0]{
        _id,
        examTitle,
        className,
        subjects,
        maxMarksPerSubject,
        minMarksPerSubject,
        createdAt,
        "studentResult": students[student._ref == $studentId][0]{
          student->{
            _id,
            fullName,
            rollNumber,
            grNumber
          },
          marks,
          percentage,
          grade,
          remarks,
          createdAt
        }
      } | order(createdAt desc)
    `

    const examSets = await client.fetch(query, { studentId })

    // Transform the data to match our interface
    const results = examSets
      .filter((examSet: any) => examSet.studentResult) // Only include exams where student has results
      .map((examSet: any) => ({
        _id: examSet._id,
        examTitle: examSet.examTitle,
        className: examSet.className,
        subjects: examSet.subjects || [],
        maxMarksPerSubject: examSet.maxMarksPerSubject || 100,
        minMarksPerSubject: examSet.minMarksPerSubject,
        student: examSet.studentResult.student,
        marks: examSet.studentResult.marks || [],
        percentage: examSet.studentResult.percentage || 0,
        grade: examSet.studentResult.grade || 'F',
        remarks: examSet.studentResult.remarks || 'Fail',
        createdAt: examSet.studentResult.createdAt || examSet.createdAt
      }))

    return NextResponse.json({ ok: true, results })
  } catch (error: any) {
    console.error('Error fetching student exam results:', error)
    return NextResponse.json({ 
      ok: false, 
      error: error?.message || 'Failed to fetch exam results' 
    }, { status: 500 })
  }
}
