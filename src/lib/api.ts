// Minimal typed client for the Go backend. Lives in the browser; reads token
// from localStorage. For SSR/route handlers, pass the token explicitly.

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

export type KnowledgeFile = {
  filename: string;
  size: number;
  chunks: number;
  uploaded_at: string;
};

export type KnowledgeBase = {
  id: string;
  tenant_id: string;
  name: string;
  description: string;
  files: KnowledgeFile[];
  chunk_count: number;
  created_at: string;
  updated_at: string;
};

// One bound external account (FB page, LINE OA, etc.). Tenants can have many
// of these per provider, capped by their plan tier.
//
// `webhook_url` is the URL the customer pastes into the platform's console
// (e.g. LINE Developers → Messaging API → Webhook URL). We compute it
// server-side from BACKEND_PUBLIC_URL so the dashboard never has to know
// the backend's public hostname.
export type ChannelConnection = {
  id: string;
  provider: 'facebook' | 'line' | string;
  external_id: string;
  display_name: string;
  status: 'active' | 'error' | 'disabled' | string;
  error?: string;
  webhook_url: string;
  created_at: string;
  updated_at: string;
};

export type ChannelsResponse = {
  connections: ChannelConnection[];
  /** Per-provider plan caps, e.g. { facebook: 3, line: 1 } */
  limits: Record<string, number>;
  /** Per-provider current usage, e.g. { facebook: 2 } */
  used: Record<string, number>;
  /**
   * "per_provider" — each provider has its own cap (legacy behavior, UI
   *   renders one section per provider).
   * "total" — a single total cap (`total`) bounds the sum of all
   *   connections; the UI shows a unified "Connect a channel" picker.
   *
   * A provider with `limits[provider] === 0` is still hidden regardless
   * of mode (admin override for tier gating).
   */
  channel_limit_mode: 'per_provider' | 'total' | string;
  /** Max total connections across all providers (only meaningful in total mode). -1 = unlimited. */
  total: number;
  /** Sum of `used` across providers — convenience for the total-mode header. */
  total_used: number;
};

export type FacebookOAuthStartResp = {
  login_url: string;
  state: string;
};

export type FacebookOAuthPagesResp = {
  state: string;
  pages: { id: string; name: string; category?: string }[];
};

export type InstagramOAuthStartResp = {
  login_url: string;
  state: string;
};

export type InstagramOAuthAccountsResp = {
  state: string;
  accounts: { igid: string; name: string; username?: string }[];
};

export type TikTokOAuthStartResp = {
  login_url: string;
  state: string;
};

export type TikTokOAuthAccountsResp = {
  state: string;
  accounts: { business_id: string; display_name: string; username?: string }[];
};

export type WhatsAppOAuthStartResp = {
  login_url: string;
  state: string;
};

export type WhatsAppOAuthPhoneNumbersResp = {
  state: string;
  phone_numbers: {
    phone_number_id: string;
    display_phone_number: string;
    verified_name?: string;
    quality_rating?: string;
    waba_id: string;
    waba_name?: string;
  }[];
};

export type LazadaOAuthStartResp = {
  login_url: string;
  state: string;
};

export type Message = {
  id: string;
  conversation_id: string;
  role: 'user' | 'ai' | 'human' | 'suggestion';
  content: string;
  channel: string;
  external_user_id?: string;
  sender_name?: string;
  attachments?: MessageAttachment[];
  created_at: string;
};

export type MessageAttachment = {
  id?: string;
  type: 'image' | 'video' | 'audio' | 'file' | string;
  url?: string;
  content_type?: string;
  name?: string;
};

// One row in the inbox list — aggregated from the messages collection.
export type InboxConversation = {
  id: string;                     // conversation_id, e.g. "line:Uxxxx:Uyyyy"
  channel: string;                // "line" | "facebook" | …
  external_user_id: string;
  customer_name: string;          // "LINE User abcd12"
  preview: string;                // last message, rune-truncated
  last_message_at: string;
  last_sender_role: 'user' | 'ai' | 'human' | 'suggestion';
  message_count: number;
  /** True when the AI couldn't answer or the customer asked for a human. */
  needs_human: boolean;
};

// ── Team / members ────────────────────────────────────────────────
export type Role = 'owner' | 'admin' | 'agent' | 'viewer';

export type Member = {
  id: string;
  tenant_id: string;
  name: string;
  email: string;
  role: Role;
  is_platform_admin?: boolean;
  suspended?: boolean;
  created_at: string;
};

