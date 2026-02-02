import { db } from "@/lib/firebase";
import { doc, updateDoc, setDoc } from "firebase/firestore";

/**
 * Run this function to promote a user to Super Admin.
 * You can call this from your browser console if you expose it,
 * or create a temporary button in the UI.
 */
export const makeSuperAdmin = async (uid: string) => {
    try {
        console.log(`Promoting user ${uid} to super_admin...`);
        await setDoc(doc(db, "users", uid), {
            role: 'super_admin'
        }, { merge: true });
        console.log("Success! User is now a Super Admin.");
        window.location.reload();
    } catch (error) {
        console.error("Error promoting user:", error);
    }
};
