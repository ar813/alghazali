import { createClient } from 'next-sanity';
import { apiVersion, dataset, projectId } from '../sanity/env';

export const sanityWriteClient = createClient({
    projectId,
    dataset,
    apiVersion,
    useCdn: false,
    token: process.env.SANITY_API_WRITE_TOKEN,
});

interface AdminUserData {
    uid: string;
    email: string;
    displayName: string;
    role: string;
}

export const syncAdminToSanity = async (userData: AdminUserData) => {
    try {
        if (!process.env.SANITY_API_WRITE_TOKEN) {
            console.warn("SANITY_API_WRITE_TOKEN is missing. Skipping Sanity backup.");
            return;
        }

        // Create or replace the document with ID based on UID to ensure uniqueness
        await sanityWriteClient.createOrReplace({
            _id: `admin-${userData.uid}`,
            _type: 'adminUser',
            uid: userData.uid,
            email: userData.email,
            displayName: userData.displayName,
            role: userData.role,
            lastSyncedAt: new Date().toISOString(),
        });

        console.log(`Successfully synced admin ${userData.email} to Sanity.`);
    } catch (error) {
        console.error("Error syncing admin to Sanity:", error);
    }
};

export const patchAdminInSanity = async (uid: string, updates: Partial<AdminUserData>) => {
    try {
        if (!process.env.SANITY_API_WRITE_TOKEN) {
            console.warn("SANITY_API_WRITE_TOKEN is missing. Skipping Sanity backup patch.");
            return;
        }

        const patch = sanityWriteClient.patch(`admin-${uid}`);

        if (updates.email) patch.set({ email: updates.email });
        if (updates.displayName) patch.set({ displayName: updates.displayName });
        if (updates.role) patch.set({ role: updates.role });

        patch.set({ lastSyncedAt: new Date().toISOString() });

        await patch.commit();
        console.log(`Successfully patched admin ${uid} in Sanity.`);
    } catch (error) {
        console.error("Error patching admin in Sanity:", error);
    }
};

export const deleteAdminFromSanity = async (uid: string) => {
    try {
        if (!process.env.SANITY_API_WRITE_TOKEN) {
            console.warn("SANITY_API_WRITE_TOKEN is missing. Skipping Sanity backup deletion.");
            return;
        }

        await sanityWriteClient.delete(`admin-${uid}`);
        console.log(`Successfully deleted admin ${uid} from Sanity.`);
    } catch (error) {
        // Ignore 404s if already deleted
        console.error("Error deleting admin from Sanity:", error);
    }
};
