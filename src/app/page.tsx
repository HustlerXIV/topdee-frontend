"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ChannelBadge } from "@/components/ui/ChannelBadge";
import { CompactPreferences } from "@/components/PreferencesToggle";
import { useT } from "@/lib/i18n/useT";
import { usePreferences } from "@/store/preferences";
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

const PLANS = [
  {
    name: "Starter",
    price: "฿490",
    th: {
      desc: "สำหรับธุรกิจที่เพิ่งเริ่ม",
      cta: "เริ่มใช้งาน",
      features: [
        "2 ช่องทาง (LINE + FB)",
        "AI Chatbot 1 บอท",
        "ไฟล์ Knowledge Base 50MB",
        "1,000 ข้อความ/เดือน",
        "สมาชิกทีม 2 คน",
      ],
    },
    en: {
      desc: "For businesses just getting started",
      cta: "Start now",
      features: [
        "2 channels (LINE + FB)",
        "1 AI Chatbot",
        "50MB Knowledge Base",
        "1,000 messages/month",
        "2 team members",
      ],
    },
    popular: false,
  },
  {
    name: "Growth",
    price: "฿990",
    th: {
      desc: "สำหรับ SME ที่กำลังขยาย",
      cta: "เริ่มใช้งาน",
      features: [
        "4 ช่องทาง (LINE, FB, IG, Web)",
        "AI Chatbot 3 บอท",
        "ไฟล์ Knowledge Base 500MB",
        "10,000 ข้อความ/เดือน",
        "สมาชิกทีม 10 คน",
        "Analytics Dashboard",
      ],
    },
    en: {
      desc: "For SMBs that are scaling",
      cta: "Start now",
      features: [
        "4 channels (LINE, FB, IG, Web)",
        "3 AI Chatbots",
        "500MB Knowledge Base",
        "10,000 messages/month",
        "10 team members",
        "Analytics Dashboard",
      ],
    },
    popular: true,
  },
  {
    name: "Pro",
    price: "฿2,490",
    th: {
      desc: "สำหรับธุรกิจที่ต้องการเต็มพลัง",
      cta: "ติดต่อทีมขาย",
      features: [
        "ช่องทางไม่จำกัด",
        "AI Chatbot ไม่จำกัด",
        "Knowledge Base 5GB",
        "ข้อความไม่จำกัด",
        "สมาชิกทีมไม่จำกัด",
        "API Access + Webhook",
      ],
    },
    en: {
      desc: "For businesses going all-in",
      cta: "Talk to sales",
      features: [
        "Unlimited channels",
        "Unlimited AI Chatbots",
        "5GB Knowledge Base",
        "Unlimited messages",
        "Unlimited team",
        "API Access + Webhook",
      ],
    },
    popular: false,
  },
];

