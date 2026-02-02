import { NextRequest, NextResponse } from "next/server";
import { authAdmin, dbAdmin } from "@/lib/firebase-admin";
import { syncAdminToSanity, deleteAdminFromSanity, patchAdminInSanity } from "@/lib/sanity-sync";

async function isSuperAdmin(req: NextRequest) {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return false;

    const idToken = authHeader.split("Bearer ")[1];
    try {
        const decodedToken = await authAdmin.verifyIdToken(idToken);
        const userDoc = await dbAdmin.collection("users").doc(decodedToken.uid).get();
        return userDoc.exists && userDoc.data()?.role === "super_admin";
    } catch (error) {
        console.error("isSuperAdmin check failed:", error);
        return false;
    }
}

export async function POST(req: NextRequest) {
    try {
        if (!(await isSuperAdmin(req))) {
            return NextResponse.json({ error: "Access Denied: Super Admin privileges required." }, { status: 403 });
        }

        const { email, password, displayName, role } = await req.json();

        if (!email || !password) {
            return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
        }

        // 1. Create User in Firebase Auth
        const userRecord = await authAdmin.createUser({
            email,
            password,
            displayName: displayName || "Admin",
        });

        // 2. Create User Doc in Firestore
        await dbAdmin.collection("users").doc(userRecord.uid).set({
            uid: userRecord.uid,
            email,
            displayName: displayName || "Admin",
            role: role || "admin",
            createdAt: new Date().toISOString(),
        });

        // 3. Sync to Sanity (Backup)
        await syncAdminToSanity({
            uid: userRecord.uid,
            email,
            displayName: displayName || "Admin",
            role: role || "admin",
        });

        return NextResponse.json({
            success: true,
            uid: userRecord.uid,
            message: "User created successfully."
        });
    } catch (error: any) {
        console.error("Error creating user:", error);
        return NextResponse.json({ error: error.message || "Failed to create user." }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        if (!(await isSuperAdmin(req))) {
            return NextResponse.json({ error: "Access Denied: Super Admin privileges required." }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const uid = searchParams.get("uid");

        if (!uid) {
            return NextResponse.json({ error: "User UID is required." }, { status: 400 });
        }

        // --- ANTI-LOCKOUT SAFEGUARD ---
        const authHeader = req.headers.get("Authorization");
        const idToken = authHeader!.split("Bearer ")[1];
        const decodedToken = await authAdmin.verifyIdToken(idToken);

        if (uid === decodedToken.uid) {
            return NextResponse.json({ error: "Security Restriction: You cannot delete your own Super Admin account." }, { status: 400 });
        }
        // ------------------------------

        // 1. Delete from Firebase Auth
        await authAdmin.deleteUser(uid);

        // 2. Delete from Firestore
        await dbAdmin.collection("users").doc(uid).delete();

        // 3. Delete from Sanity (Backup)
        await deleteAdminFromSanity(uid);

        return NextResponse.json({ success: true, message: "User deleted successfully." });
    } catch (error: any) {
        console.error("Error deleting user:", error);
        return NextResponse.json({ error: error.message || "Failed to delete user." }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        if (!(await isSuperAdmin(req))) {
            return NextResponse.json({ error: "Access Denied: Super Admin privileges required." }, { status: 403 });
        }

        const { uid, email, password, displayName, role } = await req.json();

        if (!uid) {
            return NextResponse.json({ error: "User UID is required." }, { status: 400 });
        }

        // --- ANTI-LOCKOUT SAFEGUARD ---
        const authHeader = req.headers.get("Authorization");
        const idToken = authHeader!.split("Bearer ")[1];
        const decodedToken = await authAdmin.verifyIdToken(idToken);

        if (uid === decodedToken.uid && role && role !== "super_admin") {
            return NextResponse.json({ error: "Security Restriction: You cannot demote yourself to a regular admin." }, { status: 400 });
        }
        // ------------------------------

        // 1. Update Firebase Authentication
        const updateData: any = {};
        if (email) updateData.email = email;
        if (password) updateData.password = password;
        if (displayName) updateData.displayName = displayName;

        if (Object.keys(updateData).length > 0) {
            await authAdmin.updateUser(uid, updateData);
        }

        // 2. Update Firestore
        const firestoreUpdate: any = {};
        if (email) firestoreUpdate.email = email;
        if (displayName) firestoreUpdate.displayName = displayName;
        if (role) firestoreUpdate.role = role;

        if (Object.keys(firestoreUpdate).length > 0) {
            await dbAdmin.collection("users").doc(uid).update(firestoreUpdate);
        }

        // 3. Sync Updates to Sanity (Backup)
        const sanityUpdates: any = {};
        if (email) sanityUpdates.email = email;
        if (displayName) sanityUpdates.displayName = displayName;
        if (role) sanityUpdates.role = role;

        if (Object.keys(sanityUpdates).length > 0) {
            await patchAdminInSanity(uid, sanityUpdates);
        }

        return NextResponse.json({
            success: true,
            message: "User profile updated successfully."
        });
    } catch (error: any) {
        console.error("Error updating user:", error);
        return NextResponse.json({ error: error.message || "Failed to update user." }, { status: 500 });
    }
}
