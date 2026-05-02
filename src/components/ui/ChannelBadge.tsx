import { type ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Channel = 'line' | 'fb' | 'ig' | 'web';

const styles: Record<Channel, string> = {
  line: 'bg-line-soft text-line dark:bg-emerald-900/40 dark:text-emerald-300',
  fb: 'bg-fb-soft text-fb dark:bg-sky-900/40 dark:text-sky-300',
  ig: 'bg-ig-soft text-ig dark:bg-pink-900/40 dark:text-pink-300',
  web: 'bg-web-soft text-web dark:bg-brand-soft dark:text-brand-200',
};

const labels: Record<Channel, string> = {
  line: 'LINE OA',
  fb: 'Facebook',
  ig: 'Instagram',
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
