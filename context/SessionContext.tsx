"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { auth } from "@/lib/firebase";

// Define the Session Context Type
interface SessionContextType {
    selectedSession: string | null;
    setSelectedSession: (session: string | null) => void;
    sessions: string[]; // List of available sessions
    isLoading: boolean;
    addSession: (session: string) => Promise<void>;
    renameSession: (oldName: string, newName: string) => Promise<void>;
    deleteSession: (sessionName: string) => Promise<void>;
    refreshSessions: () => Promise<void>;
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
    const [sessions, setSessions] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const DEFAULT_SESSION = "2025-2026";

        const initializeSessions = async () => {
            try {
                // Try fetching from Sanity API first with NO-CACHE
                const res = await fetch('/api/sessions/list', { cache: 'no-store' });
                const data = await res.json();

                console.log('[SessionContext] API response:', data);

                let finalSessions: string[] = [];

                if (data.ok && data.sessions) {
                    finalSessions = [...data.sessions];
                } else {
                    // Fallback to localStorage if API specifically failed but returned JSON
                    const savedSessionsList = localStorage.getItem("admin_sessions_list");
                    if (savedSessionsList) {
                        try {
                            finalSessions = JSON.parse(savedSessionsList);
                        } catch (_e) { }
                    }
                }

                // Always ensure the default session exists
                if (!finalSessions.includes(DEFAULT_SESSION)) {
                    finalSessions.unshift(DEFAULT_SESSION);
                }

                console.log('[SessionContext] Sync complete. Sessions:', finalSessions);
                setSessions(finalSessions);
                localStorage.setItem("admin_sessions_list", JSON.stringify(finalSessions));

            } catch (error) {
                console.error("Failed to fetch sessions from API:", error);
                // Fallback to localStorage
                const savedSessionsList = localStorage.getItem("admin_sessions_list");
                if (savedSessionsList) {
                    try {
                        const parsed = JSON.parse(savedSessionsList);
                        // Ensure default session exists
                        if (!parsed.includes(DEFAULT_SESSION)) {
                            parsed.unshift(DEFAULT_SESSION);
                        }
                        setSessions(parsed);
                    } catch (_e) {
                        setSessions([DEFAULT_SESSION]);
                    }
                } else {
                    setSessions([DEFAULT_SESSION]);
                }
            } finally {
                setIsLoading(false);
            }

            // Load persisted selected session
            const savedSession = localStorage.getItem("admin_selected_session");
            if (savedSession) {
                setSelectedSessionState(savedSession);
            }
        };

        initializeSessions();

        // Add visibility change listener to refresh sessions when tab becomes visible
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                console.log('[SessionContext] Tab became visible, refreshing sessions...');
                initializeSessions();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    // Expose refresh function for manual calls
    const refreshSessions = async () => {
        const DEFAULT_SESSION = "2025-2026";
        try {
            const res = await fetch('/api/sessions/list', { cache: 'no-store' });
            const data = await res.json();

            let finalSessions: string[] = [];

            if (data.ok && data.sessions) {
                finalSessions = [...data.sessions];
            }

            // Always ensure the default session exists
            if (!finalSessions.includes(DEFAULT_SESSION)) {
                finalSessions.unshift(DEFAULT_SESSION);
            }

            console.log('[SessionContext] Manual Refreshed sessions:', finalSessions);
            setSessions(finalSessions);
            localStorage.setItem("admin_sessions_list", JSON.stringify(finalSessions));
        } catch (error) {
            console.error("Failed to refresh sessions:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const setSelectedSession = (session: string | null) => {
        setSelectedSessionState(session);
        if (session) {
            localStorage.setItem("admin_selected_session", session);
        } else {
            localStorage.removeItem("admin_selected_session");
        }
    };

    const addSession = async (newSession: string) => {
        if (!sessions.includes(newSession)) {
            try {
                const token = await auth.currentUser?.getIdToken();
                const res = await fetch('/api/sessions/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ sessionName: newSession })
                });
                const data = await res.json();
                if (!data.ok) throw new Error(data.error);

                // Update local state after successful API call
                const updatedSessions = [...sessions, newSession];
                setSessions(updatedSessions);
                localStorage.setItem("admin_sessions_list", JSON.stringify(updatedSessions));
            } catch (error) {
                console.error('Failed to create session:', error);
                throw error;
            }
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
        <SessionContext.Provider value={{ selectedSession, setSelectedSession, sessions, isLoading, addSession, renameSession, deleteSession, refreshSessions }}>
            {children}
        </SessionContext.Provider>
    );
};
