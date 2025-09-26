import { NextRequest, NextResponse } from 'next/server'
import serverClient from '@/sanity/lib/serverClient'
import nodemailer from 'nodemailer'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const studentId = searchParams.get('studentId') || undefined
    const className = searchParams.get('className') || undefined
    const limit = searchParams.get('limit') ? Math.min(1000, Number(searchParams.get('limit'))) : 50
    const eventsOnly = searchParams.get('events') === '1' || searchParams.get('events') === 'true'

    // If no filters are provided, return ALL notices for admin/overview screens
    const params: Record<string, any> = { limit }
    let query: string
    if (!className && !studentId) {
      let baseWhere = "_type == \"notice\""
      if (eventsOnly) baseWhere += " && isEvent == true"
      query = `*[${baseWhere}] | order(coalesce(createdAt, _createdAt) desc) [0...$limit]{
        _id,
        title,
        content,
        targetType,
        className,
        student->{ _id, fullName, grNumber, rollNumber, email, admissionFor },
        isEvent,
        eventDate,
        eventType,
        createdAt,
        _createdAt
      }`
    } else {
      const whereParts: string[] = ['_type == "notice"']
      const conditions: string[] = [`targetType == 'all'`]
      if (className) { conditions.push(`(targetType == 'class' && className == $className)`); params.className = className }
      if (studentId) { conditions.push(`(targetType == 'student' && defined(student) && student._ref == $studentId)`); params.studentId = studentId }
      if (eventsOnly) { whereParts.push(`isEvent == true`) }
      whereParts.push(`(${conditions.join(' || ')})`)
      query = `*[$where] | order(coalesce(createdAt, _createdAt) desc) [0...$limit]{
        _id,
        title,
        content,
        targetType,
        className,
        student->{ _id, fullName, grNumber, rollNumber, email, admissionFor },
        isEvent,
        eventDate,
        eventType,
        createdAt,
        _createdAt
      }`.replace('$where', whereParts.join(' && '))
    }

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
    const { title, content, targetType, className, studentId, sendEmail, isEvent, eventDate, eventType } = body || {}
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
    if (typeof isEvent === 'boolean') doc.isEvent = isEvent
    if (isEvent && eventDate) doc.eventDate = eventDate
    if (isEvent && eventType) doc.eventType = eventType
    if (targetType === 'student') {
      doc.student = { _type: 'reference', _ref: studentId }
    }

    const created = await serverClient.create(doc)

    let emailInfo: any = null
    if (sendEmail) {
      // Collect recipients based on target
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
        if (recipients.length === 0) {
          return NextResponse.json({ ok: false, error: 'Student has no email.' }, { status: 400 })
        }
      }

      // Attempt to send via SMTP if environment is configured
      const EMAIL_HOST = process.env.EMAIL_HOST
      const EMAIL_PORT = process.env.EMAIL_PORT ? Number(process.env.EMAIL_PORT) : undefined
      const EMAIL_SECURE = process.env.EMAIL_SECURE === 'true'
      const EMAIL_USER = process.env.EMAIL_USER
      const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD
      const EMAIL_SERVICE = process.env.EMAIL_SERVICE || 'gmail'
      // Force sender as requested
      const EMAIL_FROM = 'ar3584158@gmail.com'

      try {
        if (recipients.length > 0 && EMAIL_USER && EMAIL_PASSWORD) {
          const transporter = nodemailer.createTransport(
            EMAIL_HOST
              ? { host: EMAIL_HOST, port: EMAIL_PORT || 587, secure: EMAIL_SECURE, auth: { user: EMAIL_USER, pass: EMAIL_PASSWORD } }
              : { service: EMAIL_SERVICE, auth: { user: EMAIL_USER, pass: EMAIL_PASSWORD } } as any
          )

          let sentCount = 0
          for (const r of recipients) {
            await transporter.sendMail({
              from: EMAIL_FROM,
              to: r,
              subject: `Notice: ${title}`,
              text: content,
            })
            sentCount++
          }
          emailInfo = { attempted: recipients.length, sent: true, sentCount }
        } else {
          emailInfo = { attempted: recipients.length, sent: false, note: 'Email env not fully configured (need EMAIL_USER and EMAIL_PASSWORD and EMAIL_HOST or EMAIL_SERVICE).' }
        }
      } catch (e: any) {
        emailInfo = { attempted: recipients.length, sent: false, error: e?.message || 'Failed to send emails' }
      }
    }

    return NextResponse.json({ ok: true, id: created._id, emailInfo })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Failed to create notice' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    if (!process.env.SANITY_API_WRITE_TOKEN) {
      return NextResponse.json({ ok: false, error: 'Server is missing SANITY_API_WRITE_TOKEN' }, { status: 500 })
    }
    const body = await req.json()
    const { id, title, content, targetType, className, studentId, isEvent, eventDate, eventType, isHeadline } = body || {}
    if (!id) return NextResponse.json({ ok: false, error: 'id is required' }, { status: 400 })

    const patch: any = {}
    if (typeof title === 'string') patch.title = title
    if (typeof content === 'string') patch.content = content
    if (typeof targetType === 'string') patch.targetType = targetType
    if (typeof className !== 'undefined') patch.className = className || undefined
    if (typeof studentId !== 'undefined') patch.student = studentId ? { _type: 'reference', _ref: studentId } : undefined
    if (typeof isEvent !== 'undefined') patch.isEvent = !!isEvent
    if (typeof eventDate !== 'undefined') patch.eventDate = eventDate || undefined
    if (typeof eventType !== 'undefined') patch.eventType = eventType || undefined
    if (typeof isHeadline !== 'undefined') patch.isHeadline = !!isHeadline

    await serverClient.patch(id).set(patch).commit()
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Failed to update notice' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    if (!process.env.SANITY_API_WRITE_TOKEN) {
      return NextResponse.json({ ok: false, error: 'Server is missing SANITY_API_WRITE_TOKEN' }, { status: 500 })
    }
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const deleteAll = searchParams.get('all') === 'true'
    if (!id && !deleteAll) return NextResponse.json({ ok: false, error: 'id is required' }, { status: 400 })

    if (deleteAll) {
      // Bulk delete all notices
      await serverClient.delete({ query: '*[_type == "notice"]' } as any)
      return NextResponse.json({ ok: true, deleted: 'all' })
    } else if (id) {
      await serverClient.delete(id)
      return NextResponse.json({ ok: true })
    }
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Failed to delete notice' }, { status: 500 })
  }
}
