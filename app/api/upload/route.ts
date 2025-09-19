export const runtime = 'nodejs'
import { NextResponse } from 'next/server'
import serverClient from '@/sanity/lib/serverClient'

export async function POST(request: Request) {
  try {
    const form = await request.formData()
    const file = form.get('file') as File | null
    if (!file) {
      return NextResponse.json({ ok: false, error: 'No file provided' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const asset = await serverClient.assets.upload('image', buffer, {
      filename: file.name || 'upload.png',
      contentType: file.type || 'image/png',
    })

    return NextResponse.json({ ok: true, assetId: asset._id, url: asset.url })
  } catch (err: unknown) {
    console.error('Upload error', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
