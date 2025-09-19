import { NextResponse } from 'next/server'
import serverClient from '@/sanity/lib/serverClient'

export async function POST(request: Request) {
  const body = await request.json()
  console.log('API POST /api/students body:', body)
  try {
    const doc = await serverClient.create({ _type: 'student', ...body })
    return NextResponse.json({ ok: true, doc })
  } catch (err) {
    console.error('API POST error', err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const { id, patch } = await request.json()
  console.log('API PATCH /api/students', id, patch)
  try {
    const res = await serverClient.patch(id).set(patch).commit()
    return NextResponse.json({ ok: true, res })
  } catch (err) {
    console.error('API PATCH error', err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const { id } = await request.json()
  console.log('API DELETE /api/students', id)
  try {
    const res = await serverClient.delete(id)
    return NextResponse.json({ ok: true, res })
  } catch (err) {
    console.error('API DELETE error', err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
