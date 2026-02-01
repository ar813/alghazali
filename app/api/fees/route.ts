import { NextRequest, NextResponse } from 'next/server'
import serverClient from '@/sanity/lib/serverClient'

// Helpers
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'admission'] as const

type QueryFilters = {
  studentId?: string
  className?: string
  month?: string
  year?: number
  status?: 'paid' | 'partial' | 'unpaid'
  q?: string
  cursor?: string
  limit?: number
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const filters: QueryFilters = {
      studentId: searchParams.get('studentId') || undefined,
      className: searchParams.get('className') || undefined,
      month: searchParams.get('month') || undefined,
      year: searchParams.get('year') ? Number(searchParams.get('year')) : undefined,
      status: (searchParams.get('status') as any) || undefined,
      q: searchParams.get('q') || undefined,
      cursor: searchParams.get('cursor') || undefined,
      limit: searchParams.get('limit') ? Math.min(100, Number(searchParams.get('limit'))) : 50,
    }

    // Build GROQ filter
    const where: string[] = ['_type == "fee"']
    const params: Record<string, any> = {}
    if (filters.studentId) { where.push('student._ref == $studentId'); params.studentId = filters.studentId }
    if (filters.className) { where.push('className == $className'); params.className = filters.className }
    if (filters.month) { where.push('month == $month'); params.month = filters.month }
    if (typeof filters.year === 'number' && !Number.isNaN(filters.year)) { where.push('year == $year'); params.year = filters.year }
    if (filters.status) { where.push('status == $status'); params.status = filters.status }
    if (filters.q) {
      // Search over receiptNumber, bookNumber, notes, student rollNumber, student grNumber
      where.push(`(
        (defined(receiptNumber) && receiptNumber match $q) ||
        (defined(bookNumber) && bookNumber match $q) ||
        (defined(notes) && notes match $q) ||
        (defined(student->rollNumber) && student->rollNumber match $q) ||
        (defined(student->grNumber) && student->grNumber match $q)
      )`)
      params.q = `${filters.q}*`
    }

    const query = `*[$where] | order(year desc, month desc) [0...$limit]{
      _id,
      month,
      year,
      status,
      feeType,
      amountPaid,
      paidDate,
      receiptNumber,
      bookNumber,
      notes,
      className,
      student->{ _id, fullName, grNumber, rollNumber, admissionFor }
    }`
      .replace('$where', where.join(' && '))

    const data = await serverClient.fetch(query, { ...params, limit: filters.limit })
    return NextResponse.json({ ok: true, data })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Failed to fetch fees' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.SANITY_API_WRITE_TOKEN) {
      return NextResponse.json({ ok: false, error: 'Server is missing SANITY_API_WRITE_TOKEN' }, { status: 500 })
    }
    const body = await req.json()
    const { studentId, className, month, year, amountPaid = 0, paidDate, receiptNumber, bookNumber, feeType = 'monthly', notes } = body || {}
    // Determine fee type without mutation
    const effectiveFeeType: 'monthly' | 'admission' = month === 'admission' ? 'admission' : feeType

    // Basic validation
    if (!studentId || !month || typeof year !== 'number') {
      return NextResponse.json({ ok: false, error: 'studentId, month and year are required' }, { status: 400 })
    }
    if (!MONTHS.includes(month)) {
      return NextResponse.json({ ok: false, error: 'Invalid month value' }, { status: 400 })
    }

    // Upsert unique
    // For admission fees: only one record per student
    // For monthly fees: unique by (studentId + month + year)
    const existing = await serverClient.fetch(
      effectiveFeeType === 'admission'
        ? `*[_type == "fee" && student._ref == $studentId && feeType == 'admission'][0]{ _id }`
        : `*[_type == "fee" && student._ref == $studentId && month == $month && year == $year][0]{ _id }`,
      effectiveFeeType === 'admission' ? { studentId } : { studentId, month, year }
    ) as { _id: string } | null

    const doc = {
      _type: 'fee',
      student: { _type: 'reference', _ref: studentId },
      className,
      month,
      year,
      amountPaid,
      status: 'paid' as const,
      paidDate: paidDate || new Date().toISOString().slice(0, 10),
      receiptNumber,
      bookNumber,
      feeType: effectiveFeeType,
      notes,
    }

    if (existing?._id) {
      const res = await serverClient.patch(existing._id).set(doc).commit()
      return NextResponse.json({ ok: true, action: 'updated', id: existing._id, res })
    } else {
      const created = await serverClient.create(doc)
      return NextResponse.json({ ok: true, action: 'created', id: created._id })
    }
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Failed to upsert fee' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    if (!process.env.SANITY_API_WRITE_TOKEN) {
      return NextResponse.json({ ok: false, error: 'Server is missing SANITY_API_WRITE_TOKEN' }, { status: 500 })
    }
    const body = await req.json()
    const { id, patch } = body || {}
    if (!id || !patch) {
      return NextResponse.json({ ok: false, error: 'id and patch are required' }, { status: 400 })
    }
    // Normalize potential studentId into a reference
    if (patch.studentId) {
      patch.student = { _type: 'reference', _ref: patch.studentId }
      delete patch.studentId
    }
    // Do not enforce 'paid' status. Respect what is passed.
    // If status is 'unpaid', we should likely unset paidDate and amountPaid if desired, 
    // or just keep them as record. For now, let's just respect the status change.

    // Logic: If setting to 'paid' and no date, set today.
    if (patch.status === 'paid' && !patch.paidDate) {
      patch.paidDate = new Date().toISOString().slice(0, 10)
    }
    // If setting to 'unpaid', maybe we should clear paidDate? 
    // It depends on business logic. Let's start with just updating status.

    if ('dueDate' in patch) delete patch.dueDate

    const res = await serverClient.patch(id).set(patch).commit()
    return NextResponse.json({ ok: true, res })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Failed to update fee' }, { status: 500 })
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

    // Bulk deletion path: /api/fees?all=true&className=&month=&year=&q=
    if (deleteAll) {
      // Build filters similar to GET
      const filters: any = {
        className: searchParams.get('className') || undefined,
        month: searchParams.get('month') || undefined,
        year: searchParams.get('year') ? Number(searchParams.get('year')) : undefined,
        q: searchParams.get('q') || undefined,
      }

      const where: string[] = ['_type == "fee"']
      const params: Record<string, any> = {}
      if (filters.className) { where.push('className == $className'); params.className = filters.className }
      if (filters.month) { where.push('month == $month'); params.month = filters.month }
      if (typeof filters.year === 'number' && !Number.isNaN(filters.year)) { where.push('year == $year'); params.year = filters.year }
      if (filters.q) {
        where.push(`(
          (defined(receiptNumber) && receiptNumber match $q) ||
          (defined(bookNumber) && bookNumber match $q) ||
          (defined(notes) && notes match $q) ||
          (defined(student->rollNumber) && student->rollNumber match $q) ||
          (defined(student->grNumber) && student->grNumber match $q)
        )`)
        params.q = `${filters.q}*`
      }

      const idsQuery = `*[$where][0...500]{ _id }`.replace('$where', where.join(' && '))
      const docs: { _id: string }[] = await serverClient.fetch(idsQuery, params)
      if (!docs.length) {
        return NextResponse.json({ ok: true, deleted: 0 })
      }
      // Delete in a transaction
      let tx = serverClient.transaction()
      docs.forEach(d => { tx = tx.delete(d._id) })
      const result = await tx.commit()
      return NextResponse.json({ ok: true, deleted: docs.length, tx: result })
    }

    // Single delete by id (default path)
    if (!id) {
      return NextResponse.json({ ok: false, error: 'id is required' }, { status: 400 })
    }
    const res = await serverClient.delete(id)
    return NextResponse.json({ ok: true, res })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Failed to delete fee' }, { status: 500 })
  }
}
