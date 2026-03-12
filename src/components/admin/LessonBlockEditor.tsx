import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Play, Type, Image, FileDown, MousePointer, Minus, AlertCircle,
  ChevronUp, ChevronDown, Trash2, Pencil, X, Check, GripVertical,
  Loader2, Save, LayoutTemplate, BookmarkPlus,
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Card, CardBody, Button, Badge, Input, Textarea } from '../ui';
import { Heading, Label } from '../ui/Typography';
import { getLessonBlocks, setLessonBlocks, createTemplateFromLesson } from '@/src/services/api';
import type { LessonBlock } from '@/src/types';
import { useWorkspace } from '@/src/hooks/useWorkspace';
import TemplatePicker from './TemplatePicker';

interface LessonBlockEditorProps {
  lessonId: number;
  onClose: () => void;
}

type BlockType = LessonBlock['block_type'];

const BLOCK_TYPES: { type: BlockType; label: string; icon: React.ReactNode; color: string }[] = [
  { type: 'video', label: 'Video', icon: <Play size={14} />, color: 'text-blue-400 bg-blue-500/10' },
  { type: 'text', label: 'Texto', icon: <Type size={14} />, color: 'text-warm-gray bg-warm-gray/10' },
  { type: 'image', label: 'Imagem', icon: <Image size={14} />, color: 'text-emerald-400 bg-emerald-500/10' },
  { type: 'file', label: 'Arquivo', icon: <FileDown size={14} />, color: 'text-amber-400 bg-amber-500/10' },
  { type: 'button', label: 'Botao', icon: <MousePointer size={14} />, color: 'text-gold bg-gold/10' },
  { type: 'divider', label: 'Separador', icon: <Minus size={14} />, color: 'text-warm-gray/50 bg-warm-gray/5' },
  { type: 'callout', label: 'Destaque', icon: <AlertCircle size={14} />, color: 'text-blue-400 bg-blue-500/10' },
];

function getBlockBadge(type: BlockType): { label: string; className: string } {
  switch (type) {
    case 'video': return { label: 'Video', className: 'bg-blue-500/10 text-blue-400' };
    case 'text': return { label: 'Texto', className: 'bg-warm-gray/10 text-warm-gray' };
    case 'image': return { label: 'Imagem', className: 'bg-emerald-500/10 text-emerald-400' };
    case 'file': return { label: 'Arquivo', className: 'bg-amber-500/10 text-amber-400' };
    case 'button': return { label: 'Botao', className: 'bg-gold/10 text-gold' };
    case 'divider': return { label: 'Separador', className: 'bg-warm-gray/5 text-warm-gray/50' };
    case 'callout': return { label: 'Destaque', className: 'bg-blue-500/10 text-blue-400' };
    default: return { label: type, className: 'bg-warm-gray/10 text-warm-gray' };
  }
}

function getBlockPreview(block: LessonBlock): string {
  const c = block.content;
  switch (block.block_type) {
    case 'video': return c.url || 'Sem URL';
    case 'text': {
      const text = (c.html || '').replace(/<[^>]+>/g, '');
      return text.length > 80 ? text.slice(0, 80) + '...' : text || 'Sem conteudo';
    }
    case 'image': return c.caption || c.url || 'Sem imagem';
    case 'file': return c.filename || c.url || 'Sem arquivo';
    case 'button': return c.label || 'Sem label';
    case 'divider': return '---';
    case 'callout': {
      const t = c.text || '';
      return t.length > 60 ? t.slice(0, 60) + '...' : t || 'Sem texto';
    }
    default: return '';
  }
}

function defaultContent(type: BlockType): Record<string, any> {
  switch (type) {
    case 'video': return { url: '' };
    case 'text': return { html: '' };
    case 'image': return { url: '', caption: '' };
    case 'file': return { url: '', filename: '', size: '' };
    case 'button': return { label: '', url: '', style: 'primary' };
    case 'divider': return {};
    case 'callout': return { text: '', type: 'info' };
    default: return {};
  }
}

