import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, ChevronDown, ChevronRight, Play, FileText, Trash2, Pencil, X, Check, Loader2, LayoutGrid } from 'lucide-react';
import {
  Card, CardBody, Button, Badge, Input, StatCard,
} from '../ui';
import { Heading, Label } from '../ui/Typography';
import { listItem } from '@/src/lib/motion';
import {
  getAdminCourses, createCourse, updateCourse, deleteCourse,
  createModule, updateModule, deleteModule,
  createLesson, updateLesson, deleteLesson,
  type AdminCourse,
} from '@/src/services/api';

interface ModuleWithLessons {
  id: number;
  course_id: number;
  title: string;
  order: number;
  lessons: LessonRow[];
}

interface LessonRow {
  id: number;
  module_id: number;
  title: string;
  content_url: string | null;
  content_type: string | null;
  duration: number | null;
  order: number;
}

// Inline form for creating/editing
function InlineForm({ initialValue, placeholder, onSave, onCancel }: {
  initialValue: string;
  placeholder: string;
  onSave: (value: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(initialValue);
  return (
    <div className="flex items-center gap-3">
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        autoFocus
        onKeyDown={(e) => {
          if (e.key === 'Enter' && value.trim()) onSave(value.trim());
          if (e.key === 'Escape') onCancel();
        }}
      />
      <Button variant="ghost" size="sm" iconOnly icon={<Check size={14} />} onClick={() => value.trim() && onSave(value.trim())} />
      <Button variant="ghost" size="sm" iconOnly icon={<X size={14} />} onClick={onCancel} />
    </div>
  );
}

export default function AdminCourses() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedCourse, setExpandedCourse] = useState<number | null>(null);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);

  // Course form states
  const [showNewCourse, setShowNewCourse] = useState(false);
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCourseDesc, setNewCourseDesc] = useState('');
  const [editingCourseId, setEditingCourseId] = useState<number | null>(null);
  const [editCourseTitle, setEditCourseTitle] = useState('');
  const [editCourseDesc, setEditCourseDesc] = useState('');

  // Module form states
  const [addingModuleCourseId, setAddingModuleCourseId] = useState<number | null>(null);
  const [editingModuleId, setEditingModuleId] = useState<number | null>(null);

  // Lesson form states
  const [addingLessonModuleId, setAddingLessonModuleId] = useState<number | null>(null);
  const [editingLessonId, setEditingLessonId] = useState<number | null>(null);

  // Expanded course modules/lessons cache
  const [courseModules, setCourseModules] = useState<Record<number, ModuleWithLessons[]>>({});

  const loadCourses = useCallback(async () => {
    try {
      const data = await getAdminCourses();
      setCourses(data);
    } catch (err) {
      console.error('Failed to load courses:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  // Load modules+lessons when expanding a course
  const loadCourseContent = useCallback(async (courseId: number) => {
    try {
      const res = await fetch(`/api/courses/${courseId}/content`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('stoa_access_token')}` },
      });
      if (res.ok) {
        const modules = await res.json();
        setCourseModules((prev) => ({ ...prev, [courseId]: modules }));
      }
    } catch (err) {
      console.error('Failed to load course content:', err);
    }
  }, []);

  const handleExpandCourse = (courseId: number) => {
    if (expandedCourse === courseId) {
      setExpandedCourse(null);
    } else {
      setExpandedCourse(courseId);
      if (!courseModules[courseId]) {
        loadCourseContent(courseId);
      }
    }
  };

  // ── Course CRUD ──
  const handleCreateCourse = async () => {
    if (!newCourseTitle.trim()) return;
    try {
      await createCourse({ title: newCourseTitle.trim(), description: newCourseDesc.trim() });
      setShowNewCourse(false);
      setNewCourseTitle('');
      setNewCourseDesc('');
      loadCourses();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateCourse = async (id: number) => {
    try {
      await updateCourse(id, { title: editCourseTitle, description: editCourseDesc });
      setEditingCourseId(null);
      loadCourses();
      // Refresh expanded content if needed
      if (expandedCourse === id) loadCourseContent(id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCourse = async (id: number) => {
    if (!confirm('Excluir este curso e todos os seus modulos/aulas?')) return;
    try {
      await deleteCourse(id);
      if (expandedCourse === id) setExpandedCourse(null);
      loadCourses();
    } catch (err) {
      console.error(err);
    }
  };

  // ── Module CRUD ──
  const handleCreateModule = async (courseId: number, title: string) => {
    const modules = courseModules[courseId] || [];
    try {
      await createModule(courseId, { title, order: modules.length });
      setAddingModuleCourseId(null);
      loadCourseContent(courseId);
      loadCourses(); // refresh counts
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateModule = async (moduleId: number, title: string, courseId: number) => {
    try {
      await updateModule(moduleId, { title });
      setEditingModuleId(null);
      loadCourseContent(courseId);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteModule = async (moduleId: number, courseId: number) => {
    if (!confirm('Excluir este modulo e todas as suas aulas?')) return;
    try {
      await deleteModule(moduleId);
      loadCourseContent(courseId);
      loadCourses();
    } catch (err) {
      console.error(err);
    }
  };

  // ── Lesson CRUD ──
  const handleCreateLesson = async (moduleId: number, title: string, courseId: number) => {
    try {
      await createLesson(moduleId, { title, order: 0 });
      setAddingLessonModuleId(null);
      loadCourseContent(courseId);
      loadCourses();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateLesson = async (lessonId: number, title: string, courseId: number) => {
    try {
      await updateLesson(lessonId, { title });
      setEditingLessonId(null);
      loadCourseContent(courseId);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteLesson = async (lessonId: number, courseId: number) => {
    if (!confirm('Excluir esta aula?')) return;
    try {
      await deleteLesson(lessonId);
      loadCourseContent(courseId);
      loadCourses();
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = courses.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  const totalLessons = courses.reduce((sum, c) => sum + c.lesson_count, 0);
  const totalModules = courses.reduce((sum, c) => sum + c.module_count, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-gold" size={24} />
      </div>
    );
  }

  return (
    <div className="space-y-16">
      {/* Toolbar */}
      <div className="flex items-center gap-6">
        <div className="flex-1">
          <Input
            icon={<Search size={16} />}
            placeholder="Buscar cursos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button icon={<Plus size={16} />} onClick={() => setShowNewCourse(true)}>Novo Curso</Button>
      </div>

      {/* New Course Form */}
      <AnimatePresence>
        {showNewCourse && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <Card variant="elevated">
              <CardBody className="space-y-4">
                <Heading level={3}>Novo Curso</Heading>
                <Input
                  placeholder="Titulo do curso"
                  value={newCourseTitle}
                  onChange={(e) => setNewCourseTitle(e.target.value)}
                  autoFocus
                />
                <Input
                  placeholder="Descricao (opcional)"
                  value={newCourseDesc}
                  onChange={(e) => setNewCourseDesc(e.target.value)}
                />
                <div className="flex items-center gap-3">
                  <Button onClick={handleCreateCourse}>Criar Curso</Button>
                  <Button variant="secondary" onClick={() => { setShowNewCourse(false); setNewCourseTitle(''); setNewCourseDesc(''); }}>Cancelar</Button>
                </div>
              </CardBody>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Course List */}
      <div className="space-y-6">
        {filtered.map((course, i) => {
          const isExpanded = expandedCourse === course.id;
          const isEditing = editingCourseId === course.id;
          const modules = courseModules[course.id] || [];

          return (
            <motion.div key={course.id} {...listItem(i)}>
              <Card variant="elevated">
                <CardBody className="space-y-4">
                  {/* Course Header */}
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1 space-y-3">
                      {isEditing ? (
                        <div className="space-y-3">
                          <Input
                            placeholder="Titulo"
                            value={editCourseTitle}
                            onChange={(e) => setEditCourseTitle(e.target.value)}
                            autoFocus
                          />
                          <Input
                            placeholder="Descricao"
                            value={editCourseDesc}
                            onChange={(e) => setEditCourseDesc(e.target.value)}
                          />
                          <div className="flex items-center gap-3">
                            <Button size="sm" onClick={() => handleUpdateCourse(course.id)}>Salvar</Button>
                            <Button variant="secondary" size="sm" onClick={() => setEditingCourseId(null)}>Cancelar</Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-4">
                            <Heading level={3}>{course.title}</Heading>
                          </div>
                          <div className="flex items-center gap-6">
                            <Label>{course.lesson_count} aulas</Label>
                            <Label>{course.module_count} modulos</Label>
                          </div>
                          {course.description && (
                            <Label className="text-warm-gray/60">{course.description}</Label>
                          )}
                        </>
                      )}
                    </div>
                    {!isEditing && (
                      <div className="flex items-center gap-3">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setEditingCourseId(course.id);
                            setEditCourseTitle(course.title);
                            setEditCourseDesc(course.description || '');
                          }}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          iconOnly
                          icon={<Trash2 size={14} className="text-red-400" />}
                          onClick={() => handleDeleteCourse(course.id)}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          iconOnly
                          icon={isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          onClick={() => handleExpandCourse(course.id)}
                        />
                      </div>
                    )}
                  </div>

                  {/* Accordion Modules */}
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
                          {modules.map((mod) => {
                            const modKey = `${course.id}-${mod.id}`;
                            const isModExpanded = expandedModule === modKey;
                            const lessons = mod.lessons || [];

                            return (
                              <div key={mod.id} className="border border-line">
                                <div className="w-full p-6 flex items-center justify-between hover:bg-bg/30 transition-colors">
                                  <button
                                    onClick={() => setExpandedModule(isModExpanded ? null : modKey)}
                                    className="flex items-center gap-4 flex-1 text-left"
                                  >
                                    {isModExpanded ? <ChevronDown size={14} className="text-gold" /> : <ChevronRight size={14} className="text-warm-gray" />}
                                    {editingModuleId === mod.id ? (
                                      <div onClick={(e) => e.stopPropagation()}>
                                        <InlineForm
                                          initialValue={mod.title}
                                          placeholder="Titulo do modulo"
                                          onSave={(val) => handleUpdateModule(mod.id, val, course.id)}
                                          onCancel={() => setEditingModuleId(null)}
                                        />
                                      </div>
                                    ) : (
                                      <>
                                        <span className="font-bold text-sm">{mod.title}</span>
                                        <Label>{lessons.length} aulas</Label>
                                      </>
                                    )}
                                  </button>
                                  {editingModuleId !== mod.id && (
                                    <div className="flex items-center gap-2">
                                      <Button variant="ghost" size="sm" iconOnly icon={<Pencil size={12} />} onClick={() => setEditingModuleId(mod.id)} />
                                      <Button variant="ghost" size="sm" iconOnly icon={<Trash2 size={12} className="text-red-400" />} onClick={() => handleDeleteModule(mod.id, course.id)} />
                                    </div>
                                  )}
                                </div>
                                <AnimatePresence>
                                  {isModExpanded && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.2 }}
                                      className="overflow-hidden"
                                    >
                                      <div className="border-t border-line">
                                        {lessons.map((lesson) => (
                                          <div key={lesson.id} className="border-b border-line last:border-b-0">
                                            <div className="px-6 py-4 flex items-center justify-between hover:bg-bg/20 transition-colors">
                                              {editingLessonId === lesson.id ? (
                                                <div className="flex-1" onClick={(e) => e.stopPropagation()}>
                                                  <InlineForm
                                                    initialValue={lesson.title}
                                                    placeholder="Titulo da aula"
                                                    onSave={(val) => handleUpdateLesson(lesson.id, val, course.id)}
                                                    onCancel={() => setEditingLessonId(null)}
                                                  />
                                                </div>
                                              ) : (
                                                <>
                                                  <div className="flex items-center gap-4">
                                                    <div className="w-3.5 h-3.5 border border-line rounded-full" />
                                                    <span className="text-sm">{lesson.title}</span>
                                                  </div>
                                                  <div className="flex items-center gap-4">
                                                    {lesson.duration && <Label>{lesson.duration} min</Label>}
                                                    {lesson.content_type === 'video' ? (
                                                      <Play size={12} className="text-warm-gray/40" />
                                                    ) : (
                                                      <FileText size={12} className="text-warm-gray/40" />
                                                    )}
                                                    <Button
                                                      variant="ghost" size="sm"
                                                      icon={<LayoutGrid size={12} />}
                                                      onClick={() => navigate(`/admin/editor/${lesson.id}`, { state: { lessonTitle: lesson.title } })}
                                                    >
                                                      <span className="text-[10px]">Blocos</span>
                                                    </Button>
                                                    <Button variant="ghost" size="sm" iconOnly icon={<Pencil size={12} />} onClick={() => setEditingLessonId(lesson.id)} />
                                                    <Button variant="ghost" size="sm" iconOnly icon={<Trash2 size={12} className="text-red-400" />} onClick={() => handleDeleteLesson(lesson.id, course.id)} />
                                                  </div>
                                                </>
                                              )}
                                            </div>
                                          </div>
                                        ))}
                                        {/* Add lesson */}
                                        <div className="px-6 py-4 border-t border-line">
                                          {addingLessonModuleId === mod.id ? (
                                            <InlineForm
                                              initialValue=""
                                              placeholder="Titulo da nova aula"
                                              onSave={(val) => handleCreateLesson(mod.id, val, course.id)}
                                              onCancel={() => setAddingLessonModuleId(null)}
                                            />
                                          ) : (
                                            <Button variant="ghost" size="sm" icon={<Plus size={12} />} onClick={() => setAddingLessonModuleId(mod.id)}>
                                              Adicionar Aula
                                            </Button>
                                          )}
                                        </div>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            );
                          })}

                          {/* Add module */}
                          <div className="pt-2">
                            {addingModuleCourseId === course.id ? (
                              <InlineForm
                                initialValue=""
                                placeholder="Titulo do novo modulo"
                                onSave={(val) => handleCreateModule(course.id, val)}
                                onCancel={() => setAddingModuleCourseId(null)}
                              />
                            ) : (
                              <Button variant="ghost" size="sm" icon={<Plus size={12} />} onClick={() => setAddingModuleCourseId(course.id)}>
                                Adicionar Modulo
                              </Button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardBody>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Footer Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <StatCard label="Total de Cursos" value={String(courses.length)} />
        <StatCard label="Total de Modulos" value={String(totalModules)} />
        <StatCard label="Total de Aulas" value={String(totalLessons)} />
      </div>
    </div>
  );
}
