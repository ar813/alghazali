import { NextResponse } from 'next/server'

// This endpoint has been deprecated. Manual Results feature is removed from the app.
export async function POST() {
  return NextResponse.json({ ok: false, error: 'Manual Results API is removed (deprecated).' }, { status: 410 })
}

export async function DELETE() {
  return NextResponse.json({ ok: false, error: 'Manual Results API is removed (deprecated).' }, { status: 410 })
}
