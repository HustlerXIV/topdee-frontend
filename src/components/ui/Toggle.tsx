'use client';

import { type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> & {
  size?: 'sm' | 'md';
};

export function Toggle({ size = 'md', className, checked, ...rest }: Props) {
  const dims = size === 'sm' ? 'h-5 w-9' : 'h-6 w-11';
  const knob =
    size === 'sm' ? 'h-3.5 w-3.5 left-0.5 top-0.5' : 'h-4 w-4 left-1 top-1';
  const knobShift =
    size === 'sm' ? 'peer-checked:translate-x-4' : 'peer-checked:translate-x-5';

  return (
    <label className={cn('relative inline-flex cursor-pointer', dims, className)}>
      <input
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        {...rest}
      />
      <span
        className={cn(
          'absolute inset-0 rounded-full bg-line2 transition-colors peer-checked:bg-brand-600',
        )}
      />
      <span
        className={cn(
          'absolute rounded-full bg-card shadow transition-transform',
          knob,
          knobShift,
        )}
      />
    </label>
  );
}
