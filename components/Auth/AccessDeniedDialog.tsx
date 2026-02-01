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
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="mx-auto bg-red-100 p-3 rounded-full w-fit mb-4">
                        <ShieldAlert className="h-8 w-8 text-red-600" />
                    </div>
                    <DialogTitle className="text-center text-xl">
                        Access Restricted
                    </DialogTitle>
                    <DialogDescription className="text-center pt-2">
                        You do not have permission to perform this action. This area is
                        restricted to <strong>Super Administrators</strong> only.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex justify-center p-4 bg-slate-50 rounded-lg mt-2">
                    <p className="text-sm text-slate-500 text-center">
                        If you believe this is an error, please contact your system
                        administrator to request elevated privileges.
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
