"use client";

import { useState, type ComponentType } from "react";
import {
  MessageCircle,
  Facebook,
  Instagram,
  Globe,
} from "@/components/ui/Icon";

/**
 * Interactive "support every channel" illustration.
 *
 * A glossy 3D sphere with a cute smiley rests in the centre. Hover (or focus)
 * any channel icon on the orbit and the sphere turns to look toward it and
 * tints to that brand's colour — LINE green, Facebook blue, Instagram pink,
 * Webchat/Globe violet. With nothing hovered it faces front in its resting
 * lavender-violet.
 */

type Channel = {
  key: string;
  label: string;
  Icon: ComponentType<{ className?: string; size?: number | string }>;
  /** Tile position on the orbit (percent of the square container). */
  pos: { top?: string; left?: string; right?: string; bottom?: string };
  /** Brand base colour for the sphere + icon glow. */
  color: string;
  /** Lighter mid stop for the sphere gradient. */
  light: string;
  /** Darker shade used for the eyes + mouth (reads on the pastel sphere). */
  face: string;
  /** Icon tint. */
  iconColor: string;
  /** Tile tilt in degrees (negative leans left, positive leans right). */
  rot: number;
  /** Tile size in px (tiles vary in size for a playful look). */
  size: number;
  /** How far the face features slide toward this icon (px). */
  look: { x: number; y: number };
};

const REST_COLOR = "#B5A3FF";
const REST_FACE = "#7A5AF0";
const TILE =
  "bg-white/60 ring-1 ring-inset ring-white/70 backdrop-blur-md dark:bg-white/10 dark:ring-white/20";

const CHANNELS: Channel[] = [
  {
    key: "globe",
    label: "Webchat",
    Icon: Globe,
    pos: { top: "8%", left: "6%" },
    color: "#B5A3FF",
    light: "#E2DAFF",
    face: "#7A5AF0",
    iconColor: "text-brand-500",
    rot: -12,
    size: 66,
    look: { x: -10, y: -8 },
  },
  {
    key: "line",
    label: "LINE",
    Icon: MessageCircle,
    pos: { top: "30%", left: "80%" },
    color: "#7ED9A8",
    light: "#D6F3E5",
    face: "#05A34C",
    iconColor: "text-[#06C755]",
    rot: 14,
    size: 52,
    look: { x: 11, y: -2 },
  },
  {
    key: "ig",
    label: "Instagram",
    Icon: Instagram,
    pos: { top: "78%", left: "66%" },
    color: "#F291B8",
    light: "#FBDCE9",
    face: "#CE2064",
    iconColor: "text-[#E1306C]",
    rot: 13,
    size: 62,
    look: { x: 9, y: 9 },
  },
  {
    key: "fb",
    label: "Facebook",
    Icon: Facebook,
    pos: { top: "66%", left: "2%" },
    color: "#86B7F2",
    light: "#DCEBFB",
    face: "#1461D2",
    iconColor: "text-[#1877F2]",
    rot: -14,
    size: 56,
    look: { x: -10, y: 8 },
  },
];

const REST_LIGHT = "#E2DAFF";

/** Soft pastel sphere gradient — white highlight → light tint → base colour. */
const sphereGradient = (light: string, base: string) =>
  `radial-gradient(circle at 30% 20%, rgba(255,255,255,0.6), rgba(255,255,255,0) 48%), linear-gradient(145deg, #FFFFFF 0%, ${light} 52%, ${base} 100%)`;

export function ChannelOrbit() {
  const [hovered, setHovered] = useState<number | null>(null);

  const color = hovered === null ? REST_COLOR : CHANNELS[hovered].color;
  const light = hovered === null ? REST_LIGHT : CHANNELS[hovered].light;
  const faceColor = hovered === null ? REST_FACE : CHANNELS[hovered].face;
  const look = hovered === null ? { x: 0, y: 0 } : CHANNELS[hovered].look;

  return (
    <div
      className="relative mx-auto h-72 w-72 sm:h-80 sm:w-80"
      style={{ perspective: "900px" }}
    >
      {/* Concentric orbit rings */}
      <span className="pointer-events-none absolute left-1/2 top-1/2 h-[60%] w-[60%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-line2-strong/70" />
      <span className="pointer-events-none absolute left-1/2 top-1/2 h-[80%] w-[80%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-line2/70" />
      <span className="pointer-events-none absolute left-1/2 top-1/2 h-full w-full -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-line2/40" />

      {/* Soft glow that tints toward the active brand colour */}
      <span
        className="pointer-events-none absolute left-1/2 top-1/2 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl transition-colors duration-700"
        style={{ backgroundColor: `${color}55` }}
      />

      {/* 3D sphere with smiley */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 flex h-32 w-32 items-center justify-center rounded-full sm:h-36 sm:w-36"
        style={{
          transform: "translate(-50%, -50%)",
          backgroundImage: sphereGradient(light, color),
          boxShadow: `inset -9px -11px 26px rgba(80,60,150,0.24), inset 9px 11px 22px rgba(255,255,255,0.45), 0 22px 52px ${color}55`,
          transition: "box-shadow 0.6s ease",
        }}
      >
        {/* Glossy top highlight */}
        <span className="pointer-events-none absolute left-1/2 top-[12%] h-6 w-16 -translate-x-1/2 rounded-full bg-white/45 blur-md sm:h-7 sm:w-20" />

        {/* Cute face — centred at rest, slides toward the active icon */}
        <svg
          width="88"
          height="88"
          viewBox="0 0 100 100"
          fill="none"
          className="relative"
          style={{
            transform: `translate(${look.x}px, ${look.y}px)`,
            transition: "transform 0.7s cubic-bezier(0.34,1.25,0.5,1)",
            filter: "drop-shadow(0 1px 2px rgba(90,70,160,0.25))",
          }}
        >
          <circle
            cx="30"
            cy="34"
            r="12"
            style={{ fill: faceColor, transition: "fill 0.5s ease" }}
          />
          <circle
            cx="70"
            cy="34"
            r="12"
            style={{ fill: faceColor, transition: "fill 0.5s ease" }}
          />
          <path
            d="M25 66 Q50 90 75 66"
            strokeWidth="7.5"
            strokeLinecap="round"
            fill="none"
            style={{ stroke: faceColor, transition: "stroke 0.5s ease" }}
          />
        </svg>
      </div>

      {/* Channel icon tiles */}
      {CHANNELS.map((ch, i) => {
        const isActive = i === hovered;
        const { Icon: ChIcon } = ch;
        return (
          <button
            key={ch.key}
            type="button"
            aria-label={ch.label}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered((h) => (h === i ? null : h))}
            onFocus={() => setHovered(i)}
            onBlur={() => setHovered((h) => (h === i ? null : h))}
            className={`absolute flex items-center justify-center rounded-2xl outline-none transition-all duration-500 focus-visible:ring-2 focus-visible:ring-brand-300 ${TILE} ${ch.iconColor}`}
            style={{
              ...ch.pos,
              width: ch.size,
              height: ch.size,
              transform: `rotate(${ch.rot}deg) scale(${isActive ? 1.16 : 1})`,
              boxShadow: isActive
                ? `inset 0 1px 0 rgba(255,255,255,0.6), 0 0 0 2px ${ch.color}, 0 14px 30px ${ch.color}66`
                : "inset 0 1px 0 rgba(255,255,255,0.55), 0 10px 24px rgba(15,23,42,0.16)",
              zIndex: isActive ? 2 : 1,
            }}
          >
            <ChIcon size={Math.round(ch.size * 0.46)} />
          </button>
        );
      })}
    </div>
  );
}
