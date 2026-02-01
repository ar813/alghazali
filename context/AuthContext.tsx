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
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    role: null,
    loading: true,
    isSuperAdmin: false,
    logout: async () => { },
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
                        setRole("admin");
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

    const value = {
        user,
        role,
        loading,
        isSuperAdmin: role === "super_admin",
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
