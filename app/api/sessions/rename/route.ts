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

        console.log(`[Session Rename] Renaming from ${oldSession} to ${newSession}`);

        // Define types to update
        const typesToUpdate = ['student', 'fee', 'notice', 'examResultSet'];

        // Fetch all IDs to update
        const query = `*[_type in $types && session == $oldSession]._id`;
        const ids = await serverClient.fetch(query, { types: typesToUpdate, oldSession });

        console.log(`[Session Rename] Found ${ids.length} documents to update.`);

        // Batch update
        let totalUpdated = 0;
        const batchSize = 100;

        for (let i = 0; i < ids.length; i += batchSize) {
            const batch = ids.slice(i, i + batchSize);
            const transaction = serverClient.transaction();

            batch.forEach((id: string) => {
                transaction.patch(id, { set: { session: newSession } });
            });

            await transaction.commit();
            totalUpdated += batch.length;
            console.log(`[Session Rename] Updated batch ${i / batchSize + 1}, total: ${totalUpdated}`);
        }

        return NextResponse.json({
            ok: true,
            message: `Successfully renamed session to ${newSession}. Updated ${totalUpdated} records.`,
            count: totalUpdated
        });

    } catch (error: any) {
        console.error('[Session Rename Error]:', error);
        return NextResponse.json({ ok: false, error: error.message || 'Failed to rename session' }, { status: 500 });
    }
}
