"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Activity, Radio, ShieldCheck, LogOut, User, Copy, Check, AlertCircle, FileText, BookOpen } from "lucide-react";
import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { clearZkLoginSession, getZkLoginAddress, isZkLoginSessionValid, getSuiClient } from "@/utils/zklogin-proof";
import { PACKAGE_ID } from "@/lib/contract";

type UserRole = 'student' | 'rep' | null;

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [zkAddress, setZkAddress] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [isVerifiedRep, setIsVerifiedRep] = useState(false);
    const [userRole, setUserRole] = useState<UserRole>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function initSidebar() {
            const address = getZkLoginAddress();
            setZkAddress(address);

            const role = window.sessionStorage.getItem("sui_echo_user_role") as UserRole;
            setUserRole(role);

            const token = window.sessionStorage.getItem("sui_zklogin_jwt");
            if (token) {
                try {
                    const decoded: any = jwtDecode(token);
                    setUserEmail(decoded.email);
                } catch (e) {
                    console.error("Failed to decode token", e);
                }
            }

            if (address && PACKAGE_ID) {
                try {
                    const client = getSuiClient();
                    const objects = await client.getOwnedObjects({
                        owner: address,
                        filter: { StructType: `${PACKAGE_ID}::echo::CourseRepCap` },
                        options: { showType: true },
                    });

                    if (objects.data.length > 0) {
                        setIsVerifiedRep(true);
                    }
                } catch (error) {
                    console.error("[Sidebar] Error checking CourseRepCap:", error);
                }
            }

            setLoading(false);

            if (!isZkLoginSessionValid()) {
                router.push("/");
            }
        }

        initSidebar();
    }, [router]);

    const handleLogout = () => {
        clearZkLoginSession();
        window.sessionStorage.removeItem("sui_echo_user_role");
        router.push("/");
    };

    const handleCopyAddress = () => {
        if (zkAddress) {
            navigator.clipboard.writeText(zkAddress);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const repNavItems = [
        { name: "Dashboard", href: "/dashboard", icon: Activity },
        { name: "Broadcasts", href: "/dashboard/broadcasts", icon: Radio },
        { name: "Handouts", href: "/dashboard/handouts", icon: ShieldCheck },
        { name: "Admin Panel", href: "/dashboard/admin", icon: ShieldCheck },
    ];

    const studentNavItems = [
        { name: "Dashboard", href: "/dashboard", icon: Activity },
        { name: "Scan Notes", href: "/scan", icon: BookOpen },
        { name: "My Handouts", href: "/dashboard/handouts", icon: FileText },
    ];

    const navItems = userRole === 'rep' ? repNavItems : studentNavItems;

    return (
        <aside className="fixed left-0 top-0 h-screen w-64 hidden lg:flex flex-col bg-[#0B0E14] border-r border-[#1E232E] p-5 z-50">
            {/* Logo */}
            <div className="flex items-center gap-3 px-1 mb-8">
                <div className="w-9 h-9 rounded-lg bg-[#4F9EF8] flex items-center justify-center">
                    <Activity className="text-white w-5 h-5" />
                </div>
                <div>
                    <h3 className="font-semibold text-white text-sm">Sui-Echo</h3>
                    {userRole === 'rep' ? (
                        isVerifiedRep ? (
                            <div className="flex items-center gap-1 text-[10px] text-[#22C55E] font-medium">
                                <ShieldCheck size={10} /> Verified Rep
                            </div>
                        ) : (
                            <div className="flex items-center gap-1 text-[10px] text-[#EAB308] font-medium">
                                <AlertCircle size={10} /> Pending
                            </div>
                        )
                    ) : (
                        <div className="text-[10px] text-[#8A919E] font-medium">
                            Student / Reader
                        </div>
                    )}
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${isActive
                                    ? "bg-[#4F9EF8] text-white"
                                    : "text-[#8A919E] hover:text-white hover:bg-[#12151C]"
                                }`}
                        >
                            <item.icon size={18} />
                            <span>{item.name}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Apply Banner for unverified reps */}
            {userRole === 'rep' && !isVerifiedRep && (
                <div className="mb-4 p-3 bg-[#4F9EF8]/10 border border-[#4F9EF8]/20 rounded-lg">
                    <p className="text-xs text-[#4F9EF8] font-semibold mb-2">Become a Verified Rep</p>
                    <p className="text-[10px] text-[#8A919E] mb-3">Apply to unlock broadcasting features.</p>
                    <Link
                        href="/dashboard/apply"
                        className="block w-full py-2 bg-[#4F9EF8] text-white text-xs font-semibold rounded-md text-center hover:opacity-90 transition-opacity"
                    >
                        Apply Now
                    </Link>
                </div>
            )}

            {/* User section */}
            <div className="pt-4 border-t border-[#1E232E]">
                <div className="flex items-center gap-3 px-1 mb-3">
                    <div className="w-9 h-9 rounded-full bg-[#12151C] flex items-center justify-center text-[#4F9EF8] border border-[#1E232E]">
                        <User size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white truncate">{userEmail || "Anonymous"}</p>
                        <p className="text-[10px] text-[#565B67]">zkLogin</p>
                    </div>
                </div>

                {/* Address copy */}
                {zkAddress && (
                    <button
                        onClick={handleCopyAddress}
                        className="w-full mb-3 px-3 py-2 bg-[#12151C] border border-[#1E232E] rounded-lg flex items-center justify-between hover:border-[#2A3140] transition-colors"
                    >
                        <span className="text-[10px] text-[#8A919E] font-mono truncate">
                            {zkAddress.slice(0, 8)}...{zkAddress.slice(-6)}
                        </span>
                        {copied ? (
                            <Check size={12} className="text-[#22C55E]" />
                        ) : (
                            <Copy size={12} className="text-[#565B67]" />
                        )}
                    </button>
                )}

                <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-[#EF4444] hover:bg-[#EF4444]/10 rounded-lg transition-colors font-medium text-xs"
                >
                    <LogOut size={14} /> Logout
                </button>
            </div>
        </aside>
    );
}
