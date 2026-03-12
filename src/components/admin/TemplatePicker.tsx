import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Play, Type, Image, FileDown, MousePointer, Minus, AlertCircle,
  X, Loader2, LayoutTemplate, Sparkles,
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Button, Badge } from '../ui';
import { Heading, Label, Text } from '../ui/Typography';
import * as api from '@/src/services/api';
import type { LessonTemplate } from '@/src/services/api';

interface TemplatePickerProps {
  workspaceId: number;
  lessonId: number;
  onApply: () => void;
  onClose: () => void;
}

const BLOCK_TYPE_ICONS: Record<string, { icon: React.ReactNode; color: string }> = {
  video: { icon: <Play size={10} />, color: 'bg-blue-500/20 text-blue-400' },
  text: { icon: <Type size={10} />, color: 'bg-warm-gray/20 text-warm-gray' },
  image: { icon: <Image size={10} />, color: 'bg-emerald-500/20 text-emerald-400' },
  file: { icon: <FileDown size={10} />, color: 'bg-amber-500/20 text-amber-400' },
  button: { icon: <MousePointer size={10} />, color: 'bg-gold/20 text-gold' },
  divider: { icon: <Minus size={10} />, color: 'bg-warm-gray/10 text-warm-gray/50' },
  callout: { icon: <AlertCircle size={10} />, color: 'bg-blue-500/20 text-blue-400' },
};

export default function TemplatePicker({ workspaceId, lessonId, onApply, onClose }: TemplatePickerProps) {
  const [templates, setTemplates] = useState<LessonTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<number | null>(null);

  useEffect(() => {
    api.getLessonTemplates(workspaceId)
      .then(setTemplates)
      .catch(() => setTemplates([]))
      .finally(() => setLoading(false));
  }, [workspaceId]);

  const handleApply = async (templateId: number) => {
    try {
      setApplying(templateId);
      await api.applyTemplateToLesson(templateId, lessonId);
      onApply();
      onClose();
    } catch (err) {
      console.error('Failed to apply template:', err);
      alert('Falha ao aplicar template.');
    } finally {
      setApplying(null);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-2xl max-h-[80vh] overflow-y-auto bg-surface border border-line shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-line sticky top-0 bg-surface z-10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center">
                <LayoutTemplate size={16} className="text-gold" />
              </div>
              <div>
                <Heading level={4}>Escolher Template</Heading>
                <p className="text-[10px] mono-label text-warm-gray/50 tracking-widest mt-0.5">
                  OS BLOCOS ATUAIS SERAO SUBSTITUIDOS
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" iconOnly icon={<X size={16} />} onClick={onClose} />
          </div>

          {/* Content */}
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin text-gold" size={20} />
              </div>
            ) : (
              <div className="space-y-4">
                {/* Start from scratch option */}
                <button
                  onClick={onClose}
                  className="w-full flex items-center gap-4 p-4 border border-dashed border-line hover:border-gold/30 hover:bg-gold/5 transition-all group"
                >
                  <div className="w-10 h-10 flex items-center justify-center border border-line group-hover:border-gold/30 transition-colors">
                    <Sparkles size={16} className="text-warm-gray/40 group-hover:text-gold transition-colors" />
                  </div>
                  <div className="text-left">
                    <span className="font-bold text-sm block">Comecar do zero</span>
                    <span className="text-[11px] text-warm-gray/50">Adicione blocos manualmente</span>
                  </div>
                </button>

                {/* Template cards grid */}
                {templates.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {templates.map((template) => {
                      const isApplying = applying === template.id;
                      return (
                        <div
                          key={template.id}
                          className="border border-line hover:border-gold/30 transition-all group"
                        >
                          <div className="p-4 space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <span className="font-bold text-sm block">{template.name}</span>
                                {template.description && (
                                  <span className="text-[11px] text-warm-gray/50 line-clamp-2 mt-0.5 block">
                                    {template.description}
                                  </span>
                                )}
                              </div>
                              {!!template.is_default && (
                                <Badge variant="muted" className="shrink-0 text-[8px]">Padrao</Badge>
                              )}
                            </div>

                            {/* Block type preview dots */}
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {template.blocks
                                ? template.blocks.map((b, i) => {
                                    const info = BLOCK_TYPE_ICONS[b.block_type] || BLOCK_TYPE_ICONS.text;
                                    return (
                                      <span
                                        key={i}
                                        className={cn('inline-flex items-center justify-center w-5 h-5 rounded-sm', info.color)}
                                        title={b.block_type}
                                      >
                                        {info.icon}
                                      </span>
                                    );
                                  })
                                : template.block_count
                                  ? (
                                    <Label className="text-warm-gray/40">{template.block_count} blocos</Label>
                                  )
                                  : null
                              }
                            </div>

                            <Button
                              size="sm"
                              className="w-full"
                              onClick={() => handleApply(template.id)}
                              disabled={isApplying}
                              icon={isApplying ? <Loader2 size={12} className="animate-spin" /> : undefined}
                            >
                              {isApplying ? 'Aplicando...' : 'Usar este template'}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {templates.length === 0 && (
                  <div className="text-center py-8">
                    <LayoutTemplate size={24} className="mx-auto mb-3 text-warm-gray/20" />
                    <Text size="sm" muted>Nenhum template disponivel</Text>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
