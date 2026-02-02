import { NextRequest, NextResponse } from 'next/server';
import serverClient from '@/sanity/lib/serverClient';
import { verifyAuth, unauthorizedResponse } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const user = await verifyAuth(req);
        if (!user) return unauthorizedResponse();

        const { oldSession, newSession } = await req.json();

        if (!oldSession || !newSession) {
            return NextResponse.json({ ok: false, error: 'Both oldSession and newSession are required' }, { status: 400 });
        }

        // PROTECT MASTER SESSION
        if (oldSession === "2024-2025") {
            return NextResponse.json({ ok: false, error: 'Master session "2024-2025" cannot be renamed.' }, { status: 403 });
        }

        console.log(`[Session Rename] Renaming from "${oldSession}" to "${newSession}"`);

        // 1. Update related records
        const dataTypes = ['student', 'fee', 'notice', 'examResultSet', 'schedule', 'attendance', 'quizResult'];
        const dataQuery = `*[_type in $types && session == $oldSession]._id`;
        const dataIds = await serverClient.fetch(dataQuery, { types: dataTypes, oldSession });

        // 2. Update sessionMeta document
        const metaQuery = `*[_type == "sessionMeta" && sessionName == $oldSession]._id`;
        const metaIds = await serverClient.fetch(metaQuery, { oldSession });

        console.log(`[Session Rename] Found ${dataIds.length} data records and ${metaIds.length} metadata docs to rename.`);

        const allDataBatch = [...dataIds];
        const allMetaBatch = [...metaIds];

        if (allDataBatch.length === 0 && allMetaBatch.length === 0) {
            return NextResponse.json({ ok: false, error: 'Session not found or already renamed.' }, { status: 404 });
        }

        // Execute transactions
        const transaction = serverClient.transaction();

        // Patch data docs (set 'session' field)
        allDataBatch.forEach(id => {
            transaction.patch(id, { set: { session: newSession } });
        });

        // Patch meta docs (set 'sessionName' field)
        allMetaBatch.forEach(id => {
            transaction.patch(id, { set: { sessionName: newSession } });
        });

        await transaction.commit();

        return NextResponse.json({
            ok: true,
            message: `Successfully renamed session to "${newSession}".`,
            count: allDataBatch.length + allMetaBatch.length
        });

    } catch (error: any) {
        console.error('[Session Rename Error]:', error);
        return NextResponse.json({ ok: false, error: error.message || 'Failed to rename session' }, { status: 500 });
    }
}
