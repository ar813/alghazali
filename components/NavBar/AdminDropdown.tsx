import { useState } from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, LayoutDashboard, CalendarClock, Smartphone, UserCog } from "lucide-react";
import { User as FirebaseUser } from "firebase/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import LogoutConfirmationDialog from "../Auth/LogoutConfirmationDialog";
import ProfileUpdateDialog from "../Auth/ProfileUpdateDialog";

interface AdminDropdownProps {
    user: FirebaseUser;
    role?: "admin" | "super_admin" | null;
    logout: () => Promise<void>;
}

export function AdminDropdown({ user, role, logout }: AdminDropdownProps) {
    const router = useRouter();
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [showProfileUpdate, setShowProfileUpdate] = useState(false);

    const handleLogout = async () => {
        await logout();
        router.refresh();
    };

    const initials = user.displayName
        ? user.displayName.split(" ").map((n) => n[0]).join("").toUpperCase().substring(0, 2)
        : "AD";

    const mobileAppUrl = process.env.NEXT_PUBLIC_MOBILE_APP_URL || "#";

    return (
        <>
            <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                    <button className="relative outline-none rounded-full transition-transform active:scale-95 focus:ring-2 focus:ring-neutral-200 dark:focus:ring-neutral-800 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-black">
                        <div className={cn(
                            "h-9 w-9 rounded-full flex items-center justify-center overflow-hidden",
                            "bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700",
                            "hover:border-neutral-300 dark:hover:border-neutral-600 transition-colors duration-200"
                        )}>
                            {user.photoURL ? (
                                <img
                                    src={user.photoURL}
                                    alt="Profile"
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400 select-none">
                                    {initials}
                                </span>
                            )}
                        </div>
                    </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent className="w-60 p-1.5" align="end" sideOffset={8}>
                    {/* Header */}
                    <div className="flex items-center gap-3 p-2 mb-1">
                        <div className="h-8 w-8 shrink-0 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-400 font-medium text-xs border border-neutral-200 dark:border-neutral-700 select-none">
                            {initials}
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm font-medium truncate text-neutral-900 dark:text-neutral-100">
                                {user.displayName || "Admin User"}
                            </span>
                            <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-neutral-500 truncate">
                                    {user.email}
                                </span>
                                <span className={cn(
                                    "text-[9px] px-1.5 py-px rounded-full font-medium uppercase tracking-wide border",
                                    role === "super_admin"
                                        ? "bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800"
                                        : "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800"
                                )}>
                                    {role === "super_admin" ? "S. Admin" : "Admin"}
                                </span>
                            </div>
                        </div>
                    </div>

                    <DropdownMenuSeparator className="my-1" />

                    <DropdownMenuGroup>
                        <DropdownMenuItem asChild>
                            <Link href="/admin" className="gap-2.5 py-2 cursor-pointer focus:bg-neutral-100 dark:focus:bg-neutral-800">
                                <LayoutDashboard size={15} className="text-neutral-500" />
                                <span className="text-sm">Dashboard</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href={mobileAppUrl} target="_blank" className="gap-2.5 py-2 cursor-pointer focus:bg-neutral-100 dark:focus:bg-neutral-800">
                                <Smartphone size={15} className="text-neutral-500" />
                                <span className="text-sm">Get Mobile App</span>
                            </Link>
                        </DropdownMenuItem>
                    </DropdownMenuGroup>

                    <DropdownMenuSeparator className="my-1" />

                    <div className="px-2 py-1.5 flex items-center gap-2 text-[10px] text-neutral-400 font-medium select-none">
                        <CalendarClock size={12} />
                        <span>Logged in: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    <DropdownMenuSeparator className="my-1" />

                    <DropdownMenuItem
                        onClick={() => setShowProfileUpdate(true)}
                        className="gap-2.5 py-2 cursor-pointer focus:bg-neutral-100 dark:focus:bg-neutral-800"
                    >
                        <UserCog size={15} className="text-neutral-500" />
                        <span className="text-sm">Edit Profile</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                        onClick={(e) => {
                            e.preventDefault();
                            setShowLogoutConfirm(true);
                        }}
                        className="gap-2.5 py-2 text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-900/20 cursor-pointer"
                    >
                        <LogOut size={15} />
                        <span className="text-sm font-medium">Log out</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <ProfileUpdateDialog
                open={showProfileUpdate}
                onOpenChange={setShowProfileUpdate}
            />

            <LogoutConfirmationDialog
                open={showLogoutConfirm}
                onOpenChange={setShowLogoutConfirm}
                onConfirm={handleLogout}
            />
        </>
    );
}
