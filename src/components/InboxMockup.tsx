"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "@/components/ui/Icon";

/**
 * Animated unified-inbox mockup for the landing "unified inbox" section.
 *
 * Loops a short, life-like exchange: the customer's question slides up, a
 * typing indicator appears, then the AI's reply pops in with an "AI drafted"
 * tag — as if messages were arriving live. Falls back to the finished state
 * for users who prefer reduced motion.
 */

// Time (ms) spent on each step before advancing: idle → question → typing → answer.
const DELAYS = [600, 1500, 1500, 3200];

export function InboxMockup({ isTh }: { isTh: boolean }) {
  const [step, setStep] = useState(0);
  const [animate, setAnimate] = useState(true);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setAnimate(false);
      setStep(3);
    }
  }, []);

  useEffect(() => {
    if (!animate) return;
    const id = setTimeout(() => setStep((s) => (s + 1) % 4), DELAYS[step]);
    return () => clearTimeout(id);
  }, [step, animate]);

  const showQ = step >= 1;
  const showTyping = step === 2;
  const showA = step >= 3;

  const enter = (show: boolean) =>
    ({
      opacity: show ? 1 : 0,
      transform: show ? "translateY(0)" : "translateY(10px)",
      transition: "opacity 0.35s ease, transform 0.35s ease",
    }) as const;

  return (
    <div className="overflow-hidden rounded-2xl border border-line2 bg-card shadow-[0_24px_60px_rgba(15,23,42,0.14)] dark:shadow-[0_24px_60px_rgba(0,0,0,0.5)]">
      {/* Window chrome */}
      <div className="flex items-center gap-1.5 border-b border-line2 bg-muted px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
      </div>

      <div className="grid grid-cols-[minmax(0,7rem)_1fr] sm:grid-cols-[minmax(0,9rem)_1fr]">
        {/* Conversation list */}
        <div className="border-r border-line2 py-2">
          {[
            { n: "คุณ A", active: true },
            { n: "คุณ B", active: false },
            { n: "คุณ C", active: false },
          ].map((row) => (
            <div
              key={row.n}
              className={`flex items-center gap-2 px-3 py-2.5 ${row.active ? "bg-brand-soft" : ""}`}
            >
              <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-brand-gradient text-[10px] font-bold text-white">
                {row.n.slice(-1)}
              </span>
              <div className="min-w-0">
                <div className="truncate text-[11px] font-semibold text-ink">
                  {row.n}
                </div>
                <div className="truncate text-[10px] text-ink-faint">
                  {isTh ? "สนใจสินค้า..." : "Interested in..."}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Chat panel */}
        <div className="flex min-h-[168px] flex-col gap-2 p-3">
          {/* Customer question */}
          <div
            className="w-fit max-w-[85%] rounded-2xl rounded-tl-sm bg-muted px-3 py-2 text-[12px] text-ink"
            style={enter(showQ)}
          >
            {isTh ? "สินค้ามีสีอะไรบ้างคะ?" : "What colors are available?"}
          </div>

          {/* Typing indicator */}
          {showTyping && (
            <div
              className="flex w-fit items-center gap-1 rounded-2xl rounded-tr-sm bg-brand-600 px-3 py-2.5"
              style={{ marginLeft: "auto", ...enter(true) }}
            >
              {[0, 1, 2].map((d) => (
                <span
                  key={d}
                  className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-white/90"
                  style={{ animationDelay: `${d * 0.15}s` }}
                />
              ))}
            </div>
          )}

          {/* AI reply */}
          <div
            className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-tr-sm bg-brand-600 px-3 py-2 text-[12px] text-white"
            style={enter(showA)}
          >
            {isTh ? "มีสีดำ ขาว และน้ำเงินค่ะ 🎨" : "Black, white and blue 🎨"}
          </div>

          {/* AI-drafted tag */}
          <div
            className="mt-1 flex items-center gap-1.5 self-start rounded-full bg-brand-soft px-2.5 py-1 text-[10px] font-medium text-brand-600"
            style={{
              ...enter(showA),
              transitionDelay: showA ? "0.15s" : "0s",
            }}
          >
            <Sparkles className="h-3 w-3" />
            {isTh ? "AI ร่างคำตอบให้" : "AI drafted this"}
          </div>
        </div>
      </div>
    </div>
  );
}
