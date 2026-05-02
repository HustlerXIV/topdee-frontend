import { type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

type CardProps = HTMLAttributes<HTMLDivElement> & {
  /** Removes the inner padding (useful when the body is a list with its own padding). */
  flush?: boolean;
};

export function Card({ className, flush, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-line2 bg-card',
        flush ? 'p-0' : 'p-6',
        'mb-5',
        className,
      )}
      {...rest}
    />
  );
}

export function CardHeader({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h3 className="flex items-center gap-2 text-base font-bold text-ink">
          {icon}
          {title}
        </h3>
        {description && (
          <p className="mt-1 text-sm text-ink-muted">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
