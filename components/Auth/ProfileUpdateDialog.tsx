"use client";

import React, { useState } from 'react';
import { UserRound } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface ProfileUpdateDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const ProfileUpdateDialog = ({ open, onOpenChange }: ProfileUpdateDialogProps) => {
    const { user, updateName } = useAuth();
    const [newName, setNewName] = useState(user?.displayName || '');
    const [isUpdating, setIsUpdating] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim()) return;

        setIsUpdating(true);
        try {
            await updateName(newName.trim());
            toast.success('Name updated successfully!');
            onOpenChange(false);
        } catch (error) {
            console.error('Error updating name:', error);
            toast.error('Failed to update name.');
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[calc(100%-2rem)] sm:max-w-[400px] border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden p-0 shadow-2xl">
                <div className="bg-neutral-50 dark:bg-neutral-900/50 p-6 border-b border-neutral-200 dark:border-neutral-800">
                    <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500 mb-4">
                        <UserEdit size={20} strokeWidth={2.5} />
                    </div>
                    <DialogTitle className="text-lg font-bold">Update Profile</DialogTitle>
                    <p className="text-xs text-neutral-500 mt-1">Change your public display name.</p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-widest font-bold text-neutral-400 ml-1">Display Name</label>
                        <Input
                            autoFocus
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="e.g. Arsalan"
                            className="h-10 text-sm font-medium border-neutral-200 dark:border-neutral-800 focus:ring-offset-0 focus:ring-1 focus:ring-blue-500 transition-all rounded-lg"
                            required
                        />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 pt-2">
                        <Button type="button" variant="ghost" className="order-2 sm:order-1 flex-1 text-xs h-10 rounded-lg" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isUpdating || !newName.trim()}
                            className="order-1 sm:order-2 flex-[1.5] bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:hover:bg-blue-700 text-xs h-10 rounded-lg font-semibold shadow-lg shadow-blue-500/10"
                        >
                            {isUpdating ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                'Save Changes'
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default ProfileUpdateDialog;

// Lucide icon helper if UserEdit isn't available
function UserEdit({ size, strokeWidth, ...props }: any) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            {...props}
        >
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
    );
}
