import { NextRequest, NextResponse } from 'next/server'
import serverClient from '@/sanity/lib/serverClient'

const DOC_ID = 'importantButRare-singleton'

export async function GET() {
  try {
    const doc = await serverClient.fetch(`*[_type=="importantButRare" && _id==$id][0]`, { id: DOC_ID })
    return NextResponse.json({ ok: true, data: doc || null })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    if (!process.env.SANITY_API_WRITE_TOKEN) {
      return NextResponse.json({ ok: false, error: 'Server is missing SANITY_API_WRITE_TOKEN' }, { status: 500 })
    }
    const body = await req.json()
    const patch: any = {}
    for (const k of ['cardIssueDate','cardExpiryDate','classFees','schoolAddress','phoneNumber','email','officeHours']) {
      if (k in body) patch[k] = body[k]
    }
    const exists = await serverClient.fetch(`*[_type=="importantButRare" && _id==$id][0]{_id}`, { id: DOC_ID })
    if (exists?._id) {
      await serverClient.patch(DOC_ID).set(patch).commit()
    } else {
      await serverClient.create({ _id: DOC_ID, _type: 'importantButRare', ...patch })
    }
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Failed to save settings' }, { status: 500 })
  }
}
