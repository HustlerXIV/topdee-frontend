import { type ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Tone =
  | 'admin'
  | 'agent'
  | 'viewer'
  | 'paid'
  | 'due'
  | 'pending'
  | 'success'
  | 'warning'
  | 'info'
  | 'neutral'
  | 'default'
  | 'error';

const toneMap: Record<Tone, string> = {
  admin: 'bg-brand-100 text-brand-600 dark:bg-brand-soft dark:text-brand-200',
  agent: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-200',
  viewer: 'bg-muted text-ink-muted',
  paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200',
  due: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-200',
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-200',
  success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200',
  warning: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-200',
  info: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-200',
  neutral: 'bg-muted text-ink-muted',
  default: 'bg-muted text-ink-muted',
  error: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

export function Badge({
  tone = 'neutral',
  children,
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold',
        toneMap[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
