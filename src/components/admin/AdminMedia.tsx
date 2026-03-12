import { useState, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import { Search, Upload, Image, Video, FileText, File, Calendar, Loader2 } from 'lucide-react';
import {
  Card, CardBody, Button, Badge, ProgressBar, Input,
} from '../ui';
import { Heading, Label, Text } from '../ui/Typography';
import { listItem } from '@/src/lib/motion';
import { uploadFile, uploadImage } from '@/src/services/api';

type MediaType = 'all' | 'image' | 'video' | 'document';

interface MediaAsset {
  name: string;
  type: 'image' | 'video' | 'document';
  extension: string;
  size: string;
  date: string;
  url?: string;
}

function inferType(mime: string): MediaAsset['type'] {
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  return 'document';
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function todayFormatted(): string {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

const defaultAssets: MediaAsset[] = [
  { name: 'thumbnail-sistemas', type: 'image', extension: '.jpg', size: '2.4 MB', date: '02/03/2026' },
  { name: 'banner-homepage', type: 'image', extension: '.png', size: '1.1 MB', date: '01/03/2026' },
  { name: 'intro-arquitetura', type: 'video', extension: '.mp4', size: '45 MB', date: '28/02/2026' },
  { name: 'guia-plataforma', type: 'document', extension: '.pdf', size: '320 KB', date: '27/02/2026' },
  { name: 'avatar-default', type: 'image', extension: '.png', size: '48 KB', date: '25/02/2026' },
  { name: 'aula-01-fundamentos', type: 'video', extension: '.mp4', size: '120 MB', date: '24/02/2026' },
  { name: 'og-image-curso', type: 'image', extension: '.jpg', size: '890 KB', date: '23/02/2026' },
  { name: 'template-certificado', type: 'document', extension: '.pdf', size: '1.2 MB', date: '22/02/2026' },
  { name: 'hero-lideranca', type: 'image', extension: '.jpg', size: '3.1 MB', date: '20/02/2026' },
  { name: 'depoimento-ana', type: 'video', extension: '.mp4', size: '28 MB', date: '18/02/2026' },
  { name: 'icone-modulo-01', type: 'image', extension: '.svg', size: '12 KB', date: '15/02/2026' },
  { name: 'checklist-onboard', type: 'document', extension: '.pdf', size: '450 KB', date: '10/02/2026' },
];

const typeIcon: Record<MediaAsset['type'], typeof Image> = {
  image: Image,
  video: Video,
  document: FileText,
};

const typeColor: Record<MediaAsset['type'], string> = {
  image: 'bg-blue-500/10 text-blue-500',
  video: 'bg-purple-500/10 text-purple-500',
  document: 'bg-amber-500/10 text-amber-500',
};

const typeBadge: Record<MediaAsset['type'], 'default' | 'gold' | 'success' | 'muted'> = {
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

const storageUsed = 3.2;
const storageTotal = 5;

export default function AdminMedia() {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<MediaType>('all');
  const [assets, setAssets] = useState<MediaAsset[]>(defaultAssets);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropzoneInputRef = useRef<HTMLInputElement>(null);

  const typeCounts = {
    all: assets.length,
    image: assets.filter(a => a.type === 'image').length,
    video: assets.filter(a => a.type === 'video').length,
    document: assets.filter(a => a.type === 'document').length,
  };

  const handleUpload = useCallback(async (files: FileList | File[]) => {
    if (!files.length) return;
    setUploading(true);

    try {
      for (const file of Array.from(files)) {
        const isImage = file.type.startsWith('image/');
        const result = isImage
          ? await uploadImage(file)
          : await uploadFile(file);

        const ext = file.name.includes('.')
          ? file.name.slice(file.name.lastIndexOf('.'))
          : '';
        const baseName = file.name.replace(/\.[^.]+$/, '');

        const newAsset: MediaAsset = {
          name: baseName,
          type: inferType(file.type),
          extension: ext,
          size: formatSize(result.size),
          date: todayFormatted(),
          url: result.url,
        };

        setAssets(prev => [newAsset, ...prev]);
      }
    } catch (err: any) {
      console.error('Upload failed:', err.message);
      alert(err.message || 'Falha no upload.');
    } finally {
      setUploading(false);
    }
  }, []);

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

  const filtered = assets.filter(a => {
    const matchesSearch = a.name.toLowerCase().includes(search.toLowerCase());
    const matchesType = activeFilter === 'all' || a.type === activeFilter;
    return matchesSearch && matchesType;
  });

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
        <Button
          icon={uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? 'Enviando...' : 'Upload'}
        </Button>
      </div>

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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filtered.map((asset, i) => {
          const Icon = typeIcon[asset.type];
          return (
            <motion.div key={`${asset.name}-${asset.date}-${i}`} {...listItem(i)}>
              <Card variant="flat" interactive className="h-full">
                {asset.url && asset.type === 'image' ? (
                  <div className="h-32 overflow-hidden">
                    <img
                      src={asset.url}
                      alt={asset.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className={`h-32 flex items-center justify-center ${typeColor[asset.type]}`}>
                    <Icon size={32} />
                  </div>
                )}
                <CardBody className="space-y-2 p-4">
                  <Text size="sm" className="font-bold truncate">{asset.name}{asset.extension}</Text>
                  <div className="flex items-center justify-between">
                    <Badge variant={typeBadge[asset.type]}>{asset.extension}</Badge>
                    <Label className="text-warm-gray/40">{asset.size}</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={10} className="text-warm-gray/30" />
                    <Label className="text-warm-gray/30">{asset.date}</Label>
                  </div>
                </CardBody>
              </Card>
            </motion.div>
          );
        })}
      </div>

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
            {uploading ? 'Enviando arquivos...' : 'Arraste arquivos ou clique para upload'}
          </Text>
          <Text size="xs" muted className="mt-1">JPG, PNG, MP4, PDF — max. 50 MB (imagens max. 10 MB)</Text>
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
            <Label variant="gold">{storageUsed} GB de {storageTotal} GB</Label>
          </div>
          <ProgressBar value={(storageUsed / storageTotal) * 100} size="md" showLabel />
        </div>
      </Card>
    </div>
  );
}
