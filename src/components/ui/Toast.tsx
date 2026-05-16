'use client';

import { useUI } from '@/store/ui';
import { cn } from '@/lib/cn';

export function ToastViewport() {
  const toast = useUI((s) => s.toast);
  const dismiss = useUI((s) => s.dismissToast);

  return (
    <div
      className={cn(
        'pointer-events-none fixed bottom-20 left-1/2 z-[9999] -translate-x-1/2',
        'rounded-[10px] px-5 py-3 text-sm font-semibold text-white shadow-lg',
        'transition-all duration-200',
        toast?.tone === 'error'
          ? 'bg-red-600 dark:bg-red-700'
          : toast?.tone === 'success'
            ? 'bg-emerald-600 dark:bg-emerald-700'
            : 'bg-slate-900 dark:bg-slate-700',
        toast ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
      )}
      role="status"
      aria-live="polite"
      onClick={dismiss}
    >
      {toast?.message ?? ' '}
    </div>
  );
}
