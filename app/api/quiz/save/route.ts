import { NextRequest, NextResponse } from 'next/server'
import serverClient from '@/sanity/lib/serverClient'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
    try {
        if (!process.env.SANITY_API_WRITE_TOKEN) {
            return NextResponse.json({ ok: false, error: 'Server is missing SANITY_API_WRITE_TOKEN' }, { status: 500 })
        }

        const { resultId, answers } = await req.json()

        if (!resultId || !Array.isArray(answers)) {
            return NextResponse.json({ ok: false, error: 'resultId and answers array are required' }, { status: 400 })
        }

        // Patch the result document
        await serverClient
            .patch(resultId)
            .set({
                answers,
                lastUpdated: new Date().toISOString()
            })
            .commit()

        return NextResponse.json({ ok: true })

    } catch (err: any) {
        console.error("Quiz Save Error:", err)
        return NextResponse.json({ ok: false, error: err?.message || 'Failed to save progress' }, { status: 500 })
    }
}