function BlockEditForm({ block, onChange }: { block: LessonBlock; onChange: (content: Record<string, any>) => void }) {
  const c = block.content;
  const update = (key: string, val: any) => onChange({ ...c, [key]: val });

  switch (block.block_type) {
    case 'video':
      return (
        <div className="space-y-3">
          <Label>URL do Video (YouTube, Vimeo ou direto)</Label>
          <Input
            placeholder="https://youtube.com/watch?v=..."
            value={c.url || ''}
            onChange={(e) => update('url', e.target.value)}
          />
        </div>
      );

    case 'text':
      return (
        <div className="space-y-3">
          <Label>Conteudo HTML</Label>
          <Textarea
            placeholder="<p>Seu conteudo aqui...</p>"
            value={c.html || ''}
            onChange={(e) => update('html', e.target.value)}
            className="h-40 font-mono text-xs"
          />
        </div>
      );

    case 'image':
      return (
        <div className="space-y-3">
          <Label>URL da Imagem</Label>
          <Input
            placeholder="https://..."
            value={c.url || ''}
            onChange={(e) => update('url', e.target.value)}
          />
          <Label>Legenda (opcional)</Label>
          <Input
            placeholder="Descricao da imagem"
            value={c.caption || ''}
            onChange={(e) => update('caption', e.target.value)}
          />
        </div>
      );

    case 'file':
      return (
        <div className="space-y-3">
          <Label>URL do Arquivo</Label>
          <Input
            placeholder="https://..."
            value={c.url || ''}
            onChange={(e) => update('url', e.target.value)}
          />
          <Label>Nome do Arquivo</Label>
          <Input
            placeholder="material.pdf"
            value={c.filename || ''}
            onChange={(e) => update('filename', e.target.value)}
          />
          <Label>Tamanho (opcional)</Label>
          <Input
            placeholder="2.4 MB"
            value={c.size || ''}
            onChange={(e) => update('size', e.target.value)}
          />
        </div>
      );

    case 'button':
      return (
        <div className="space-y-3">
          <Label>Texto do Botao</Label>
          <Input
            placeholder="Acessar recurso"
            value={c.label || ''}
            onChange={(e) => update('label', e.target.value)}
          />
          <Label>URL de Destino</Label>
          <Input
            placeholder="https://..."
            value={c.url || ''}
            onChange={(e) => update('url', e.target.value)}
          />
          <Label>Estilo</Label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => update('style', 'primary')}
              className={cn(
                'px-4 py-2 text-xs font-bold border transition-all',
                c.style === 'primary'
                  ? 'bg-gold text-paper border-gold'
                  : 'border-line text-warm-gray hover:border-gold/30'
              )}
            >
              Primario
            </button>
            <button
              onClick={() => update('style', 'secondary')}
              className={cn(
                'px-4 py-2 text-xs font-bold border transition-all',
                c.style === 'secondary'
                  ? 'bg-gold text-paper border-gold'
                  : 'border-line text-warm-gray hover:border-gold/30'
              )}
            >
              Secundario
            </button>
          </div>
        </div>
      );

    case 'divider':
      return (
        <p className="text-xs text-warm-gray/40 italic">Sem configuracao necessaria</p>
      );

    case 'callout':
      return (
        <div className="space-y-3">
          <Label>Texto</Label>
          <Textarea
            placeholder="Conteudo do destaque..."
            value={c.text || ''}
            onChange={(e) => update('text', e.target.value)}
            className="h-24"
          />
          <Label>Tipo</Label>
          <div className="flex items-center gap-3">
            {(['tip', 'warning', 'info'] as const).map((t) => (
              <button
                key={t}
                onClick={() => update('type', t)}
                className={cn(
                  'px-4 py-2 text-xs font-bold border transition-all',
                  c.type === t
                    ? 'bg-gold text-paper border-gold'
                    : 'border-line text-warm-gray hover:border-gold/30'
                )}
              >
                {t === 'tip' ? 'Dica' : t === 'warning' ? 'Aviso' : 'Info'}
              </button>
            ))}
          </div>
        </div>
      );

    default:
      return null;
  }
}

