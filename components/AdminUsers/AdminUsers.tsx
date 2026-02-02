"use client";

import React, { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { Trash2, Shield, ShieldCheck, UserCog, Search, Plus, X, AlertCircle, Edit3, Loader2, Mail, Calendar, RefreshCw, Clock } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface UserData {
    uid: string;
    email: string;
    displayName?: string;
    role?: "admin" | "super_admin";
    lastLoginAt?: string;
    createdAt?: string;
}

const AdminUsers = ({ onLoadingChange }: { onLoadingChange?: (loading: boolean) => void }) => {
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const currentUserUid = auth.currentUser?.uid;
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Add Dialog state
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [role, setRole] = useState<"admin" | "super_admin">("admin");

    // Edit Dialog state
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [editingUser, setEditingUser] = useState<UserData | null>(null);
    const [editDisplayName, setEditDisplayName] = useState("");
    const [editEmail, setEditEmail] = useState("");
    const [editPassword, setEditPassword] = useState("");
    const [editRole, setEditRole] = useState<"admin" | "super_admin">("admin");

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [updatingRoleUid, setUpdatingRoleUid] = useState<string | null>(null);

    // Delete Confirmation state
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [userToDelete, setUserToDelete] = useState<UserData | null>(null);

    const fetchUsers = async (silent = false) => {
        if (!silent) {
            setLoading(true);
            onLoadingChange?.(true);
        }
        try {
            const querySnapshot = await getDocs(collection(db, "users"));
            const usersData: UserData[] = [];
            querySnapshot.forEach((doc) => {
                usersData.push(doc.data() as UserData);
            });
            setUsers(usersData);
        } catch (error) {
            console.error("Error fetching users:", error);
            toast.error("Failed to load users.");
        } finally {
            if (!silent) {
                setLoading(false);
                onLoadingChange?.(false);
            }
        }
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await fetchUsers(true);
        setTimeout(() => setIsRefreshing(false), 600); // Small delay for animation feel
        toast.success("User list updated");
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const idToken = await auth.currentUser?.getIdToken();
            const response = await fetch("/api/admin/users", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${idToken}`,
                },
                body: JSON.stringify({ email, password, displayName, role }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Failed to create user");

            toast.success("User added successfully");
            setShowAddDialog(false);
            resetAddForm();
            fetchUsers();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;
        setIsSubmitting(true);
        try {
            const idToken = await auth.currentUser?.getIdToken();
            const response = await fetch("/api/admin/users", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${idToken}`,
                },
                body: JSON.stringify({
                    uid: editingUser.uid,
                    displayName: editDisplayName,
                    email: editEmail,
                    role: editRole,
                    ...(editPassword ? { password: editPassword } : {})
                }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Failed to update user");

            toast.success("Profile updated");
            setShowEditDialog(false);
            setEditingUser(null);
            fetchUsers();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleQuickRoleChange = async (user: UserData) => {
        if (user.uid === currentUserUid) {
            toast.error("You cannot demote yourself.");
            return;
        }

        const newRole = user.role === "super_admin" ? "admin" : "super_admin";
        setUpdatingRoleUid(user.uid);
        try {
            const idToken = await auth.currentUser?.getIdToken();
            const response = await fetch("/api/admin/users", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${idToken}`,
                },
                body: JSON.stringify({
                    uid: user.uid,
                    role: newRole
                }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Failed to update role");

            toast.success(`Role changed to ${newRole}`);
            setUsers((prev) =>
                prev.map((u) => (u.uid === user.uid ? { ...u, role: newRole } : u))
            );
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setUpdatingRoleUid(null);
        }
    };

    const handleDeleteUser = (user: UserData) => {
        if (user.uid === currentUserUid) {
            toast.error("You cannot delete your own account.");
            return;
        }
        setUserToDelete(user);
        setShowDeleteDialog(true);
    };

    const confirmDelete = async () => {
        if (!userToDelete) return;
        setIsSubmitting(true);
        try {
            const idToken = await auth.currentUser?.getIdToken();
            const response = await fetch(`/api/admin/users?uid=${userToDelete.uid}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${idToken}`,
                },
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Failed to delete user");

            toast.success("User removed permanently.");
            setUsers(prev => prev.filter(user => user.uid !== userToDelete.uid));
            setShowDeleteDialog(false);
            setUserToDelete(null);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetAddForm = () => {
        setEmail("");
        setPassword("");
        setDisplayName("");
        setRole("admin");
    };

    const openEditDialog = (user: UserData) => {
        setEditingUser(user);
        setEditDisplayName(user.displayName || "");
        setEditEmail(user.email || "");
        setEditRole(user.role || "admin");
        setEditPassword("");
        setShowEditDialog(true);
    };

    const filteredUsers = users.filter((user) =>
        (user.email?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (user.displayName?.toLowerCase() || "").includes(searchTerm.toLowerCase())
    );

    return (
        <>
            <div className="max-w-7xl mx-auto px-2 sm:px-6 space-y-6 pb-20">
                {/* Header Section */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5 bg-white p-5 sm:p-7 rounded-2xl border border-neutral-200 shadow-sm transition-all">
                    <div className="space-y-1">
                        <h2 className="text-xl sm:text-2xl font-semibold text-neutral-900 flex items-center gap-3">
                            <div className="p-2 bg-indigo-50 rounded-xl">
                                <UserCog className="h-6 w-6 text-indigo-600" />
                            </div>
                            Admin Access
                        </h2>
                        <p className="text-sm text-neutral-500 pl-1">
                            Team access and security levels.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto mt-2 lg:mt-0">
                        <button
                            onClick={handleRefresh}
                            disabled={isRefreshing || loading}
                            className="p-2.5 text-neutral-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl border border-neutral-200 transition-all active:scale-95 disabled:opacity-50"
                            title="Refresh Data"
                        >
                            <RefreshCw size={20} className={cn(isRefreshing && "animate-spin")} />
                        </button>
                        <div className="relative flex-1 sm:w-72">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                            <input
                                type="text"
                                placeholder="Search by name or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder:text-neutral-400"
                            />
                        </div>
                        <button
                            onClick={() => setShowAddDialog(true)}
                            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-indigo-600/10"
                        >
                            <Plus size={18} />
                            <span>Add User</span>
                        </button>
                    </div>
                </div>

                {/* Table for Desktop */}
                <div className="hidden md:block bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-neutral-500 uppercase bg-neutral-50/50 border-b border-neutral-200">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">User</th>
                                    <th className="px-6 py-4 font-semibold">Role</th>
                                    <th className="px-6 py-4 font-semibold">Last Login</th>
                                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="relative">
                                                    <div className="w-12 h-12 border-4 border-indigo-100 rounded-full"></div>
                                                    <div className="absolute inset-0 w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-sm font-bold text-neutral-900">Loading Team</p>
                                                    <p className="text-xs text-neutral-500">Checking access permissions...</p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-16 text-center text-neutral-500">
                                            No users found.
                                        </td>
                                    </tr>
                                ) : filteredUsers.map((user) => (
                                    <tr key={user.uid} className={cn(
                                        "group hover:bg-neutral-50/50 transition-colors",
                                        user.uid === currentUserUid && "bg-indigo-50/30"
                                    )}>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-700 font-semibold text-lg border border-neutral-200">
                                                    {(user.displayName || user.email)[0].toUpperCase()}
                                                </div>
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium text-neutral-900">
                                                            {user.displayName || "Admin User"}
                                                        </span>
                                                        {user.uid === currentUserUid && (
                                                            <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold uppercase">You</span>
                                                        )}
                                                    </div>
                                                    <span className="text-xs text-neutral-500">{user.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className={cn(
                                                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border",
                                                user.role === "super_admin"
                                                    ? "bg-purple-50 text-purple-700 border-purple-100"
                                                    : "bg-blue-50 text-blue-700 border-blue-100"
                                            )}>
                                                {user.role === "super_admin" ? "Super Admin" : "Regular Admin"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col gap-0.5">
                                                <div className="flex items-center gap-1.5 text-neutral-700 font-medium">
                                                    <Clock size={14} className="text-neutral-400" />
                                                    <span>{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Never"}</span>
                                                </div>
                                                <span className="text-[11px] text-neutral-400 ml-5">
                                                    {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : "No activity"}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleQuickRoleChange(user)}
                                                    disabled={updatingRoleUid === user.uid || user.uid === currentUserUid}
                                                    className="px-4 py-1.5 text-xs font-medium rounded-lg text-neutral-600 hover:bg-neutral-100 border border-neutral-200 disabled:opacity-40 min-w-[80px] flex items-center justify-center"
                                                >
                                                    {updatingRoleUid === user.uid ? <Loader2 size={14} className="animate-spin" /> : (user.role === "super_admin" ? "Demote" : "Promote")}
                                                </button>
                                                <button onClick={() => openEditDialog(user)} className="p-2 text-neutral-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="Edit">
                                                    <Edit3 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteUser(user)}
                                                    disabled={user.uid === currentUserUid}
                                                    className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-20"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Cards for Mobile */}
                <div className="md:hidden space-y-4">
                    {loading ? (
                        <div className="p-12 text-center bg-white rounded-2xl border border-neutral-200">
                            <Loader2 size={28} className="animate-spin text-indigo-600 mx-auto mb-3" />
                            <p className="text-neutral-500">Loading team members...</p>
                        </div>
                    ) : (
                        filteredUsers.map((user) => (
                            <div key={user.uid} className={cn(
                                "bg-white rounded-2xl border p-5 space-y-4 shadow-sm relative",
                                user.uid === currentUserUid ? "border-indigo-300 ring-1 ring-indigo-100" : "border-neutral-200",
                            )}>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-700 font-bold text-xl border border-neutral-200">
                                        {(user.displayName || user.email)[0].toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-neutral-900 truncate">{user.displayName || "Admin User"}</h3>
                                            {user.uid === currentUserUid && <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-bold uppercase">YOU</span>}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-neutral-500 mt-0.5">
                                            <Mail size={12} />
                                            <p className="text-xs truncate">{user.email}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between py-1 px-1 border-t border-neutral-50 pt-3">
                                    <span className={cn(
                                        "px-2.5 py-1 rounded-lg text-xs font-semibold border",
                                        user.role === "super_admin" ? "bg-purple-50 text-purple-700 border-purple-100" : "bg-blue-50 text-blue-700 border-blue-100"
                                    )}>
                                        {user.role === "super_admin" ? "Super Admin" : "Admin"}
                                    </span>
                                    <div className="flex items-center gap-1.5 text-neutral-400 text-[10px]">
                                        <Clock size={10} />
                                        <span>{user.lastLoginAt ? `${new Date(user.lastLoginAt).toLocaleDateString()} ${new Date(user.lastLoginAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'New Account'}</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-2 pt-1">
                                    <button
                                        onClick={() => handleQuickRoleChange(user)}
                                        disabled={updatingRoleUid === user.uid || user.uid === currentUserUid}
                                        className="flex flex-col items-center gap-1 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-[11px] font-medium text-neutral-600 active:scale-95 disabled:opacity-30"
                                    >
                                        {updatingRoleUid === user.uid ? <Loader2 size={16} className="animate-spin" /> : <Shield size={16} />}
                                        <span>{user.role === "super_admin" ? "Demote" : "Promote"}</span>
                                    </button>
                                    <button onClick={() => openEditDialog(user)} className="flex flex-col items-center gap-1 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-[11px] font-medium text-neutral-600 active:scale-95">
                                        <Edit3 size={16} className="text-indigo-600" />
                                        <span>Edit Info</span>
                                    </button>
                                    <button
                                        onClick={() => handleDeleteUser(user)}
                                        disabled={user.uid === currentUserUid}
                                        className="flex flex-col items-center gap-1 py-3 bg-red-50 border border-red-100 rounded-xl text-[11px] font-medium text-red-600 active:scale-95 disabled:opacity-20"
                                    >
                                        <Trash2 size={16} />
                                        <span>Delete</span>
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* --- DIALOGS (Moved outside main div to avoid transformation clipping) --- */}

            {/* Add User Dialog */}
            {showAddDialog && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-start justify-center pt-8 sm:items-center sm:pt-0 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in duration-300">
                        <div className="p-5 sm:p-6 border-b border-neutral-100 flex items-center justify-between shrink-0">
                            <div>
                                <h3 className="text-lg font-semibold text-neutral-900">Add User</h3>
                                <p className="text-xs text-neutral-500">Create a new admin account.</p>
                            </div>
                            <button onClick={() => setShowAddDialog(false)} className="text-neutral-400 hover:text-neutral-600 p-2 rounded-lg hover:bg-neutral-50 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
                            <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex gap-3 text-sm text-amber-800">
                                <AlertCircle className="h-5 w-5 shrink-0 text-amber-600" />
                                <p>Account creation is permanent. Please use correct details.</p>
                            </div>

                            <form id="add-user-form" onSubmit={handleAddUser} className="space-y-5">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Full Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={displayName}
                                            onChange={(e) => setDisplayName(e.target.value)}
                                            className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm outline-none focus:border-indigo-500 transition-colors"
                                            placeholder="Arsalan Ahmed"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Access Role</label>
                                        <select
                                            value={role}
                                            onChange={(e) => setRole(e.target.value as any)}
                                            className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm outline-none focus:border-indigo-500 cursor-pointer appearance-none"
                                        >
                                            <option value="admin">Regular Admin</option>
                                            <option value="super_admin">Super Admin</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Email Address</label>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm outline-none focus:border-indigo-500 transition-colors"
                                        placeholder="admin@alghazali.edu"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Password</label>
                                    <input
                                        type="password"
                                        required
                                        minLength={6}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm outline-none focus:border-indigo-500 transition-colors"
                                        placeholder="At least 6 characters"
                                    />
                                </div>
                            </form>
                        </div>

                        <div className="p-5 border-t border-neutral-100 bg-neutral-50/50 shrink-0">
                            <button
                                form="add-user-form"
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition-all shadow-md active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? <><Loader2 className="animate-spin" size={18} /><span>Adding User...</span></> : "Create Account"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit User Dialog */}
            {showEditDialog && editingUser && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-start justify-center pt-8 sm:items-center sm:pt-0 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in duration-300">
                        <div className="p-5 sm:p-6 border-b border-neutral-100 flex items-center justify-between shrink-0">
                            <div>
                                <h3 className="text-lg font-semibold text-neutral-900">Update Profile</h3>
                                <p className="text-xs text-neutral-500">Modifying details for {editingUser.displayName || "Admin"}</p>
                            </div>
                            <button onClick={() => setShowEditDialog(false)} className="text-neutral-400 hover:text-neutral-600 p-2 rounded-lg hover:bg-neutral-50 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
                            <form id="edit-user-form" onSubmit={handleUpdateUser} className="space-y-5">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Full Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={editDisplayName}
                                        onChange={(e) => setEditDisplayName(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm outline-none focus:border-indigo-500 transition-colors"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Email</label>
                                    <input
                                        type="email"
                                        required
                                        value={editEmail}
                                        onChange={(e) => setEditEmail(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm outline-none focus:border-indigo-500 transition-colors"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">New Password (Empty to keep)</label>
                                    <input
                                        type="password"
                                        minLength={6}
                                        value={editPassword}
                                        onChange={(e) => setEditPassword(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm outline-none focus:border-indigo-500 transition-colors"
                                        placeholder="Must be 6+ chars"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Account Role</label>
                                    <select
                                        value={editRole}
                                        onChange={(e) => setEditRole(e.target.value as any)}
                                        disabled={editingUser.uid === currentUserUid}
                                        className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm outline-none focus:border-indigo-500 appearance-none disabled:bg-neutral-100 disabled:text-neutral-400"
                                    >
                                        <option value="admin">Regular Admin</option>
                                        <option value="super_admin">Super Admin</option>
                                    </select>
                                    {editingUser.uid === currentUserUid && <p className="text-[10px] text-amber-600 font-medium ml-1">You cannot demote your own account for safety.</p>}
                                </div>
                            </form>
                        </div>

                        <div className="p-5 border-t border-neutral-100 bg-neutral-50/50 shrink-0">
                            <button
                                form="edit-user-form"
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition-all shadow-md active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? <><Loader2 className="animate-spin" size={18} /><span>Saving Changes...</span></> : "Save Changes"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
            {showDeleteDialog && userToDelete && (
                <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in duration-300">
                        <div className="p-8 text-center space-y-6">
                            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
                                <Trash2 className="h-8 w-8 text-red-600" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-bold text-neutral-900">Delete Permanently?</h3>
                                <p className="text-sm text-neutral-500">
                                    This will erase <span className="font-semibold text-neutral-900">{userToDelete.displayName || userToDelete.email}</span>. This action is irreversible.
                                </p>
                            </div>
                            <div className="flex flex-col gap-2.5 pt-2">
                                <button
                                    onClick={confirmDelete}
                                    disabled={isSubmitting}
                                    className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-xl transition-all shadow-red-600/10 active:scale-95 disabled:opacity-70 flex items-center justify-center"
                                >
                                    {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : "Delete User"}
                                </button>
                                <button
                                    onClick={() => { setShowDeleteDialog(false); setUserToDelete(null); }}
                                    disabled={isSubmitting}
                                    className="w-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-medium py-3 rounded-xl transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default AdminUsers;
