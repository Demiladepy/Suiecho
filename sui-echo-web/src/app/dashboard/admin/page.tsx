"use client";

import { useState, useEffect } from "react";
import { Loader2, ShieldCheck, Users, FileText, Check, X, RefreshCw, ExternalLink } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { getSuiClient, getZkLoginAddress, isZkLoginSessionValid } from "@/utils/zklogin-proof";
import { TYPES, ADMIN_CAP_ID, COURSE_REP_REGISTRY_ID, TARGETS, PACKAGE_ID, isContractConfigured } from "@/lib/contract";
import { useRouter } from "next/navigation";
import { SUI_NETWORK } from "@/config";

interface Application {
    id: string;
    applicant: string;
    courseCode: string;
    name: string;
    studentId: string;
    department: string;
    createdAt: string;
}

interface Handout {
    id: string;
    owner: string;
    blobId: string;
    metadata: string;
    verified: boolean;
    createdAt: string;
}

export default function AdminPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [applications, setApplications] = useState<Application[]>([]);
    const [pendingHandouts, setPendingHandouts] = useState<Handout[]>([]);
    const [activeTab, setActiveTab] = useState<'applications' | 'handouts'>('applications');
    const [processing, setProcessing] = useState<string | null>(null);
    const [adminAddress, setAdminAddress] = useState<string | null>(null);

    useEffect(() => {
        checkAdminStatus();
    }, []);

    async function checkAdminStatus() {
        if (!isZkLoginSessionValid()) {
            router.push("/");
            return;
        }

        const address = getZkLoginAddress();
        setAdminAddress(address);

        if (!address || !isContractConfigured()) {
            setLoading(false);
            return;
        }

        try {
            const client = getSuiClient();

            // Check if user owns AdminCap
            const ownedObjects = await client.getOwnedObjects({
                owner: address,
                options: { showType: true },
            });

            const hasAdminCap = ownedObjects.data.some(obj =>
                obj.data?.type?.includes("AdminCap")
            );

            setIsAdmin(hasAdminCap);

            if (hasAdminCap) {
                await fetchPendingData();
            }
        } catch (error) {
            console.error("[Admin] Error checking status:", error);
        } finally {
            setLoading(false);
        }
    }

    async function fetchPendingData() {
        try {
            const client = getSuiClient();

            // Fetch CourseRepApplications (they're transferred to applicant, query all and filter)
            // In a real setup, you'd query events or use a custom indexer
            // For now, we'll show a placeholder

            // Fetch unverified Handouts
            // This would require an indexer or event query in production

            console.log("[Admin] Fetching pending data...");

            // Simulated data for demo - in production use event queries
            setApplications([]);
            setPendingHandouts([]);

        } catch (error) {
            console.error("[Admin] Error fetching data:", error);
        }
    }

    async function handleApproveApplication(appId: string) {
        setProcessing(appId);
        try {
            // Build CLI command for the admin
            const command = `sui client call \\
  --package ${PACKAGE_ID} \\
  --module echo \\
  --function approve_course_rep \\
  --args ${ADMIN_CAP_ID} ${COURSE_REP_REGISTRY_ID} ${appId} \\
  --gas-budget 10000000`;

            navigator.clipboard.writeText(command);
            alert(`Command copied to clipboard! Run it in your terminal:\n\n${command}`);
        } catch (error) {
            console.error("[Admin] Error:", error);
            alert("Failed to approve. See console for details.");
        } finally {
            setProcessing(null);
        }
    }

    async function handleRejectApplication(appId: string) {
        setProcessing(appId);
        try {
            const command = `sui client call \\
  --package ${PACKAGE_ID} \\
  --module echo \\
  --function reject_course_rep \\
  --args ${ADMIN_CAP_ID} ${COURSE_REP_REGISTRY_ID} ${appId} \\
  --gas-budget 10000000`;

            navigator.clipboard.writeText(command);
            alert(`Command copied to clipboard! Run it in your terminal:\n\n${command}`);
        } catch (error) {
            console.error("[Admin] Error:", error);
        } finally {
            setProcessing(null);
        }
    }

    async function handleVerifyHandout(handoutId: string) {
        setProcessing(handoutId);
        try {
            const command = `sui client call \\
  --package ${PACKAGE_ID} \\
  --module echo \\
  --function verify_handout_admin \\
  --args ${ADMIN_CAP_ID} ${handoutId} \\
  --gas-budget 10000000`;

            navigator.clipboard.writeText(command);
            alert(`Command copied to clipboard! Run it in your terminal:\n\n${command}`);
        } catch (error) {
            console.error("[Admin] Error:", error);
        } finally {
            setProcessing(null);
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0A0F1D] text-white flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0A0F1D] text-white flex">
            <Sidebar />
            <main className="flex-1 lg:ml-64 p-8">
                <div className="max-w-5xl mx-auto">
                    <header className="mb-8">
                        <h1 className="text-3xl font-bold mb-2">Admin Panel</h1>
                        <p className="text-gray-400">Manage course rep applications and verify handouts</p>
                    </header>

                    {/* Admin Status */}
                    <div className={`p-4 rounded-xl border mb-8 ${isAdmin ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                        <div className="flex items-center gap-3">
                            <ShieldCheck className={isAdmin ? 'text-green-400' : 'text-red-400'} />
                            <div>
                                <p className={`font-bold ${isAdmin ? 'text-green-400' : 'text-red-400'}`}>
                                    {isAdmin ? 'Admin Access Granted' : 'Not an Admin'}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {isAdmin
                                        ? `You hold the AdminCap. Connected: ${adminAddress?.slice(0, 12)}...`
                                        : 'You need to hold the AdminCap to access admin functions. The AdminCap was given to the contract deployer.'
                                    }
                                </p>
                            </div>
                        </div>
                    </div>

                    {!isAdmin && (
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
                            <Users size={48} className="mx-auto text-gray-600 mb-4" />
                            <h2 className="text-xl font-bold mb-2">Admin Access Required</h2>
                            <p className="text-gray-400 mb-4">
                                Only the contract deployer can access this page. The AdminCap object ID is:
                            </p>
                            <code className="text-xs bg-black/40 px-3 py-2 rounded-lg text-blue-400 block overflow-x-auto">
                                {ADMIN_CAP_ID}
                            </code>
                            <p className="text-xs text-gray-500 mt-4">
                                Transfer this AdminCap to your zkLogin address to gain admin access.
                            </p>
                        </div>
                    )}

                    {isAdmin && (
                        <>
                            {/* Tabs */}
                            <div className="flex gap-2 mb-6">
                                <button
                                    onClick={() => setActiveTab('applications')}
                                    className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${activeTab === 'applications'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                        }`}
                                >
                                    <Users size={16} className="inline mr-2" />
                                    Course Rep Applications
                                </button>
                                <button
                                    onClick={() => setActiveTab('handouts')}
                                    className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${activeTab === 'handouts'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                        }`}
                                >
                                    <FileText size={16} className="inline mr-2" />
                                    Pending Handouts
                                </button>
                                <button
                                    onClick={fetchPendingData}
                                    className="ml-auto px-3 py-2 bg-white/5 text-gray-400 rounded-lg hover:bg-white/10 transition-colors"
                                >
                                    <RefreshCw size={16} />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                                {activeTab === 'applications' && (
                                    <div className="p-6">
                                        <h3 className="font-bold mb-4">Course Rep Applications</h3>
                                        {applications.length === 0 ? (
                                            <div className="text-center py-12 text-gray-500">
                                                <Users size={40} className="mx-auto mb-3 opacity-50" />
                                                <p>No pending applications</p>
                                                <p className="text-xs mt-2">
                                                    To find applications, query CourseRepApplication objects or check transaction events.
                                                </p>
                                                <div className="mt-4 p-4 bg-black/40 rounded-lg text-left">
                                                    <p className="text-xs text-gray-400 mb-2">Run this command to find applications:</p>
                                                    <code className="text-xs text-green-400">
                                                        sui client objects | grep CourseRepApplication
                                                    </code>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {applications.map(app => (
                                                    <div key={app.id} className="p-4 bg-black/20 rounded-xl flex justify-between items-center">
                                                        <div>
                                                            <p className="font-bold">{app.name}</p>
                                                            <p className="text-sm text-gray-400">{app.courseCode} • {app.department}</p>
                                                            <p className="text-xs text-gray-500 font-mono mt-1">{app.id}</p>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => handleApproveApplication(app.id)}
                                                                disabled={processing === app.id}
                                                                className="px-3 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-sm font-bold flex items-center gap-1"
                                                            >
                                                                <Check size={14} /> Approve
                                                            </button>
                                                            <button
                                                                onClick={() => handleRejectApplication(app.id)}
                                                                disabled={processing === app.id}
                                                                className="px-3 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-sm font-bold flex items-center gap-1"
                                                            >
                                                                <X size={14} /> Reject
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'handouts' && (
                                    <div className="p-6">
                                        <h3 className="font-bold mb-4">Pending Handout Verifications</h3>
                                        {pendingHandouts.length === 0 ? (
                                            <div className="text-center py-12 text-gray-500">
                                                <FileText size={40} className="mx-auto mb-3 opacity-50" />
                                                <p>No pending handouts to verify</p>
                                                <p className="text-xs mt-2">
                                                    Handouts are automatically verified by the TEE worker, or you can verify manually.
                                                </p>
                                                <div className="mt-4 p-4 bg-black/40 rounded-lg text-left">
                                                    <p className="text-xs text-gray-400 mb-2">Run this command to find handouts:</p>
                                                    <code className="text-xs text-green-400">
                                                        sui client objects | grep Handout
                                                    </code>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {pendingHandouts.map(handout => (
                                                    <div key={handout.id} className="p-4 bg-black/20 rounded-xl flex justify-between items-center">
                                                        <div>
                                                            <p className="font-bold">{handout.metadata}</p>
                                                            <p className="text-sm text-gray-400">Blob: {handout.blobId.slice(0, 16)}...</p>
                                                            <p className="text-xs text-gray-500 font-mono mt-1">{handout.id}</p>
                                                        </div>
                                                        <button
                                                            onClick={() => handleVerifyHandout(handout.id)}
                                                            disabled={processing === handout.id}
                                                            className="px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-bold flex items-center gap-1"
                                                        >
                                                            <ShieldCheck size={14} /> Verify
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* CLI Commands Help */}
                            <div className="mt-8 p-6 bg-white/5 border border-white/10 rounded-2xl">
                                <h3 className="font-bold mb-4">Quick CLI Commands</h3>
                                <div className="space-y-4 text-sm">
                                    <div>
                                        <p className="text-gray-400 mb-1">Approve a course rep application:</p>
                                        <code className="text-xs bg-black/40 px-3 py-2 rounded-lg text-green-400 block overflow-x-auto">
                                            sui client call --package {PACKAGE_ID?.slice(0, 10)}... --module echo --function approve_course_rep --args ADMIN_CAP REGISTRY APP_ID --gas-budget 10000000
                                        </code>
                                    </div>
                                    <div>
                                        <p className="text-gray-400 mb-1">Verify a handout manually:</p>
                                        <code className="text-xs bg-black/40 px-3 py-2 rounded-lg text-green-400 block overflow-x-auto">
                                            sui client call --package {PACKAGE_ID?.slice(0, 10)}... --module echo --function verify_handout_admin --args ADMIN_CAP HANDOUT_ID --gas-budget 10000000
                                        </code>
                                    </div>
                                    <div>
                                        <p className="text-gray-400 mb-1">Create a TEE Verifier Cap (for Nautilus worker):</p>
                                        <code className="text-xs bg-black/40 px-3 py-2 rounded-lg text-green-400 block overflow-x-auto">
                                            sui client call --package {PACKAGE_ID?.slice(0, 10)}... --module echo --function create_tee_verifier --args ADMIN_CAP TEE_WALLET_ADDRESS --gas-budget 10000000
                                        </code>
                                    </div>
                                </div>
                            </div>

                            {/* Explorer Link */}
                            <div className="mt-4 text-center">
                                <a
                                    href={`https://suiscan.xyz/${SUI_NETWORK}/account/${adminAddress}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-sm text-blue-400 hover:underline"
                                >
                                    View your objects on Suiscan <ExternalLink size={14} />
                                </a>
                            </div>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}
