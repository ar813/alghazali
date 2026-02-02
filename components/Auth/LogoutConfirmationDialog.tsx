import React from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { LogOut } from "lucide-react";

interface LogoutConfirmationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
}

const LogoutConfirmationDialog = ({ open, onOpenChange, onConfirm }: LogoutConfirmationDialogProps) => {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="w-[calc(100%-2rem)] max-w-sm rounded-[1.5rem] p-0 overflow-hidden border-neutral-200 dark:border-neutral-800 shadow-2xl gap-0">

                {/* Header Section with Icon */}
                <div className="flex flex-col items-center pt-8 pb-4 px-6 text-center">
                    <div className="w-14 h-14 bg-red-50 dark:bg-red-950/30 rounded-full flex items-center justify-center text-red-500 mb-4 border border-red-100 dark:border-red-900/50 shadow-sm">
                        <LogOut size={24} strokeWidth={2.5} className="ml-1" />
                    </div>
                    <AlertDialogTitle className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-2">
                        Confirm Logout
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-sm text-neutral-500 dark:text-neutral-400 font-medium leading-relaxed max-w-[260px]">
                        Are you sure you want to end your current session? You will need to sign in again.
                    </AlertDialogDescription>
                </div>

                {/* Footer Actions */}
                <AlertDialogFooter className="p-4 bg-neutral-50 dark:bg-neutral-900/50 border-t border-neutral-100 dark:border-neutral-800 flex-col-reverse sm:flex-row sm:justify-center gap-3">
                    <AlertDialogCancel
                        className="w-full sm:w-1/2 h-11 rounded-xl border-neutral-200 bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 font-semibold m-0"
                    >
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirm}
                        className="w-full sm:w-1/2 h-11 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold shadow-lg shadow-red-500/20 m-0"
                    >
                        Yes, Log Out
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export default LogoutConfirmationDialog;
