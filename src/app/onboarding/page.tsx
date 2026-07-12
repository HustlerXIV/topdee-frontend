'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Button } from '@/components/ui/Button';
import { Input, Select, FormGroup } from '@/components/ui/Input';
import { useAuth } from '@/store/auth';
import { useUI } from '@/store/ui';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n/useT';
import { type DictKey } from '@/lib/i18n/dictionary';
import { cn } from '@/lib/cn';
import {
  MessageCircle,
  Facebook,
  Instagram,
  Globe,
  Smile,
  Building2,
  Lightbulb,
  Plug,
  Bot,
  PartyPopper,
} from '@/components/ui/Icon';
import type { ComponentType } from 'react';

type Step = 1 | 2 | 3 | 4;
type Channel = 'line' | 'fb' | 'ig' | 'web';
type Persona = 'friendly' | 'professional';

const STEPS: { n: Step; key: DictKey }[] = [
  { n: 1, key: 'onboarding.step.account' },
  { n: 2, key: 'onboarding.step.channel' },
  { n: 3, key: 'onboarding.step.bot' },
  { n: 4, key: 'onboarding.step.done' },
];

type ChannelSpec = {
  id: Channel;
  Icon: ComponentType<{ className?: string }>;
  iconClass: string;
  name: string;
  descTh: string;
  descEn: string;
};

