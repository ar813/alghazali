import { NextRequest, NextResponse } from 'next/server'
import serverClient from '@/sanity/lib/serverClient'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const studentId = searchParams.get('studentId') || undefined
    const className = searchParams.get('className') || undefined
    const limit = searchParams.get('limit') ? Math.min(100, Number(searchParams.get('limit'))) : 50

    const whereParts: string[] = ['_type == "notice"']
    const conditions: string[] = [
      `targetType == 'all'`
    ]
    const params: Record<string, any> = { limit }
    if (className) { conditions.push(`(targetType == 'class' && className == $className)`); params.className = className }
    if (studentId) { conditions.push(`(targetType == 'student' && defined(student) && student._ref == $studentId)`); params.studentId = studentId }

    whereParts.push(`(${conditions.join(' || ')})`)

    const query = `*[$where] | order(coalesce(createdAt, _createdAt) desc) [0...$limit]{
      _id,
      title,
      content,
      targetType,
      className,
      student->{ _id, fullName, grNumber, rollNumber, email, admissionFor },
      createdAt,
      _createdAt
    }`.replace('$where', whereParts.join(' && '))

    const data = await serverClient.fetch(query, params)
    return NextResponse.json({ ok: true, data })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Failed to fetch notices' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.SANITY_API_WRITE_TOKEN) {
      return NextResponse.json({ ok: false, error: 'Server is missing SANITY_API_WRITE_TOKEN' }, { status: 500 })
    }
    const body = await req.json()
    const { title, content, targetType, className, studentId, sendEmail } = body || {}
    if (!title || !content || !targetType) {
      return NextResponse.json({ ok: false, error: 'title, content and targetType are required' }, { status: 400 })
    }
    if (targetType === 'class' && !className) {
      return NextResponse.json({ ok: false, error: 'className is required for class target' }, { status: 400 })
    }
    if (targetType === 'student' && !studentId) {
      return NextResponse.json({ ok: false, error: 'studentId is required for student target' }, { status: 400 })
    }

    const doc: any = {
      _type: 'notice',
      title,
      content,
      targetType,
      className: className || undefined,
      createdAt: new Date().toISOString(),
    }
    if (targetType === 'student') {
      doc.student = { _type: 'reference', _ref: studentId }
    }

    const created = await serverClient.create(doc)

    let emailInfo: any = null
    if (sendEmail) {
      // Optional: Implement actual email sending with a provider like SMTP/Resend/SES.
      // For now, we collect recipients and return a stubbed response.
      let recipients: string[] = []
      if (targetType === 'all') {
        const emails = await serverClient.fetch(`*[_type == "student" && defined(email)]{ email }`)
        recipients = emails.map((e: any) => e.email).filter(Boolean)
      } else if (targetType === 'class' && className) {
        const emails = await serverClient.fetch(`*[_type == "student" && admissionFor == $className && defined(email)]{ email }`, { className })
        recipients = emails.map((e: any) => e.email).filter(Boolean)
      } else if (targetType === 'student' && studentId) {
        const email = await serverClient.fetch(`*[_type == "student" && _id == $id][0]{ email }`, { id: studentId })
        recipients = email?.email ? [email.email] : []
      }
      emailInfo = { attempted: recipients.length, note: 'Configure SMTP/SES to actually send emails.' }
    }

    return NextResponse.json({ ok: true, id: created._id, emailInfo })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Failed to create notice' }, { status: 500 })
  }
}
