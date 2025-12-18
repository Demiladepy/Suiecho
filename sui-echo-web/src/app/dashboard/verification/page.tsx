"use client";

import { useState } from "react";
import { ShieldCheck, FileText, CheckCircle, XCircle, ExternalLink, Search, Filter } from "lucide-react";

export default function VerificationPage() {
    const [filter, setFilter] = useState("all");

    const handouts = [
        { id: "1", file: "GST_111_Lecture_Notes_Oct.pdf", user: "0x8f...3a21", course: "GST 111", status: "pending", date: "2h ago" },
        { id: "2", file: "SOC_101_Chapter_4.png", user: "0x4a...91bc", course: "SOC 101", status: "pending", date: "5h ago" },
        { id: "3", file: "Math_Methods_Tutorial.pdf", user: "0x12...ef45", course: "MTH 102", status: "verified", date: "1d ago" },
        { id: "4", file: "History_of_Nigeria.docx", user: "0x7d...88aa", course: "HIS 201", status: "rejected", date: "2d ago" },
    ];

    const filteredHandouts = handouts.filter(h => filter === "all" || h.status === filter);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black mb-2 tracking-tight">Handout Verification</h1>
                    <p className="text-gray-400 font-medium text-lg">Validate community contributions and maintain data quality.</p>
                </div>
                <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 shrink-0">
                    {["all", "pending", "verified"].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${filter === f ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "text-gray-500 hover:text-white"}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Stats */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="glass-panel p-6 rounded-3xl bg-blue-600/10 border border-blue-500/20">
                        <h3 className="text-blue-400 text-xs font-black uppercase tracking-widest mb-4">Verification Score</h3>
                        <div className="flex items-end gap-2 mb-2">
                            <span className="text-4xl font-black">94.8%</span>
                            <span className="text-green-500 text-xs font-black mb-1">↗ 2.4%</span>
                        </div>
                        <p className="text-sm text-blue-200/50 font-medium">Your accuracy is in the top 5% of all course reps.</p>
                    </div>

                    <div className="glass-panel p-6 rounded-3xl bg-white/5 border border-white/10">
                        <h3 className="text-gray-500 text-xs font-black uppercase tracking-widest mb-6">Queue Status</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-bold text-gray-300">Awaiting Action</span>
                                <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] font-black rounded-lg">12</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-bold text-gray-300">In TEE Process</span>
                                <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 text-[10px] font-black rounded-lg">5</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-bold text-gray-300">Resolved Today</span>
                                <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-[10px] font-black rounded-lg">28</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Handout List */}
                <div className="lg:col-span-3">
                    <div className="glass-panel rounded-[2.5rem] bg-white/5 border border-white/10 overflow-hidden">
                        <div className="p-6 border-b border-white/5 flex flex-col md:flex-row gap-4 justify-between items-center">
                            <div className="relative w-full md:w-96">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                <input className="w-full bg-[#0F172A]/50 border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-sm focus:border-blue-500/50 outline-none transition-all" placeholder="Search by file name or uploader..." />
                            </div>
                            <button className="flex items-center gap-2 px-4 py-3 text-xs font-bold text-gray-400 hover:text-white transition-colors">
                                <Filter size={16} /> Advanced Filters
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left border-b border-white/5">
                                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Document</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Uploader</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Course</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Status</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredHandouts.map((h) => (
                                        <tr key={h.id} className="group hover:bg-white/[0.02] transition-colors">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                                                        <FileText size={20} />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-bold text-white mb-0.5">{h.file}</h4>
                                                        <p className="text-[10px] text-gray-500 font-medium">Uploaded {h.date}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="text-xs font-mono text-gray-400 bg-white/5 px-2 py-1 rounded-lg border border-white/5">{h.user}</span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="text-xs font-black text-gray-300">{h.course}</span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-2">
                                                    {h.status === "pending" && <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />}
                                                    <span className={`text-[10px] font-black uppercase tracking-widest ${h.status === "verified" ? "text-green-400" :
                                                            h.status === "rejected" ? "text-red-400" :
                                                                "text-blue-400"
                                                        }`}>{h.status}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <button className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-blue-600 hover:border-blue-500 hover:text-white transition-all text-gray-400">
                                                    <ExternalLink size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
