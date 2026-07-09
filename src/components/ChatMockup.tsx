"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "@/components/ui/Icon";

/**
 * Animated chat mockup for the "personal admin" section.
 *
 * Loops a natural back-and-forth: the customer asks, a typing indicator
 * blinks, the AI replies, the customer follows up, then the AI starts typing
 * again — as if a real conversation were unfolding. Falls back to the full
 * transcript for users who prefer reduced motion.
 */

// Time (ms) at each step: idle → q1 → typing → a1 → q2 → typing again.
const DELAYS = [500, 1500, 1500, 2200, 1600, 2600];

export function ChatMockup({ isTh }: { isTh: boolean }) {
  const [step, setStep] = useState(0);
  const [animate, setAnimate] = useState(true);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setAnimate(false);
      setStep(5);
    }
  }, []);

  useEffect(() => {
    if (!animate) return;
    const id = setTimeout(() => setStep((s) => (s + 1) % 6), DELAYS[step]);
    return () => clearTimeout(id);
  }, [step, animate]);

  const enter = (show: boolean) =>
    ({
      opacity: show ? 1 : 0,
      transform: show ? "translateY(0)" : "translateY(10px)",
      transition: "opacity 0.35s ease, transform 0.35s ease",
    }) as const;

  return (
    <div className="rounded-2xl border border-line2 bg-card p-4 shadow-[0_24px_60px_rgba(15,23,42,0.14)] dark:shadow-[0_24px_60px_rgba(0,0,0,0.5)]">
      <div className="flex min-h-[228px] flex-col gap-3">
        {/* Customer Q1 */}
        <div
          className="w-fit max-w-[80%] rounded-2xl rounded-tl-sm bg-muted px-3.5 py-2.5 text-[13px] text-ink"
          style={enter(step >= 1)}
        >
          {isTh ? "ร้านเปิดกี่โมงคะ?" : "What time do you open?"}
        </div>

        {/* AI typing before first reply */}
        {step === 2 && (
          <div
            className="flex w-fit items-center gap-1 self-end rounded-2xl rounded-tr-sm bg-brand-600 px-3.5 py-3"
            style={enter(true)}
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
        {step >= 3 && (
          <div
            className="ml-auto w-fit max-w-[80%] rounded-2xl rounded-tr-sm bg-brand-600 px-3.5 py-2.5 text-[13px] text-white"
            style={enter(step >= 3)}
          >
            {isTh
              ? "เปิดทุกวัน 9:00–18:00 น. ค่ะ 😊 มีอะไรให้ช่วยเพิ่มไหมคะ?"
              : "Every day, 9am–6pm 😊 Anything else I can help with?"}
          </div>
        )}

        {/* Customer Q2 */}
        {step >= 4 && (
          <div
            className="w-fit max-w-[80%] rounded-2xl rounded-tl-sm bg-muted px-3.5 py-2.5 text-[13px] text-ink"
            style={enter(step >= 4)}
          >
            {isTh ? "ส่งของกี่วันถึงคะ?" : "How long is delivery?"}
          </div>
        )}

        {/* AI typing again */}
        {step >= 5 && (
          <div
            className="ml-auto flex w-fit items-center gap-1.5 rounded-2xl rounded-tr-sm bg-brand-600 px-3.5 py-2.5 text-[13px] text-white"
            style={enter(step >= 5)}
          >
            <Sparkles className="h-3.5 w-3.5" />
            {isTh ? "กำลังพิมพ์..." : "typing..."}
          </div>
        )}
      </div>
    </div>
  );
}
