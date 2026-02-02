"use client";

import React from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ShieldAlert } from "lucide-react";

interface AccessDeniedDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function AccessDeniedDialog({
    open,
    onOpenChange,
}: AccessDeniedDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[calc(100%-2rem)] max-w-[400px] rounded-3xl p-0 overflow-hidden border-neutral-200 dark:border-neutral-800 shadow-2xl gap-0">
                <div className="flex flex-col items-center pt-10 pb-6 px-6 text-center">
                    <div className="w-16 h-16 bg-red-50 dark:bg-red-950/30 rounded-full flex items-center justify-center text-red-500 mb-5 border border-red-100 dark:border-red-900/50 shadow-sm ring-4 ring-red-50/50 dark:ring-red-900/20">
                        <ShieldAlert size={32} strokeWidth={2} />
                    </div>
                    <DialogTitle className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-2.5">
                        Access Restricted
                    </DialogTitle>
                    <DialogDescription className="text-sm text-neutral-500 dark:text-neutral-400 font-medium leading-relaxed">
                        This action allows permanent changes and is restricted to <span className="text-red-600 dark:text-red-400 font-bold">Super Administrators</span>.
                    </DialogDescription>
                </div>

                <div className="p-5 bg-neutral-50 dark:bg-neutral-900/50 border-t border-neutral-100 dark:border-neutral-800">
                    <div className="bg-white dark:bg-neutral-900 rounded-xl p-3.5 border border-neutral-100 dark:border-neutral-800 shadow-sm">
                        <p className="text-[11px] text-neutral-400 dark:text-neutral-500 text-center leading-relaxed font-medium">
                            System security protocols prevent unauthorized modifications to master records. Contact IT Support if you require elevated privileges.
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
