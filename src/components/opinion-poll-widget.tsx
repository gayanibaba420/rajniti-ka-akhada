"use client";

import { useEffect, useState } from "react";
import { Vote, CheckCircle2 } from "lucide-react";

export function OpinionPollWidget() {
  const pollId = "poll_2026_08_31";
  const question = "क्या हरियाणा विधानसभा में विधायकों और नेताओं के बीच मर्यादित भाषा के लिए कड़े नियम बनने चाहिए?";
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasVoted, setHasVoted] = useState(false);

  const [votes, setVotes] = useState([
    { label: "हाँ, कड़े नियम जरूरी हैं", count: 842 },
    { label: "नहीं, लोकतंत्र में बहस खुली हो", count: 128 },
    { label: "कह नहीं सकते / निष्पक्ष", count: 45 },
  ]);

  useEffect(() => {
    const saved = localStorage.getItem(pollId);
    if (saved !== null) {
      setSelectedOption(Number(saved));
      setHasVoted(true);
    }
  }, []);

  const totalVotes = votes.reduce((sum, v) => sum + v.count, 0);

  function handleVote(index: number) {
    if (hasVoted) return;
    setSelectedOption(index);
    setHasVoted(true);
    localStorage.setItem(pollId, String(index));
    setVotes((prev) =>
      prev.map((v, i) => (i === index ? { ...v, count: v.count + 1 } : v))
    );
  }

  return (
    <section className="my-10 rounded-2xl border-2 border-amber-300 dark:border-amber-900/60 bg-gradient-to-br from-amber-500/10 via-white to-red-500/5 dark:from-amber-950/30 dark:via-neutral-900 dark:to-neutral-900 p-6 shadow-sm">
      <div className="flex items-center gap-2 text-[var(--brand)] font-black text-xs uppercase tracking-wider mb-2">
        <Vote size={18} className="animate-pulse" />
        <span>जनता की राय • आज का बड़ा सवाल</span>
      </div>

      <h3 className="text-lg sm:text-xl font-black text-neutral-900 dark:text-neutral-100 leading-snug">
        {question}
      </h3>

      <div className="mt-5 space-y-3">
        {votes.map((option, idx) => {
          const percent = totalVotes > 0 ? Math.round((option.count / totalVotes) * 100) : 0;
          const isUserChoice = selectedOption === idx;

          return (
            <div key={idx} className="relative overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 transition">
              {hasVoted && (
                <div
                  className={`absolute top-0 bottom-0 left-0 transition-all duration-700 ${
                    isUserChoice ? "bg-[var(--brand)]/20" : "bg-neutral-200/60 dark:bg-neutral-700/60"
                  }`}
                  style={{ width: `${percent}%` }}
                />
              )}

              <button
                type="button"
                disabled={hasVoted}
                onClick={() => handleVote(idx)}
                className="relative z-10 w-full flex items-center justify-between p-3.5 text-left text-sm font-bold disabled:cursor-default"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`h-5 w-5 rounded-full border flex items-center justify-center shrink-0 ${
                      isUserChoice
                        ? "border-[var(--brand)] bg-[var(--brand)] text-white"
                        : "border-neutral-400 bg-transparent"
                    }`}
                  >
                    {isUserChoice && <CheckCircle2 size={13} />}
                  </div>
                  <span className={isUserChoice ? "font-black text-[var(--brand)]" : "text-neutral-800 dark:text-neutral-200"}>
                    {option.label}
                  </span>
                </div>

                {hasVoted && (
                  <span className="text-xs font-black text-neutral-700 dark:text-neutral-300">
                    {percent}% ({option.count.toLocaleString("hi-IN")})
                  </span>
                )}
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-neutral-500 font-bold border-t border-neutral-200 dark:border-neutral-800 pt-3">
        <span>कुल वोट: {totalVotes.toLocaleString("hi-IN")}</span>
        <span>{hasVoted ? "✓ आपका वोट दर्ज हो चुका है" : "वोट करने के लिए विकल्प चुनें"}</span>
      </div>
    </section>
  );
}
