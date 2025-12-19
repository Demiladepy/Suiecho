"use client";

import { Activity, BookOpen, Clock, Radio, ShieldCheck, TrendingUp, Users, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { getZkLoginAddress, isZkLoginSessionValid } from "@/utils/zklogin-proof";
import { getSuiClient } from "@/utils/zklogin-proof";
import { PACKAGE_ID } from "@/config";
import { useRouter } from "next/navigation";

interface DashboardStats {
    totalBroadcasts: number;
    handoutsVerified: number;
    pendingHandouts: number;
    tokensEarned: string;
}

interface RecentActivity {
    file: string;
    user: string;
    time: string;
    status: "success" | "pending";
}

export default function OverviewPage() {
    const router = useRouter();
    const [userName, setUserName] = useState<string | null>(null);
    const [zkAddress, setZkAddress] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<DashboardStats>({
        totalBroadcasts: 0,
        handoutsVerified: 0,
        pendingHandouts: 0,
        tokensEarned: "0",
    });
    const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

    useEffect(() => {
        // Check authentication
        if (!isZkLoginSessionValid()) {
            router.push("/");
            return;
        }

        // Get user info
        const address = getZkLoginAddress();
        setZkAddress(address);

        const token = window.sessionStorage.getItem("sui_zklogin_jwt");
        if (token) {
            try {
                const decoded: any = jwtDecode(token);
                setUserName(decoded.given_name || decoded.name || decoded.email?.split('@')[0]);
            } catch (e) {
                console.error("Failed to decode token", e);
            }
        }

        // Fetch on-chain data
        fetchDashboardData(address);
    }, [router]);

    async function fetchDashboardData(address: string | null) {
        if (!address) {
            setLoading(false);
            return;
        }

        try {
            const client = getSuiClient();

            // Fetch user's owned objects (broadcasts and handouts)
            const ownedObjects = await client.getOwnedObjects({
                owner: address,
                options: { showType: true, showContent: true },
            });

            let broadcasts = 0;
            let verifiedHandouts = 0;
            let pendingHandouts = 0;
            const activities: RecentActivity[] = [];

            for (const obj of ownedObjects.data) {
                const type = obj.data?.type;
                if (!type) continue;

                if (type.includes("CourseRepBroadcast")) {
                    broadcasts++;
                } else if (type.includes("Handout")) {
                    const content = obj.data?.content;
                    if (content?.dataType === "moveObject") {
                        const fields = content.fields as any;
                        if (fields?.verified) {
                            verifiedHandouts++;
                            activities.push({
                                file: fields.description || "Handout",
                                user: address.slice(0, 6) + "..." + address.slice(-4),
                                time: "Recently",
                                status: "success",
                            });
                        } else {
                            pendingHandouts++;
                            activities.push({
                                file: fields.description || "Handout",
                                user: address.slice(0, 6) + "..." + address.slice(-4),
                                time: "Recently",
                                status: "pending",
                            });
                        }
                    }
                }
            }

            setStats({
                totalBroadcasts: broadcasts,
                handoutsVerified: verifiedHandouts,
                pendingHandouts,
                tokensEarned: `${(verifiedHandouts * 0.1).toFixed(1)} SUI`,
            });

            setRecentActivity(activities.slice(0, 5));

        } catch (error) {
            console.error("[Dashboard] Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2">
                        Welcome back, <span className="text-blue-500">{userName || "Course Rep"}</span>.
                    </h1>
                    <p className="text-gray-400 font-medium text-lg">Here's what's happening in your Sui-Echo network.</p>
                    {zkAddress && (
                        <p className="text-xs text-gray-600 font-mono mt-2">
                            Address: {zkAddress.slice(0, 10)}...{zkAddress.slice(-8)}
                        </p>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-xs font-bold uppercase tracking-widest text-gray-300">Connected</span>
                    </div>
                </div>
            </header>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: "Total Broadcasts", value: stats.totalBroadcasts.toString(), icon: Radio, color: "text-blue-400", trend: "Your broadcasts" },
                    { label: "Handouts Verified", value: stats.handoutsVerified.toString(), icon: ShieldCheck, color: "text-green-400", trend: `${stats.pendingHandouts} pending` },
                    { label: "Pending Review", value: stats.pendingHandouts.toString(), icon: Clock, color: "text-yellow-400", trend: "Awaiting TEE" },
                    { label: "Tokens Earned", value: stats.tokensEarned, icon: TrendingUp, color: "text-emerald-400", trend: "From verified handouts" },
                ].map((stat, i) => (
                    <div key={i} className="glass-panel p-6 rounded-3xl bg-white/5 border border-white/10 hover:border-white/20 transition-all group">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-2xl bg-white/5 border border-white/5 ${stat.color}`}>
                                <stat.icon size={24} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 px-2 py-1 bg-white/5 rounded-lg">{stat.trend}</span>
                        </div>
                        <p className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-1">{stat.label}</p>
                        <h2 className="text-3xl font-black tracking-tight">{stat.value}</h2>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Activity Area */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold">Quick Actions</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Link href="/scan" className="glass-panel p-6 rounded-3xl bg-green-600/10 border border-green-500/20 hover:bg-green-600/20 transition-all group flex flex-col justify-between h-48">
                            <div className="w-12 h-12 rounded-2xl bg-green-600 flex items-center justify-center text-white shadow-lg shadow-green-500/20 group-hover:scale-110 transition-transform">
                                <BookOpen size={24} />
                            </div>
                            <div>
                                <h4 className="font-bold text-lg mb-1">Scan Handouts</h4>
                                <p className="text-sm text-green-200/60 font-medium">Upload and OCR scan course materials.</p>
                            </div>
                        </Link>

                        <Link href="/dashboard/broadcasts" className="glass-panel p-6 rounded-3xl bg-blue-600/10 border border-blue-500/20 hover:bg-blue-600/20 transition-all group flex flex-col justify-between h-48">
                            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                                <Radio size={24} />
                            </div>
                            <div>
                                <h4 className="font-bold text-lg mb-1">Create Broadcast</h4>
                                <p className="text-sm text-blue-200/60 font-medium">Record announcements for your students.</p>
                            </div>
                        </Link>
                    </div>

                    <Link href="/dashboard/verification" className="glass-panel p-6 rounded-3xl bg-emerald-600/10 border border-emerald-500/20 hover:bg-emerald-600/20 transition-all group flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform">
                                <ShieldCheck size={24} />
                            </div>
                            <div>
                                <h4 className="font-bold text-lg mb-1">Verify Handouts</h4>
                                <p className="text-sm text-emerald-200/60 font-medium">Approve OCR scanned notes to release rewards.</p>
                            </div>
                        </div>
                        {stats.pendingHandouts > 0 && (
                            <div className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-bold rounded-lg">
                                {stats.pendingHandouts} pending
                            </div>
                        )}
                    </Link>
                </div>

                {/* Sidebar Feed */}
                <div className="space-y-6">
                    <div className="glass-panel p-6 rounded-3xl bg-white/5 border border-white/10">
                        <div className="flex items-center gap-2 mb-6">
                            <Clock size={16} className="text-blue-400" />
                            <h3 className="font-bold">Recent Activity</h3>
                        </div>
                        {recentActivity.length > 0 ? (
                            <div className="space-y-6">
                                {recentActivity.map((item, i) => (
                                    <div key={i} className="flex items-start gap-4">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${item.status === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                                            <BookOpen size={16} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-bold truncate">{item.file}</h4>
                                            <p className="text-[10px] text-gray-500 font-medium">
                                                {item.status === 'success' ? 'Verified' : 'Pending'} • {item.time}
                                            </p>
                                        </div>
                                        {item.status === 'success' && <ShieldCheck size={14} className="text-green-500 shrink-0" />}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-sm text-center py-8">
                                No recent activity. Start by scanning a handout!
                            </p>
                        )}
                    </div>

                    <div className="glass-panel p-6 rounded-3xl bg-gradient-to-br from-blue-600/20 to-cyan-500/20 border border-blue-500/20 relative overflow-hidden group">
                        <div className="relative z-10">
                            <h3 className="font-black text-xl mb-2">Get Started</h3>
                            <p className="text-sm text-blue-100/60 font-medium mb-4">
                                Scan your first handout to earn SUI rewards!
                            </p>
                            <Link href="/scan" className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-bold transition-colors">
                                Start Scanning
                            </Link>
                        </div>
                        <TrendingUp size={80} className="absolute -bottom-4 -right-4 opacity-10 group-hover:scale-110 transition-transform duration-500" />
                    </div>
                </div>
            </div>
        </div>
    );
}
