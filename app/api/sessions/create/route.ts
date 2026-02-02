import { NextRequest, NextResponse } from 'next/server';
import serverClient from '@/sanity/lib/serverClient';
import { verifyAuth, unauthorizedResponse } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const user = await verifyAuth(req);
        if (!user) return unauthorizedResponse();

        const { sessionName } = await req.json();

        if (!sessionName || typeof sessionName !== 'string' || !sessionName.trim()) {
            return NextResponse.json({ ok: false, error: 'sessionName is required' }, { status: 400 });
        }

        const trimmedName = sessionName.trim();

        console.log(`[Session Create] Creating session: ${trimmedName}`);

        // Check if session already exists (by checking if any document uses this session name)
        const existingQuery = `count(*[session == $sessionName])`;
        const existingCount = await serverClient.fetch(existingQuery, { sessionName: trimmedName });

        if (existingCount > 0) {
            console.log(`[Session Create] Session "${trimmedName}" already has documents.`);
        }

        // Create a session metadata document to track sessions even when empty
        // This ensures the session persists in Sanity
        const sessionDoc = {
            _type: 'sessionMeta',
            _id: `session-${trimmedName.replace(/[^a-zA-Z0-9-]/g, '-')}`,
            sessionName: trimmedName,
            createdAt: new Date().toISOString(),
            createdBy: user.uid || 'unknown'
        };

        const result = await serverClient.createOrReplace(sessionDoc);

        console.log(`[Session Create] Session metadata created:`, result._id);

        return NextResponse.json({
            ok: true,
            message: `Session "${trimmedName}" created successfully.`,
            session: trimmedName,
            docId: result._id
        });

    } catch (error: any) {
        console.error('[Session Create Error]:', error);
        return NextResponse.json({ ok: false, error: error.message || 'Failed to create session' }, { status: 500 });
    }
}
