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
        'rounded-[10px] bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-lg dark:bg-slate-700',
        'transition-all duration-200',
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
