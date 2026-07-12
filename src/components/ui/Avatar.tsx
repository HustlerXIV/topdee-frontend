import { type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type AvatarTone = 'purple' | 'blue' | 'pink' | 'yellow' | 'green' | 'gray' | 'ai';

const toneMap: Record<AvatarTone, string> = {
  // Light fill / dark text in light mode; muted in dark mode.
  purple: 'bg-brand-100 text-brand-600 dark:bg-brand-soft dark:text-brand-200',
  blue: 'bg-fb-soft text-fb dark:bg-sky-900/40 dark:text-sky-300',
  pink: 'bg-ig-soft text-ig dark:bg-pink-900/40 dark:text-pink-300',
  yellow: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200',
  green: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200',
  gray: 'bg-muted text-ink-muted',
  ai: 'bg-brand-600 text-white',
};

const sizeMap = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-xl',
};

export function Avatar({
  initials,
  tone = 'purple',
  size = 'md',
  className,
  badge,
}: {
  initials: ReactNode;
  tone?: AvatarTone;
  size?: keyof typeof sizeMap;
  className?: string;
  badge?: ReactNode;
}) {
  return (
    <div className={cn('relative flex-shrink-0', className)}>
      <div
        className={cn(
          'flex items-center justify-center rounded-full font-bold',
          toneMap[tone],
          sizeMap[size],
        )}
      >
        {initials}
      </div>
      {badge && (
        <div className="absolute -right-0.5 -bottom-0.5 ring-2 ring-card rounded-full">
          {badge}
        </div>
      )}
    </div>
  );
}

const dotMap = {
  line: 'bg-line text-white',
  fb: 'bg-fb text-white',
  ig: 'bg-ig text-white',
  tiktok: 'bg-neutral-900 text-white',
  whatsapp: 'bg-emerald-500 text-white',
  lazada: 'bg-orange-500 text-white',
  web: 'bg-web text-white',
};

const dotIcon = {
  line: 'L',
  fb: 'f',
  ig: 'i',
  tiktok: 'T',
  whatsapp: 'W',
  lazada: 'Lz',
  web: 'w',
};

export function ChannelDot({ channel }: { channel: keyof typeof dotMap }) {
  return (
    <div
      className={cn(
        'flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-bold',
        dotMap[channel],
      )}
    >
      {dotIcon[channel]}
    </div>
  );
}
