import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Play, Type, Image, FileDown, MousePointer, Minus, AlertCircle,
  ChevronUp, ChevronDown, Trash2, Pencil, Check, GripVertical,
  Loader2, Save, ArrowLeft, BookmarkPlus, LayoutTemplate,
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Button, Badge, Input, Textarea } from '@/src/components/ui';
import { Label } from '@/src/components/ui/Typography';
import {
  getLessonBlocks, setLessonBlocks, createTemplateFromLesson,
  getLessonTemplates, applyTemplateToLesson,
} from '@/src/services/api';
import type { LessonTemplate } from '@/src/services/api';
import type { LessonBlock } from '@/src/types';
import { useWorkspace } from '@/src/hooks/useWorkspace';

/* ─── Block type definitions ─── */

type BlockType = LessonBlock['block_type'];

const BLOCK_TYPES: { type: BlockType; label: string; icon: React.ReactNode; color: string }[] = [
  { type: 'video', label: 'Video', icon: <Play size={16} />, color: 'text-blue-400' },
  { type: 'text', label: 'Texto', icon: <Type size={16} />, color: 'text-warm-gray' },
  { type: 'image', label: 'Imagem', icon: <Image size={16} />, color: 'text-emerald-400' },
  { type: 'file', label: 'Arquivo', icon: <FileDown size={16} />, color: 'text-amber-400' },
  { type: 'button', label: 'Botao', icon: <MousePointer size={16} />, color: 'text-gold' },
  { type: 'divider', label: 'Separador', icon: <Minus size={16} />, color: 'text-warm-gray/50' },
  { type: 'callout', label: 'Destaque', icon: <AlertCircle size={16} />, color: 'text-blue-400' },
];

const BLOCK_TYPE_ICONS: Record<string, { icon: React.ReactNode; color: string }> = {
  video: { icon: <Play size={10} />, color: 'bg-blue-500/20 text-blue-400' },
  text: { icon: <Type size={10} />, color: 'bg-warm-gray/20 text-warm-gray' },
  image: { icon: <Image size={10} />, color: 'bg-emerald-500/20 text-emerald-400' },
  file: { icon: <FileDown size={10} />, color: 'bg-amber-500/20 text-amber-400' },
  button: { icon: <MousePointer size={10} />, color: 'bg-gold/20 text-gold' },
  divider: { icon: <Minus size={10} />, color: 'bg-warm-gray/10 text-warm-gray/50' },
  callout: { icon: <AlertCircle size={10} />, color: 'bg-blue-500/20 text-blue-400' },
};

/* ─── Helpers ─── */

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

/* ─── Block Edit Form ─── */

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

/* ─── Main Page ─── */

