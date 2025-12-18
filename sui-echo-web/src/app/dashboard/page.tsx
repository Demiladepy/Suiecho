"use client";

import { Activity, BookOpen, Clock, Radio, ShieldCheck, TrendingUp, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";

export default function OverviewPage() {
    const [userName, setUserName] = useState<string | null>(null);

    useEffect(() => {
        const token = window.sessionStorage.getItem("sui_zklogin_id_token");
        if (token) {
            try {
                const decoded: any = jwtDecode(token);
                setUserName(decoded.given_name || decoded.name || decoded.email.split('@')[0]);
            } catch (e) {
                console.error("Failed to decode token", e);
            }
        }
    }, []);

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2">
                        Welcome back, <span className="text-blue-500">{userName || "Course Rep"}</span>.
                    </h1>
                    <p className="text-gray-400 font-medium text-lg">Here's what's happening in your Sui-Echo network today.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                        <span className="text-xs font-bold uppercase tracking-widest text-gray-300">Live Status</span>
                    </div>
                </div>
            </header>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: "Total Broadcasts", value: "24", icon: Radio, color: "text-blue-400", trend: "+2 this week" },
                    { label: "Handouts Verified", value: "158", icon: ShieldCheck, color: "text-green-400", trend: "18 pending" },
                    { label: "Total Listeners", value: "1.2k", icon: Users, color: "text-indigo-400", trend: "+12% growth" },
                    { label: "Tokens Earned", value: "450 SUI", icon: TrendingUp, color: "text-yellow-400", trend: "≈ $1,240.00" },
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
                        <h3 className="text-xl font-bold">Recommended Actions</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Link href="/dashboard/broadcasts" className="glass-panel p-6 rounded-3xl bg-blue-600/10 border border-blue-500/20 hover:bg-blue-600/20 transition-all group flex flex-col justify-between h-48">
                            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                                <Radio size={24} />
                            </div>
                            <div>
                                <h4 className="font-bold text-lg mb-1">Create Broadcast</h4>
                                <p className="text-sm text-blue-200/60 font-medium">Record or upload course notes for your students.</p>
                            </div>
                        </Link>

                        <Link href="/dashboard/verification" className="glass-panel p-6 rounded-3xl bg-emerald-600/10 border border-emerald-500/20 hover:bg-emerald-600/20 transition-all group flex flex-col justify-between h-48">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform">
                                <ShieldCheck size={24} />
                            </div>
                            <div>
                                <h4 className="font-bold text-lg mb-1">Verify Handouts</h4>
                                <p className="text-sm text-emerald-200/60 font-medium">Approve OCR scanned notes to release rewards.</p>
                            </div>
                        </Link>
                    </div>

                    <div className="glass-panel p-8 rounded-[2.5rem] bg-white/5 border border-white/10">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-bold">Network Engagement</h3>
                            <div className="flex gap-2">
                                <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-gray-400">7 DAYS</span>
                                <span className="px-3 py-1 rounded-full bg-blue-500 text-[10px] font-bold text-white">30 DAYS</span>
                            </div>
                        </div>
                        <div className="h-48 flex items-end justify-between gap-2">
                            {[40, 60, 45, 90, 65, 80, 50, 70, 40, 95, 85, 100].map((h, i) => (
                                <div key={i} className="flex-1 bg-blue-500/20 rounded-t-lg relative group transition-all hover:bg-blue-500" style={{ height: `${h}%` }}>
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-[#0A0F1D] text-[10px] font-black px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                        {Math.round(h * 12)} downloads
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between mt-4">
                            <span className="text-[10px] font-bold text-gray-600 uppercase">Start of month</span>
                            <span className="text-[10px] font-bold text-gray-600 uppercase">Today</span>
                        </div>
                    </div>
                </div>

                {/* Sidebar Feed */}
                <div className="space-y-6">
                    <div className="glass-panel p-6 rounded-3xl bg-white/5 border border-white/10">
                        <div className="flex items-center gap-2 mb-6">
                            <Clock size={16} className="text-blue-400" />
                            <h3 className="font-bold">Recent Verification</h3>
                        </div>
                        <div className="space-y-6">
                            {[
                                { file: "Intro_to_Sociology.pdf", user: "Tayo O.", time: "12m ago", status: "success" },
                                { file: "Math_101_Homework.png", user: "Emma W.", time: "45m ago", status: "pending" },
                                { file: "GST_111_Notes.txt", user: "John D.", time: "2h ago", status: "success" },
                            ].map((item, i) => (
                                <div key={i} className="flex items-start gap-4">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${item.status === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                                        <BookOpen size={16} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-bold truncate">{item.file}</h4>
                                        <p className="text-[10px] text-gray-500 font-medium">Uploaded by <span className="text-gray-300">{item.user}</span> • {item.time}</p>
                                    </div>
                                    {item.status === 'success' && <ShieldCheck size={14} className="text-green-500 shrink-0" />}
                                </div>
                            ))}
                        </div>
                        <button className="w-full mt-8 py-3 bg-white/5 border border-white/5 hover:bg-white/10 rounded-xl text-xs font-bold transition-all">
                            View All Submissions
                        </button>
                    </div>

                    <div className="glass-panel p-6 rounded-3xl bg-gradient-to-br from-blue-600/20 to-cyan-500/20 border border-blue-500/20 relative overflow-hidden group">
                        <div className="relative z-10">
                            <h3 className="font-black text-xl mb-2">Build your reputation.</h3>
                            <p className="text-sm text-blue-100/60 font-medium mb-4">Higher verification accuracy increases your SUI reward multiplier.</p>
                            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 w-[78%]"></div>
                            </div>
                            <p className="text-[10px] font-bold mt-2 uppercase tracking-widest text-blue-400">Accuracy Rank: Gold (78%)</p>
                        </div>
                        <TrendingUp size={80} className="absolute -bottom-4 -right-4 opacity-10 group-hover:scale-110 transition-transform duration-500" />
                    </div>
                </div>
            </div>
        </div>
    );
}
