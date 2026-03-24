import { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, Upload, Image, Video, FileText, File, Calendar, Loader2, Trash2, X, Check } from 'lucide-react';
import {
  Card, CardBody, Button, Badge, ProgressBar, Input,
} from '../ui';
import { Heading, Label, Text } from '../ui/Typography';
import { listItem } from '@/src/lib/motion';
import { listMedia, uploadMedia, updateMedia, deleteMedia, getMediaStats } from '@/src/services/api';
import type { MediaAsset, StorageStats } from '@/src/types/media';

type MediaType = 'all' | 'image' | 'video' | 'document';

const BUNNY_CDN = 'vz-670d5a2f-df7.b-cdn.net';
const WORKSPACE_ID = 1;
const PAGE_SIZE = 24;

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatStorageLabel(bytes: number): string {
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function getExtension(filename: string): string {
  const idx = filename.lastIndexOf('.');
  return idx >= 0 ? filename.slice(idx) : '';
}

const typeIcon: Record<MediaAsset['file_type'], typeof Image> = {
  image: Image,
  video: Video,
  document: FileText,
};

const typeColor: Record<MediaAsset['file_type'], string> = {
  image: 'bg-blue-500/10 text-blue-500',
  video: 'bg-purple-500/10 text-purple-500',
  document: 'bg-amber-500/10 text-amber-500',
};

const typeBadge: Record<MediaAsset['file_type'], 'default' | 'gold' | 'success' | 'muted'> = {
  image: 'default',
  video: 'gold',
  document: 'muted',
};

const tabs: { key: MediaType; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'image', label: 'Imagens' },
  { key: 'video', label: 'Videos' },
  { key: 'document', label: 'Docs' },
];

// ── Edit Modal ────────────────────────────────────────────────────────

