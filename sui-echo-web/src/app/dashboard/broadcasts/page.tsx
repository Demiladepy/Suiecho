"use client";

import { useState } from "react";
import VoiceRecorder from "@/components/VoiceRecorder";
import { uploadToWalrus } from "@/lib/walrus";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { Radio, ShieldCheck, Users, Icon, Link as IconLink, Upload } from "lucide-react";

export default function BroadcastsPage() {
    const account = useCurrentAccount();
    const [courseCode, setCourseCode] = useState("");
    const [message, setMessage] = useState("");
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [uploading, setUploading] = useState(false);

    const handlePublish = async () => {
        if (!audioBlob || !courseCode || !message) return;
        setUploading(true);

        try {
            const blobId = await uploadToWalrus(audioBlob);
            console.log("Audio uploaded:", blobId);
            alert(`Broadcast Created! \n\nCourse: ${courseCode}\nMessage: ${message}\nWalrus ID: ${blobId}`);
        } catch (e) {
            console.error(e);
            alert("Failed to publish broadcast.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-bold mb-2">Broadcast Center</h1>
                    <p className="text-gray-400">Create announcements and track engagement.</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-green-900/30 text-green-400 text-xs font-bold border border-green-500/30 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> NETWORK: TESTNET
                </span>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Stats Row */}
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                        <div className="glass-panel p-6 rounded-3xl relative overflow-hidden group bg-white/5 border border-white/10">
                            <div className="absolute top-0 right-0 p-6 opacity-30 group-hover:opacity-100 transition-opacity text-blue-400"><Radio /></div>
                            <p className="text-gray-400 text-sm font-medium mb-1">Total Broadcasts</p>
                            <h2 className="text-4xl font-bold">24</h2>
                            <p className="text-green-400 text-xs mt-2 font-bold">↗ +2 this week</p>
                        </div>
                        <div className="glass-panel p-6 rounded-3xl relative overflow-hidden group bg-white/5 border border-white/10">
                            <div className="absolute top-0 right-0 p-6 opacity-30 group-hover:opacity-100 transition-opacity text-indigo-400"><Users /></div>
                            <p className="text-gray-400 text-sm font-medium mb-1">Active Listeners</p>
                            <h2 className="text-4xl font-bold">1,204</h2>
                            <p className="text-green-400 text-xs mt-2 font-bold">↗ +12% engagement</p>
                        </div>
                        <div className="glass-panel p-6 rounded-3xl relative overflow-hidden group bg-white/5 border border-white/10 hidden lg:block">
                            <div className="absolute top-0 right-0 p-6 opacity-30 group-hover:opacity-100 transition-opacity text-yellow-400"><ShieldCheck /></div>
                            <p className="text-gray-400 text-sm font-medium mb-1">Tokens Earned</p>
                            <h2 className="text-4xl font-bold">450 <span className="text-xl text-gray-500 font-medium">SUI</span></h2>
                            <p className="text-green-400 text-xs mt-2 font-bold">Available to claim</p>
                        </div>
                    </div>

                    {/* Create Post Section */}
                    <div className="glass-panel p-6 lg:p-8 rounded-[2.5rem] border border-white/10 bg-white/5">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20"><IconLink size={20} /></div>
                            <h2 className="text-xl font-bold">New Announcement</h2>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Subject Line</label>
                                <input className="w-full bg-[#0F172A]/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500/50 transition-colors" placeholder="e.g. SOC 101 Midterm" value={courseCode} onChange={e => setCourseCode(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Recipient Group</label>
                                <div className="relative">
                                    <select className="w-full bg-[#0F172A]/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500/50 transition-colors appearance-none">
                                        <option>All Students (SOC 101)</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Message Body</label>
                            <textarea className="w-full bg-[#0F172A]/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500/50 transition-colors h-32 resize-none" placeholder="Type your details here..." value={message} onChange={e => setMessage(e.target.value)} />
                        </div>

                        <div className="p-6 border-2 border-dashed border-white/5 hover:border-blue-500/30 rounded-2xl transition-colors bg-white/[0.02] text-center">
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-gray-400 border border-white/10">
                                    <Upload size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm">Upload Audio-PQ or PDF</h4>
                                    <p className="text-xs text-gray-500">Supports MP3, WAV, PDF (Max 10MB)</p>
                                </div>

                                <div className="mt-2 w-full max-w-sm mx-auto">
                                    <VoiceRecorder onRecordingComplete={setAudioBlob} />
                                    {audioBlob && <p className="text-xs text-green-400 mt-2 font-bold animate-pulse">✓ Audio Captured Successfully</p>}
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handlePublish}
                            disabled={!audioBlob || !courseCode || uploading}
                            className="w-full mt-6 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99]"
                        >
                            {uploading ? "Verifying & Publishing..." : "Broadcast Verified Update"}
                        </button>
                    </div>
                </div>

                {/* Right Activity Feed */}
                <div className="space-y-6">
                    <div className="glass-panel p-6 rounded-3xl bg-white/5 border border-white/10">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold">Recent Activity</h3>
                            <button className="text-xs text-blue-400 font-bold hover:text-blue-300 transition-colors">View All</button>
                        </div>

                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all cursor-pointer group hover:border-white/10">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-[10px] font-bold rounded uppercase tracking-wider">Audio-PQ</span>
                                        <span className="text-[10px] text-gray-500 font-medium">2h ago</span>
                                    </div>
                                    <h4 className="font-bold text-sm mb-1 group-hover:text-blue-400 transition-colors">GST 111 Lecture Notes</h4>
                                    <p className="text-xs text-gray-400 line-clamp-1">Correction on Chapter 4 regarding...</p>
                                    <div className="mt-3 flex items-center justify-between text-[10px] text-gray-500 border-t border-white/5 pt-3">
                                        <span className="font-mono opacity-60">0x8f...3a21</span>
                                        <span className="flex items-center gap-1 text-green-400 font-bold"><div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div> On-Chain</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
