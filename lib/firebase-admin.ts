import "server-only";
import admin from "firebase-admin";

if (!admin.apps.length) {
    try {
        const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
            ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
            : undefined;

        if (serviceAccount) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });
            console.log("Firebase Admin Initialized successfully.");
        } else {
            console.warn(
                "FIREBASE_SERVICE_ACCOUNT_KEY is missing. Admin features will not work."
            );
        }
    } catch (error) {
        console.error("Firebase Admin Initialization Error:", error);
    }
}

export const dbAdmin = admin.firestore();
export const authAdmin = admin.auth();
