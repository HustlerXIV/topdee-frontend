'use client';

/**
 * Dialog — styled modal that matches the app design system.
 *
 * Two exports:
 *
 *   <Dialog>          — flexible, bring-your-own content + footer
 *   <ConfirmDialog>   — shorthand for the "are you sure?" pattern
 *
 * Both close on Escape and on backdrop click.
 */

import {
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/cn';
import { Button } from './Button';
import { X } from './Icon';

// ── Types ────────────────────────────────────────────────────────────────────

export type DialogVariant = 'default' | 'danger' | 'warning';

// ── Primitive Dialog ─────────────────────────────────────────────────────────

type DialogProps = {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  /** Icon shown in the coloured circle at the top-left of the header */
  icon?: ReactNode;
  variant?: DialogVariant;
  /** Tailwind max-width class. Default: 'max-w-md' */
  width?: string;
  children?: ReactNode;
  /** Hide the × button */
  hideClose?: boolean;
};

const iconRing: Record<DialogVariant, string> = {
  default: 'bg-brand-soft text-brand-600',
  danger:  'bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400',
  warning: 'bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
};

export function Dialog({
  open,
  onClose,
  title,
  description,
  icon,
  variant = 'default',
  width = 'max-w-md',
  children,
  hideClose = false,
}: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Auto-focus panel for keyboard users
  useEffect(() => {
    if (open) panelRef.current?.focus();
  }, [open]);

  if (!open || typeof window === 'undefined') return null;

  return createPortal(
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)', animation: 'backdropIn 0.15s ease' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      aria-modal="true"
      role="dialog"
    >
      {/* Panel */}
      <div
        ref={panelRef}
        tabIndex={-1}
        className={cn(
          'relative w-full rounded-2xl border border-line2 bg-card shadow-2xl outline-none',
          'overflow-hidden',
          width,
        )}
        style={{ animation: 'dialogIn 0.2s cubic-bezier(0.16,1,0.3,1)' }}
      >
        {/* Header */}
        {(title || icon || !hideClose) && (
          <div className="flex items-start gap-4 p-6">
            {icon && (
              <div className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                iconRing[variant],
              )}>
                {icon}
              </div>
            )}
            <div className="min-w-0 flex-1">
              {title && (
                <h2 className="text-base font-bold text-ink">{title}</h2>
              )}
              {description && (
                <p className="mt-1 text-sm leading-relaxed text-ink-muted">{description}</p>
              )}
            </div>
            {!hideClose && (
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-faint transition-colors hover:bg-muted hover:text-ink"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        {children}
      </div>
    </div>,
    document.body,
  );
}

// ── Dialog.Footer ────────────────────────────────────────────────────────────

Dialog.Footer = function DialogFooter({
  children,
  align = 'right',
}: {
  children: ReactNode;
  align?: 'left' | 'right' | 'between';
}) {
  return (
    <div className={cn(
      'flex flex-wrap gap-3 border-t border-line2 bg-muted/40 px-6 py-4',
      align === 'right'   && 'justify-end',
      align === 'left'    && 'justify-start',
      align === 'between' && 'justify-between',
    )}>
      {children}
    </div>
  );
};

// ── Dialog.Body ──────────────────────────────────────────────────────────────

Dialog.Body = function DialogBody({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('px-6 pb-6', className)}>
      {children}
    </div>
  );
};

// ── ConfirmDialog ────────────────────────────────────────────────────────────

type ConfirmDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: ReactNode;
  description?: ReactNode;
  /** Optional highlighted detail block shown below the description */
  detail?: ReactNode;
  icon?: ReactNode;
  variant?: DialogVariant;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
};

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  detail,
  icon,
  variant = 'default',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  loading = false,
}: ConfirmDialogProps) {
  const btnVariant =
    variant === 'danger'  ? 'danger'  :
    variant === 'warning' ? 'outline' : 'primary';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      icon={icon}
      variant={variant}
      hideClose
    >
      {detail && (
        <Dialog.Body>
          <div className="rounded-xl border border-line2 bg-muted/60 px-4 py-3 text-sm leading-relaxed text-ink-muted">
            {detail}
          </div>
        </Dialog.Body>
      )}
      <Dialog.Footer>
        <Button variant="outline" onClick={onClose} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button variant={btnVariant} onClick={onConfirm} disabled={loading}>
          {loading ? '…' : confirmLabel}
        </Button>
      </Dialog.Footer>
    </Dialog>
  );
}