const CHANNELS: ChannelSpec[] = [
  { id: 'line', Icon: MessageCircle, iconClass: 'text-line', name: 'LINE OA', descTh: 'เชื่อมต่อง่ายที่สุด', descEn: 'Easiest to connect' },
  { id: 'fb', Icon: Facebook, iconClass: 'text-fb', name: 'Facebook', descTh: 'Messenger & Page', descEn: 'Messenger & Page' },
  { id: 'ig', Icon: Instagram, iconClass: 'text-ig', name: 'Instagram', descTh: 'Direct Messages', descEn: 'Direct Messages' },
  { id: 'web', Icon: Globe, iconClass: 'text-web', name: 'Webchat', descTh: 'ฝังบนเว็บไซต์', descEn: 'Embed on your site' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const t = useT();
  const showToast = useUI((s) => s.showToast);
  const { token, user, hydrated, hydrate } = useAuth();

  // Begin at step 2 — registration counts as step 1.
  const [step, setStep] = useState<Step>(2);
  const [picked, setPicked] = useState<Set<Channel>>(new Set(['line']));
  const [botName, setBotName] = useState('AI Assistant');
  const [businessType, setBusinessType] = useState('ecommerce');
  const [persona, setPersona] = useState<Persona>('friendly');
  const [finishing, setFinishing] = useState(false);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  useEffect(() => {
    if (hydrated && !token) router.replace('/login?tab=register');
  }, [hydrated, token, router]);

  function togglePick(id: Channel) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function finish() {
    if (finishing) return;
    setFinishing(true);
    // Persist the bot config the user just set up. The onboarding persona set
    // ('friendly' | 'professional') maps onto the bot's persona vocabulary
    // ('professional' → 'formal'). Errors already surface a toast from the API
    // layer; we still route on completion so the user is never stuck here.
    const botPersona = persona === 'professional' ? 'formal' : 'friendly';
    try {
      await api.bot.update({
        name: botName.trim() || 'AI Assistant',
        persona: botPersona,
      });
    } catch {
      // swallow — toast already shown; continue.
    }
    // Business type lives on the workspace, not the bot. Best-effort: a fresh
    // onboarding workspace has no website yet, so sending an empty one is safe.
    try {
      await api.settings.updateWorkspace({
        name: user?.workspace ?? '',
        website: '',
        business_type: businessType,
      });
    } catch {
      // swallow — non-critical for finishing onboarding.
    }
    showToast(t('onboarding.finish'), 'success');
    router.push('/inbox');
  }

  // Tip uses the locale via the store — read it through t.
  // (We don't need explicit locale here because every visible string runs through t().)

  return (
    <AuthLayout>
      <div className="w-full max-w-[560px] rounded-3xl bg-card p-10 shadow-brand-glow">
        {/* Step indicator */}
        <ol className="mb-9 flex items-center">
          {STEPS.map((s, idx) => {
            const state: 'done' | 'active' | 'pending' =
              s.n < step ? 'done' : s.n === step ? 'active' : 'pending';
            return (
              <li key={s.n} className="flex flex-1 items-center">
                <div className="flex flex-1 flex-col items-center">
                  <div
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-bold',
                      state === 'done' && 'bg-brand-600 text-white',
                      state === 'active' && 'bg-brand-600 text-white ring-4 ring-brand-100 dark:ring-brand-soft',
                      state === 'pending' && 'bg-muted text-ink-faint',
                    )}
                  >
                    {state === 'done' ? '✓' : s.n}
                  </div>
                  <div
                    className={cn(
                      'mt-1.5 text-[11px] font-medium',
                      state === 'pending' ? 'text-ink-faint' : 'text-brand-600',
                    )}
                  >
                    {t(s.key)}
                  </div>
                </div>
                {idx < STEPS.length - 1 && (
                  <div
                    className={cn('-mt-5 h-0.5 flex-1', s.n < step ? 'bg-brand-600' : 'bg-line2')}
                  />
                )}
              </li>
            );
          })}
        </ol>

        {step === 2 && (
          <>
            <h2 className="flex items-center gap-2 text-xl font-extrabold text-ink">
              <Plug className="h-5 w-5 text-brand-600" />
              {t('onboarding.step2.title').replace('🔌 ', '')}
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-ink-muted">
              {t('onboarding.step2.sub')}
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              {CHANNELS.map((c) => {
                const selected = picked.has(c.id);
                const CIcon = c.Icon;
                return (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => togglePick(c.id)}
                    className={cn(
                      'rounded-2xl border-2 p-5 text-center transition-colors',
                      selected
                        ? 'border-brand-600 bg-brand-soft'
                        : 'border-line2 hover:border-brand-300 hover:bg-brand-soft/40',
                    )}
                  >
                    <CIcon className={cn('mx-auto h-8 w-8', c.iconClass)} />
                    <div className="mt-2 text-sm font-bold text-ink">{c.name}</div>
                    <div className="text-xs text-ink-faint">
                      {t('common.lang.th') === 'ไทย' ? c.descTh : c.descEn}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 flex items-start gap-2 rounded-[10px] bg-yellow-100/80 px-4 py-3 text-sm text-yellow-900 dark:bg-yellow-900/30 dark:text-yellow-200">
              <Lightbulb className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>{t('onboarding.tip.line').replace('💡 ', '').replace(/^\s*/, '')}</span>
            </div>

            <div className="mt-6 flex justify-between">
              <Button variant="outline" onClick={() => router.back()}>
                ← {t('common.back')}
              </Button>
              <Button onClick={() => setStep(3)} disabled={picked.size === 0}>
                {t('onboarding.next.bot')}
              </Button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="flex items-center gap-2 text-xl font-extrabold text-ink">
              <Bot className="h-5 w-5 text-brand-600" />
              {t('onboarding.step3.title').replace('🤖 ', '')}
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-ink-muted">{t('onboarding.step3.sub')}</p>

            <div className="mt-6 space-y-4">
              <FormGroup label={t('onboarding.botName')}>
                <Input value={botName} onChange={(e) => setBotName(e.target.value)} />
              </FormGroup>

              <FormGroup label={t('onboarding.business')}>
                <Select
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                >
                  <option value="ecommerce">E-commerce</option>
                  <option value="food">Food & Beverage</option>
                  <option value="service">Service</option>
                  <option value="realestate">Real Estate</option>
                  <option value="health">Health & Beauty</option>
                  <option value="other">Other</option>
                </Select>
              </FormGroup>

              <FormGroup label={t('onboarding.persona.q')}>
                <div className="grid grid-cols-2 gap-3">
                  {(
                    [
                      { id: 'friendly', Icon: Smile, key: 'onboarding.persona.friendly' },
                      { id: 'professional', Icon: Building2, key: 'onboarding.persona.professional' },
                    ] as { id: Persona; Icon: ComponentType<{ className?: string }>; key: DictKey }[]
                  ).map((p) => {
                    const PIcon = p.Icon;
                    return (
                      <button
                        type="button"
                        key={p.id}
                        onClick={() => setPersona(p.id)}
                        className={cn(
                          'rounded-2xl border-2 p-4 text-center transition-colors',
                          persona === p.id
                            ? 'border-brand-600 bg-brand-soft'
                            : 'border-line2 hover:border-brand-300',
                        )}
                      >
                        <PIcon className="mx-auto h-6 w-6 text-brand-600" />
                        <div className="mt-1 text-[13px] font-bold text-ink">{t(p.key)}</div>
                      </button>
                    );
                  })}
                </div>
              </FormGroup>
            </div>

            <div className="mt-6 flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>
                ← {t('common.back')}
              </Button>
              <Button onClick={finish} disabled={finishing}>
                {finishing ? '…' : t('onboarding.finish')}
              </Button>
            </div>
          </>
        )}
      </div>
    </AuthLayout>
  );
}