export type AuthUser = {
  id?: string;
  tenant_id?: string;
  name?: string;
  email: string;
  role?: Role;
  is_platform_admin?: boolean;
  isAdmin?: boolean;
};

// ── Platform admin ───────────────────────────────────────────────
export type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'paused';

export type Subscription = {
  status: SubscriptionStatus;
  trial_ends_at?: string | null;
  current_period_end?: string | null;
  canceled_at?: string | null;
  cancel_at_period_end: boolean;
  admin_notes: string;
  updated_at?: string;
};

export type AdminTenant = {
  id: string;
  name: string;
  plan: string;
  usage_tokens: number;
  suspended: boolean;
  member_count: number;
  created_at: string;
};

// Full tenant payload returned by GET /admin/tenants/:id — same as the
// stored Mongo doc with secrets stripped.
export type AdminTenantFull = AdminTenant & {
  subscription?: Subscription;
};

export type PlanLimits = {
  /**
   * "per_provider" (default) — each provider's cap in `channels` applies.
   * "total" — a single cap (`total_channels`) bounds the sum across
   * providers; `channels[provider] === 0` still hides a provider.
   */
  channel_limit_mode?: 'per_provider' | 'total' | string;
  /** Sum-of-all-providers cap. Only used when channel_limit_mode === 'total'. -1 = unlimited. */
  total_channels?: number;
  channels: Record<string, number>; // keyed by provider slug, -1 = unlimited
  members: number;
  messages_per_month: number;
  knowledge_bases: number;
  storage_mb: number;
};

export type Plan = {
  id: string;
  display_name: string;
  description: string;
  price: number;
  currency: string;
  is_active: boolean;
  is_public: boolean;       // false = hidden/custom, only assignable by admin
  is_recommended: boolean;  // shows "Popular" badge on pricing page
  sort_order: number;
  expiry_days: number; // 0 = forever
  /** Monthly Stripe Price ID (price_xxx). Set in Admin → Plans. */
  stripe_price_id?: string;
  /** Yearly Stripe Price ID — leave empty if no annual billing option. */
  stripe_price_id_yearly?: string;
  /** Display price charged per year, e.g. 9900 for ฿9,900/yr. */
  yearly_price?: number;
  /** Badge shown next to the yearly option, e.g. "2 months free", "Save 17%". */
  yearly_saving_label?: string;
  limits: PlanLimits;
  created_at: string;
  updated_at: string;
};

export type PlanInput = Omit<Plan, 'created_at' | 'updated_at' | 'is_active' | 'is_public' | 'is_recommended'> & {
  is_active: boolean;
  is_public: boolean;
  is_recommended: boolean;
  stripe_price_id?: string;
};

export type AdminMetrics = {
  tenants: {
    total: number;
    suspended: number;
    by_plan: Record<string, number>;
  };
  users: { total: number; suspended: number; admins: number };
  messages: { total: number };
  knowledge_bases: { total: number; chunks: number };
};

export type TeamInvite = {
  id: string;
  tenant_id: string;
  email: string;
  role: Role;
  status: 'pending' | 'accepted' | 'revoked' | 'expired';
  invited_by: string;
  created_at: string;
  expires_at: string;
  accepted_at?: string;
};

// Returned by POST /team/invites and POST /team/invites/:id/resend — the
// accept_url is what you share with the recipient until email delivery
// is wired up.
export type CreateInviteResp = {
  invite: TeamInvite;
  accept_url: string;
};

// ── Billing / payment methods ────────────────────────────────────────
export type PaymentMethod = {
  id: string;
  brand: string;   // "visa" | "mastercard" | "amex" | …
  last4: string;
  exp_month: number; // 1–12
  exp_year: number;  // e.g. 2027
  is_default: boolean;
};

export type Invoice = {
  id: string;
  number: string;
  amount_paid: number;   // in smallest unit (satang / cents)
  currency: string;      // "thb" | "usd" …
  status: string;        // "paid" | "open" | "void" | "uncollectible"
  source: string;        // "invoice" (card/subscription) | "promptpay"
  description: string;   // e.g. "Starter — 1 Month" for PromptPay
  period_start: string;  // "2025-01-01"
  period_end: string;    // "2025-02-01"
  invoice_url: string;   // hosted Stripe invoice page or receipt
  pdf_url: string;
  created_at: string;    // "2025-01-01"
};

// ── Billing / self-service ───────────────────────────────────────────
export type BillingUsage = {
  members: number;
  channels: number;
  messages_this_month: number;
};

