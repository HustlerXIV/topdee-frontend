"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { CompactPreferences } from "@/components/PreferencesToggle";
import { ChannelOrbit } from "@/components/ChannelOrbit";
import { InboxMockup } from "@/components/InboxMockup";
import { ChatMockup } from "@/components/ChatMockup";
import { useT } from "@/lib/i18n/useT";
import { usePreferences } from "@/store/preferences";
import { api, type Plan } from "@/lib/api";
import {
  MessageCircle,
  Facebook,
  Instagram,
  Globe,
  Inbox,
  Bot,
  Zap,
  DollarSign,
  BarChart3,
  LinkIcon,
  Check,
  Star,
  Sparkles,
  ArrowRight,
  Send,
  Upload,
  ChevronDown,
  MessageSquare,
} from "@/components/ui/Icon";
import type { ComponentType } from "react";

type FeatureSpec = {
  Icon: ComponentType<{ className?: string }>;
  iconBg: string;
  iconFg: string;
  th: { title: string; body: string };
  en: { title: string; body: string };
};

const FEATURES: FeatureSpec[] = [
  {
    Icon: Inbox,
    iconBg: "bg-brand-100 dark:bg-brand-soft",
    iconFg: "text-brand-600 dark:text-brand-200",
    th: {
      title: "Unified Inbox",
      body: "ดูและตอบแชทจากทุก channel ในหน้าเดียว ไม่ต้องสลับแอปให้วุ่นวาย ทีมทำงานพร้อมกันได้",
    },
    en: {
      title: "Unified Inbox",
      body: "See and reply to chats from every channel in one screen. No more app-switching, your whole team can work together.",
    },
  },
  {
    Icon: Bot,
    iconBg: "bg-emerald-100 dark:bg-emerald-900/40",
    iconFg: "text-emerald-700 dark:text-emerald-300",
    th: {
      title: "AI ที่ปรับเองได้",
      body: "โยนไฟล์ PDF, Word, หรือ Excel ให้ AI อ่าน แล้ว AI จะตอบแทนคุณโดยอ้างอิงข้อมูลจากไฟล์นั้น",
    },
    en: {
      title: "AI you can train",
      body: "Drop in PDFs, Word docs or spreadsheets — the AI will read them and answer customers based on your files.",
    },
  },
  {
    Icon: Zap,
    iconBg: "bg-yellow-100 dark:bg-yellow-900/40",
    iconFg: "text-yellow-700 dark:text-yellow-200",
    th: {
      title: "Self-serve 100%",
      body: "ตั้งค่าเองได้ทุกอย่างไม่ต้องรอทีม support เปลี่ยน prompt ปรับ AI บุคลิก เพิ่ม channel ได้เลย",
    },
    en: {
      title: "100% self-serve",
      body: "Configure everything yourself — no support tickets to change a prompt, tweak the AI's tone, or add a channel.",
    },
  },
  {
    Icon: DollarSign,
    iconBg: "bg-rose-100 dark:bg-rose-900/40",
    iconFg: "text-rose-700 dark:text-rose-300",
    th: {
      title: "ราคา SME จ่ายได้",
      body: "เริ่มต้น ฿490/เดือน ไม่ต้องจ่าย setup fee ไม่มีสัญญาขั้นต่ำ ยกเลิกได้ทุกเมื่อ",
    },
    en: {
      title: "SMB-friendly pricing",
      body: "Starts at ฿490/month. No setup fee, no minimum contract, cancel anytime.",
    },
  },
  {
    Icon: BarChart3,
    iconBg: "bg-sky-100 dark:bg-sky-900/40",
    iconFg: "text-sky-700 dark:text-sky-300",
    th: {
      title: "Analytics ครบ",
      body: "ดู volume แชท อัตราการตอบ AI resolution rate และ performance ทีม real-time",
    },
    en: {
      title: "Full analytics",
      body: "See chat volume, AI resolution rate, and team performance in real time.",
    },
  },
  {
    Icon: LinkIcon,
    iconBg: "bg-emerald-50 dark:bg-emerald-950/40",
    iconFg: "text-emerald-700 dark:text-emerald-300",
    th: {
      title: "เชื่อมง่ายใน 5 นาที",
      body: "คัดลอก webhook URL วาง token แค่นี้พอ ไม่ต้องจ้างโปรแกรมเมอร์ ไม่ต้องรู้เรื่อง API",
    },
    en: {
      title: "Connect in 5 minutes",
      body: "Copy a webhook URL, paste a token — done. No developers, no API knowledge needed.",
    },
  },
];


