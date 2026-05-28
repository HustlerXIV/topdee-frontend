import { type ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Channel =
  | 'line'
  | 'fb'
  | 'ig'
  | 'tiktok'
  | 'whatsapp'
  | 'lazada'
  | 'web';

const styles: Record<Channel, string> = {
  line: 'bg-line-soft text-line dark:bg-emerald-900/40 dark:text-emerald-300',
  fb: 'bg-fb-soft text-fb dark:bg-sky-900/40 dark:text-sky-300',
  ig: 'bg-ig-soft text-ig dark:bg-pink-900/40 dark:text-pink-300',
  // TikTok — no brand tokens in the design system yet; lean on neutral
  // grays which match TikTok's monochrome aesthetic.
  tiktok:
    'bg-neutral-100 text-neutral-900 dark:bg-neutral-800/60 dark:text-neutral-100',
  // WhatsApp — emerald to match the brand color.
  whatsapp:
    'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  // Lazada — orange, matching the marketplace's brand color.
  lazada:
    'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  web: 'bg-web-soft text-web dark:bg-brand-soft dark:text-brand-200',
};

const labels: Record<Channel, string> = {
  line: 'LINE OA',
  fb: 'Facebook',
  ig: 'Instagram',
  tiktok: 'TikTok',
  whatsapp: 'WhatsApp',
  lazada: 'Lazada',
  web: 'Webchat',
};

export function ChannelBadge({
  channel,
  icon,
  children,
  className,
}: {
  channel: Channel;
  icon?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold',
        styles[channel],
        className,
      )}
    >
      {icon}
      {children ?? labels[channel]}
    </span>
  );
}
