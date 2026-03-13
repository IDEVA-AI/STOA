import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Plus, Trash2, ChevronDown, ChevronRight, ArrowUp, ArrowDown, Loader2, Route, X } from 'lucide-react';
import {
  Card, CardBody, Button, Badge, Input, Toggle, StatCard,
} from '../ui';
import { Heading, Label, Text } from '../ui/Typography';
import { listItem } from '@/src/lib/motion';
import * as api from '@/src/services/api';
import { useWorkspace } from '@/src/hooks/useWorkspace';
import type { Trail, Course } from '@/src/types';

type AdminCourse = api.AdminCourse;

export default function AdminTrails() {
  const { activeWorkspace } = useWorkspace();
  const workspaceId = activeWorkspace?.id;

  const [trails, setTrails] = useState<Trail[]>([]);
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Create form
  const [showNewTrail, setShowNewTrail] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');

  // Edit state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');

  // Expanded trail (for course management)
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [trailDetail, setTrailDetail] = useState<Trail | null>(null);
  const [manageCourseIds, setManageCourseIds] = useState<number[]>([]);

  const loadData = useCallback(async () => {
    if (!workspaceId) return;
    try {
      const [trs, crs] = await Promise.all([
        api.getTrails(workspaceId),
        api.getAdminCourses(),
      ]);
      setTrails(trs);
      setCourses(crs);
    } catch (err) {
      console.error('Failed to load trails:', err);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    if (workspaceId) loadData();
  }, [workspaceId, loadData]);

  const loadTrailDetail = useCallback(async (id: number) => {
    try {
      const detail = await api.getTrail(id);
      setTrailDetail(detail);
      setManageCourseIds(detail.courses?.map((c) => c.id) || []);
    } catch (err) {
      console.error('Failed to load trail detail:', err);
    }
  }, []);

  const handleExpand = (id: number) => {
    if (expandedId === id) {
      setExpandedId(null);
      setTrailDetail(null);
    } else {
      setExpandedId(id);
      loadTrailDetail(id);
    }
  };

  // CRUD
  const handleCreate = async () => {
    if (!newTitle.trim() || !workspaceId) return;
    try {
      await api.createTrail({
        workspace_id: workspaceId,
        title: newTitle.trim(),
        description: newDesc.trim() || undefined,
      });
      setShowNewTrail(false);
      setNewTitle('');
      setNewDesc('');
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdate = async (id: number) => {
    try {
      await api.updateTrail(id, {
        title: editTitle,
        description: editDesc,
      });
      setEditingId(null);
      loadData();
      if (expandedId === id) loadTrailDetail(id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Excluir esta trilha?')) return;
    try {
      await api.deleteTrail(id);
      if (expandedId === id) {
        setExpandedId(null);
        setTrailDetail(null);
      }
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleTogglePublished = async (trail: Trail) => {
    try {
      await api.updateTrail(trail.id, {
        is_published: trail.is_published ? 0 : 1,
      });
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const startEditing = (trail: Trail) => {
    setEditingId(trail.id);
    setEditTitle(trail.title);
    setEditDesc(trail.description || '');
  };

  // Course management within trail
  const handleAddCourseToTrail = async (trailId: number, courseId: number) => {
    const updated = [...manageCourseIds, courseId];
    setManageCourseIds(updated);
    try {
      await api.updateTrail(trailId, { courseIds: updated });
      loadTrailDetail(trailId);
      loadData();
    } catch (err) {
      console.error(err);
      setManageCourseIds(manageCourseIds); // rollback
    }
  };

  const handleRemoveCourseFromTrail = async (trailId: number, courseId: number) => {
    const updated = manageCourseIds.filter((id) => id !== courseId);
    setManageCourseIds(updated);
    try {
      await api.updateTrail(trailId, { courseIds: updated });
      loadTrailDetail(trailId);
      loadData();
    } catch (err) {
      console.error(err);
      setManageCourseIds(manageCourseIds); // rollback
    }
  };

  const handleReorder = async (trailId: number, fromIndex: number, direction: 'up' | 'down') => {
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= manageCourseIds.length) return;
    const updated = [...manageCourseIds];
    [updated[fromIndex], updated[toIndex]] = [updated[toIndex], updated[fromIndex]];
    setManageCourseIds(updated);
    try {
      await api.updateTrail(trailId, { courseIds: updated });
      loadTrailDetail(trailId);
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = trails.filter((t) =>
    t.title.toLowerCase().includes(search.toLowerCase())
  );

  const publishedCount = trails.filter((t) => t.is_published).length;

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
    <div className="space-y-16">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <StatCard label="Total de Trilhas" value={String(trails.length)} />
        <StatCard label="Trilhas Publicadas" value={String(publishedCount)} />
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-6">
        <div className="flex-1">
          <Input
            icon={<Search size={16} />}
            placeholder="Buscar trilhas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button icon={<Plus size={16} />} onClick={() => setShowNewTrail(true)}>Nova Trilha</Button>
      </div>

      {/* New Trail Form */}
      <AnimatePresence>
        {showNewTrail && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <Card variant="elevated">
              <CardBody className="space-y-4">
                <Heading level={3}>Nova Trilha</Heading>
                <Input
                  placeholder="Titulo da trilha"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  autoFocus
                />
                <Input
                  placeholder="Descricao (opcional)"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                />
                <div className="flex items-center gap-3">
                  <Button onClick={handleCreate}>Criar Trilha</Button>
                  <Button variant="secondary" onClick={() => { setShowNewTrail(false); setNewTitle(''); setNewDesc(''); }}>Cancelar</Button>
                </div>
              </CardBody>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trail List */}
      <div className="space-y-6">
        {filtered.map((trail, i) => {
          const isEditing = editingId === trail.id;
          const isExpanded = expandedId === trail.id;

          return (
            <motion.div key={trail.id} {...listItem(i)}>
              <Card variant="elevated">
                <CardBody className="space-y-4">
                  {isEditing ? (
                    <div className="space-y-4">
                      <Input
                        placeholder="Titulo"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        autoFocus
                      />
                      <Input
                        placeholder="Descricao"
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                      />
                      <div className="flex items-center gap-3">
                        <Button size="sm" onClick={() => handleUpdate(trail.id)}>Salvar</Button>
                        <Button variant="secondary" size="sm" onClick={() => setEditingId(null)}>Cancelar</Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-6">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-4">
                            {trail.thumbnail && (
                              <img
                                src={trail.thumbnail}
                                alt={trail.title}
                                className="w-12 h-12 object-cover rounded"
                              />
                            )}
                            <Heading level={3}>{trail.title}</Heading>
                            <Badge variant={trail.is_published ? 'success' : 'muted'}>
                              {trail.is_published ? 'Publicada' : 'Rascunho'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-6">
                            <Label>{trail.course_count ?? trail.courses?.length ?? 0} cursos</Label>
                          </div>
                          {trail.description && (
                            <Text size="sm" muted>{trail.description}</Text>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <Toggle
                            checked={!!trail.is_published}
                            onChange={() => handleTogglePublished(trail)}
                          />
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => startEditing(trail)}
                          >
                            Editar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            iconOnly
                            icon={<Trash2 size={14} className="text-red-400" />}
                            onClick={() => handleDelete(trail.id)}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            iconOnly
                            icon={isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            onClick={() => handleExpand(trail.id)}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Expanded: Course Management */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-line mt-4 pt-6 space-y-4">
                          <div className="flex items-center justify-between">
                            <Heading level={4}>Cursos da Trilha</Heading>
                            <Label className="text-warm-gray/40">{manageCourseIds.length} cursos vinculados</Label>
                          </div>

                          {/* Linked courses with reorder */}
                          {manageCourseIds.length > 0 ? (
                            <div className="space-y-2">
                              {manageCourseIds.map((courseId, idx) => {
                                const course = courses.find((c) => c.id === courseId);
                                if (!course) return null;
                                return (
                                  <div
                                    key={courseId}
                                    className="flex items-center justify-between p-4 border border-line hover:bg-bg/30 transition-colors"
                                  >
                                    <div className="flex items-center gap-4">
                                      <span className="text-[10px] font-mono text-warm-gray/40 w-6">
                                        {String(idx + 1).padStart(2, '0')}
                                      </span>
                                      <span className="font-bold text-sm">{course.title}</span>
                                      <Label>{course.lesson_count} aulas</Label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        iconOnly
                                        icon={<ArrowUp size={12} />}
                                        onClick={() => handleReorder(trail.id, idx, 'up')}
                                        disabled={idx === 0}
                                      />
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        iconOnly
                                        icon={<ArrowDown size={12} />}
                                        onClick={() => handleReorder(trail.id, idx, 'down')}
                                        disabled={idx === manageCourseIds.length - 1}
                                      />
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        iconOnly
                                        icon={<X size={12} className="text-red-400" />}
                                        onClick={() => handleRemoveCourseFromTrail(trail.id, courseId)}
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <Text size="sm" muted>Nenhum curso vinculado</Text>
                          )}

                          {/* Add course */}
                          {courses.filter((c) => !manageCourseIds.includes(c.id)).length > 0 && (
                            <div className="pt-2 space-y-2">
                              <Label>Adicionar curso:</Label>
                              <div className="grid grid-cols-2 gap-2">
                                {courses
                                  .filter((c) => !manageCourseIds.includes(c.id))
                                  .map((c) => (
                                    <button
                                      key={c.id}
                                      onClick={() => handleAddCourseToTrail(trail.id, c.id)}
                                      className="flex items-center gap-3 p-3 border border-dashed border-line hover:border-gold/50 hover:bg-bg/30 transition-all text-left group"
                                    >
                                      <Plus size={12} className="text-warm-gray group-hover:text-gold transition-colors" />
                                      <span className="text-sm">{c.title}</span>
                                    </button>
                                  ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardBody>
              </Card>
            </motion.div>
          );
        })}

        {filtered.length === 0 && !loading && (
          <div className="text-center py-16">
            <Route size={32} className="mx-auto mb-4 text-warm-gray/30" />
            <Text muted>Nenhuma trilha encontrada</Text>
          </div>
        )}
      </div>
    </div>
  );
}
