"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";

interface AuthContextType {
    user: User | null;
    role: "admin" | "super_admin" | null;
    loading: boolean;
    isSuperAdmin: boolean;
    logout: () => Promise<void>;
    updateName: (newName: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    role: null,
    loading: true,
    isSuperAdmin: false,
    logout: async () => { },
    updateName: async () => { },
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [role, setRole] = useState<"admin" | "super_admin" | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let unsubscribeRole: (() => void) | undefined;

        const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);

            // Clean up previous role listener if it exists
            if (unsubscribeRole) {
                unsubscribeRole();
                unsubscribeRole = undefined;
            }

            if (currentUser) {
                // Fetch user role from Firestore with real-time updates
                unsubscribeRole = onSnapshot(doc(db, "users", currentUser.uid), (userDoc) => {
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        setRole(userData.role || "admin");
                    } else {
                        // Security: If user exists in Auth but not in Firestore (deleted by Super Admin), force logout
                        console.warn("User account deleted. Logging out.");
                        signOut(auth).then(() => {
                            setRole(null);
                            localStorage.removeItem("adminSession");
                            // Optional: Redirect or refresh could happen here, but state change usually triggers re-render
                        });
                        return;
                    }
                    setLoading(false);
                }, (error) => {
                    console.error("Error fetching user role:", error);
                    setRole(null);
                    setLoading(false);
                });
            } else {
                setRole(null);
                setLoading(false);
            }
        });

        return () => {
            unsubscribeAuth();
            if (unsubscribeRole) unsubscribeRole();
        };
    }, []);

    const logout = async () => {
        try {
            await signOut(auth);
            // Clear legacy local storage session if it exists
            localStorage.removeItem("adminSession");
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

    const updateName = async (newName: string) => {
        try {
            const { updateProfile } = await import("firebase/auth");
            const { doc, setDoc } = await import("firebase/firestore");

            if (auth.currentUser) {
                await updateProfile(auth.currentUser, {
                    displayName: newName.trim()
                });

                await setDoc(doc(db, "users", auth.currentUser.uid), {
                    displayName: newName.trim(),
                    updatedAt: new Date().toISOString()
                }, { merge: true });

                // Force state update to reflect name change
                setUser({ ...auth.currentUser } as User);
            }
        } catch (error) {
            console.error("Error updating name:", error);
            throw error;
        }
    };

    const value = {
        user,
        role,
        loading,
        isSuperAdmin: role === "super_admin",
        logout,
        updateName,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
