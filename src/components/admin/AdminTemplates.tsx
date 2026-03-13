import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search, Plus, Trash2, Loader2, LayoutTemplate, Star, X,
} from 'lucide-react';
import {
  Card, CardBody, Button, Badge, Input, StatCard, Toggle,
} from '../ui';
import { Heading, Label, Text } from '../ui/Typography';
import { listItem } from '@/src/lib/motion';
import * as api from '@/src/services/api';
import { useWorkspace } from '@/src/hooks/useWorkspace';
import type { LessonTemplate } from '@/src/services/api';

export default function AdminTemplates() {
  const { activeWorkspace } = useWorkspace();
  const workspaceId = activeWorkspace?.id;

  const [templates, setTemplates] = useState<LessonTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Create form
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  // Edit state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const loadData = useCallback(async () => {
    if (!workspaceId) return;
    try {
      const data = await api.getLessonTemplates(workspaceId);
      setTemplates(data);
    } catch (err) {
      console.error('Failed to load templates:', err);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    if (workspaceId) loadData();
  }, [workspaceId, loadData]);

  const handleCreate = async () => {
    if (!newName.trim() || !workspaceId) return;
    try {
      await api.createLessonTemplate({
        workspace_id: workspaceId,
        name: newName.trim(),
        description: newDesc.trim() || undefined,
      });
      setShowNew(false);
      setNewName('');
      setNewDesc('');
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdate = async (id: number) => {
    try {
      await api.updateLessonTemplate(id, {
        name: editName,
        description: editDesc,
      });
      setEditingId(null);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Excluir este template?')) return;
    try {
      await api.deleteLessonTemplate(id);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleDefault = async (template: LessonTemplate) => {
    try {
      await api.updateLessonTemplate(template.id, {
        is_default: template.is_default ? 0 : 1,
      });
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const startEditing = (template: LessonTemplate) => {
    setEditingId(template.id);
    setEditName(template.name);
    setEditDesc(template.description || '');
  };

  const filtered = templates.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  const defaultCount = templates.filter((t) => t.is_default).length;

  if (!workspaceId) {
    return (
      <div className="flex items-center justify-center py-20">
        <Text muted>Selecione um workspace</Text>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-gold" size={24} />
      </div>
    );
  }

  return (
    <div className="space-y-8 sm:space-y-16">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <StatCard label="Total de Templates" value={String(templates.length)} />
        <StatCard label="Templates Padrao" value={String(defaultCount)} />
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-6">
        <div className="flex-1">
          <Input
            icon={<Search size={16} />}
            placeholder="Buscar templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button icon={<Plus size={16} />} onClick={() => setShowNew(true)}>Novo Template</Button>
      </div>

      {/* New Template Form */}
      <AnimatePresence>
        {showNew && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <Card variant="elevated">
              <CardBody className="space-y-4">
                <Heading level={3}>Novo Template</Heading>
                <Input
                  placeholder="Nome do template"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  autoFocus
                />
                <Input
                  placeholder="Descricao (opcional)"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                />
                <div className="flex items-center gap-3">
                  <Button onClick={handleCreate}>Criar Template</Button>
                  <Button variant="secondary" onClick={() => { setShowNew(false); setNewName(''); setNewDesc(''); }}>Cancelar</Button>
                </div>
              </CardBody>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Template List */}
      <div className="space-y-6">
        {filtered.map((template, i) => {
          const isEditing = editingId === template.id;

          return (
            <motion.div key={template.id} {...listItem(i)}>
              <Card variant="elevated">
                <CardBody className="space-y-4">
                  {isEditing ? (
                    <div className="space-y-4">
                      <Input
                        placeholder="Nome"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        autoFocus
                      />
                      <Input
                        placeholder="Descricao"
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                      />
                      <div className="flex items-center gap-3">
                        <Button size="sm" onClick={() => handleUpdate(template.id)}>Salvar</Button>
                        <Button variant="secondary" size="sm" onClick={() => setEditingId(null)}>Cancelar</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-6">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-4">
                          <Heading level={3}>{template.name}</Heading>
                          {!!template.is_default && (
                            <Badge variant="success">
                              <Star size={10} className="mr-1" />
                              Padrao
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-6">
                          <Label>{template.block_count ?? 0} blocos</Label>
                          {template.created_at && (
                            <Label className="text-warm-gray/30">
                              {new Date(template.created_at).toLocaleDateString('pt-BR')}
                            </Label>
                          )}
                        </div>
                        {template.description && (
                          <Text size="sm" muted>{template.description}</Text>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <Toggle
                          checked={!!template.is_default}
                          onChange={() => handleToggleDefault(template)}
                        />
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => startEditing(template)}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          iconOnly
                          icon={<Trash2 size={14} className="text-red-400" />}
                          onClick={() => handleDelete(template.id)}
                        />
                      </div>
                    </div>
                  )}
                </CardBody>
              </Card>
            </motion.div>
          );
        })}

        {filtered.length === 0 && !loading && (
          <div className="text-center py-16">
            <LayoutTemplate size={32} className="mx-auto mb-4 text-warm-gray/30" />
            <Text muted>Nenhum template encontrado</Text>
          </div>
        )}
      </div>
    </div>
  );
}
