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
};

export type FacebookOAuthStartResp = {
  login_url: string;
  state: string;
};

export type FacebookOAuthPagesResp = {
  state: string;
  pages: { id: string; name: string; category?: string }[];
};

export type Message = {
  id: string;
  conversation_id: string;
  role: 'user' | 'ai' | 'human' | 'suggestion';
  content: string;
  channel: string;
  external_user_id?: string;
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
  limits: PlanLimits;
  created_at: string;
  updated_at: string;
};

export type PlanInput = Omit<Plan, 'created_at' | 'updated_at' | 'is_active' | 'is_public' | 'is_recommended'> & {
  is_active: boolean;
  is_public: boolean;
  is_recommended: boolean;
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

export type SettingsSnapshot = {
  account: AccountSettings;
  workspace: WorkspaceSettings;
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

class ApiError extends Error {
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

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type') && init.body && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  const text = await res.text();
  const body = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new ApiError(res.status, body?.error ?? res.statusText);
  }
  return body as T;
}

export const api = {
  health: () => request<{ status: string }>('/health'),

  // Public — no auth required. Used by homepage and billing page.
  plans: () => request<Plan[]>('/api/v1/plans'),

  register: (tenant_name: string, email: string, password: string) =>
    request<{ token: string; user: AuthUser }>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({ tenant_name, email, password }),
    }),

  login: (email: string, password: string) =>
    request<{ token: string; user: AuthUser }>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
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

  acceptInvite: (input: { token: string; name: string; password: string }) =>
    request<{ token: string; user: Member }>('/api/v1/auth/accept-invite', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  billing: {
    /** Returns { url } — frontend should redirect the user to Stripe Checkout. */
    checkout: (plan: string) =>
      request<{ url: string }>('/api/v1/billing/checkout-session', {
        method: 'POST',
        body: JSON.stringify({ plan }),
      }),
    /** Returns { url } — Stripe Customer Portal for self-service. */
    portal: () =>
      request<{ url: string }>('/api/v1/billing/portal-session', {
        method: 'POST',
      }),
  },

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
      timezone: string;
      website: string;
      business_type: string;
    }) =>
      request<WorkspaceSettings>('/api/v1/settings/workspace', {
        method: 'PATCH',
        body: JSON.stringify(input),
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

export { ApiError };
