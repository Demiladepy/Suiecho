"use client";

import { useState, useEffect, useCallback } from "react";
import { ShieldCheck, FileText, ExternalLink, Search, Loader2, RefreshCw, Clock, Gift, Volume2, VolumeX } from "lucide-react";
import { getSuiClient, getZkLoginAddress, isZkLoginSessionValid, executeSponsoredZkLoginTransaction } from "@/utils/zklogin-proof";
import { PACKAGE_ID, SUI_NETWORK } from "@/config";
import { TARGETS, ALUMNI_AJO_ID, isContractConfigured } from "@/lib/contract";
import { Transaction } from "@mysten/sui/transactions";
import { useRouter } from "next/navigation";

interface Handout {
    id: string;
    file: string;
    blobId: string;
    user: string;
    status: "pending" | "verified";
    date: string;
    objectId: string;
}

export default function HandoutsPage() {
    const router = useRouter();
    const [filter, setFilter] = useState("all");
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [handouts, setHandouts] = useState<Handout[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [claimingId, setClaimingId] = useState<string | null>(null);
    const [speakingId, setSpeakingId] = useState<string | null>(null);
    const [stats, setStats] = useState({ pending: 0, verified: 0, total: 0 });

    // Text-to-speech function
    const speakHandout = useCallback(async (handout: Handout) => {
        if (speakingId === handout.id) {
            // Stop speaking
            window.speechSynthesis.cancel();
            setSpeakingId(null);
            return;
        }

        if (!handout.blobId) {
            announce("No content available for this handout");
            return;
        }

        setSpeakingId(handout.id);
        announce("Loading handout content");

        try {
            const response = await fetch(`https://aggregator.walrus-testnet.walrus.space/v1/${handout.blobId}`);
            const text = await response.text();

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.9;
            utterance.onend = () => setSpeakingId(null);
            utterance.onerror = () => {
                setSpeakingId(null);
                announce("Failed to read content");
            };

            window.speechSynthesis.speak(utterance);
        } catch {
            setSpeakingId(null);
            announce("Failed to load handout content");
        }
    }, [speakingId]);

    // Announce for screen readers
    const announce = (message: string) => {
        const el = document.getElementById("sr-announcer");
        if (el) el.textContent = message;
    };

    useEffect(() => {
        if (!isZkLoginSessionValid()) {
            router.push("/");
            return;
        }
        fetchHandouts();
    }, [router]);

    async function fetchHandouts() {
        const address = getZkLoginAddress();
        if (!address) {
            setLoading(false);
            return;
        }

        try {
            const client = getSuiClient();
            const ownedObjects = await client.getOwnedObjects({
                owner: address,
                options: { showType: true, showContent: true },
            });

            const handoutList: Handout[] = [];
            let pending = 0, verified = 0;

            for (const obj of ownedObjects.data) {
                const type = obj.data?.type;
                if (!type?.includes("Handout")) continue;

                const content = obj.data?.content;
                if (content?.dataType !== "moveObject") continue;

                const fields = content.fields as any;
                const isVerified = fields?.verified === true;

                if (isVerified) verified++;
                else pending++;

                handoutList.push({
                    id: obj.data?.objectId || "",
                    file: fields?.description ? String(fields.description).slice(0, 30) : "Handout",
                    blobId: fields?.blob_id || "",
                    user: address.slice(0, 6) + "..." + address.slice(-4),
                    status: isVerified ? "verified" : "pending",
                    date: "Recently uploaded",
                    objectId: obj.data?.objectId || "",
                });
            }

            setHandouts(handoutList);
            setStats({ pending, verified, total: pending + verified });
        } catch (error) {
            console.error("[Handouts] Error fetching:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }

    const handleRefresh = async () => {
        setRefreshing(true);
        announce("Refreshing handouts");
        await fetchHandouts();
        announce(`Found ${handouts.length} handouts`);
    };

    const filteredHandouts = handouts.filter(h => {
        const matchesFilter = filter === "all" || h.status === filter;
        const matchesSearch = !searchQuery ||
            h.file.toLowerCase().includes(searchQuery.toLowerCase()) ||
            h.blobId.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const openOnExplorer = (objectId: string) => {
        const explorerUrl = SUI_NETWORK === 'mainnet'
            ? `https://suiexplorer.com/object/${objectId}`
            : `https://suiexplorer.com/object/${objectId}?network=${SUI_NETWORK}`;
        window.open(explorerUrl, '_blank');
    };

    const handleClaimReward = async (handoutObjectId: string) => {
        if (!isContractConfigured() || !ALUMNI_AJO_ID) {
            announce("Contract not configured");
            return;
        }

        setClaimingId(handoutObjectId);
        announce("Claiming reward");

        try {
            const tx = new Transaction();
            tx.moveCall({
                target: TARGETS.claim_reward,
                arguments: [
                    tx.object(ALUMNI_AJO_ID),
                    tx.object(handoutObjectId),
                    tx.pure.vector("u8", Array.from(new TextEncoder().encode("GENERAL"))),
                ],
            });

            const result = await executeSponsoredZkLoginTransaction(tx);
            announce("Reward claimed successfully");
            await fetchHandouts();
        } catch (e: any) {
            console.error("[Handouts] Claim error:", e);
            announce("Failed to claim reward");
        } finally {
            setClaimingId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]" role="status" aria-label="Loading handouts">
                <Loader2 className="w-6 h-6 text-[#4F9EF8] animate-spin" aria-hidden="true" />
                <span className="sr-only">Loading handouts</span>
            </div>
        );
    }

    return (
        <main className="space-y-6" role="main" aria-label="Handouts page">
            {/* Screen reader announcer */}
            <div id="sr-announcer" className="sr-only" aria-live="polite" aria-atomic="true" />

            {/* Header */}
            <header>
                <h1 className="text-2xl font-semibold tracking-tight mb-1">My Handouts</h1>
                <p className="text-[#8A919E] text-sm">Manage your scanned handouts and claim rewards</p>
            </header>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
                {/* Search */}
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#565B67]" size={16} aria-hidden="true" />
                    <input
                        type="search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-[#12151C] border border-[#1E232E] rounded-lg pl-10 pr-4 py-2.5 text-sm focus:border-[#4F9EF8] outline-none transition-colors"
                        placeholder="Search handouts..."
                        aria-label="Search handouts"
                    />
                </div>

                {/* Filter + Refresh */}
                <div className="flex items-center gap-3">
                    <div className="flex bg-[#12151C] p-1 rounded-lg border border-[#1E232E]" role="tablist" aria-label="Filter handouts">
                        {["all", "pending", "verified"].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                role="tab"
                                aria-selected={filter === f}
                                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${filter === f
                                        ? "bg-[#4F9EF8] text-white"
                                        : "text-[#8A919E] hover:text-white"
                                    }`}
                            >
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="p-2.5 bg-[#12151C] border border-[#1E232E] rounded-lg hover:border-[#2A3140] transition-colors disabled:opacity-50"
                        aria-label="Refresh handouts"
                    >
                        <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} aria-hidden="true" />
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-[#12151C] border border-[#1E232E] rounded-lg p-4">
                    <p className="text-xs text-[#8A919E] mb-1">Total</p>
                    <p className="text-xl font-semibold">{stats.total}</p>
                </div>
                <div className="bg-[#12151C] border border-[#1E232E] rounded-lg p-4">
                    <p className="text-xs text-[#22C55E] mb-1">Verified</p>
                    <p className="text-xl font-semibold">{stats.verified}</p>
                </div>
                <div className="bg-[#12151C] border border-[#1E232E] rounded-lg p-4">
                    <p className="text-xs text-[#EAB308] mb-1">Pending</p>
                    <p className="text-xl font-semibold">{stats.pending}</p>
                </div>
            </div>

            {/* Handouts List */}
            {filteredHandouts.length > 0 ? (
                <ul className="space-y-3" role="list" aria-label="Handout list">
                    {filteredHandouts.map((h) => (
                        <li
                            key={h.id}
                            className="bg-[#12151C] border border-[#1E232E] rounded-xl p-4 hover:border-[#2A3140] transition-colors"
                            role="listitem"
                        >
                            <div className="flex items-center justify-between gap-4">
                                {/* Info */}
                                <div className="flex items-center gap-4 min-w-0 flex-1">
                                    <div className="w-10 h-10 rounded-lg bg-[#1A1E28] flex items-center justify-center shrink-0" aria-hidden="true">
                                        <FileText size={18} className="text-[#4F9EF8]" />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-medium text-sm truncate">{h.file}</h3>
                                        <p className="text-xs text-[#565B67] truncate font-mono">
                                            {h.blobId ? h.blobId.slice(0, 16) + "..." : "No blob ID"}
                                        </p>
                                    </div>
                                </div>

                                {/* Status */}
                                <div className="flex items-center gap-2 shrink-0">
                                    {h.status === "verified" ? (
                                        <span className="flex items-center gap-1 px-2 py-1 bg-[#22C55E]/10 text-[#22C55E] text-xs font-medium rounded">
                                            <ShieldCheck size={12} aria-hidden="true" />
                                            Verified
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1 px-2 py-1 bg-[#EAB308]/10 text-[#EAB308] text-xs font-medium rounded">
                                            <Clock size={12} aria-hidden="true" />
                                            Pending
                                        </span>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 shrink-0">
                                    {/* Listen Button */}
                                    <button
                                        onClick={() => speakHandout(h)}
                                        className={`p-2 rounded-lg transition-colors ${speakingId === h.id
                                                ? "bg-[#4F9EF8] text-white"
                                                : "bg-[#1A1E28] text-[#8A919E] hover:text-white hover:bg-[#4F9EF8]/20"
                                            }`}
                                        aria-label={speakingId === h.id ? "Stop listening" : "Listen to handout"}
                                        aria-pressed={speakingId === h.id}
                                    >
                                        {speakingId === h.id ? (
                                            <VolumeX size={16} aria-hidden="true" />
                                        ) : (
                                            <Volume2 size={16} aria-hidden="true" />
                                        )}
                                    </button>

                                    {/* Claim Reward */}
                                    {h.status === "verified" && (
                                        <button
                                            onClick={() => handleClaimReward(h.objectId)}
                                            disabled={claimingId === h.objectId}
                                            className="p-2 rounded-lg bg-[#EAB308]/10 text-[#EAB308] hover:bg-[#EAB308] hover:text-black transition-colors disabled:opacity-50"
                                            aria-label="Claim reward"
                                            aria-busy={claimingId === h.objectId}
                                        >
                                            {claimingId === h.objectId ? (
                                                <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                                            ) : (
                                                <Gift size={16} aria-hidden="true" />
                                            )}
                                        </button>
                                    )}

                                    {/* Open Reader */}
                                    {h.blobId && (
                                        <a
                                            href={`/reader?blobId=${h.blobId}`}
                                            className="p-2 rounded-lg bg-[#1A1E28] text-[#8A919E] hover:text-[#22C55E] hover:bg-[#22C55E]/10 transition-colors"
                                            aria-label="Open in reader"
                                        >
                                            <FileText size={16} aria-hidden="true" />
                                        </a>
                                    )}

                                    {/* Explorer */}
                                    <button
                                        onClick={() => openOnExplorer(h.objectId)}
                                        className="p-2 rounded-lg bg-[#1A1E28] text-[#8A919E] hover:text-[#4F9EF8] hover:bg-[#4F9EF8]/10 transition-colors"
                                        aria-label="View on Sui Explorer"
                                    >
                                        <ExternalLink size={16} aria-hidden="true" />
                                    </button>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="bg-[#12151C] border border-[#1E232E] rounded-xl p-12 text-center" role="status">
                    <FileText size={40} className="text-[#565B67] mx-auto mb-4" aria-hidden="true" />
                    <h3 className="font-medium mb-1">No Handouts Found</h3>
                    <p className="text-sm text-[#565B67] mb-4">
                        {searchQuery ? "Try a different search term" : "Start scanning handouts to see them here"}
                    </p>
                    <a
                        href="/scan"
                        className="inline-block px-4 py-2 bg-[#4F9EF8] text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
                    >
                        Scan Your First Handout
                    </a>
                </div>
            )}
        </main>
    );
}