export type BillingInfo = {
  plan: Plan;
  subscription?: Subscription;
  has_subscription: boolean;
  has_stripe_customer: boolean;
  usage: BillingUsage;
  /** > 0 when the tenant has an active referral discount, e.g. 10 = 10% */
  referral_discount_percent?: number;
  referral_discount_expires_at?: string;
};

// ── Analytics ────────────────────────────────────────────────────────
export type DailyStat = {
  date: string;   // "YYYY-MM-DD"
  count: number;
};

export type ChannelStat = {
  channel: string; // "line" | "facebook" | …
  count: number;
  pct: number;     // 0–100
};

export type AnalyticsStats = {
  total_conversations: number;
  prev_total_conversations: number;
  ai_resolved_count: number;
  ai_resolved_pct: number;
  prev_ai_resolved_pct: number;
  human_takeovers: number;
  unique_customers: number;
  prev_unique_customers: number;
  channel_breakdown: ChannelStat[];
  daily: DailyStat[];
  days_in_range: number;
};

// One row in the playground "past tests" picker.
export type PlaygroundConversationSummary = {
  id: string;
  first_message_at: string;
  last_message_at: string;
  preview: string;       // first user message (or empty if there was none)
  message_count: number;
};

// One row of the weekly schedule. Open/Close are 24h "HH:MM" wall-clock
// in the workspace timezone.
export type DayHours = {
  enabled: boolean;
  open: string;
  close: string;
};

// Workspace business hours. `days` is always a 7-tuple, indexed Sun..Sat
// (matches Date#getDay()), so the UI can map straight to weekday rows.
export type BusinessHours = {
  timezone: string;                // IANA, e.g. "Asia/Bangkok"
  out_of_hours_message: string;
  days: DayHours[];                // length 7, Sun..Sat
  updated_at?: string;
};

export type NotificationSettings = {
  new_chat: boolean;
  ai_cant_answer: boolean;
  quota_warning: boolean;
  daily_summary: boolean;
};

export type SettingsSnapshot = {
  account: AccountSettings;
  workspace: WorkspaceSettings;
  notification: NotificationSettings;
};

export type AccountSettings = {
  name: string;
  email: string;
  role: string;
};

export type WorkspaceSettings = {
  name: string;
  timezone: string;
  website: string;
  business_type: string;
  logo_url: string;
};

// Per-tenant bot config. The backend always returns a fully-populated object
// — empty fields fall back to env defaults server-side. So the UI can render
// without null-checking, and a save round-trips the same shape.
export type BotSettings = {
  name: string;
  language: 'th' | 'en' | 'mix' | string;
  persona: 'friendly' | 'formal' | 'fun' | 'concise' | string;
  mode: 'auto' | 'suggest' | 'manual' | string;
  system_prompt: string;
  model: string;
  temperature: number | null;
  updated_at?: string;
};

// ── Referral ────────────────────────────────────────────────────────

export type ReferralCode = {
  /** The code string itself (e.g. "NAPAT26"). Also the _id. */
  id: string;
  tenant_id: string;
  user_id: string;
  created_at: string;
};

export type Referral = {
  id: string;
  code: string;
  referrer_tenant_id: string;
  referrer_user_id: string;
  referred_tenant_id: string;
  referred_tenant_name: string;
  status: 'active' | 'paused' | string;
  commission_count: number;
  total_earned: number; // satang
  created_at: string;
  updated_at: string;
};

export type ReferralStats = {
  total_referrals: number;
  total_earned: number; // satang
  referrals: Referral[];
};

export type ReferralWallet = {
  id: string;
  tenant_id: string;
  balance: number; // satang
  payout_type: 'manual' | 'credit';
  updated_at?: string;
};

export type WalletTransaction = {
  id: string;
  tenant_id: string;
  type: 'commission' | 'payout' | 'credit_applied' | string;
  amount: number; // satang, positive=credit, negative=debit
  referral_id?: string;
  description: string;
  created_at: string;
};

export type ReferralSettings = {
  id?: string;
  enabled: boolean;
  first_commission_amount: number;   // satang
  recurring_commission_amount: number; // satang
  discount_percent: number;          // 0–100
  discount_type: 'first_purchase' | 'duration'; // default: first_purchase
  discount_duration_months: number;  // only used when discount_type === 'duration'
  default_payout_type: 'manual' | 'credit';
  updated_at?: string;
};

export type AdminReferralRow = Referral & {
  referrer_tenant_name: string;
};

export type AdminWalletRow = ReferralWallet & {
  tenant_name: string;
};

