import { NextRequest, NextResponse } from 'next/server';
import serverClient from '@/sanity/lib/serverClient';
import { dataset, projectId } from '@/sanity/env';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
    try {
        console.log(`[Session List] Querying project: ${projectId}, dataset: ${dataset}`);

        // Fetch all sessionMeta documents from Sanity with a timestamp to bypass caches
        const query = `*[_type == "sessionMeta"] | order(_createdAt desc) { _id, sessionName }`;
        const sessions = await serverClient.fetch(query, { t: Date.now() });

        const sessionNames = Array.from(new Set(
            sessions
                .filter((s: any) => s.sessionName)
                .map((s: any) => s.sessionName.trim())
        ));

        console.log(`[Session List] Found ${sessionNames.length} sessions.`);

        return NextResponse.json({
            ok: true,
            sessions: sessionNames
        });

    } catch (error: any) {
        console.error('[Session List Error]:', error);
        return NextResponse.json({ ok: false, error: error.message || 'Failed to fetch sessions' }, { status: 500 });
    }
}