export default function HomePage() {
  const t = useT();
  const locale = usePreferences((s) => s.locale);
  const isTh = locale === "th";

  return (
    <main className="page-enter bg-page text-ink">
      {/* Top nav */}
      <nav className="sticky top-0 z-30 flex items-center gap-2 border-b border-line2 bg-card px-6 py-3">
        <Link
          href="/"
          className="mr-auto text-lg font-extrabold tracking-tight text-brand-600"
        >
          Top<span className="text-ink">Dee</span>
        </Link>
        <CompactPreferences />
        <Link href="/login">
          <Button variant="outline" size="sm">
            {t("landing.signin")}
          </Button>
        </Link>
        <Link href="/login?tab=register">
          <Button variant="primary" size="sm">
            {t("landing.signup")}
          </Button>
        </Link>
      </nav>

      {/* Hero */}
      <section className="bg-brand-gradient px-6 py-24 text-center text-white">
        <h1 className="mx-auto max-w-3xl text-[clamp(32px,5vw,56px)] font-extrabold leading-tight">
          {t("landing.heroTop")}
          <br />
          {t("landing.heroBottom")}{" "}
          <em className="not-italic rounded-lg bg-white/25 px-2">
            {t("landing.heroEmphasis")}
          </em>{" "}
          {t("landing.heroBottomTail")}
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed opacity-90">
          {t("landing.heroSub")}
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Link href="/login?tab=register">
            <Button variant="white" size="lg">
              {t("landing.cta.tryFree")}
            </Button>
          </Link>
          <Button
            size="lg"
            className="border-2 border-white/40 bg-white/15 text-white backdrop-blur hover:bg-white/25"
          >
            {t("landing.cta.watchVideo")}
          </Button>
        </div>
      </section>

      {/* Channel strip */}
      <section className="flex flex-wrap items-center justify-center gap-5 border-b border-line2 bg-card px-6 py-7">
        <span className="text-sm font-medium text-ink-faint">
          {t("landing.channels.label")}
        </span>
        <ChannelBadge
          channel="line"
          icon={<MessageCircle className="h-4 w-4" />}
        >
          LINE OA
        </ChannelBadge>
        <ChannelBadge channel="fb" icon={<Facebook className="h-4 w-4" />}>
          Facebook
        </ChannelBadge>
        <ChannelBadge channel="ig" icon={<Instagram className="h-4 w-4" />}>
          Instagram
        </ChannelBadge>
        <ChannelBadge channel="web" icon={<Globe className="h-4 w-4" />}>
          Webchat
        </ChannelBadge>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="mb-12 text-center text-3xl font-extrabold text-ink">
          {t("landing.features.title")}
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => {
            const copy = isTh ? f.th : f.en;
            const FIcon = f.Icon;
            return (
              <article
                key={copy.title}
                className="rounded-2xl border border-line2 bg-card p-7 transition hover:-translate-y-1 hover:border-brand-300 hover:shadow-card-hover"
              >
                <div
                  className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${f.iconBg} ${f.iconFg}`}
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

      {/* Pricing */}
      <section className="bg-page px-6 py-16">
        <h2 className="text-center text-3xl font-extrabold text-ink">
          {t("landing.pricing.title")}
        </h2>
        <p className="mt-3 text-center text-base text-ink-muted">
          {t("landing.pricing.subtitle")}
        </p>
        <div className="mx-auto mt-12 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {PLANS.map((p) => {
            const copy = isTh ? p.th : p.en;
            return (
              <div
                key={p.name}
                className={`relative rounded-3xl border-2 bg-card p-8 ${p.popular ? "border-brand-600" : "border-line2"}`}
              >
                {p.popular && (
                  <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-brand-600 px-4 py-1 text-xs font-bold text-white">
                    <Star className="h-3 w-3 fill-white" />
                    {isTh ? "ยอดนิยม" : "Popular"}
                  </span>
                )}
                <div className="text-sm font-semibold uppercase tracking-wider text-ink-muted">
                  {p.name}
                </div>
                <div className="mt-2 text-4xl font-extrabold text-ink">
                  {p.price}
                  <span className="text-base font-medium text-ink-muted">
                    {isTh ? "/เดือน" : "/mo"}
                  </span>
                </div>
                <p className="mb-6 mt-2 text-[13px] text-ink-faint">
                  {copy.desc}
                </p>
                <ul className="mb-7 space-y-2.5">
                  {copy.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-center gap-2.5 text-sm text-ink"
                    >
                      <Check className="h-4 w-4 flex-shrink-0 text-brand-600" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/login?tab=register">
                  <Button
                    fullWidth
                    variant={p.popular ? "primary" : "outline"}
                    className={
                      p.popular
                        ? ""
                        : "border-brand-600 text-brand-600 hover:bg-brand-soft"
                    }
                  >
                    {copy.cta}
                  </Button>
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      <footer className="border-t border-line2 bg-card px-6 py-8 text-center text-sm text-ink-muted">
        © {new Date().getFullYear()} TopDee by Topdee · Made for Thai SMEs.
      </footer>
    </main>
  );
}