export default function BlockEditorPage() {
  const { lessonId: lessonIdParam } = useParams<{ lessonId: string }>();
  const lessonId = Number(lessonIdParam);
  const navigate = useNavigate();
  const location = useLocation();
  const { activeWorkspace } = useWorkspace();
  const workspaceId = activeWorkspace?.id;

  const lessonTitle = (location.state as { lessonTitle?: string } | null)?.lessonTitle || 'Aula';

  const [blocks, setBlocks] = useState<LessonBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [dirty, setDirty] = useState(false);

  // Templates
  const [templates, setTemplates] = useState<LessonTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [applyingTemplate, setApplyingTemplate] = useState<number | null>(null);

  /* ── Load blocks ── */
  const loadBlocks = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getLessonBlocks(lessonId);
      setBlocks(data.sort((a, b) => a.position - b.position));
    } catch (err) {
      console.error('Failed to load blocks:', err);
      setBlocks([]);
    } finally {
      setLoading(false);
    }
  }, [lessonId]);

  /* ── Load templates ── */
  const loadTemplates = useCallback(async () => {
    if (!workspaceId) return;
    try {
      setLoadingTemplates(true);
      const data = await getLessonTemplates(workspaceId);
      setTemplates(data);
    } catch {
      setTemplates([]);
    } finally {
      setLoadingTemplates(false);
    }
  }, [workspaceId]);

  useEffect(() => { loadBlocks(); }, [loadBlocks]);
  useEffect(() => { loadTemplates(); }, [loadTemplates]);

  /* ── Block handlers ── */
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

  const handleSaveAsTemplate = async () => {
    if (!workspaceId) return;
    const name = prompt('Nome do template:');
    if (!name?.trim()) return;
    try {
      await createTemplateFromLesson(workspaceId, lessonId, name.trim());
      alert('Template criado com sucesso!');
      loadTemplates();
    } catch (err) {
      console.error('Failed to save as template:', err);
      alert('Falha ao criar template.');
    }
  };

  const handleApplyTemplate = async (templateId: number) => {
    if (!confirm('Substituir blocos atuais pelo template selecionado?')) return;
    try {
      setApplyingTemplate(templateId);
      await applyTemplateToLesson(templateId, lessonId);
      setDirty(false);
      setEditingIdx(null);
      await loadBlocks();
    } catch (err) {
      console.error('Failed to apply template:', err);
      alert('Falha ao aplicar template.');
    } finally {
      setApplyingTemplate(null);
    }
  };

  const handleBack = () => {
    if (dirty && !confirm('Existem alteracoes nao salvas. Deseja sair mesmo assim?')) return;
    navigate('/admin');
  };

  /* ── Render ── */
  return (
    <div className="flex h-screen overflow-hidden font-sans bg-bg text-text">
      {/* ── Left Sidebar ── */}
      <aside className="w-64 bg-surface border-r border-line flex flex-col overflow-hidden shrink-0">
        <div className="flex-1 overflow-y-auto py-6 px-4">
          {/* Components Section */}
          <p className="mono-label text-[9px] text-warm-gray/50 tracking-[0.2em] uppercase px-2 mb-3 font-bold">
            Componentes
          </p>
          <div className="space-y-0.5">
            {BLOCK_TYPES.map(({ type, label, icon, color }) => (
              <button
                key={type}
                onClick={() => handleAddBlock(type)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold transition-all duration-200 rounded-sm',
                  'hover:bg-gold/5 hover:text-gold',
                  color
                )}
              >
                {icon}
                <span>{label}</span>
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="border-t border-line my-5" />

          {/* Templates Section */}
          <p className="mono-label text-[9px] text-warm-gray/50 tracking-[0.2em] uppercase px-2 mb-3 font-bold">
            Templates
          </p>
          {loadingTemplates ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 size={16} className="animate-spin text-warm-gray/30" />
            </div>
          ) : templates.length === 0 ? (
            <p className="text-[11px] text-warm-gray/30 px-2 italic">Nenhum template disponivel</p>
          ) : (
            <div className="space-y-1">
              {templates.map((template) => {
                const isApplying = applyingTemplate === template.id;
                return (
                  <button
                    key={template.id}
                    onClick={() => handleApplyTemplate(template.id)}
                    disabled={isApplying}
                    className={cn(
                      'w-full text-left px-3 py-2.5 transition-all duration-200 rounded-sm group',
                      'hover:bg-gold/5',
                      isApplying && 'opacity-50 pointer-events-none'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {isApplying ? (
                        <Loader2 size={12} className="animate-spin text-gold shrink-0" />
                      ) : (
                        <LayoutTemplate size={12} className="text-warm-gray/40 group-hover:text-gold shrink-0 transition-colors" />
                      )}
                      <span className="text-xs font-bold text-text truncate group-hover:text-gold transition-colors">
                        {template.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1.5 pl-5">
                      {template.blocks ? (
                        template.blocks.map((b, i) => {
                          const info = BLOCK_TYPE_ICONS[b.block_type] || BLOCK_TYPE_ICONS.text;
                          return (
                            <span
                              key={i}
                              className={cn('inline-flex items-center justify-center w-4 h-4 rounded-sm', info.color)}
                              title={b.block_type}
                            >
                              {info.icon}
                            </span>
                          );
                        })
                      ) : template.block_count ? (
                        <span className="text-[10px] text-warm-gray/40">{template.block_count} blocos</span>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </aside>

      {/* ── Right: Top bar + Canvas ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 bg-surface border-b border-line flex items-center justify-between px-6 shrink-0">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-warm-gray hover:text-gold transition-colors text-sm font-bold"
          >
            <ArrowLeft size={16} />
            <span>Voltar</span>
          </button>

          <h1 className="font-serif font-bold text-base truncate max-w-md">
            Editando: {lessonTitle}
          </h1>

          <div className="flex items-center gap-3">
            {dirty && (
              <span className="text-[9px] mono-label text-amber-400 tracking-widest hidden sm:inline">
                ALTERACOES NAO SALVAS
              </span>
            )}
            {workspaceId && blocks.length > 0 && (
              <Button
                variant="secondary"
                size="sm"
                icon={<BookmarkPlus size={14} />}
                onClick={handleSaveAsTemplate}
              >
                <span className="hidden md:inline">Salvar como Template</span>
              </Button>
            )}
            <Button
              size="sm"
              icon={saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              onClick={handleSave}
              disabled={saving || !dirty}
              className={cn(
                'transition-all',
                dirty && '!bg-gold !text-paper animate-pulse'
              )}
            >
              Salvar
            </Button>
          </div>
        </header>

        {/* Canvas */}
        <div className="flex-1 overflow-y-auto p-8 bg-bg">
          <div className="max-w-3xl mx-auto">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="animate-spin text-gold" size={24} />
              </div>
            ) : (
              <>
                {/* Block List */}
                <div className="space-y-4">
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
                            isEditing ? 'border-gold/30 bg-gold/5' : 'border-line bg-surface/50'
                          )}
                        >
                          {/* Block Row */}
                          <div className="flex items-center gap-4 p-4">
                            <div className="text-warm-gray/20 cursor-grab">
                              <GripVertical size={16} />
                            </div>

                            <span className={cn('inline-flex items-center mono-label text-[9px] font-bold tracking-widest px-3 py-1', badge.className)}>
                              {badge.label}
                            </span>

                            <span className="flex-1 text-xs text-warm-gray/60 truncate font-mono">
                              {getBlockPreview(block)}
                            </span>

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
                </div>

                {/* Empty state */}
                {blocks.length === 0 && !loading && (
                  <div className="text-center py-20">
                    <LayoutTemplate size={40} className="mx-auto mb-4 text-warm-gray/15" />
                    <p className="font-serif italic text-sm text-warm-gray/40">
                      Escolha um componente ou template para comecar
                    </p>
                    <p className="text-xs text-warm-gray/25 mt-2">
                      Use a barra lateral esquerda para adicionar blocos de conteudo
                    </p>
                  </div>
                )}

                {/* Add block bar (visible when blocks exist) */}
                {blocks.length > 0 && (
                  <div className="mt-6 border border-dashed border-line/50 p-4">
                    <p className="mono-label text-[9px] text-warm-gray/30 tracking-widest mb-3">ADICIONAR BLOCO</p>
                    <div className="flex flex-wrap gap-2">
                      {BLOCK_TYPES.map(({ type, label, icon, color }) => (
                        <button
                          key={type}
                          onClick={() => handleAddBlock(type)}
                          className={cn(
                            'flex items-center gap-2 px-3 py-2 text-xs font-bold border border-line',
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
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