export default function LessonBlockEditor({ lessonId, onClose }: LessonBlockEditorProps) {
  const { activeWorkspace } = useWorkspace();
  const workspaceId = activeWorkspace?.id;
  const [blocks, setBlocks] = useState<LessonBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [dirty, setDirty] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [showInitialPicker, setShowInitialPicker] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getLessonBlocks(lessonId);
      const sorted = data.sort((a, b) => a.position - b.position);
      setBlocks(sorted);
      if (sorted.length === 0 && workspaceId) {
        setShowInitialPicker(true);
      }
    } catch (err) {
      console.error('Failed to load blocks:', err);
      setBlocks([]);
      if (workspaceId) setShowInitialPicker(true);
    } finally {
      setLoading(false);
    }
  }, [lessonId, workspaceId]);

  const handleSaveAsTemplate = async () => {
    if (!workspaceId) return;
    const name = prompt('Nome do template:');
    if (!name?.trim()) return;
    try {
      await createTemplateFromLesson(workspaceId, lessonId, name.trim());
      alert('Template criado com sucesso!');
    } catch (err) {
      console.error('Failed to save as template:', err);
      alert('Falha ao criar template.');
    }
  };

  const handleTemplateApplied = () => {
    setShowInitialPicker(false);
    setShowTemplatePicker(false);
    setDirty(false);
    load();
  };

  useEffect(() => {
    load();
  }, [load]);

  const handleAddBlock = (type: BlockType) => {
    const newBlock: LessonBlock = {
      block_type: type,
      content: defaultContent(type),
      position: blocks.length,
    };
    setBlocks((prev) => [...prev, newBlock]);
    setEditingIdx(blocks.length);
    setDirty(true);
  };

  const handleUpdateContent = (idx: number, content: Record<string, any>) => {
    setBlocks((prev) => prev.map((b, i) => (i === idx ? { ...b, content } : b)));
    setDirty(true);
  };

  const handleMoveUp = (idx: number) => {
    if (idx === 0) return;
    setBlocks((prev) => {
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next.map((b, i) => ({ ...b, position: i }));
    });
    if (editingIdx === idx) setEditingIdx(idx - 1);
    else if (editingIdx === idx - 1) setEditingIdx(idx);
    setDirty(true);
  };

  const handleMoveDown = (idx: number) => {
    if (idx >= blocks.length - 1) return;
    setBlocks((prev) => {
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next.map((b, i) => ({ ...b, position: i }));
    });
    if (editingIdx === idx) setEditingIdx(idx + 1);
    else if (editingIdx === idx + 1) setEditingIdx(idx);
    setDirty(true);
  };

  const handleDeleteBlock = (idx: number) => {
    if (!confirm('Excluir este bloco?')) return;
    setBlocks((prev) => prev.filter((_, i) => i !== idx).map((b, i) => ({ ...b, position: i })));
    if (editingIdx === idx) setEditingIdx(null);
    else if (editingIdx !== null && editingIdx > idx) setEditingIdx(editingIdx - 1);
    setDirty(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = blocks.map((b, i) => ({
        block_type: b.block_type,
        content: b.content,
        position: i,
      }));
      const result = await setLessonBlocks(lessonId, payload);
      // Update local blocks with returned IDs
      if (result.ids) {
        setBlocks((prev) =>
          prev.map((b, i) => ({ ...b, id: result.ids[i], position: i, lesson_id: lessonId }))
        );
      }
      setDirty(false);
      setEditingIdx(null);
    } catch (err) {
      console.error('Failed to save blocks:', err);
      alert('Falha ao salvar blocos.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-gold" size={20} />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="overflow-hidden"
    >
      <div className="border border-gold/20 bg-surface/50 mt-3">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-line">
          <div className="flex items-center gap-4">
            <Heading level={4}>Editor de Blocos</Heading>
            {dirty && (
              <span className="text-[9px] mono-label text-amber-400 tracking-widest">ALTERACOES NAO SALVAS</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {workspaceId && (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<LayoutTemplate size={14} />}
                  onClick={() => setShowTemplatePicker(true)}
                >
                  Usar Template
                </Button>
                {blocks.length > 0 && (
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<BookmarkPlus size={14} />}
                    onClick={handleSaveAsTemplate}
                  >
                    Salvar como Template
                  </Button>
                )}
              </>
            )}
            <Button
              size="sm"
              icon={saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              onClick={handleSave}
              disabled={saving || !dirty}
              className={cn(dirty ? '!bg-gold !text-paper' : '')}
            >
              Salvar
            </Button>
            <Button variant="ghost" size="sm" iconOnly icon={<X size={14} />} onClick={onClose} />
          </div>
        </div>

        {/* Block List */}
        <div className="p-6 space-y-3">
          <AnimatePresence initial={false}>
            {blocks.map((block, idx) => {
              const badge = getBlockBadge(block.block_type);
              const isEditing = editingIdx === idx;

              return (
                <motion.div
                  key={`${block.id ?? 'new'}-${idx}`}
                  layout
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    'border transition-colors',
                    isEditing ? 'border-gold/30 bg-gold/5' : 'border-line bg-bg/30'
                  )}
                >
                  {/* Block Row */}
                  <div className="flex items-center gap-4 p-4">
                    {/* Drag Handle */}
                    <div className="text-warm-gray/20 cursor-grab">
                      <GripVertical size={16} />
                    </div>

                    {/* Type Badge */}
                    <span className={cn('inline-flex items-center mono-label text-[9px] font-bold tracking-widest px-3 py-1', badge.className)}>
                      {badge.label}
                    </span>

                    {/* Preview */}
                    <span className="flex-1 text-xs text-warm-gray/60 truncate font-mono">
                      {getBlockPreview(block)}
                    </span>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost" size="sm" iconOnly
                        icon={<ChevronUp size={12} />}
                        onClick={() => handleMoveUp(idx)}
                        disabled={idx === 0}
                        className="!w-7 !h-7"
                      />
                      <Button
                        variant="ghost" size="sm" iconOnly
                        icon={<ChevronDown size={12} />}
                        onClick={() => handleMoveDown(idx)}
                        disabled={idx >= blocks.length - 1}
                        className="!w-7 !h-7"
                      />
                      <Button
                        variant="ghost" size="sm" iconOnly
                        icon={isEditing ? <Check size={12} className="text-gold" /> : <Pencil size={12} />}
                        onClick={() => setEditingIdx(isEditing ? null : idx)}
                        className="!w-7 !h-7"
                      />
                      <Button
                        variant="ghost" size="sm" iconOnly
                        icon={<Trash2 size={12} className="text-red-400" />}
                        onClick={() => handleDeleteBlock(idx)}
                        className="!w-7 !h-7"
                      />
                    </div>
                  </div>

                  {/* Inline Edit Form */}
                  <AnimatePresence>
                    {isEditing && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-6 pt-2 border-t border-line/50">
                          <BlockEditForm
                            block={block}
                            onChange={(content) => handleUpdateContent(idx, content)}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {blocks.length === 0 && (
            <div className="text-center py-12 text-warm-gray/30">
              <p className="font-serif italic text-sm">Nenhum bloco adicionado.</p>
              <p className="text-xs mt-2">Use a barra abaixo para adicionar conteudo ou escolha um template.</p>
              {workspaceId && (
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<LayoutTemplate size={14} />}
                  onClick={() => setShowTemplatePicker(true)}
                  className="mt-4"
                >
                  Escolher Template
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Add Block Toolbar */}
        <div className="border-t border-line p-6">
          <Label className="text-warm-gray/40 mb-4 block text-[9px] tracking-widest">ADICIONAR BLOCO</Label>
          <div className="flex flex-wrap gap-2">
            {BLOCK_TYPES.map(({ type, label, icon, color }) => (
              <button
                key={type}
                onClick={() => handleAddBlock(type)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 text-xs font-bold border border-line',
                  'hover:border-gold/30 hover:bg-gold/5 transition-all',
                  color
                )}
              >
                {icon}
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Template Picker modals */}
      {workspaceId && (showTemplatePicker || showInitialPicker) && (
        <TemplatePicker
          workspaceId={workspaceId}
          lessonId={lessonId}
          onApply={handleTemplateApplied}
          onClose={() => { setShowTemplatePicker(false); setShowInitialPicker(false); }}
        />
      )}
    </motion.div>
  );
}
