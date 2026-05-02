import { type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function StatCard({
  label,
  value,
  unit,
  change,
  changeTone,
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  unit?: ReactNode;
  change?: ReactNode;
  changeTone?: 'up' | 'down' | 'neutral';
  className?: string;
}) {
  const changeColor =
    changeTone === 'up'
      ? 'text-emerald-500'
      : changeTone === 'down'
      ? 'text-red-500'
      : 'text-ink-muted';
  return (
    <div
      className={cn(
        'rounded-2xl border border-line2 bg-card px-6 py-5',
        className,
      )}
    >
      <div className="text-[13px] font-medium text-ink-muted">{label}</div>
      <div className="mt-2 text-3xl font-extrabold text-ink">
        {value}
        {unit && <span className="ml-1 text-base font-medium text-ink-muted">{unit}</span>}
      </div>
      {change && <div className={cn('mt-1 text-[13px]', changeColor)}>{change}</div>}
    </div>
  );
}