function EditModal({
  asset,
  onClose,
  onSave,
}: {
  asset: MediaAsset;
  onClose: () => void;
  onSave: (updated: MediaAsset) => void;
}) {
  const [name, setName] = useState(asset.name);
  const [description, setDescription] = useState(asset.description || '');
  const [tagsStr, setTagsStr] = useState(() => {
    try {
      return JSON.parse(asset.tags).join(', ');
    } catch {
      return '';
    }
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const tagsArray = tagsStr
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      const updated = await updateMedia(asset.id, {
        name,
        description: description || undefined,
        tags: JSON.stringify(tagsArray),
      });
      onSave(updated);
    } catch (err: any) {
      console.error('Update failed:', err.message);
      alert(err.message || 'Falha ao atualizar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg mx-4">
        <Card variant="elevated" padding="lg">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Heading level={3}>Editar arquivo</Heading>
              <button onClick={onClose} className="text-warm-gray hover:text-text transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="mb-1 block">Nome</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <Label className="mb-1 block">Descricao</Label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-surface border border-line px-4 py-3 text-sm text-text placeholder:text-warm-gray/50 focus:border-gold focus:outline-none transition-colors resize-none"
                />
              </div>
              <div>
                <Label className="mb-1 block">Tags (separadas por virgula)</Label>
                <Input
                  value={tagsStr}
                  onChange={(e) => setTagsStr(e.target.value)}
                  placeholder="tag1, tag2, tag3"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={onClose}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving} icon={saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}>
                {saving ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────

export default function AdminMedia() {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<MediaType>('all');
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [editingAsset, setEditingAsset] = useState<MediaAsset | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropzoneInputRef = useRef<HTMLInputElement>(null);

  // ── Fetch media ──────────────────────────────────────────────

  const fetchMedia = useCallback(async (pageNum: number, append: boolean) => {
    setLoading(true);
    try {
      const typeParam = activeFilter === 'all' ? undefined : activeFilter;
      const searchParam = search.trim() || undefined;
      const result = await listMedia({
        workspaceId: WORKSPACE_ID,
        type: typeParam,
        search: searchParam,
        page: pageNum,
        limit: PAGE_SIZE,
      });
      if (append) {
        setAssets((prev) => [...prev, ...result.items]);
      } else {
        setAssets(result.items);
      }
      setTotal(result.total);
    } catch (err: any) {
      console.error('Fetch media failed:', err.message);
    } finally {
      setLoading(false);
    }
  }, [activeFilter, search]);

  const fetchStats = useCallback(async () => {
    try {
      const s = await getMediaStats(WORKSPACE_ID);
      setStats(s);
    } catch (err: any) {
      console.error('Fetch stats failed:', err.message);
    }
  }, []);

  // Reset page and fetch when filters change
  useEffect(() => {
    setPage(1);
    setSelected(new Set());
    fetchMedia(1, false);
  }, [activeFilter, search]);

  useEffect(() => {
    fetchStats();
  }, []);

  // ── Upload ──────────────────────────────────────────────────

  const handleUpload = useCallback(async (files: FileList | File[]) => {
    if (!files.length) return;
    setUploading(true);

    try {
      for (const file of Array.from(files)) {
        setUploadProgress(0);
        const uploaded = await uploadMedia(file, WORKSPACE_ID, (pct) => setUploadProgress(pct));
        setAssets((prev) => [uploaded, ...prev]);
        setTotal((prev) => prev + 1);
      }
      fetchStats();
    } catch (err: any) {
      console.error('Upload failed:', err.message);
      alert(err.message || 'Falha no upload.');
    } finally {
      setUploading(false);
    }
  }, [fetchStats]);

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      handleUpload(e.target.files);
      e.target.value = '';
    }
  }, [handleUpload]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) {
      handleUpload(e.dataTransfer.files);
    }
  }, [handleUpload]);

  // ── Delete ──────────────────────────────────────────────────

  const handleDelete = useCallback(async (id: number) => {
    if (!window.confirm('Tem certeza que deseja excluir este arquivo?')) return;
    try {
      await deleteMedia(id);
      setAssets((prev) => prev.filter((a) => a.id !== id));
      setTotal((prev) => prev - 1);
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      fetchStats();
    } catch (err: any) {
      console.error('Delete failed:', err.message);
      alert(err.message || 'Falha ao excluir.');
    }
  }, [fetchStats]);

  const handleBulkDelete = useCallback(async () => {
    if (!selected.size) return;
    if (!window.confirm(`Excluir ${selected.size} arquivo(s) selecionado(s)?`)) return;
    setDeleting(true);
    try {
      for (const id of selected) {
        await deleteMedia(id);
      }
      setAssets((prev) => prev.filter((a) => !selected.has(a.id)));
      setTotal((prev) => prev - selected.size);
      setSelected(new Set());
      fetchStats();
    } catch (err: any) {
      console.error('Bulk delete failed:', err.message);
      alert(err.message || 'Falha ao excluir alguns arquivos.');
    } finally {
      setDeleting(false);
    }
  }, [selected, fetchStats]);

  // ── Selection ───────────────────────────────────────────────

  const toggleSelect = useCallback((id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // ── Edit save handler ───────────────────────────────────────

  const handleEditSave = useCallback((updated: MediaAsset) => {
    setAssets((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    setEditingAsset(null);
  }, []);

  // ── Load more ───────────────────────────────────────────────

  const loadMore = useCallback(() => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchMedia(nextPage, true);
  }, [page, fetchMedia]);

  // ── Derived data ────────────────────────────────────────────

  const typeCounts = {
    all: assets.length,
    image: assets.filter((a) => a.file_type === 'image').length,
    video: assets.filter((a) => a.file_type === 'video').length,
    document: assets.filter((a) => a.file_type === 'document').length,
  };

  const storageTotal = 5 * 1024 * 1024 * 1024; // 5 GB
  const storageUsed = stats
    ? (stats.image?.total_size || 0) + (stats.video?.total_size || 0) + (stats.document?.total_size || 0)
    : 0;

  // ── Thumbnail helper ────────────────────────────────────────

  function getThumbnail(asset: MediaAsset): string | null {
    if (asset.file_type === 'image') return asset.url;
    if (asset.source === 'bunny' && asset.bunny_video_id && asset.bunny_status === 'ready') {
      return `https://${BUNNY_CDN}/${asset.bunny_video_id}/thumbnail.jpg`;
    }
    return null;
  }

  const isBunnyProcessing = (asset: MediaAsset) =>
    asset.source === 'bunny' && asset.bunny_status && asset.bunny_status !== 'ready';

  return (
    <div className="space-y-12">
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={onFileChange}
        multiple
      />
      <input
        ref={dropzoneInputRef}
        type="file"
        className="hidden"
        onChange={onFileChange}
        multiple
        accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx"
      />

      {/* Edit Modal */}
      {editingAsset && (
        <EditModal
          asset={editingAsset}
          onClose={() => setEditingAsset(null)}
          onSave={handleEditSave}
        />
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-6">
        <div className="flex-1">
          <Input
            icon={<Search size={16} />}
            placeholder="Buscar arquivos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {selected.size > 0 && (
          <Button
            variant="ghost"
            icon={deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
            onClick={handleBulkDelete}
            disabled={deleting}
            className="text-red-500 hover:text-red-600"
          >
            Deletar {selected.size} selecionado{selected.size > 1 ? 's' : ''}
          </Button>
        )}
        <Button
          icon={uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? `Enviando${uploadProgress > 0 ? ` ${uploadProgress}%` : '...'}` : 'Upload'}
        </Button>
      </div>

      {/* Upload Progress Bar */}
      {uploading && (
        <Card variant="elevated" padding="md">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Loader2 size={16} className="text-gold animate-spin" />
                <Text size="sm" className="font-bold">Enviando video...</Text>
              </div>
              <Label variant="gold">{uploadProgress}%</Label>
            </div>
            <ProgressBar value={uploadProgress} size="md" />
          </div>
        </Card>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            className={`px-4 py-2 text-xs font-bold tracking-tight transition-all ${
              activeFilter === tab.key
                ? 'bg-text text-bg'
                : 'bg-surface border border-line text-warm-gray hover:text-gold hover:border-gold/50'
            }`}
          >
            {tab.label}:{typeCounts[tab.key]}
          </button>
        ))}
      </div>

      {/* Asset Grid */}
      {loading && assets.length === 0 ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={24} className="text-gold animate-spin" />
        </div>
      ) : assets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <File size={32} className="text-warm-gray/30" />
          <Text muted>Nenhum arquivo encontrado.</Text>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {assets.map((asset, i) => {
            const Icon = typeIcon[asset.file_type];
            const thumb = getThumbnail(asset);
            const isSelected = selected.has(asset.id);
            const processing = isBunnyProcessing(asset);

            return (
              <motion.div key={asset.id} {...listItem(i)}>
                <Card variant="flat" interactive className={`h-full relative ${isSelected ? 'ring-2 ring-gold' : ''}`}>
                  {/* Bulk select checkbox */}
                  <label
                    className="absolute top-2 left-2 z-10 cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(asset.id)}
                      className="w-4 h-4 accent-gold cursor-pointer"
                    />
                  </label>

                  {/* Delete button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(asset.id);
                    }}
                    className="absolute top-2 right-2 z-10 p-1.5 bg-black/50 text-white/70 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 hover:opacity-100"
                    style={{ opacity: undefined }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = '')}
                  >
                    <Trash2 size={14} />
                  </button>

                  {/* Thumbnail / Icon area */}
                  <div className="relative">
                    {thumb ? (
                      <div className="h-32 overflow-hidden">
                        <img
                          src={thumb}
                          alt={asset.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className={`h-32 flex items-center justify-center ${typeColor[asset.file_type]}`}>
                        <Icon size={32} />
                      </div>
                    )}

                    {/* Bunny processing overlay */}
                    {processing && (
                      <div className="absolute inset-0 h-32 bg-black/50 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 size={20} className="text-white animate-spin" />
                          <Badge variant="gold">Processando</Badge>
                        </div>
                      </div>
                    )}
                  </div>

                  <CardBody className="space-y-2 p-4">
                    <button
                      onClick={() => setEditingAsset(asset)}
                      className="text-left w-full"
                    >
                      <Text size="sm" className="font-bold truncate hover:text-gold transition-colors">
                        {asset.name}{getExtension(asset.original_filename)}
                      </Text>
                    </button>
                    <div className="flex items-center justify-between">
                      <Badge variant={typeBadge[asset.file_type]}>
                        {getExtension(asset.original_filename) || asset.file_type}
                      </Badge>
                      <Label className="text-warm-gray/40">{formatSize(asset.size)}</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={10} className="text-warm-gray/30" />
                      <Label className="text-warm-gray/30">
                        {new Date(asset.created_at).toLocaleDateString('pt-BR')}
                      </Label>
                    </div>
                  </CardBody>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Load More */}
      {assets.length < total && (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            onClick={loadMore}
            disabled={loading}
            icon={loading ? <Loader2 size={16} className="animate-spin" /> : undefined}
          >
            {loading ? 'Carregando...' : `Carregar mais (${assets.length}/${total})`}
          </Button>
        </div>
      )}

      {/* Dropzone */}
      <button
        className={`w-full border-2 border-dashed py-16 flex flex-col items-center justify-center gap-4 transition-colors duration-300 cursor-pointer group ${
          dragOver
            ? 'border-gold bg-gold/5'
            : 'border-line hover:border-gold/50'
        } ${uploading ? 'pointer-events-none opacity-50' : ''}`}
        onClick={() => dropzoneInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
      >
        <div className="w-14 h-14 rounded-full bg-surface flex items-center justify-center group-hover:bg-gold/10 transition-colors">
          {uploading ? (
            <Loader2 size={24} className="text-gold animate-spin" />
          ) : (
            <Upload size={24} className="text-warm-gray group-hover:text-gold transition-colors" />
          )}
        </div>
        <div className="text-center">
          <Text size="sm" className="font-bold">
            {uploading ? `Enviando${uploadProgress > 0 ? ` — ${uploadProgress}%` : '...'}` : 'Arraste arquivos ou clique para upload'}
          </Text>
          <Text size="xs" muted className="mt-1">JPG, PNG, MP4, PDF — videos ate 2 GB, outros ate 500 MB</Text>
        </div>
      </button>

      {/* Storage Bar */}
      <Card variant="elevated" padding="md">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <File size={16} className="text-warm-gray" />
              <Heading level={4}>Armazenamento</Heading>
            </div>
            <Label variant="gold">{formatStorageLabel(storageUsed)} de {formatStorageLabel(storageTotal)}</Label>
          </div>
          <ProgressBar value={storageTotal > 0 ? (storageUsed / storageTotal) * 100 : 0} size="md" showLabel />
          {stats && (
            <div className="flex gap-6">
              {stats.image && (
                <Label className="text-warm-gray/60">
                  Imagens: {formatStorageLabel(stats.image.total_size)} ({stats.image.count})
                </Label>
              )}
              {stats.video && (
                <Label className="text-warm-gray/60">
                  Videos: {formatStorageLabel(stats.video.total_size)} ({stats.video.count})
                </Label>
              )}
              {stats.document && (
                <Label className="text-warm-gray/60">
                  Docs: {formatStorageLabel(stats.document.total_size)} ({stats.document.count})
                </Label>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
