'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { AppShell, PageBody, PageHeader } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { api, type KnowledgeBase, type KnowledgeFile } from '@/lib/api';
import { useUI } from '@/store/ui';
import { useT } from '@/lib/i18n/useT';
import { cn } from '@/lib/cn';
import {
  BookOpen,
  Trash2,
  Upload,
  CloudUpload,
  FileText,
  FileSpreadsheet,
  File as FileIcon,
  CheckCircle2,
  ArrowLeft,
} from '@/components/ui/Icon';

export default function KnowledgeDetailPage() {
  const router = useRouter();
  const t = useT();
  const showToast = useUI((s) => s.showToast);
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [kb, setKb] = useState<KnowledgeBase | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.knowledge
      .get(id)
      .then(setKb)
      .catch(() => {});
  }, [id]);

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

  async function uploadFile(file: File) {
    if (file.size > MAX_FILE_SIZE) {
      setErr(`File "${file.name}" exceeds the 10 MB limit (${(file.size / 1024 / 1024).toFixed(1)} MB).`);
      return;
    }
    setUploading(true);
    setErr(null);
    try {
      const updated = await api.knowledge.uploadFile(id, file);
      setKb(updated);
      showToast(`✓ ${file.name}`, 'success');
    } catch { } finally {
      setUploading(false);
    }
  }

  async function handleDelete() {
    if (!kb) return;
    if (!confirm(`Delete "${kb.name}"?`)) return;
    try {
      await api.knowledge.delete(id);
      router.push('/knowledge');
    } catch { }
  }

  return (
    <AppShell>
      <PageHeader
        icon={<BookOpen className="h-7 w-7" />}
        title={
          <span className="flex items-center gap-3">
            <Link
              href="/knowledge"
              className="text-ink-faint hover:text-ink"
              aria-label={t('common.back')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            {kb?.name ?? t('common.loading')}
          </span>
        }
        description={kb?.description || t('kb.sub')}
        action={
          kb && (
            <Button
              variant="danger"
              onClick={handleDelete}
              iconLeft={<Trash2 className="h-4 w-4" />}
            >
              {t('kb.delete').replace('🗑 ', '')}
            </Button>
          )
        }
      />
      <PageBody>
        {err && <p className="mb-3 text-sm text-red-500">{err}</p>}

        <Card>
          <CardHeader icon={<Upload className="h-4 w-4" />} title={t('kb.upload.section')} />
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              const f = e.dataTransfer.files?.[0];
              if (f) uploadFile(f);
            }}
            className={cn(
              'cursor-pointer rounded-2xl border-2 border-dashed p-9 text-center transition-colors',
              drag
                ? 'border-brand-600 bg-brand-soft'
                : 'border-brand-300 bg-brand-soft/40 hover:bg-brand-soft/60',
            )}
          >
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              accept=".pdf,.txt,.md,.csv,.docx,.xlsx"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = '';
                if (f) uploadFile(f);
              }}
            />
            <CloudUpload className="mx-auto mb-3 h-10 w-10 text-brand-400" />
            <p className="text-sm text-ink-muted">
              <span className="font-semibold text-brand-600">
                {uploading ? t('kb.upload.busy') : t('kb.upload.click')}
              </span>{' '}
              {t('kb.upload.drag')}
            </p>
            <p className="mt-2 text-xs text-ink-faint">{t('kb.upload.types')}</p>
          </div>
        </Card>

        <Card>
          <CardHeader
            icon={<FileText className="h-4 w-4" />}
            title={t('kb.files.section')}
            description={kb ? `${kb.files.length} files · ${kb.chunk_count} chunks` : undefined}
          />
          {!kb && <p className="text-sm text-ink-faint">{t('common.loading')}</p>}
          {kb && kb.files.length === 0 && (
            <p className="text-sm text-ink-faint">{t('kb.files.empty')}</p>
          )}
          {kb && kb.files.length > 0 && (
            <ul className="space-y-2.5">
              {kb.files.map((f, i) => (
                <FileItem key={i} file={f} />
              ))}
            </ul>
          )}
        </Card>
      </PageBody>
    </AppShell>
  );
}

function FileItem({ file }: { file: KnowledgeFile }) {
  const t = useT();
  const ext = file.filename.split('.').pop()?.toLowerCase() ?? '';
  const meta = fileMeta(ext);
  const Icon = meta.Icon;
  return (
    <li className="flex items-center gap-3 rounded-xl border border-line2 bg-page px-4 py-3">
      <div
        className={cn(
          'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg',
          meta.bg,
          meta.fg,
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-ink">{file.filename}</div>
        <div className="text-xs text-ink-faint">
          {(file.size / 1024).toFixed(1)} KB · {file.chunks} chunks ·{' '}
          {new Date(file.uploaded_at).toLocaleDateString()}
        </div>
      </div>
      <Badge tone="success">
        <CheckCircle2 className="h-3 w-3" /> {t('kb.file.ready').replace('✓ ', '')}
      </Badge>
    </li>
  );
}

function fileMeta(ext: string) {
  switch (ext) {
    case 'pdf':
      return { Icon: FileText, bg: 'bg-brand-soft', fg: 'text-brand-600' };
    case 'doc':
    case 'docx':
      return { Icon: FileText, bg: 'bg-fb-soft dark:bg-sky-900/40', fg: 'text-fb dark:text-sky-300' };
    case 'xls':
    case 'xlsx':
    case 'csv':
      return {
        Icon: FileSpreadsheet,
        bg: 'bg-emerald-100 dark:bg-emerald-900/40',
        fg: 'text-emerald-700 dark:text-emerald-300',
      };
    default:
      return { Icon: FileIcon, bg: 'bg-muted', fg: 'text-ink-muted' };
  }
}