export type PayoutRequest = {
  id: string;
  tenant_id: string;
  amount: number; // satang
  // Bank details
  bank_name: string;
  account_number: string;
  account_name: string;
  // Tax details
  tax_id: string;
  full_name: string;
  address: string;
  // PDPA consent
  consent_given: boolean;
  consent_at: string;
  // Status
  status: 'pending' | 'approved' | 'rejected';
  approved_by?: string;
  approved_at?: string;
  admin_note?: string;
  created_at: string;
  updated_at: string;
};

export type AdminPayoutRequestRow = PayoutRequest & {
  tenant_name: string;
};

export type SubmitPayoutRequestBody = {
  bank_name: string;
  account_number: string;
  account_name: string;
  tax_id: string;
  full_name: string;
  address: string;
  consent_given: boolean;
};

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('topdee_token');
}

// Lazily import the UI store so we never pull Zustand into SSR bundles.
// Called only when a real error fires in the browser.
function showErrorToast(message: string) {
  if (typeof window === 'undefined') return;
  // Dynamic import keeps the store out of server-side bundles.
  import('@/store/ui').then(({ useUI }) => {
    useUI.getState().showToast(message, 'error');
  });
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type') && init.body && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) headers.set('Authorization', `Bearer ${token}`);

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { ...init, headers });
  } catch {
    // Network error (offline, DNS failure, etc.)
    showErrorToast('Network error — please check your connection.');
    throw new ApiError(0, 'Network error');
  }

  const text = await res.text();
  const body = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const message = body?.error ?? res.statusText;
    showErrorToast(message);
    throw new ApiError(res.status, message);
  }
  return body as T;
}

