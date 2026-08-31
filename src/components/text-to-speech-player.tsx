"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause, Square, Volume2, FastForward } from "lucide-react";

export function TextToSpeechPlayer({ text, title }: { text: string; title: string }) {
  const [supported, setSupported] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [rate, setRate] = useState(1);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      setSupported(true);
    }
  }, []);

  const fullTextToRead = `${title}। ${text.replace(/<[^>]*>/g, " ").replace(/[#*`_>\[\]]/g, " ")}`;

  function handlePlay() {
    if (!supported || typeof window === "undefined") return;

    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPlaying(true);
      setIsPaused(false);
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(fullTextToRead);
    utterance.rate = rate;
    utterance.lang = "hi-IN";

    // Attempt to pick a Hindi voice if available
    const voices = window.speechSynthesis.getVoices();
    const hindiVoice = voices.find((v) => v.lang.includes("hi") || v.name.toLowerCase().includes("hindi"));
    if (hindiVoice) utterance.voice = hindiVoice;

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
    setIsPaused(false);
  }

  function handlePause() {
    if (!supported || typeof window === "undefined") return;
    window.speechSynthesis.pause();
    setIsPlaying(false);
    setIsPaused(true);
  }

  function handleStop() {
    if (!supported || typeof window === "undefined") return;
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
  }

  function toggleSpeed() {
    const nextRate = rate === 1 ? 1.25 : rate === 1.25 ? 1.5 : 1;
    setRate(nextRate);
    if (isPlaying) {
      handleStop();
      setTimeout(() => handlePlay(), 100);
    }
  }

  if (!supported) return null;

  return (
    <div className="my-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-gradient-to-r from-red-50/50 via-amber-50/30 to-white dark:from-red-950/20 dark:via-neutral-900 dark:to-neutral-900 p-4 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Headline & Audio Icon */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand)] text-white shadow-sm shrink-0">
            <Volume2 size={20} className={isPlaying ? "animate-bounce" : ""} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase text-[var(--brand)] tracking-wider">
                ऑडियो बुलेटिन
              </span>
              {isPlaying && (
                <span className="flex items-center gap-0.5">
                  <span className="h-2 w-1 bg-red-600 rounded-full animate-pulse" />
                  <span className="h-3 w-1 bg-red-600 rounded-full animate-pulse delay-75" />
                  <span className="h-4 w-1 bg-red-600 rounded-full animate-pulse delay-150" />
                </span>
              )}
            </div>
            <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
              {isPlaying ? "खबर सुनाई जा रही है..." : "इस खबर को सुनें (हिंदी आवाज़ में)"}
            </p>
          </div>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-2">
          {!isPlaying ? (
            <button
              onClick={handlePlay}
              className="flex items-center gap-1.5 bg-[var(--brand)] hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-black transition shadow-sm"
              aria-label="खबर सुनें"
            >
              <Play size={15} fill="currentColor" />
              <span>{isPaused ? "फिर से सुनें" : "खबर सुनें"}</span>
            </button>
          ) : (
            <button
              onClick={handlePause}
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl text-xs font-black transition shadow-sm"
              aria-label="रोकें"
            >
              <Pause size={15} fill="currentColor" />
              <span>रोकें</span>
            </button>
          )}

          {(isPlaying || isPaused) && (
            <button
              onClick={handleStop}
              className="btn btn-ghost !p-2 text-neutral-500 hover:text-red-600"
              title="बंद करें"
            >
              <Square size={16} fill="currentColor" />
            </button>
          )}

          <button
            onClick={toggleSpeed}
            className="flex items-center gap-1 bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 px-2.5 py-2 rounded-xl text-xs font-black transition"
            title="बोलने की गति बदलें"
          >
            <FastForward size={13} />
            <span>{rate}x</span>
          </button>
        </div>
      </div>
    </div>
  );
}
