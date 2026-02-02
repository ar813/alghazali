import { NextRequest, NextResponse } from 'next/server';
import serverClient from '@/sanity/lib/serverClient';
import { verifyAuth, unauthorizedResponse } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const user = await verifyAuth(req);
        if (!user) return unauthorizedResponse();

        const body = await req.json();
        const { sourceSession, targetSession, mapping } = body;

        if (!sourceSession || !targetSession || !mapping || typeof mapping !== 'object') {
            return NextResponse.json({ ok: false, error: 'sourceSession, targetSession, and mapping are required' }, { status: 400 });
        }

        console.log(`[Promotion] Starting transfer from ${sourceSession} to ${targetSession}`);

        let totalProcessed = 0;
        let totalCreated = 0;

        // mapping is like { "KG": "1", "1": "2", ... }
        const classesToTransfer = Object.keys(mapping);

        const transaction = serverClient.transaction();

        for (const fromClass of classesToTransfer) {
            const toClass = mapping[fromClass];
            if (!toClass) continue; // Skip if no mapping provided

            // Fetch students from source session (handling legacy undefined session)
            const query = `*[_type == "student" && 
                (session == $source || (!defined(session) && $source == "2024-2025")) && 
                admissionFor == $cls
            ]{
                _id, _type, fullName, fatherName, fatherCnic, dob, rollNumber, grNumber, 
                gender, nationality, medicalCondition, cnicOrBform, email, phoneNumber, 
                whatsappNumber, address, formerEducation, previousInstitute, lastExamPercentage,
                guardianName, guardianContact, guardianCnic, guardianRelation, photo,
                issueDate, expiryDate
            }`;

            const students = await serverClient.fetch(query, { source: sourceSession, cls: fromClass });

            console.log(`[Promotion] Found ${students.length} students in ${fromClass} to promote to ${toClass}`);

            for (const student of students) {
                totalProcessed++;

                // Construct new document
                // We DON'T include _id so Sanity generates a new one.
                // We DO include the fields but update session and admissionFor
                const newDoc = {
                    ...student,
                    _id: undefined, // Let Sanity generate new ID
                    session: targetSession,
                    admissionFor: toClass,
                    // Optionally prefix roll number or keep same? User said "copy roll no"
                    // We'll keep it as is, user can edit later in the new session
                };

                // Add to transaction
                transaction.create(newDoc);
                totalCreated++;
            }
        }

        if (totalCreated === 0) {
            return NextResponse.json({ ok: true, message: 'No students found to transfer', count: 0 });
        }

        const result = await transaction.commit();

        return NextResponse.json({
            ok: true,
            message: `Successfully transferred ${totalCreated} students.`,
            count: totalCreated,
            processed: totalProcessed
        });

    } catch (error: any) {
        console.error('[Promotion API Error]:', error);
        return NextResponse.json({ ok: false, error: error.message || 'Failed to transfer students' }, { status: 500 });
    }
}
