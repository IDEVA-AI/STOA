import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Plus, Trash2, Loader2, Users } from 'lucide-react';
import {
  Card, CardBody, Button, Badge, Input, StatCard,
} from '../ui';
import { Heading, Label, Text } from '../ui/Typography';
import { listItem } from '@/src/lib/motion';
import * as api from '@/src/services/api';
import { useWorkspace } from '@/src/hooks/useWorkspace';
import type { Community } from '@/src/types';

export default function AdminCommunities() {
  const { activeWorkspace } = useWorkspace();
  const workspaceId = activeWorkspace?.id;

  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Create form
  const [showNewCommunity, setShowNewCommunity] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  // Edit state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const loadCommunities = useCallback(async () => {
    if (!workspaceId) return;
    try {
      const data = await api.getCommunities(workspaceId);
      setCommunities(data);
    } catch (err) {
      console.error('Failed to load communities:', err);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    if (workspaceId) loadCommunities();
  }, [workspaceId, loadCommunities]);

  const handleCreate = async () => {
    if (!newName.trim() || !workspaceId) return;
    try {
      await api.createCommunity({
        workspace_id: workspaceId,
        name: newName.trim(),
        description: newDesc.trim() || undefined,
      });
      setShowNewCommunity(false);
      setNewName('');
      setNewDesc('');
      loadCommunities();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdate = async (id: number) => {
    try {
      await api.updateCommunity(id, {
        name: editName,
        description: editDesc,
      });
      setEditingId(null);
      loadCommunities();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Excluir esta comunidade?')) return;
    try {
      await api.deleteCommunity(id);
      loadCommunities();
    } catch (err) {
      console.error(err);
    }
  };

  const startEditing = (community: Community) => {
    setEditingId(community.id);
    setEditName(community.name);
    setEditDesc(community.description || '');
  };

  const filtered = communities.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

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
        <StatCard label="Total de Comunidades" value={String(communities.length)} />
        <StatCard label="Total de Posts" value={String(communities.reduce((sum, c) => sum + (c.post_count || 0), 0))} />
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-6">
        <div className="flex-1">
          <Input
            icon={<Search size={16} />}
            placeholder="Buscar comunidades..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button icon={<Plus size={16} />} onClick={() => setShowNewCommunity(true)}>Nova Comunidade</Button>
      </div>

      {/* New Community Form */}
      <AnimatePresence>
        {showNewCommunity && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <Card variant="elevated">
              <CardBody className="space-y-4">
                <Heading level={3}>Nova Comunidade</Heading>
                <Input
                  placeholder="Nome da comunidade"
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
                  <Button onClick={handleCreate}>Criar Comunidade</Button>
                  <Button variant="secondary" onClick={() => { setShowNewCommunity(false); setNewName(''); setNewDesc(''); }}>Cancelar</Button>
                </div>
              </CardBody>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Community Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filtered.map((community, i) => {
          const isEditing = editingId === community.id;

          return (
            <motion.div key={community.id} {...listItem(i)}>
              <Card variant="elevated" interactive className="h-full">
                <CardBody className="space-y-6">
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
                        <Button size="sm" onClick={() => handleUpdate(community.id)}>Salvar</Button>
                        <Button variant="secondary" size="sm" onClick={() => setEditingId(null)}>Cancelar</Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-start">
                        <Heading level={4}>{community.name}</Heading>
                        {community.course_id && (
                          <Badge variant="default">Curso #{community.course_id}</Badge>
                        )}
                      </div>
                      {community.description && (
                        <Text size="sm" muted>{community.description}</Text>
                      )}
                      <div className="flex items-center gap-6">
                        <Label>{community.post_count ?? 0} posts</Label>
                      </div>
                      <div className="flex items-center justify-between">
                        <Button variant="secondary" size="sm" onClick={() => startEditing(community)}>Editar</Button>
                        <div className="flex items-center gap-2">
                          <Button variant="secondary" size="sm">Gerenciar</Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            iconOnly
                            icon={<Trash2 size={14} className="text-red-400" />}
                            onClick={() => handleDelete(community.id)}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </CardBody>
              </Card>
            </motion.div>
          );
        })}

        {/* Ghost card */}
        <motion.div {...listItem(filtered.length)}>
          <button
            onClick={() => setShowNewCommunity(true)}
            className="h-full min-h-[240px] w-full border-2 border-dashed border-line hover:border-gold/50 flex flex-col items-center justify-center gap-4 transition-colors duration-300 cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center group-hover:bg-gold/10 transition-colors">
              <Plus size={20} className="text-warm-gray group-hover:text-gold transition-colors" />
            </div>
            <Text size="sm" muted>Criar Nova Comunidade</Text>
          </button>
        </motion.div>
      </div>

      {filtered.length === 0 && !loading && communities.length === 0 && (
        <div className="text-center py-16">
          <Users size={32} className="mx-auto mb-4 text-warm-gray/30" />
          <Text muted>Nenhuma comunidade encontrada</Text>
        </div>
      )}
    </div>
  );
}
