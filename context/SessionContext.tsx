"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { auth } from "@/lib/firebase";

// Define the Session Context Type
interface SessionContextType {
    selectedSession: string | null;
    setSelectedSession: (session: string | null) => void;
    sessions: string[]; // List of available sessions
    isLoading: boolean;
    addSession: (session: string) => void;
    renameSession: (oldName: string, newName: string) => Promise<void>;
    deleteSession: (sessionName: string) => Promise<void>;
}

// Create Context
const SessionContext = createContext<SessionContextType | undefined>(undefined);

// Hook to use the Session Context
export const useSession = () => {
    const context = useContext(SessionContext);
    if (!context) {
        throw new Error("useSession must be used within a SessionProvider");
    }
    return context;
};

// Provider Component
export const SessionProvider = ({ children }: { children: ReactNode }) => {
    // Try to load from localStorage first (persistence)
    const [selectedSession, setSelectedSessionState] = useState<string | null>(null);

    // Hardcoded sessions for now (later can be fetched from DB)
    const [sessions, setSessions] = useState<string[]>(["2024-2025"]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Load persisted session on mount
        const savedSession = localStorage.getItem("admin_selected_session");
        if (savedSession && sessions.includes(savedSession)) {
            setSelectedSessionState(savedSession);
        }

        // Initialize sessions list from localStorage if available, or keep default
        // Ideally, we fetch this from Sanity/Firebase. For now, local state + default.
        const savedSessionsList = localStorage.getItem("admin_sessions_list");
        if (savedSessionsList) {
            try {
                setSessions(JSON.parse(savedSessionsList));
            } catch (e) {
                console.error("Failed to parse sessions list", e);
            }
        }

        setIsLoading(false);
    }, []);

    const setSelectedSession = (session: string | null) => {
        setSelectedSessionState(session);
        if (session) {
            localStorage.setItem("admin_selected_session", session);
        } else {
            localStorage.removeItem("admin_selected_session");
        }
    };

    const addSession = (newSession: string) => {
        if (!sessions.includes(newSession)) {
            const updatedSessions = [...sessions, newSession];
            setSessions(updatedSessions);
            localStorage.setItem("admin_sessions_list", JSON.stringify(updatedSessions));
        }
    };

    const renameSession = async (oldName: string, newName: string) => {
        try {
            const token = await auth.currentUser?.getIdToken();
            const res = await fetch('/api/sessions/rename', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ oldSession: oldName, newSession: newName })
            });
            const data = await res.json();
            if (!data.ok) throw new Error(data.error);

            // Update local state
            const updatedSessions = sessions.map(s => s === oldName ? newName : s);
            setSessions(updatedSessions);
            localStorage.setItem("admin_sessions_list", JSON.stringify(updatedSessions));

            // If the renamed session was selected, update selection
            if (selectedSession === oldName) {
                setSelectedSession(newName);
            }
        } catch (error) {
            console.error(error);
            throw error;
        }
    };

    const deleteSession = async (sessionName: string) => {
        try {
            const token = await auth.currentUser?.getIdToken();
            const res = await fetch('/api/sessions/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ session: sessionName })
            });
            const data = await res.json();
            if (!data.ok) throw new Error(data.error);

            // Update local state
            const updatedSessions = sessions.filter(s => s !== sessionName);
            setSessions(updatedSessions);
            localStorage.setItem("admin_sessions_list", JSON.stringify(updatedSessions));

            // If deleted session was selected, clear selection
            if (selectedSession === sessionName) {
                setSelectedSession(null);
            }
        } catch (error) {
            console.error(error);
            throw error;
        }
    };

    return (
        <SessionContext.Provider value={{ selectedSession, setSelectedSession, sessions, isLoading, addSession, renameSession, deleteSession }}>
            {children}
        </SessionContext.Provider>
    );
};
