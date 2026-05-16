'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell, PageBody, PageHeader } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { FormGroup, Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { api, ApiError, type KnowledgeBase } from '@/lib/api';
import { useUI } from '@/store/ui';
import { useT } from '@/lib/i18n/useT';
import { BookOpen, Plus, Folder, FolderOpen } from '@/components/ui/Icon';

export default function KnowledgePage() {
  const t = useT();
  const showToast = useUI((s) => s.showToast);
  const [kbs, setKbs] = useState<KnowledgeBase[] | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.knowledge
      .list()
      .then(setKbs)
      .catch((e) => {
        if (e instanceof ApiError && e.status === 401) return; // handled by auth redirect
      });
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const kb = await api.knowledge.create({ name, description });
      setKbs((prev) => (prev ? [...prev, kb] : [kb]));
      setName('');
      setDescription('');
      showToast(t('kb.toast.created'), 'success');
    } catch {
      // error toast shown by request()
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <PageHeader
        icon={<BookOpen className="h-7 w-7" />}
        title={t('kb.title').replace('📚 ', '')}
        description={t('kb.sub')}
      />
      <PageBody>
        <Card>
          <CardHeader icon={<Plus className="h-4 w-4" />} title={t('kb.create.section')} />
          <form onSubmit={create} className="space-y-4">
            <FormGroup label={t('common.name')}>
              <Input
                placeholder={t('kb.create.namePlaceholder')}
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </FormGroup>
            <FormGroup label={t('kb.create.descLabel')}>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} />
            </FormGroup>
            <Button type="submit" disabled={busy}>
              {busy ? t('kb.create.busy') : t('kb.create.btn')}
            </Button>
          </form>
        </Card>

        <Card>
          <CardHeader
            icon={<Folder className="h-4 w-4" />}
            title={t('kb.list.section')}
            description={kbs ? `${kbs.length} bases` : t('common.loading')}
          />
          {!kbs && <p className="text-sm text-ink-faint">{t('common.loading')}</p>}
          {kbs && kbs.length === 0 && (
            <div className="rounded-2xl border-2 border-dashed border-brand-300 bg-brand-soft/40 p-8 text-center text-sm text-ink-muted">
              {t('kb.list.empty')}
            </div>
          )}
          {kbs && kbs.length > 0 && (
            <ul className="space-y-3">
              {kbs.map((kb) => (
                <li key={kb.id}>
                  <Link
                    href={`/knowledge/${kb.id}`}
                    className="flex items-center gap-3 rounded-xl border border-line2 bg-page px-4 py-3 transition-colors hover:border-brand-300 hover:bg-brand-soft/40"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-soft text-brand-600">
                      <FolderOpen className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-ink">{kb.name}</div>
                      <div className="text-xs text-ink-faint">
                        {kb.files.length} files · {kb.chunk_count} chunks
                        {kb.description ? ` · ${kb.description}` : ''}
                      </div>
                    </div>
                    <Badge tone={kb.chunk_count > 0 ? 'success' : 'pending'}>
                      {kb.chunk_count > 0 ? t('kb.file.ready') : '—'}
                    </Badge>
                    <span className="text-ink-faint">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </PageBody>
    </AppShell>
  );
}
