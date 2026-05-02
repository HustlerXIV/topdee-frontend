// Minimal typed client for the Go backend. Lives in the browser; reads token
// from localStorage. For SSR/route handlers, pass the token explicitly.

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

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

export type ChannelStatus = {
  facebook?: {
    page_id: string;
    page_name: string;
    connected: boolean;
    connected_at: string;
  };
  line?: {
    channel_id: string;
    connected: boolean;
    connected_at: string;
  };
};

export type Message = {
  id: string;
  conversation_id: string;
  role: 'user' | 'ai' | 'human';
  content: string;
  channel: string;
  created_at: string;
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

  register: (tenant_name: string, email: string, password: string) =>
    request<{ token: string }>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({ tenant_name, email, password }),
    }),

  login: (email: string, password: string) =>
    request<{ token: string }>('/api/v1/auth/login', {
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

  businessHours: {
    get: () => request<BusinessHours>('/api/v1/business-hours'),
    update: (input: Omit<BusinessHours, 'updated_at'>) =>
      request<BusinessHours>('/api/v1/business-hours', {
        method: 'PUT',
        body: JSON.stringify(input),
      }),
  },

  channels: {
    get: () => request<ChannelStatus>('/api/v1/channels'),
    connectFacebook: (input: { page_id: string; page_name?: string; page_access_token: string }) =>
      request<void>('/api/v1/channels/facebook', {
        method: 'PUT',
        body: JSON.stringify(input),
      }),
    disconnectFacebook: () =>
      request<void>('/api/v1/channels/facebook', { method: 'DELETE' }),
    connectLine: (input: {
      channel_id: string;
      channel_secret: string;
      channel_access_token: string;
    }) =>
      request<void>('/api/v1/channels/line', {
        method: 'PUT',
        body: JSON.stringify(input),
      }),
    disconnectLine: () =>
      request<void>('/api/v1/channels/line', { method: 'DELETE' }),
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
