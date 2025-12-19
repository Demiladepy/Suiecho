"use client";

import { ConnectButton } from "@mysten/dapp-kit";
import Link from "next/link";
import { ArrowRight, BookOpen, ShieldCheck, PlayCircle, Radio, Loader2 } from "lucide-react";
import { useState } from "react";
import { prepareZkLoginSession } from "@/utils/zklogin-proof";

export default function Home() {
  const [role, setRole] = useState<'student' | 'rep'>('student');
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setIsRedirecting(true);
    setLoginError(null);
    try {
      window.sessionStorage.setItem("sui_echo_user_role", role);
      const { loginUrl } = await prepareZkLoginSession();
      window.location.href = loginUrl;
    } catch (e: any) {
      console.error("[zkLogin] Error:", e);
      setIsRedirecting(false);
      setLoginError(e.message || "Failed to initialize zkLogin. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white flex flex-col">

      {/* Navbar */}
      <nav className="w-full max-w-6xl mx-auto px-6 py-5 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#4F9EF8] rounded-lg flex items-center justify-center">
            <BookOpen className="text-white w-5 h-5" />
          </div>
          <span className="text-xl font-semibold tracking-tight">Sui-Echo</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="hidden sm:flex items-center gap-2 text-sm text-[#8A919E] hover:text-white transition-colors">
            <span>Dashboard</span>
            <Radio size={14} />
          </Link>
          <ConnectButton className="!rounded-lg !px-4 !py-2 !bg-[#12151C] !text-white !text-sm !font-medium hover:!bg-[#1A1E28] !border !border-[#1E232E] transition-all" />
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center max-w-2xl mx-auto w-full py-16">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#4F9EF8]/10 border border-[#4F9EF8]/20 text-[#4F9EF8] text-xs font-semibold uppercase tracking-wide mb-8">
          <ShieldCheck size={14} />
          Decentralized Accessibility on Sui
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-tight mb-6">
          Connecting Voices,<br />
          <span className="text-[#4F9EF8]">Empowering Minds.</span>
        </h1>

        <p className="text-base sm:text-lg text-[#8A919E] max-w-lg leading-relaxed mb-10">
          Scan physical handouts, convert to accessible audio, and earn rewards securely with zkLogin.
        </p>

        {/* Action Card */}
        <div className="w-full max-w-sm space-y-4">

          {/* Role Switcher */}
          <div className="bg-[#12151C] p-1 rounded-lg flex border border-[#1E232E]">
            <button
              onClick={() => setRole('student')}
              className={`flex-1 py-2.5 rounded-md font-medium text-sm transition-all ${role === 'student'
                  ? 'bg-[#4F9EF8] text-white'
                  : 'text-[#8A919E] hover:text-white'
                }`}
            >
              Student / Reader
            </button>
            <button
              onClick={() => setRole('rep')}
              className={`flex-1 py-2.5 rounded-md font-medium text-sm transition-all ${role === 'rep'
                  ? 'bg-[#4F9EF8] text-white'
                  : 'text-[#8A919E] hover:text-white'
                }`}
            >
              Course Rep
            </button>
          </div>

          {/* Login Button */}
          <div className="bg-[#12151C] p-5 rounded-xl border border-[#1E232E]">
            <button
              onClick={handleGoogleLogin}
              disabled={isRedirecting}
              className="w-full bg-white hover:bg-gray-100 text-gray-900 h-12 rounded-lg font-semibold transition-all flex items-center justify-center gap-3 disabled:opacity-70"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              {isRedirecting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                `Continue with Google as ${role === 'rep' ? 'Course Rep' : 'Student'}`
              )}
            </button>

            {role === 'rep' && (
              <p className="text-xs text-[#565B67] text-center mt-3">
                After login, you can apply to become a verified course rep.
              </p>
            )}
            {loginError && (
              <p className="text-xs text-red-400 text-center mt-3">{loginError}</p>
            )}
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <Link
              href="/scan"
              className="p-4 rounded-lg bg-[#12151C] border border-[#1E232E] hover:border-[#2A3140] transition-all flex flex-col items-center gap-2"
            >
              <BookOpen size={20} className="text-[#4F9EF8]" />
              <span className="text-xs font-medium text-[#8A919E]">Quick Scan</span>
            </Link>
            <Link
              href="/reader"
              className="p-4 rounded-lg bg-[#12151C] border border-[#1E232E] hover:border-[#2A3140] transition-all flex flex-col items-center gap-2"
            >
              <PlayCircle size={20} className="text-[#22C55E]" />
              <span className="text-xs font-medium text-[#8A919E]">Quick Reader</span>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full p-6 text-center text-xs text-[#565B67] font-medium tracking-wide">
        SECURED BY ZKLOGIN • POWERED BY SUI
      </footer>
    </div>
  );
}