export const api = {
  health: () => request<{ status: string }>('/health'),

  // Public — no auth required. Used by homepage and billing page.
  plans: () => request<Plan[]>('/api/v1/plans'),

  register: (tenant_name: string, email: string, password: string, referral_code?: string) =>
    request<{ token: string; user: AuthUser }>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({ tenant_name, email, password, accepted_privacy: true, referral_code: referral_code ?? '' }),
    }),

  login: (email: string, password: string) =>
    request<{ token: string; user: AuthUser }>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  forgotPassword: (email: string) =>
    request<{ ok: boolean }>('/api/v1/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token: string, password: string) =>
    request<{ ok: boolean }>('/api/v1/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    }),

  knowledge: {
    list: () => request<KnowledgeBase[]>('/api/v1/knowledge'),
    create: (input: { name: string; description?: string }) =>
      request<KnowledgeBase>('/api/v1/knowledge', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    get: (id: string) => request<KnowledgeBase>(`/api/v1/knowledge/${id}`),
    delete: (id: string) =>
      request<void>(`/api/v1/knowledge/${id}`, { method: 'DELETE' }),
    uploadFile: (id: string, file: File) => {
      const fd = new FormData();
      fd.append('file', file);
      return request<KnowledgeBase>(`/api/v1/knowledge/${id}/files`, {
        method: 'POST',
        body: fd,
      });
    },
  },

  team: {
    members: () => request<Member[]>('/api/v1/team/members'),
    updateRole: (id: string, role: Role) =>
      request<Member>(`/api/v1/team/members/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      }),
    removeMember: (id: string) =>
      request<void>(`/api/v1/team/members/${id}`, { method: 'DELETE' }),

    invites: () => request<TeamInvite[]>('/api/v1/team/invites'),
    invite: (input: { email: string; role: Role }) =>
      request<CreateInviteResp>('/api/v1/team/invites', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    revokeInvite: (id: string) =>
      request<void>(`/api/v1/team/invites/${id}`, { method: 'DELETE' }),
    resendInvite: (id: string) =>
      request<CreateInviteResp>(`/api/v1/team/invites/${id}/resend`, {
        method: 'POST',
      }),
  },

  admin: {
    metrics: () => request<AdminMetrics>('/api/v1/admin/metrics'),
    tenants: (q?: string) =>
      request<AdminTenant[]>(
        '/api/v1/admin/tenants' + (q ? `?q=${encodeURIComponent(q)}` : ''),
      ),
    tenant: (id: string) =>
      request<AdminTenantFull>(`/api/v1/admin/tenants/${id}`),
    updateTenant: (
      id: string,
      patch: { plan?: string; suspended?: boolean },
    ) =>
      request<AdminTenantFull>(`/api/v1/admin/tenants/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      }),
    deleteTenant: (id: string) =>
      request<void>(`/api/v1/admin/tenants/${id}`, { method: 'DELETE' }),
    updateSubscription: (
      id: string,
      patch: {
        status?: SubscriptionStatus;
        trial_ends_at?: string | null;
        current_period_end?: string | null;
        canceled_at?: string | null;
        cancel_at_period_end?: boolean;
        admin_notes?: string;
        clear_trial_ends_at?: boolean;
        clear_current_period_end?: boolean;
        clear_canceled_at?: boolean;
      },
    ) =>
      request<Subscription>(`/api/v1/admin/tenants/${id}/subscription`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      }),
    extendSubscription: (id: string, days: number) =>
      request<Subscription>(
        `/api/v1/admin/tenants/${id}/subscription/extend`,
        { method: 'POST', body: JSON.stringify({ days }) },
      ),
    users: (params?: { tenant_id?: string; q?: string; suspended?: boolean }) => {
      const qs = new URLSearchParams();
      if (params?.tenant_id) qs.set('tenant_id', params.tenant_id);
      if (params?.q) qs.set('q', params.q);
      if (params?.suspended) qs.set('suspended', 'true');
      const tail = qs.toString();
      return request<Member[]>(
        '/api/v1/admin/users' + (tail ? `?${tail}` : ''),
      );
    },
    updateUser: (
      id: string,
      patch: {
        role?: Role;
        suspended?: boolean;
        is_platform_admin?: boolean;
      },
    ) =>
      request<Member>(`/api/v1/admin/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      }),
    deleteUser: (id: string) =>
      request<void>(`/api/v1/admin/users/${id}`, { method: 'DELETE' }),
    plans: () => request<Plan[]>('/api/v1/admin/plans'),
    createPlan: (body: PlanInput) =>
      request<Plan>('/api/v1/admin/plans', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    updatePlan: (id: string, body: PlanInput) =>
      request<Plan>(`/api/v1/admin/plans/${id}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      }),
    deletePlan: (id: string) =>
      request<void>(`/api/v1/admin/plans/${id}`, { method: 'DELETE' }),
  },

  inviteInfo: (token: string) =>
    request<{ email: string; workspace_name: string; inviter_email: string; expires_at: string }>(
      `/api/v1/auth/invite-info?token=${encodeURIComponent(token)}`
    ),

  syncCheckoutSession: (sessionId: string) =>
    request('/api/v1/billing/sync-session', {
      method: 'POST',
      body: JSON.stringify({ session_id: sessionId }),
    }),

  acceptInvite: (input: { token: string; name: string; password: string }) =>
    request<{ token: string; user: Member }>('/api/v1/auth/accept-invite', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  billing: {
    /** Current plan, subscription status, and live usage stats. */
    info: () => request<BillingInfo>('/api/v1/billing'),
    /** Returns { url } — frontend should redirect the user to Stripe Checkout. */
    checkout: (plan: string, interval: 'month' | 'year' = 'month') =>
      request<{ url: string }>('/api/v1/billing/checkout-session', {
        method: 'POST',
        body: JSON.stringify({ plan, interval }),
      }),
    /** Returns { url } — Stripe Customer Portal for self-service. */
    portal: () =>
      request<{ url: string }>('/api/v1/billing/portal-session', {
        method: 'POST',
      }),
    /** List saved payment methods (cards) for this tenant's Stripe customer. */
    paymentMethods: () =>
      request<{ payment_methods: PaymentMethod[] }>('/api/v1/billing/payment-methods'),
    /** Detach (remove) a saved card by its Stripe payment method id. */
    removePaymentMethod: (id: string) =>
      request<void>(`/api/v1/billing/payment-methods/${id}`, { method: 'DELETE' }),
    /**
     * Schedule the subscription to cancel at the end of the current period.
     * The tenant keeps full access until then, then drops to Free automatically.
     */
    cancel: () => request<void>('/api/v1/billing/cancel', { method: 'POST' }),
    /** Remove the scheduled cancellation so the subscription renews normally. */
    reactivate: () => request<void>('/api/v1/billing/reactivate', { method: 'POST' }),
    /** Fetch last 24 invoices from Stripe. */
    invoices: () =>
      request<{ invoices: Invoice[] }>('/api/v1/billing/invoices'),
    /**
     * Create a Stripe Checkout session for PromptPay (one-time payment mode).
     * PromptPay does not support recurring subscriptions — the plan is granted
     * for one billing period (month or year) then auto-expires.
     */
    promptPayCheckout: (plan: string, interval: 'month' | 'year' = 'month') =>
      request<{ url: string }>('/api/v1/billing/promptpay-checkout', {
        method: 'POST',
        body: JSON.stringify({ plan, interval }),
      }),
  },

  analytics: (range: '7d' | '30d' | 'month' = '7d') =>
    request<AnalyticsStats>(`/api/v1/analytics?range=${range}`),

  bot: {
    get: () => request<BotSettings>('/api/v1/bot'),
    update: (input: Partial<Omit<BotSettings, 'updated_at'>>) =>
      request<BotSettings>('/api/v1/bot', {
        method: 'PUT',
        body: JSON.stringify(input),
      }),
  },

  settings: {
    get: () => request<SettingsSnapshot>('/api/v1/settings'),
    updateAccount: (input: { name: string; email: string }) =>
      request<AccountSettings>('/api/v1/settings/account', {
        method: 'PATCH',
        body: JSON.stringify(input),
      }),
    updatePassword: (input: {
      current_password: string;
      new_password: string;
    }) =>
      request<void>('/api/v1/settings/password', {
        method: 'PATCH',
        body: JSON.stringify(input),
      }),
    updateWorkspace: (input: {
      name: string;
      timezone?: string;
      website: string;
      business_type: string;
    }) =>
      request<WorkspaceSettings>('/api/v1/settings/workspace', {
        method: 'PATCH',
        body: JSON.stringify(input),
      }),
    uploadLogo: (file: File) => {
      const fd = new FormData();
      fd.append('logo', file);
      return request<{ logo_url: string }>('/api/v1/settings/workspace/logo', {
        method: 'POST',
        body: fd,
      });
    },
    updateNotifications: (prefs: NotificationSettings) =>
      request<NotificationSettings>('/api/v1/settings/notifications', {
        method: 'PATCH',
        body: JSON.stringify(prefs),
      }),
  },

  businessHours: {
    get: () => request<BusinessHours>('/api/v1/business-hours'),
    update: (input: Omit<BusinessHours, 'updated_at'>) =>
      request<BusinessHours>('/api/v1/business-hours', {
        method: 'PUT',
        body: JSON.stringify(input),
      }),
  },

  channels: {
    /** List every connection the tenant has, plus plan limits + usage. */
    list: () => request<ChannelsResponse>('/api/v1/channels'),

    /** Disconnect a specific connection by id. */
    disconnect: (id: string) =>
      request<void>(`/api/v1/channels/${id}`, { method: 'DELETE' }),

    /** Connect a LINE Official Account. We mint the access token automatically
     * — the user only needs Channel ID + Channel Secret. The response carries
     * a `webhook_url` to paste into LINE Developers → Messaging API. */
    connectLine: (input: {
      channel_id: string;
      channel_secret: string;
    }) =>
      request<ChannelConnection>('/api/v1/channels/line', {
        method: 'PUT',
        body: JSON.stringify(input),
      }),

    /** Returns a URL pattern with `{channel_id}` placeholder so the dashboard
     * can render a live preview as the user types. */
    webhookUrlTemplate: (provider: string = 'line') =>
      request<{ provider: string; template: string }>(
        `/api/v1/channels/webhook-url-template?provider=${encodeURIComponent(provider)}`,
      ),

    facebook: {
      /** Step 1: get the Facebook Login URL. Frontend should redirect to it. */
      oauthStart: () =>
        request<FacebookOAuthStartResp>(
          '/api/v1/channels/facebook/oauth/start',
          { method: 'POST' },
        ),
      /** Step 3: list pages discovered during the OAuth dance. */
      oauthPages: (state: string) =>
        request<FacebookOAuthPagesResp>(
          `/api/v1/channels/facebook/oauth/pages?state=${encodeURIComponent(state)}`,
        ),
      /** Step 4: persist the user's chosen pages as connections. */
      oauthConnect: (state: string, page_ids: string[]) =>
        request<{ connections: ChannelConnection[] }>(
          '/api/v1/channels/facebook/oauth/connect',
          {
            method: 'POST',
            body: JSON.stringify({ state, page_ids }),
          },
        ),
    },

    instagram: {
      /** Step 1: get the Instagram OAuth URL. Frontend should redirect to it. */
      oauthStart: () =>
        request<InstagramOAuthStartResp>(
          '/api/v1/channels/instagram/oauth/start',
          { method: 'POST' },
        ),
      /** Step 3: list Instagram Business Accounts discovered during OAuth. */
      oauthAccounts: (state: string) =>
        request<InstagramOAuthAccountsResp>(
          `/api/v1/channels/instagram/oauth/accounts?state=${encodeURIComponent(state)}`,
        ),
      /** Step 4: persist the chosen IG accounts as connections. */
      oauthConnect: (state: string, ig_ids: string[]) =>
        request<{ connections: ChannelConnection[] }>(
          '/api/v1/channels/instagram/oauth/connect',
          {
            method: 'POST',
            body: JSON.stringify({ state, ig_ids }),
          },
        ),
    },

    tiktok: {
      /** Step 1: get the TikTok Login URL. Frontend should redirect to it. */
      oauthStart: () =>
        request<TikTokOAuthStartResp>(
          '/api/v1/channels/tiktok/oauth/start',
          { method: 'POST' },
        ),
      /** Step 3: list TikTok business accounts discovered during OAuth. */
      oauthAccounts: (state: string) =>
        request<TikTokOAuthAccountsResp>(
          `/api/v1/channels/tiktok/oauth/accounts?state=${encodeURIComponent(state)}`,
        ),
      /** Step 4: persist the chosen TikTok accounts as connections. */
      oauthConnect: (state: string, business_ids: string[]) =>
        request<{ connections: ChannelConnection[] }>(
          '/api/v1/channels/tiktok/oauth/connect',
          {
            method: 'POST',
            body: JSON.stringify({ state, business_ids }),
          },
        ),
    },

    whatsapp: {
      /** Step 1: get the WhatsApp / Meta Login URL. Frontend should redirect. */
      oauthStart: () =>
        request<WhatsAppOAuthStartResp>(
          '/api/v1/channels/whatsapp/oauth/start',
          { method: 'POST' },
        ),
      /** Step 3: list WhatsApp phone numbers discovered during OAuth. */
      oauthPhoneNumbers: (state: string) =>
        request<WhatsAppOAuthPhoneNumbersResp>(
          `/api/v1/channels/whatsapp/oauth/phone-numbers?state=${encodeURIComponent(state)}`,
        ),
      /** Step 4: persist the chosen phone numbers as connections. */
      oauthConnect: (state: string, phone_number_ids: string[]) =>
        request<{ connections: ChannelConnection[] }>(
          '/api/v1/channels/whatsapp/oauth/connect',
          {
            method: 'POST',
            body: JSON.stringify({ state, phone_number_ids }),
          },
        ),
    },

    lazada: {
      /** Lazada has no picker step — the callback finishes the connection
       * and bounces back to /channels?lz_oauth=ok. */
      oauthStart: () =>
        request<LazadaOAuthStartResp>(
          '/api/v1/channels/lazada/oauth/start',
          { method: 'POST' },
        ),
    },

    web: {
      /** Create a web widget connection. Returns widget_id + ready embed code. */
      connect: (input: {
        display_name?: string;
        bot_name?: string;
        greeting_message?: string;
        accent_color?: string;
      } = {}) =>
        request<{ connection: ChannelConnection; widget_id: string; embed_code: string }>(
          '/api/v1/channels/web',
          { method: 'POST', body: JSON.stringify(input) },
        ),
    },
  },

  inbox: {
    /** List real customer conversations, newest first. Optionally filter
     * by channel (e.g. "line", "facebook"). */
    list: (channel?: string) => {
      const qs = channel ? `?channel=${encodeURIComponent(channel)}` : '';
      return request<InboxConversation[]>(`/api/v1/inbox/conversations${qs}`);
    },
    /** Full transcript of one conversation, oldest first. */
    messages: (id: string) =>
      request<Message[]>(
        `/api/v1/inbox/conversations/${encodeURIComponent(id)}/messages`,
      ),
    /** Send a manual reply to a customer through the right provider's push
     * API (LINE push, FB Send API). Persists as role="human" so the
     * conversation history shows it as an agent message. */
    send: (id: string, text: string) =>
      request<Message>(
        `/api/v1/inbox/conversations/${encodeURIComponent(id)}/messages`,
        { method: 'POST', body: JSON.stringify({ text }) },
      ),
    /** Upload an image to R2 and send it to the customer via the right
     * platform's API (LINE push image, FB attachment). Persists as
     * role="human" with an image attachment. */
    sendImage: (id: string, file: File) => {
      const fd = new FormData();
      fd.append('image', file);
      return request<Message>(
        `/api/v1/inbox/conversations/${encodeURIComponent(id)}/images`,
        { method: 'POST', body: fd },
      );
    },
    /** Number of conversations where the customer spoke last (needs reply). */
    unreadCount: () => request<{ count: number }>('/api/v1/inbox/unread-count'),
    /** Clear the needs_human flag — team has taken over / resolved the question. */
    resolveHandoff: (id: string) =>
      request<void>(
        `/api/v1/inbox/conversations/${encodeURIComponent(id)}/resolve`,
        { method: 'PATCH' },
      ),
  },

  referral: {
    /** My referral code (auto-created if missing). */
    code: () => request<ReferralCode>('/api/v1/referral/code'),
    /** Stats + list of tenants I referred. */
    stats: () => request<ReferralStats>('/api/v1/referral'),
    /** Wallet balance + last 50 transactions. */
    wallet: () => request<{ wallet: ReferralWallet; transactions: WalletTransaction[] }>('/api/v1/referral/wallet'),
    /** Submit a bank-transfer payout request with bank + tax details + PDPA consent. */
    submitPayoutRequest: (body: SubmitPayoutRequestBody) =>
      request<{ ok: boolean; amount: number; request: PayoutRequest; message: string }>(
        '/api/v1/referral/wallet/payout-request',
        { method: 'POST', body: JSON.stringify(body) },
      ),
    /** My payout request history. */
    myPayoutRequests: () => request<PayoutRequest[]>('/api/v1/referral/wallet/payout-requests'),
  },

  adminReferral: {
    settings: () => request<ReferralSettings>('/api/v1/admin/referral/settings'),
    updateSettings: (body: Partial<ReferralSettings>) =>
      request<ReferralSettings>('/api/v1/admin/referral/settings', {
        method: 'PUT',
        body: JSON.stringify(body),
      }),
    referrals: () => request<AdminReferralRow[]>('/api/v1/admin/referral/referrals'),
    wallets: () => request<AdminWalletRow[]>('/api/v1/admin/referral/wallets'),
    markPayout: (walletId: string) =>
      request<{ ok: boolean; amount: number }>(`/api/v1/admin/referral/wallets/${encodeURIComponent(walletId)}/payout`, {
        method: 'POST',
      }),
    updateWalletPayoutType: (walletId: string, payout_type: 'manual' | 'credit') =>
      request<void>(`/api/v1/admin/referral/wallets/${encodeURIComponent(walletId)}`, {
        method: 'PATCH',
        body: JSON.stringify({ payout_type }),
      }),
    /** All payout requests, optionally filtered: status=pending|approved|rejected */
    payoutRequests: (status?: string) =>
      request<AdminPayoutRequestRow[]>(
        `/api/v1/admin/referral/payout-requests${status ? `?status=${status}` : ''}`,
      ),
    approvePayoutRequest: (id: string, admin_note?: string) =>
      request<{ ok: boolean; amount: number }>(
        `/api/v1/admin/referral/payout-requests/${encodeURIComponent(id)}/approve`,
        { method: 'POST', body: JSON.stringify({ admin_note: admin_note ?? '' }) },
      ),
    rejectPayoutRequest: (id: string, admin_note?: string) =>
      request<{ ok: boolean; refunded: number }>(
        `/api/v1/admin/referral/payout-requests/${encodeURIComponent(id)}/reject`,
        { method: 'POST', body: JSON.stringify({ admin_note: admin_note ?? '' }) },
      ),
  },

  playground: {
    send: (message: string, conversation_id?: string) =>
      request<{ conversation_id: string; reply: string; sources: string[] }>(
        '/api/v1/playground/chat',
        {
          method: 'POST',
          body: JSON.stringify({ message, conversation_id }),
        },
      ),
    conversation: (id: string) =>
      request<Message[]>(`/api/v1/playground/conversations/${id}`),
    /** Past playground sessions for the current tenant, newest first. */
    list: () =>
      request<PlaygroundConversationSummary[]>(
        '/api/v1/playground/conversations',
      ),
  },
};

// Fetch the current user's profile using an explicit token. Used by the
// Google OAuth callback page before the token is saved to localStorage.
export async function fetchMe(token: string): Promise<AuthUser> {
  const res = await fetch(`${API_URL}/api/v1/settings`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const text = await res.text();
  const body = text ? JSON.parse(text) : null;
  if (!res.ok) throw new ApiError(res.status, body?.error ?? res.statusText);
  // /settings returns { account: { name, email, role }, workspace: { name } }
  return {
    name: body?.account?.name ?? '',
    email: body?.account?.email ?? '',
    role: body?.account?.role ?? 'owner',
    is_platform_admin: body?.account?.is_platform_admin ?? false,
  };
}
