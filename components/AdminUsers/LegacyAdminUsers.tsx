"use client";

import React, { useEffect, useState } from "react";
import { db } from "../../lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { Trash2, Shield, UserCog, Search, Plus, AlertCircle, Edit3, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import Image from "next/image";

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    image?: string;
    createdAt?: string;
}

interface LegacyAdminUsersProps {
    onLoadingChange?: (loading: boolean) => void;
}

const LegacyAdminUsers: React.FC<LegacyAdminUsersProps> = ({ onLoadingChange }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterRole, setFilterRole] = useState<string>("all");

    const fetchUsers = React.useCallback(async () => {
        setIsLoading(true);
        try {
            const usersRef = collection(db, "users");
            const snapshot = await getDocs(usersRef);
            const usersData = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as User[];
            setUsers(usersData);
        } catch (error) {
            console.error("Error fetching users:", error);
            toast.error("Failed to fetch users");
        } finally {
            setIsLoading(false);
            onLoadingChange?.(false);
        }
    }, [onLoadingChange]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const filteredUsers = users.filter((user) => {
        const matchesSearch =
            user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = filterRole === "all" || user.role === filterRole;
        return matchesSearch && matchesRole;
    });

    const getRoleColor = (role: string) => {
        switch (role) {
            case "admin":
                return "bg-gradient-to-r from-purple-500 to-pink-500";
            case "teacher":
                return "bg-gradient-to-r from-blue-500 to-cyan-500";
            case "student":
                return "bg-gradient-to-r from-green-500 to-emerald-500";
            default:
                return "bg-gradient-to-r from-gray-500 to-slate-500";
        }
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case "admin":
                return "text-purple-400 bg-purple-500/20 border-purple-500/30";
            case "teacher":
                return "text-blue-400 bg-blue-500/20 border-blue-500/30";
            case "student":
                return "text-green-400 bg-green-500/20 border-green-500/30";
            default:
                return "text-gray-400 bg-gray-500/20 border-gray-500/30";
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
                    <p className="text-gray-400 text-sm">Loading users...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                        User Management
                    </h2>
                    <p className="text-gray-400 text-sm mt-1">
                        Manage all users and their roles
                    </p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl text-white font-medium transition-all shadow-lg shadow-purple-500/25">
                        <Plus className="w-4 h-4" />
                        Add User
                    </button>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                    />
                </div>
                <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all appearance-none cursor-pointer"
                >
                    <option value="all" className="bg-gray-900">All Roles</option>
                    <option value="admin" className="bg-gray-900">Admin</option>
                    <option value="teacher" className="bg-gray-900">Teacher</option>
                    <option value="student" className="bg-gray-900">Student</option>
                </select>
            </div>

            {/* Users Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence mode="popLayout">
                    {filteredUsers.map((user, index) => (
                        <motion.div
                            key={user.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ delay: index * 0.05 }}
                            className="group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 hover:bg-white/10 hover:border-white/20 transition-all duration-300"
                        >
                            {/* Role indicator line */}
                            <div className={`absolute top-0 left-0 right-0 h-1 ${getRoleColor(user.role)} rounded-t-2xl opacity-50 group-hover:opacity-100 transition-opacity`} />

                            <div className="flex items-start gap-4">
                                {/* Avatar */}
                                <div className={`relative w-12 h-12 rounded-xl ${getRoleColor(user.role)} flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                                    {user.image ? (
                                        <Image
                                            src={user.image}
                                            alt={user.name}
                                            width={48}
                                            height={48}
                                            className="w-full h-full object-cover rounded-xl"
                                        />
                                    ) : (
                                        user.name?.charAt(0).toUpperCase() || "U"
                                    )}
                                </div>

                                {/* User Info */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-white truncate">
                                        {user.name || "Unknown User"}
                                    </h3>
                                    <p className="text-gray-400 text-sm truncate">{user.email}</p>
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 mt-2 text-xs font-medium rounded-lg border ${getRoleBadgeColor(user.role)}`}>
                                        {user.role === "admin" && <Shield className="w-3 h-3" />}
                                        {user.role === "teacher" && <UserCog className="w-3 h-3" />}
                                        {user.role?.charAt(0).toUpperCase() + user.role?.slice(1) || "User"}
                                    </span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 mt-4 pt-4 border-t border-white/10">
                                <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all">
                                    <Edit3 className="w-4 h-4" />
                                    Edit
                                </button>
                                <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all">
                                    <Trash2 className="w-4 h-4" />
                                    Delete
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Empty State */}
            {filteredUsers.length === 0 && !isLoading && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-gray-800/50 flex items-center justify-center mb-4">
                        <AlertCircle className="w-8 h-8 text-gray-500" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-300 mb-2">No users found</h3>
                    <p className="text-gray-500 text-sm max-w-sm">
                        {searchQuery || filterRole !== "all"
                            ? "Try adjusting your search or filter criteria"
                            : "No users have been added yet"}
                    </p>
                </div>
            )}
        </div>
    );
};

export default LegacyAdminUsers;
