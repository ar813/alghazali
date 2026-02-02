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

        console.log(`[Session Delete] Starting deletion for session: ${session}`);

        // Define types to delete
        const typesToDelete = ['student', 'fee', 'notice', 'examResultSet'];

        // Fetch all IDs to delete
        const query = `*[_type in $types && session == $session]._id`;
        const ids = await serverClient.fetch(query, { types: typesToDelete, session });

        console.log(`[Session Delete] Found ${ids.length} documents to delete.`);

        if (ids.length === 0) {
            return NextResponse.json({ ok: true, message: 'Session empty, nothing to delete.', count: 0 });
        }

        // Batch delete (Sanity transaction limit is usually around 1000 ops, safest to batch ~100)
        let totalDeleted = 0;
        const batchSize = 100;

        for (let i = 0; i < ids.length; i += batchSize) {
            const batch = ids.slice(i, i + batchSize);
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
            message: `Successfully deleted session ${session} and ${totalDeleted} related records.`,
            count: totalDeleted
        });

    } catch (error: any) {
        console.error('[Session Delete Error]:', error);
        return NextResponse.json({ ok: false, error: error.message || 'Failed to delete session' }, { status: 500 });
    }
}
