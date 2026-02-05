import { NextRequest, NextResponse } from 'next/server';
import serverClient from '@/sanity/lib/serverClient';
import { verifyAuth, unauthorizedResponse } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const user = await verifyAuth(req);
        if (!user) return unauthorizedResponse();

        const { session } = await req.json();

        if (!session) {
            return NextResponse.json({ ok: false, error: 'Session is required' }, { status: 400 });
        }

        // PROTECT MASTER SESSION
        if (session === "2025-2026") {
            return NextResponse.json({ ok: false, error: 'Master session "2025-2026" cannot be deleted.' }, { status: 403 });
        }

        console.log(`[Session Delete] Starting deletion for session: ${session}`);

        // 1. Delete all related records
        const typesToDelete = ['student', 'fee', 'notice', 'examResultSet', 'schedule', 'attendance', 'quizResult'];
        const dataQuery = `*[_type in $types && session == $session]._id`;
        const dataIds = await serverClient.fetch(dataQuery, { types: typesToDelete, session });

        console.log(`[Session Delete] Found ${dataIds.length} related documents to delete.`);

        // 2. Delete the sessionMeta document itself
        const metaQuery = `*[_type == "sessionMeta" && sessionName == $session]._id`;
        const metaIds = await serverClient.fetch(metaQuery, { session });

        const allIds = [...dataIds, ...metaIds];

        if (allIds.length === 0) {
            return NextResponse.json({ ok: true, message: 'Nothing found to delete.', count: 0 });
        }

        // Batch delete
        let totalDeleted = 0;
        const batchSize = 100;

        for (let i = 0; i < allIds.length; i += batchSize) {
            const batch = allIds.slice(i, i + batchSize);
            const transaction = serverClient.transaction();

            batch.forEach((id: string) => {
                transaction.delete(id);
            });

            await transaction.commit();
            totalDeleted += batch.length;
            console.log(`[Session Delete] Deleted batch ${i / batchSize + 1}, total: ${totalDeleted}`);
        }

        return NextResponse.json({
            ok: true,
            message: `Successfully deleted session "${session}" and ${totalDeleted} related records.`,
            count: totalDeleted
        });

    } catch (error: any) {
        console.error('[Session Delete Error]:', error);
        return NextResponse.json({ ok: false, error: error.message || 'Failed to delete session' }, { status: 500 });
    }
}
