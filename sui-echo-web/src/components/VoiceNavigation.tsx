"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Mic, MicOff, Volume2 } from "lucide-react";

// Type declarations for Web Speech API
interface SpeechRecognitionEvent extends Event {
    resultIndex: number;
    results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
    error: string;
}

interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start(): void;
    stop(): void;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
    onend: (() => void) | null;
}

declare global {
    interface Window {
        SpeechRecognition: new () => SpeechRecognition;
        webkitSpeechRecognition: new () => SpeechRecognition;
    }
}

export default function VoiceNavigation() {
    const router = useRouter();
    const pathname = usePathname();
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [feedback, setFeedback] = useState("");
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const isListeningRef = useRef(false);

    // Keep ref in sync
    useEffect(() => {
        isListeningRef.current = isListening;
    }, [isListening]);

    // Announce for screen readers (no voice to avoid loops)
    const announce = useCallback((message: string) => {
        setFeedback(message);
    }, []);

    // Speak message aloud
    const speak = useCallback((message: string) => {
        setFeedback(message);
        const utterance = new SpeechSynthesisUtterance(message);
        utterance.rate = 1.0;
        window.speechSynthesis.speak(utterance);
    }, []);

    // Process voice input
    const processCommand = useCallback((text: string) => {
        const lowerText = text.toLowerCase().trim();

        const routes: Record<string, string> = {
            "home": "/",
            "go home": "/",
            "dashboard": "/dashboard",
            "scan": "/scan",
            "handouts": "/dashboard/handouts",
            "broadcasts": "/dashboard/broadcasts",
            "reader": "/reader",
        };

        for (const [keyword, route] of Object.entries(routes)) {
            if (lowerText.includes(keyword)) {
                speak(`Going to ${keyword}`);
                router.push(route);
                return true;
            }
        }

        if (lowerText.includes("help") || lowerText.includes("commands")) {
            speak("Available commands: home, dashboard, scan, handouts, broadcasts, reader, help, stop");
            return true;
        }

        if (lowerText.includes("stop") || lowerText.includes("close")) {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
            setIsListening(false);
            speak("Voice navigation stopped");
            return true;
        }

        announce("Command not recognized. Say help for options.");
        return false;
    }, [router, announce, speak]);

    // Initialize speech recognition once
    useEffect(() => {
        if (typeof window === "undefined") return;

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        const instance = new SpeechRecognition();
        instance.continuous = true;
        instance.interimResults = true;
        instance.lang = "en-US";

        instance.onresult = (event: SpeechRecognitionEvent) => {
            const current = event.resultIndex;
            const result = event.results[current];
            const text = result[0].transcript;
            setTranscript(text);

            if (result.isFinal) {
                processCommand(text);
            }
        };

        instance.onerror = (event: SpeechRecognitionErrorEvent) => {
            console.error("[Voice] Error:", event.error);
        };

        instance.onend = () => {
            // Restart if still listening
            if (isListeningRef.current) {
                try {
                    instance.start();
                } catch (e) {
                    // Ignore if already started
                }
            }
        };

        recognitionRef.current = instance;

        return () => {
            instance.stop();
        };
    }, [processCommand]);

    const toggleListening = useCallback(() => {
        const recognition = recognitionRef.current;
        if (!recognition) {
            speak("Voice navigation not supported");
            return;
        }

        if (isListening) {
            recognition.stop();
            setIsListening(false);
            speak("Voice navigation stopped");
        } else {
            try {
                recognition.start();
                setIsListening(true);
                speak("Voice navigation active. Say help for commands.");
            } catch (e) {
                console.error("[Voice] Start error:", e);
            }
        }
    }, [isListening, speak]);

    return (
        <>
            {/* Voice Nav Toggle Button */}
            <button
                onClick={toggleListening}
                className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-lg transition-all ${isListening
                        ? "bg-[#4F9EF8] text-white"
                        : "bg-[#12151C] border border-[#1E232E] text-[#8A919E] hover:text-white hover:border-[#4F9EF8]"
                    }`}
                aria-label={isListening ? "Stop voice navigation" : "Start voice navigation"}
                aria-pressed={isListening}
            >
                {isListening ? (
                    <Mic size={24} aria-hidden="true" />
                ) : (
                    <MicOff size={24} aria-hidden="true" />
                )}
            </button>

            {/* Feedback Panel */}
            {isListening && (
                <div
                    className="fixed bottom-24 right-6 z-50 w-72 bg-[#12151C] border border-[#1E232E] rounded-xl p-4 shadow-xl"
                    role="status"
                    aria-live="polite"
                >
                    <div className="flex items-center gap-2 mb-2">
                        <Volume2 size={14} className="text-[#4F9EF8]" aria-hidden="true" />
                        <span className="text-xs font-medium text-[#4F9EF8]">Voice Active</span>
                    </div>

                    {transcript && (
                        <p className="text-sm text-[#8A919E] mb-2">
                            <span className="text-[#565B67]">Heard:</span> {transcript}
                        </p>
                    )}

                    {feedback && (
                        <p className="text-sm text-white">{feedback}</p>
                    )}

                    <p className="text-[10px] text-[#565B67] mt-3">
                        Say "help" for commands
                    </p>
                </div>
            )}

            {/* Screen reader live region */}
            <div className="sr-only" aria-live="assertive" aria-atomic="true">
                {feedback}
            </div>
        </>
    );
}