export default function HomePage() {
  const t = useT();
  const locale = usePreferences((s) => s.locale);
  const isTh = locale === "th";
  const [plans, setPlans] = useState<Plan[]>([]);

  useEffect(() => {
    api.plans().then(setPlans).catch(() => {});
  }, []);

  return (
    <main className="page-enter bg-page text-ink">
      {/* Top nav */}
      <nav className="sticky top-0 z-30 flex items-center gap-2 border-b border-line2 bg-card px-4 py-2.5 md:px-6 md:py-3">
        <Link href="/" className="mr-auto flex items-center">
          <Image
            src="/topdee-light.png"
            alt="TopDee"
            width={2451}
            height={730}
            style={{ height: "32px", width: "auto" }}
            className="block dark:hidden"
            priority
            unoptimized
          />
          <Image
            src="/topdee-dark.png"
            alt="TopDee"
            width={2451}
            height={730}
            style={{ height: "32px", width: "auto" }}
            className="hidden dark:block"
            priority
            unoptimized
          />
        </Link>

        {/* Language + theme — no extra padding on mobile */}
        <CompactPreferences className="px-0 py-0" />

        {/* Login — hidden on mobile to keep the nav clean.
            The signup page lets users switch to login from there. */}
        <Link href="/login" className="hidden sm:block">
          <Button variant="outline" size="sm">
            {t("landing.signin")}
          </Button>
        </Link>

        <Link href="/login?tab=register">
          <Button variant="primary" size="sm" className="whitespace-nowrap">
            {t("landing.signup")}
          </Button>
        </Link>
      </nav>

      {/* Hero */}
      <section className="bg-hero relative overflow-hidden px-6 pt-16 pb-20 text-center md:pt-20 md:pb-28">
        {/* Soft floating gradient orbs */}
        <div
          className="hero-orb h-64 w-64 bg-brand-400"
          style={{ top: "16%", left: "6%" }}
        />
        <div
          className="hero-orb h-72 w-72 bg-amber-300"
          style={{ bottom: "8%", left: "18%", animationDelay: "1.5s" }}
        />
        <div
          className="hero-orb h-80 w-80 bg-sky-400"
          style={{ top: "8%", right: "4%", animationDelay: "2.6s" }}
        />

        <div className="relative mx-auto max-w-4xl">
          <h1 className="mx-auto max-w-3xl text-[clamp(30px,5vw,54px)] font-extrabold leading-[1.18] text-ink dark:text-white">
            {t("landing.heroTop")}
            <br />
            {t("landing.heroBottom")}{" "}
            <span className="mx-1 inline-block rounded-2xl bg-white px-3 py-0.5 align-middle shadow-[0_10px_34px_rgba(108,71,255,0.28)]">
              <span className="text-gradient-brand">
                {t("landing.heroEmphasis")}
              </span>
            </span>{" "}
            {t("landing.heroBottomTail")}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-ink-muted dark:text-white/85 md:text-lg">
            {t("landing.heroSub")}
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link href="/login?tab=register">
              <Button
                size="lg"
                className="bg-brand-600 text-white shadow-brand-strong hover:bg-brand-700 dark:bg-white dark:text-brand-700 dark:hover:bg-slate-100"
                iconRight={<ArrowRight className="h-4 w-4" />}
              >
                {t("landing.cta.tryFree")}
              </Button>
            </Link>
            <Button
              size="lg"
              className="border !border-brand-200 !bg-white/70 !text-brand-700 backdrop-blur hover:!bg-white dark:!border-white/40 dark:!bg-white/10 dark:!text-white dark:hover:!bg-white/20"
            >
              {t("landing.cta.watchVideo")}
            </Button>
          </div>

          {/* Chat widget mockup */}
          <div className="relative mx-auto mt-14 max-w-md">
            <div className="rounded-2xl border border-line2 bg-card p-4 text-left shadow-[0_28px_70px_rgba(15,23,42,0.20)] dark:shadow-[0_28px_70px_rgba(0,0,0,0.55)]">
              <div className="flex items-center gap-2.5 border-b border-line2 pb-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-gradient text-white">
                  <Bot className="h-5 w-5" />
                </span>
                <div>
                  <div className="text-sm font-bold text-ink">
                    TopDee Assistant
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-500">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    {isTh ? "ออนไลน์" : "Online"}
                  </div>
                </div>
              </div>
              <div className="space-y-2 py-4">
                <div className="w-fit rounded-2xl rounded-tl-sm bg-muted px-3 py-2 text-[13px] text-ink">
                  {isTh ? "สวัสดีค่ะ 👋" : "Hi there 👋"}
                </div>
                <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-tr-sm bg-brand-600 px-3 py-2 text-[13px] text-white">
                  {isTh
                    ? "สวัสดีครับ มีอะไรให้ AI Assistant ช่วยเหลือไหมครับ"
                    : "Hello! How can the AI Assistant help you today?"}
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-line2 bg-page px-3 py-2">
                <span className="flex-1 text-[13px] text-ink-faint">
                  {isTh ? "พิมพ์ข้อความ..." : "Type a message..."}
                </span>
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-white">
                  <Send className="h-3.5 w-3.5" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product showcase — unified inbox mockup */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-600">
              <Inbox className="h-3.5 w-3.5" />
              {isTh ? "กล่องข้อความรวม" : "Unified inbox"}
            </span>
            <h2 className="mt-4 text-3xl font-extrabold leading-snug text-ink md:text-4xl">
              {isTh
                ? "จัดการทุกแชทในหน้าจอเดียว"
                : "Every conversation, one screen"}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-ink-muted">
              {isTh
                ? "ข้อความจาก LINE, Facebook, Instagram และ Webchat ไหลมารวมกันในกล่องเดียว ทีมของคุณเห็นบริบทครบ ตอบได้ไว ไม่ต้องสลับไปมาหลายแอป"
                : "Messages from LINE, Facebook, Instagram and Webchat land in one shared inbox. Your team sees full context and replies faster — no app-switching."}
            </p>
            <ul className="mt-6 space-y-3">
              {(isTh
                ? [
                    "มอบหมายแชทให้สมาชิกในทีมได้",
                    "AI ช่วยร่างคำตอบให้อัตโนมัติ",
                    "เห็นประวัติลูกค้าครบทุกช่องทาง",
                  ]
                : [
                    "Assign chats across your team",
                    "AI drafts replies automatically",
                    "Full customer history, every channel",
                  ]
              ).map((item) => (
                <li key={item} className="flex items-center gap-2.5 text-sm text-ink">
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand-600">
                    <Check className="h-3 w-3" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Inbox UI mockup — animated */}
          <InboxMockup isTh={isTh} />
        </div>
      </section>

      {/* Support channels — orbiting icons */}
      <section className="bg-card px-6 py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
          {/* Orbit illustration */}
          <ChannelOrbit />
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-600">
              <Globe className="h-3.5 w-3.5" />
              {isTh ? "รองรับทุกช่องทาง" : "Every channel"}
            </span>
            <h2 className="mt-4 text-3xl font-extrabold leading-snug text-ink md:text-4xl">
              {isTh
                ? "ลูกค้าทักมาช่องทางไหน ก็ตอบได้หมด"
                : "Meet customers on any channel"}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-ink-muted">
              {isTh
                ? "เชื่อมต่อ LINE OA, Facebook, Instagram, TikTok, WhatsApp, Lazada และ Webchat ได้ในไม่กี่นาที ทุกข้อความเข้ามาที่เดียว AI พร้อมช่วยตอบตลอด 24 ชั่วโมง"
                : "Connect LINE OA, Facebook, Instagram, TikTok, WhatsApp, Lazada and Webchat in minutes. Everything lands in one place, with AI ready to help around the clock."}
            </p>
          </div>
        </div>
      </section>

      {/* About — personal admin chat mockup */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-600">
              <Bot className="h-3.5 w-3.5" />
              {isTh ? "ผู้ช่วยส่วนตัว" : "Personal assistant"}
            </span>
            <h2 className="mt-4 text-3xl font-extrabold leading-snug text-ink md:text-4xl">
              {isTh ? (
                <>
                  ช่วยธุรกิจของคุณ
                  <br />
                  เหมือนได้{" "}
                  <span className="text-gradient-brand">แอดมินส่วนตัว</span>
                </>
              ) : (
                <>
                  Runs your chats like a{" "}
                  <span className="text-gradient-brand">personal admin</span>
                </>
              )}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-ink-muted">
              {isTh
                ? "ป้อนข้อมูลสินค้า บริการ และคำถามที่พบบ่อยให้ AI เรียนรู้ แล้วปล่อยให้ AI คุยกับลูกค้าแทนคุณ ตอบตรงประเด็น สุภาพ และตรงตามข้อมูลบริษัทคุณเสมอ"
                : "Feed the AI your products, services and FAQs — then let it chat with customers for you. Always on-point, polite, and grounded in your own data."}
            </p>
          </div>
          {/* Chat mockup — animated */}
          <ChatMockup isTh={isTh} />
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-12 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-600">
            <Sparkles className="h-3.5 w-3.5" />
            {isTh ? "ทำไมต้องเรา" : "Why us"}
          </span>
          <h2 className="mt-4 text-3xl font-extrabold text-ink md:text-4xl">
            {isTh ? "ทำไมต้อง " : "Why "}
            <span className="text-gradient-brand">TopDee?</span>
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-ink-muted md:text-base">
            {isTh
              ? "ทุกอย่างที่ธุรกิจต้องการ รวมไว้ในที่เดียว ใช้งานง่าย ปรับเองได้"
              : "Everything your business needs, in one place — simple and fully self-serve."}
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => {
            const copy = isTh ? f.th : f.en;
            const FIcon = f.Icon;
            return (
              <article
                key={copy.title}
                className="group rounded-2xl border border-line2 bg-card p-7 transition-all duration-200 hover:-translate-y-1 hover:border-brand-300 hover:shadow-card-hover"
              >
                <div
                  className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${f.iconBg} ${f.iconFg} transition-transform duration-200 group-hover:scale-105`}
                >
                  <FIcon className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-ink">{copy.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                  {copy.body}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      {/* Big feature cards — Figma "Feature" bento */}
      <section className="bg-card px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-600">
              <Zap className="h-3.5 w-3.5" />
              Feature
            </span>
            <h2 className="mt-4 text-3xl font-extrabold text-ink md:text-4xl">
              {isTh ? (
                <>
                  ครบทุกฟีเจอร์ที่{" "}
                  <span className="text-gradient-brand">SME ต้องใช้</span>
                </>
              ) : (
                <>
                  Everything an <span className="text-gradient-brand">SME</span>{" "}
                  needs
                </>
              )}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-ink-muted md:text-base">
              {isTh
                ? "ตั้งค่าเองได้ทุกอย่าง ใช้งานง่าย เห็นผลตั้งแต่วันแรก"
                : "Configure everything yourself — easy to use, useful from day one."}
            </p>
          </div>

          <div className="space-y-6">
            {/* Row 1: wide upload + narrow AI mode */}
            <div className="grid gap-6 md:grid-cols-[1.5fr_1fr]">
              {/* Upload */}
              <article className="flex flex-col overflow-hidden rounded-2xl border border-line2 bg-card p-7">
                <h3 className="text-lg font-bold text-ink">
                  {isTh
                    ? "อัปโหลดข้อมูลของบริษัทให้ AI ตอบลูกค้าให้"
                    : "Upload your data, let AI answer customers"}
                </h3>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-muted">
                  {isTh
                    ? "โยนไฟล์ PDF, Word หรือ Excel เข้าไป AI จะอ่านและตอบลูกค้าโดยอ้างอิงจากข้อมูลของคุณ"
                    : "Drop in PDFs, Word docs or spreadsheets — the AI reads them and answers from your data."}
                </p>
                <div className="relative mt-6 flex min-h-[210px] flex-1 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-brand-softer to-white dark:from-brand-soft/25 dark:to-transparent">
                  <span
                    className="absolute h-24 w-24 rounded-full bg-brand-400/55 blur-2xl"
                    style={{ left: "14%", top: "26%" }}
                  />
                  <span
                    className="absolute h-24 w-24 rounded-full bg-amber-300/55 blur-2xl"
                    style={{ right: "16%", bottom: "14%" }}
                  />
                  <div className="relative z-10 w-44 rounded-xl bg-card p-4 shadow-card-hover">
                    <div className="space-y-2">
                      {[85, 100, 70, 92, 60].map((w, i) => (
                        <span
                          key={i}
                          className="block h-2 rounded-full bg-muted"
                          style={{ width: `${w}%` }}
                        />
                      ))}
                    </div>
                  </div>
                  <span className="absolute bottom-8 z-20 inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-brand-strong">
                    <Upload className="h-4 w-4" />
                    Upload
                  </span>
                </div>
              </article>

              {/* AI mode */}
              <article className="flex flex-col overflow-hidden rounded-2xl border border-line2 bg-card p-7">
                <h3 className="text-lg font-bold text-ink">
                  {isTh ? "ปรับโหมดการตอบของ AI ได้" : "Choose how AI replies"}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                  {isTh
                    ? "ให้ AI ตอบเอง ให้ทีมตอบเอง หรือให้ AI ช่วยร่างก่อนส่ง"
                    : "Full AI, manual, or AI-assisted drafting."}
                </p>
                <div className="relative mt-6 flex min-h-[210px] flex-1 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-brand-softer to-white dark:from-brand-soft/25 dark:to-transparent">
                  <div className="relative w-44 rounded-xl bg-card p-1.5 shadow-card-hover">
                    {(isTh
                      ? ["ตอบเอง", "ให้ AI ตอบ", "AI ช่วย"]
                      : ["Manual", "Full AI", "AI-assisted"]
                    ).map((opt, i) => (
                      <div
                        key={opt}
                        className={`rounded-lg px-3 py-2 text-sm ${i === 1 ? "bg-brand-soft font-semibold text-brand-600" : "text-ink-muted"}`}
                      >
                        {opt}
                      </div>
                    ))}
                  </div>
                  {/* cursor pointer */}
                  <svg
                    className="absolute"
                    style={{ right: "22%", top: "52%" }}
                    width="26"
                    height="26"
                    viewBox="0 0 24 24"
                    fill="#6c47ff"
                    stroke="#fff"
                    strokeWidth="1.5"
                  >
                    <path d="M4 2l7 18 2.4-7.2L21 10.4z" />
                  </svg>
                </div>
              </article>
            </div>

            {/* Row 2: narrow channels + wide widget/form */}
            <div className="grid gap-6 md:grid-cols-[1fr_1.5fr]">
              {/* Connect channels */}
              <article className="flex flex-col overflow-hidden rounded-2xl border border-line2 bg-card p-7">
                <h3 className="text-lg font-bold text-ink">
                  {isTh ? "เชื่อมต่อได้หลายช่อง" : "Connect many channels"}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                  {isTh
                    ? "คัดลอก webhook วาง token เสร็จใน 5 นาที ไม่ต้องเขียนโค้ด"
                    : "Copy a webhook, paste a token — done in 5 minutes, no code."}
                </p>
                <div className="relative mt-6 flex min-h-[210px] flex-1 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-brand-softer to-white dark:from-brand-soft/25 dark:to-transparent">
                  <span className="absolute h-40 w-40 rounded-full border border-dashed border-line2-strong/60" />
                  {[
                    { Icon: Globe, cls: "text-brand-500", pos: { top: "18%", left: "38%" } },
                    { Icon: MessageCircle, cls: "text-[#06C755]", pos: { top: "34%", right: "16%" } },
                    { Icon: Instagram, cls: "text-[#E1306C]", pos: { bottom: "18%", left: "44%" } },
                    { Icon: Facebook, cls: "text-[#1877F2]", pos: { bottom: "26%", left: "16%" } },
                  ].map(({ Icon: ChIcon, cls, pos }, i) => (
                    <span
                      key={i}
                      className={`absolute flex h-12 w-12 items-center justify-center rounded-2xl bg-card shadow-card-hover ${cls}`}
                      style={pos}
                    >
                      <ChIcon className="h-6 w-6" />
                    </span>
                  ))}
                </div>
              </article>

              {/* Chat widget / form */}
              <article className="flex flex-col overflow-hidden rounded-2xl border border-line2 bg-card p-7">
                <h3 className="text-lg font-bold text-ink">
                  {isTh
                    ? "ออกแบบหน้าแชทของคุณได้เอง"
                    : "Design your own chat widget"}
                </h3>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-muted">
                  {isTh
                    ? "ปรับข้อความต้อนรับ ปุ่มลัด และหน้าตาวิดเจ็ตให้เข้ากับแบรนด์ของคุณ"
                    : "Tweak the welcome message, quick replies and widget look to match your brand."}
                </p>
                <div className="relative mt-6 flex min-h-[210px] flex-1 flex-col justify-center gap-4 overflow-hidden rounded-xl bg-gradient-to-br from-brand-softer to-white px-6 dark:from-brand-soft/25 dark:to-transparent">
                  <div className="flex items-center gap-3">
                    <span className="h-9 w-2/5 rounded-lg border border-line2 bg-card" />
                    <span className="h-9 w-1/2 rounded-lg bg-brand-600" />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="h-9 w-1/2 rounded-lg border border-line2 bg-card" />
                    <span className="h-9 w-2/5 rounded-lg bg-brand-400" />
                  </div>
                </div>
              </article>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-page px-6 py-20">
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-600">
            <DollarSign className="h-3.5 w-3.5" />
            {isTh ? "แผนราคา" : "Pricing"}
          </span>
          <h2 className="mt-4 text-3xl font-extrabold text-ink md:text-4xl">
            {t("landing.pricing.title")}
          </h2>
          <p className="mt-3 text-base text-ink-muted">
            {t("landing.pricing.subtitle")}
          </p>
        </div>
        <div className="mx-auto mt-12 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {plans.length === 0 && (
            <p className="col-span-3 text-center text-sm text-ink-faint">Loading…</p>
          )}
          {plans.map((p) => {
            const popular = p.is_recommended;
            const priceLabel = p.price === 0
              ? (isTh ? "ฟรี" : "Free")
              : `฿${p.price.toLocaleString()}`;
            const trialLabel = p.expiry_days > 0
              ? (isTh ? `ทดลองใช้ ${p.expiry_days} วัน` : `${p.expiry_days}-day trial`)
              : null;
            return (
              <div
                key={p.id}
                className={`relative rounded-3xl border-2 bg-card p-8 transition-all duration-200 hover:-translate-y-1 ${popular ? "border-brand-600 shadow-brand-glow lg:scale-105" : "border-line2 hover:border-brand-200 hover:shadow-card-hover"}`}
              >
                {popular && (
                  <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-brand-600 px-4 py-1 text-xs font-bold text-white">
                    <Star className="h-3 w-3 fill-white" />
                    {isTh ? "ยอดนิยม" : "Popular"}
                  </span>
                )}
                <div className="text-sm font-semibold uppercase tracking-wider text-ink-muted">
                  {p.display_name}
                </div>
                <div className="mt-2 text-4xl font-extrabold text-ink">
                  {priceLabel}
                  {p.price > 0 && (
                    <span className="text-base font-medium text-ink-muted">
                      {isTh ? "/เดือน" : "/mo"}
                    </span>
                  )}
                </div>
                {trialLabel && (
                  <p className="mt-0.5 text-[12px] font-semibold text-brand-600">{trialLabel}</p>
                )}
                <p className="mb-6 mt-2 text-[13px] text-ink-faint">{p.description}</p>
                <ul className="mb-7 space-y-2.5">
                  {/* In "total" mode the plan exposes a single sum-of-all
                      cap; customers pick the providers themselves. We render
                      a single bullet instead of one per provider. */}
                  {p.limits.channel_limit_mode === 'total' ? (
                    <li className="flex items-center gap-2.5 text-sm text-ink">
                      <Check className="h-4 w-4 flex-shrink-0 text-brand-600" />
                      {p.limits.total_channels === -1
                        ? (isTh ? 'ช่องทางไม่จำกัด (เลือกได้เอง)' : 'Unlimited channels (any mix)')
                        : (isTh
                            ? `${p.limits.total_channels} ช่องทาง (เลือกได้เอง)`
                            : `${p.limits.total_channels} channels (any mix)`)}
                    </li>
                  ) : (
                    Object.entries(p.limits.channels).filter(([, n]) => n !== 0).map(([provider, n]) => (
                      <li key={provider} className="flex items-center gap-2.5 text-sm text-ink">
                        <Check className="h-4 w-4 flex-shrink-0 text-brand-600" />
                        {n === -1 ? (isTh ? `${provider} ไม่จำกัด` : `Unlimited ${provider}`) : `${n} ${provider}`}
                      </li>
                    ))
                  )}
                  <li className="flex items-center gap-2.5 text-sm text-ink">
                    <Check className="h-4 w-4 flex-shrink-0 text-brand-600" />
                    {p.limits.messages_per_month === -1
                      ? (isTh ? "ข้อความไม่จำกัด" : "Unlimited messages")
                      : `${p.limits.messages_per_month.toLocaleString()} ${isTh ? "ข้อความ/เดือน" : "msg/mo"}`}
                  </li>
                  <li className="flex items-center gap-2.5 text-sm text-ink">
                    <Check className="h-4 w-4 flex-shrink-0 text-brand-600" />
                    {p.limits.members === -1
                      ? (isTh ? "สมาชิกทีมไม่จำกัด" : "Unlimited members")
                      : `${p.limits.members} ${isTh ? "สมาชิก" : "members"}`}
                  </li>
                  <li className="flex items-center gap-2.5 text-sm text-ink">
                    <Check className="h-4 w-4 flex-shrink-0 text-brand-600" />
                    {p.limits.storage_mb === -1
                      ? (isTh ? "พื้นที่ไม่จำกัด" : "Unlimited storage")
                      : `${p.limits.storage_mb >= 1000 ? `${p.limits.storage_mb / 1000}GB` : `${p.limits.storage_mb}MB`} ${isTh ? "พื้นที่เก็บข้อมูล" : "storage"}`}
                  </li>
                </ul>
                <Link href="/login?tab=register">
                  <Button
                    fullWidth
                    variant={popular ? "primary" : "outline"}
                    className={popular ? "" : "border-brand-600 text-brand-600 hover:bg-brand-soft"}
                  >
                    {isTh ? "เริ่มใช้งาน" : "Get started"}
                  </Button>
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-card px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-600">
              <Star className="h-3.5 w-3.5 fill-brand-600" />
              {isTh ? "เสียงจากผู้ใช้" : "Testimonials"}
            </span>
            <h2 className="mt-4 text-3xl font-extrabold text-ink md:text-4xl">
              {isTh ? (
                <>
                  ธุรกิจไทยไว้ใจ{" "}
                  <span className="text-gradient-brand">TopDee</span>
                </>
              ) : (
                <>
                  Loved by{" "}
                  <span className="text-gradient-brand">Thai businesses</span>
                </>
              )}
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {(isTh
              ? [
                  {
                    q: "ตอบลูกค้าได้ไวขึ้นมาก AI จัดการคำถามซ้ำๆ ให้หมด ทีมมีเวลาไปดูเคสยากๆ",
                    n: "คุณมายด์",
                    r: "ร้านเสื้อผ้าออนไลน์",
                  },
                  {
                    q: "ตั้งค่าเองได้ทั้งหมดใน 10 นาที ไม่ต้องรอทีมเทค ราคาก็เป็นมิตรกับ SME",
                    n: "คุณต้น",
                    r: "ร้านอาหาร 3 สาขา",
                  },
                  {
                    q: "รวมแชททุกช่องทางไว้ที่เดียว ไม่พลาดลูกค้าอีกเลย ยอดขายโตขึ้นชัดเจน",
                    n: "คุณแนน",
                    r: "ร้านเครื่องสำอาง",
                  },
                ]
              : [
                  {
                    q: "We reply way faster now. The AI handles repetitive questions so the team focuses on hard cases.",
                    n: "Mind",
                    r: "Online fashion store",
                  },
                  {
                    q: "Set it all up myself in 10 minutes, no tech team needed. And the pricing is SME-friendly.",
                    n: "Ton",
                    r: "Restaurant, 3 branches",
                  },
                  {
                    q: "Every channel in one inbox — we never miss a customer now. Sales clearly went up.",
                    n: "Nan",
                    r: "Cosmetics shop",
                  },
                ]
            ).map((tst) => (
              <figure
                key={tst.n}
                className="flex flex-col rounded-2xl border border-line2 bg-page p-7"
              >
                <div className="mb-3 flex gap-0.5 text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400" />
                  ))}
                </div>
                <blockquote className="flex-1 text-sm leading-relaxed text-ink">
                  “{tst.q}”
                </blockquote>
                <figcaption className="mt-5 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-gradient font-bold text-white">
                    {tst.n.slice(-1)}
                  </span>
                  <span>
                    <span className="block text-sm font-bold text-ink">
                      {tst.n}
                    </span>
                    <span className="block text-xs text-ink-faint">{tst.r}</span>
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-page px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <div className="mb-12 text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-600">
              <MessageSquare className="h-3.5 w-3.5" />
              FAQ
            </span>
            <h2 className="mt-4 text-3xl font-extrabold text-ink md:text-4xl">
              {isTh ? "คำถามที่พบบ่อย" : "Frequently asked questions"}
            </h2>
          </div>

          <div className="space-y-3">
            {(isTh
              ? [
                  {
                    q: "ต้องเขียนโค้ดหรือมีทีมเทคไหม?",
                    a: "ไม่ต้องเลย ทุกอย่างตั้งค่าเองได้ผ่านหน้าเว็บ เชื่อมช่องทางด้วยการคัดลอก-วางเสร็จใน 5 นาที",
                  },
                  {
                    q: "AI เอาข้อมูลจากไหนมาตอบ?",
                    a: "จากไฟล์และข้อมูลที่คุณอัปโหลด เช่น PDF, Word, Excel และคำถามที่พบบ่อยที่คุณตั้งไว้",
                  },
                  {
                    q: "มีสัญญาผูกมัดหรือค่าติดตั้งไหม?",
                    a: "ไม่มีค่าติดตั้ง ไม่มีสัญญาขั้นต่ำ เริ่มต้น ฿490/เดือน ยกเลิกได้ทุกเมื่อ",
                  },
                  {
                    q: "ทดลองใช้ฟรีได้กี่วัน?",
                    a: "ทดลองใช้ฟรี 14 วัน ใช้งานได้ครบทุกฟีเจอร์ ไม่ต้องใส่บัตรเครดิต",
                  },
                ]
              : [
                  {
                    q: "Do I need to code or have a tech team?",
                    a: "Not at all. Everything is configured from the dashboard, and connecting a channel is copy-paste — done in 5 minutes.",
                  },
                  {
                    q: "Where does the AI get its answers?",
                    a: "From the files and data you upload — PDFs, Word, Excel — plus the FAQs you set up.",
                  },
                  {
                    q: "Any contract or setup fee?",
                    a: "No setup fee, no minimum contract. Starts at ฿490/month, cancel anytime.",
                  },
                  {
                    q: "How long is the free trial?",
                    a: "14 days free with every feature unlocked, no credit card required.",
                  },
                ]
            ).map((item) => (
              <details
                key={item.q}
                className="group rounded-xl border border-line2 bg-card px-5 py-4 [&_svg]:open:rotate-180"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-ink">
                  {item.q}
                  <ChevronDown className="h-4 w-4 flex-shrink-0 text-ink-faint transition-transform" />
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA banner — full-width gradient with glass card */}
      <section className="bg-brand-gradient px-6 py-20">
        <div className="mx-auto max-w-4xl rounded-3xl border border-white/25 bg-white/10 px-6 py-14 text-center backdrop-blur-sm md:px-12">
          <h2 className="mx-auto max-w-2xl text-3xl font-extrabold leading-tight text-white md:text-4xl">
            {isTh ? "พร้อมเริ่มใช้ TopDee แล้วหรือยัง?" : "Ready to try TopDee?"}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/85 md:text-base">
            {isTh
              ? "ทดลองใช้ฟรี 14 วัน ไม่ต้องใช้บัตรเครดิต ตั้งค่าเสร็จได้ภายในวันนี้ ยกเลิกได้ทุกเมื่อ"
              : "Start a 14-day free trial. No credit card, set up in a day, cancel anytime."}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/login">
              <Button
                size="lg"
                className="border !border-white/50 !bg-transparent !text-white hover:!bg-white/15"
              >
                {t("landing.signin")}
              </Button>
            </Link>
            <Link href="/login?tab=register">
              <Button
                size="lg"
                variant="white"
                iconRight={<ArrowRight className="h-4 w-4" />}
              >
                {t("landing.cta.tryFree")}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-line2 bg-card px-6 py-8 text-center text-sm text-ink-muted">
        © {new Date().getFullYear()} TopDee by Topdee · Made for Thai SMEs.
      </footer>
    </main>
  );
}
