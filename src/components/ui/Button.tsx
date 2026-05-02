import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'outline' | 'ghost' | 'danger' | 'soft' | 'white';
type Size = 'sm' | 'md' | 'lg';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  fullWidth?: boolean;
};

const sizeMap: Record<Size, string> = {
  sm: 'h-9 px-4 text-[13px]',
  md: 'h-10 px-5 text-sm',
  lg: 'h-12 px-7 text-[15px]',
};

const variantMap: Record<Variant, string> = {
  primary:
    'bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-60 shadow-sm',
  outline:
    'bg-card text-ink-muted border border-line2 hover:bg-muted hover:border-line2-strong',
  ghost: 'bg-transparent text-ink-muted hover:bg-muted',
  danger:
    'bg-card text-red-500 border border-red-300/60 hover:bg-red-50 dark:hover:bg-red-950/30',
  soft:
    'bg-brand-soft text-brand-600 border border-brand-200 hover:bg-brand-100 dark:border-brand-700/50 dark:hover:bg-brand-soft/80',
  white:
    'bg-white text-brand-600 hover:bg-slate-50 shadow-[0_4px_20px_rgba(0,0,0,0.15)]',
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  {
    variant = 'primary',
    size = 'md',
    className,
    children,
    iconLeft,
    iconRight,
    fullWidth,
    type = 'button',
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-[10px] font-semibold transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300',
        sizeMap[size],
        variantMap[variant],
        fullWidth && 'w-full',
        className,
      )}
      {...rest}
    >
      {iconLeft}
      {children}
      {iconRight}
    </button>
  );
});
