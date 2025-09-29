import { NextResponse } from 'next/server'
import serverClient from '@/sanity/lib/serverClient'

export async function POST(request: Request) {
  if (!process.env.SANITY_API_WRITE_TOKEN) {
    return NextResponse.json({ ok: false, error: 'Server is missing SANITY_API_WRITE_TOKEN' }, { status: 500 })
  }
  const body = await request.json()
  console.log('API POST /api/students body:', body)
  try {
    // minimal validation: must have fullName and admissionFor at least
    if (!body?.fullName || !body?.admissionFor) {
      return NextResponse.json({ ok: false, error: 'fullName and admissionFor are required' }, { status: 400 })
    }
    const doc = await serverClient.create({ _type: 'student', ...body })
    return NextResponse.json({ ok: true, doc })
  } catch (err) {
    console.error('API POST error', err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  if (!process.env.SANITY_API_WRITE_TOKEN) {
    return NextResponse.json({ ok: false, error: 'Server is missing SANITY_API_WRITE_TOKEN' }, { status: 500 })
  }
  const { id, patch } = await request.json()
  console.log('API PATCH /api/students', id, patch)
  try {
    if (!id || !patch || typeof patch !== 'object') {
      return NextResponse.json({ ok: false, error: 'id and patch are required' }, { status: 400 })
    }
    const res = await serverClient.patch(id).set(patch).commit()
    return NextResponse.json({ ok: true, res })
  } catch (err) {
    console.error('API PATCH error', err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  if (!process.env.SANITY_API_WRITE_TOKEN) {
    return NextResponse.json({ ok: false, error: 'Server is missing SANITY_API_WRITE_TOKEN' }, { status: 500 })
  }
  const url = new URL(request.url)
  const all = url.searchParams.get('all') === 'true'

  // If bulk delete is requested, delete all students via GROQ query
  if (all) {
    console.log('API DELETE /api/students (bulk delete all)')
    try {
      // Sanity supports delete by query
      const res = await serverClient.delete({ query: '*[_type == "student"]' })
      return NextResponse.json({ ok: true, res })
    } catch (err) {
      console.error('API BULK DELETE error', err)
      return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
    }
  }

  // Otherwise delete a single student by id (expects JSON body with { id })
  const { id } = await request.json()
  console.log('API DELETE /api/students', id)
  try {
    if (!id) {
      return NextResponse.json({ ok: false, error: 'id is required' }, { status: 400 })
    }
    const res = await serverClient.delete(id)
    return NextResponse.json({ ok: true, res })
  } catch (err) {
    console.error('API DELETE error', err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
