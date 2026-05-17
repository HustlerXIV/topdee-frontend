'use client';

import { useEffect, useState } from 'react';
import { AppShell, PageBody, PageHeader, useRoleGuard } from '@/components/layout/AppShell';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar, type AvatarTone } from '@/components/ui/Avatar';
import { Input, Select } from '@/components/ui/Input';
import {
  api,
  ApiError,
  type Member,
  type Role,
  type TeamInvite,
} from '@/lib/api';
import { useAuth } from '@/store/auth';
import { useUI } from '@/store/ui';
import { useT } from '@/lib/i18n/useT';
import {
  Users,
  Mail,
  Hourglass,
  Key,
  AlertTriangle,
  Plus,
  Check,
  X,
  Eye,
} from '@/components/ui/Icon';

// Roles a manager can hand out — owner is reserved for the workspace creator.
const ASSIGNABLE_ROLES: Role[] = ['admin', 'agent', 'viewer'];

const ROLE_TONE: Record<Role, 'admin' | 'agent' | 'viewer'> = {
  owner: 'admin',
  admin: 'admin',
  agent: 'agent',
  viewer: 'viewer',
};

const TONES: AvatarTone[] = ['purple', 'blue', 'pink', 'yellow', 'green', 'gray'];

export default function TeamPage() {
  useRoleGuard(['owner', 'admin']);
  const t = useT();
  const showToast = useUI((s) => s.showToast);
  const myRole = useAuth((s) => s.user?.role);
  // Owner & admin can invite + manage. Anyone else sees a read-only members list.
  const canManage = myRole === 'owner' || myRole === 'admin';

  const [members, setMembers] = useState<Member[] | null>(null);
  const [invites, setInvites] = useState<TeamInvite[] | null>(null);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<Role>('agent');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refresh() {
    const m = await api.team.members().catch(swallowAuth);
    if (m) setMembers(m);

    if (canManage) {
      const i = await api.team.invites().catch(swallowAuth);
      setInvites(i ?? []);
    }
  }

  function swallowAuth(e: unknown): null {
    if (e instanceof ApiError && (e.status === 401 || e.status === 403)) return null;
    return null;
  }

  async function invite() {
    const email = inviteEmail.trim();
    if (!email) return;
    setInviting(true);
    try {
      const res = await api.team.invite({ email, role: inviteRole });
      setInviteEmail('');
      try {
        await navigator.clipboard.writeText(res.accept_url);
        showToast('คัดลอกลิงก์เชิญแล้ว / Invite link copied', 'success');
      } catch {
        showToast(t('team.invite.toast'), 'success');
      }
      await refresh();
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'invite failed';
      showToast(msg, 'error');
    } finally {
      setInviting(false);
    }
  }

  async function changeRole(m: Member, role: Role) {
    if (role === m.role) return;
    try {
      await api.team.updateRole(m.id, role);
      await refresh();
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'role update failed';
      showToast(msg, 'error');
    }
  }

  async function remove(m: Member) {
    if (!confirm(`Remove ${m.name || m.email}?`)) return;
    try {
      await api.team.removeMember(m.id);
      await refresh();
      showToast(t('common.delete'), 'success');
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'remove failed';
      showToast(msg, 'error');
    }
  }

  async function resend(inv: TeamInvite) {
    try {
      const res = await api.team.resendInvite(inv.id);
      try {
        await navigator.clipboard.writeText(res.accept_url);
        showToast('Re-issued + copied to clipboard', 'success');
      } catch {
        showToast('Re-issued', 'success');
      }
      await refresh();
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'resend failed';
      showToast(msg, 'error');
    }
  }

  async function revoke(inv: TeamInvite) {
    if (!confirm(`Revoke invite for ${inv.email}?`)) return;
    try {
      await api.team.revokeInvite(inv.id);
      await refresh();
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'revoke failed';
      showToast(msg, 'error');
    }
  }

  const totalSeats = (members?.length ?? 0) + (invites?.length ?? 0);

  return (
    <AppShell>
      <PageHeader
        icon={<Users className="h-7 w-7" />}
        title={t('team.title').replace('👥 ', '')}
        description={`${t('team.subFmt')} (${totalSeats}/10)`}
      />
      <PageBody>
        {/* Owner+admin only — heads-up if a stale token is hiding the form */}
        {!myRole && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-900 dark:border-yellow-900/40 dark:bg-yellow-900/20 dark:text-yellow-200">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <span>
              Your session is from before role-based auth shipped. Please{' '}
              <strong>sign out and back in</strong> so the workspace knows you're
              the owner — then the invite form will appear here.
            </span>
          </div>
        )}

        {/* Invite form — visible to owner/admin */}
        {canManage && (
          <Card>
            <CardHeader
              icon={<Mail className="h-4 w-4" />}
              title={t('team.invite.btn').replace('+ ', '')}
              description="Generate a one-time link your teammate can use to join"
            />
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-line2 bg-page p-4">
              <Mail className="h-5 w-5 text-brand-600" />
              <Input
                type="email"
                placeholder={t('team.invite.placeholder')}
                className="min-w-[220px] flex-1"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') invite();
                }}
              />
              <Select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as Role)}
                className="w-32"
              >
                {ASSIGNABLE_ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </Select>
              <Button
                onClick={invite}
                disabled={inviting || !inviteEmail.trim()}
                iconLeft={<Plus className="h-4 w-4" />}
              >
                {inviting ? '…' : t('team.invite.send')}
              </Button>
            </div>
            <p className="mt-2 text-xs text-ink-faint">
              The invite link is auto-copied to your clipboard — paste it into
              LINE/email/Slack to send to your teammate.
            </p>
          </Card>
        )}

        {/* Pending invites — owner/admin only */}
        {canManage && invites && invites.length > 0 && (
          <Card>
            <CardHeader icon={<Hourglass className="h-4 w-4" />} title={`Pending invites (${invites.length})`} />
            <ul>
              {invites.map((inv) => (
                <li
                  key={inv.id}
                  className="flex items-center gap-3 border-b border-line2 py-3.5 last:border-b-0"
                >
                  <Avatar initials="?" tone="gray" size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-ink">{inv.email}</div>
                    <div className="text-[13px] text-ink-faint">
                      Expires {new Date(inv.expires_at).toLocaleDateString()}
                    </div>
                  </div>
                  <Badge tone={ROLE_TONE[inv.role]}>{inv.role}</Badge>
                  <Button variant="outline" size="sm" onClick={() => resend(inv)}>
                    {t('team.resend')}
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => revoke(inv)}>
                    {t('common.delete')}
                  </Button>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* Members */}
        <Card>
          <CardHeader title={t('team.list.section')} />
          {!members && <p className="text-sm text-ink-faint">{t('common.loading')}</p>}
          {members && members.length === 0 && (
            <p className="text-sm text-ink-faint">No members yet.</p>
          )}
          {members && members.length > 0 && (
            <ul>
              {members.map((m, i) => (
                <li
                  key={m.id}
                  className="flex items-center gap-3 border-b border-line2 py-3.5 last:border-b-0"
                >
                  <Avatar
                    initials={(m.name || m.email).slice(0, 1).toUpperCase()}
                    tone={TONES[i % TONES.length]}
                    size="md"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-ink">{m.name || m.email}</div>
                    <div className="text-[13px] text-ink-faint">{m.email}</div>
                  </div>
                  {/* Role: only owner can change; admins+ can see; everyone else read-only badge */}
                  {m.role === 'owner' || myRole !== 'owner' ? (
                    <Badge tone={ROLE_TONE[m.role]}>{m.role}</Badge>
                  ) : (
                    <Select
                      value={m.role}
                      onChange={(e) => changeRole(m, e.target.value as Role)}
                      className="w-32"
                    >
                      {ASSIGNABLE_ROLES.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </Select>
                  )}
                  {/* Remove button: owner+admin can remove non-owners */}
                  {canManage && m.role !== 'owner' && (
                    <Button variant="danger" size="sm" onClick={() => remove(m)}>
                      {t('common.delete')}
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Role permission table */}
        <Card>
          <CardHeader icon={<Key className="h-4 w-4" />} title={t('team.role.section')} />
          <div className="overflow-x-auto">
            <table className="w-full text-[13px] text-ink">
              <thead>
                <tr className="bg-page">
                  <th className="border-b border-line2 px-4 py-2.5 text-left">Permission</th>
                  <th className="border-b border-line2 px-3 py-2.5 text-center text-brand-600">Owner</th>
                  <th className="border-b border-line2 px-3 py-2.5 text-center text-brand-500">Admin</th>
                  <th className="border-b border-line2 px-3 py-2.5 text-center text-sky-700 dark:text-sky-400">Agent</th>
                  <th className="border-b border-line2 px-3 py-2.5 text-center text-ink-muted">Viewer</th>
                </tr>
              </thead>
              <tbody>
                <PermRow label="Reply to chats"        owner="full" admin="full" agent="full" viewer="view" />
                <PermRow label="Configure AI bot"      owner="full" admin="full" agent="full" viewer="view" />
                <PermRow label="View analytics"        owner="full" admin="full" agent="full" viewer="full" />
                <PermRow label="Manage channels"       owner="full" admin="full" agent="none" viewer="none" />
                <PermRow label="Invite / remove team"  owner="full" admin="full" agent="none" viewer="none" />
                <PermRow label="Change member roles"   owner="full" admin="none" agent="none" viewer="none" />
                <PermRow label="Manage billing"        owner="full" admin="none" agent="none" viewer="none" />
              </tbody>
            </table>
          </div>
        </Card>
      </PageBody>
    </AppShell>
  );
}

type PermLevel = 'full' | 'view' | 'none';

function PermIcon({ level }: { level: PermLevel }) {
  if (level === 'full') {
    return (
      <span className="inline-flex items-center justify-center">
        <Check className="h-4 w-4 text-green-500" />
      </span>
    );
  }
  if (level === 'view') {
    return (
      <span className="inline-flex items-center justify-center">
        <Eye className="h-4 w-4 text-sky-500" />
      </span>
    );
  }
  return (
    <span className="inline-flex items-center justify-center">
      <X className="h-4 w-4 text-ink-faint" />
    </span>
  );
}

function PermRow({
  label,
  owner,
  admin,
  agent,
  viewer,
}: {
  label: string;
  owner: PermLevel;
  admin: PermLevel;
  agent: PermLevel;
  viewer: PermLevel;
}) {
  return (
    <tr>
      <td className="border-b border-line2 px-4 py-2.5">{label}</td>
      <td className="border-b border-line2 px-3 py-2.5 text-center"><PermIcon level={owner} /></td>
      <td className="border-b border-line2 px-3 py-2.5 text-center"><PermIcon level={admin} /></td>
      <td className="border-b border-line2 px-3 py-2.5 text-center"><PermIcon level={agent} /></td>
      <td className="border-b border-line2 px-3 py-2.5 text-center"><PermIcon level={viewer} /></td>
    </tr>
  );
}
