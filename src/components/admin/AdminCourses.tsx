import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Plus, ChevronDown, ChevronRight, Play, FileText, CheckCircle } from 'lucide-react';
import {
  Card, CardBody, Button, Badge, ProgressBar, Input, StatCard,
} from '../ui';
import { Heading, Label, Text } from '../ui/Typography';
import { listItem } from '@/src/lib/motion';

interface Lesson {
  title: string;
  duration: string;
  type: 'video' | 'text';
  completed: boolean;
}

interface Module {
  title: string;
  lessons: Lesson[];
}

interface Course {
  title: string;
  students: number;
  completion: number;
  status: 'Publicado' | 'Rascunho' | 'Em revisão';
  tier: 'Premium' | 'Gratuito' | 'Elite';
  modules: Module[];
}

const courses: Course[] = [
  {
    title: 'Arquitetura de Sistemas Invisíveis',
    students: 342,
    completion: 78,
    status: 'Publicado',
    tier: 'Premium',
    modules: [
      {
        title: 'Módulo 01 — Fundamentos',
        lessons: [
          { title: 'O Mito da Eficiência', duration: '5 min', type: 'video', completed: true },
          { title: 'Delegação de Autoridade', duration: '7 min', type: 'video', completed: true },
          { title: 'Pensamento Sistêmico', duration: '12 min', type: 'video', completed: false },
          { title: 'Exercício: Mapeamento', duration: '15 min', type: 'text', completed: false },
        ],
      },
      {
        title: 'Módulo 02 — Avançado',
        lessons: [
          { title: 'Arquitetura Organizacional', duration: '10 min', type: 'video', completed: false },
          { title: 'Feedback Loops', duration: '8 min', type: 'video', completed: false },
          { title: 'Projeto Final', duration: '30 min', type: 'text', completed: false },
        ],
      },
    ],
  },
  {
    title: 'O Problema Nunca é a Peça',
    students: 128,
    completion: 23,
    status: 'Rascunho',
    tier: 'Gratuito',
    modules: [
      {
        title: 'Módulo 01 — Introdução',
        lessons: [
          { title: 'Por que Sistemas Falham', duration: '6 min', type: 'video', completed: false },
          { title: 'O Olhar do Arquiteto', duration: '9 min', type: 'video', completed: false },
        ],
      },
      {
        title: 'Módulo 02 — Diagnóstico',
        lessons: [
          { title: 'Identificando Gargalos', duration: '11 min', type: 'video', completed: false },
          { title: 'Ferramentas de Análise', duration: '8 min', type: 'text', completed: false },
          { title: 'Estudo de Caso', duration: '15 min', type: 'video', completed: false },
        ],
      },
    ],
  },
  {
    title: 'Liderança que Escala',
    students: 89,
    completion: 54,
    status: 'Em revisão',
    tier: 'Elite',
    modules: [
      {
        title: 'Módulo 01 — Mentalidade',
        lessons: [
          { title: 'De Gestor a Arquiteto', duration: '7 min', type: 'video', completed: true },
          { title: 'Cultura como Sistema', duration: '10 min', type: 'video', completed: true },
          { title: 'Leitura Complementar', duration: '5 min', type: 'text', completed: false },
        ],
      },
    ],
  },
];

const totalLessons = courses.reduce((sum, c) => sum + c.modules.reduce((s, m) => s + m.lessons.length, 0), 0);
const totalHours = '28h';
const avgCompletion = Math.round(courses.reduce((sum, c) => sum + c.completion, 0) / courses.length);

export default function AdminCourses() {
  const [search, setSearch] = useState('');
  const [expandedCourse, setExpandedCourse] = useState<number | null>(null);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);

  const filtered = courses.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  const statusBadge = (status: Course['status']) => {
    const map: Record<Course['status'], 'success' | 'muted' | 'gold'> = {
      'Publicado': 'success',
      'Rascunho': 'muted',
      'Em revisão': 'gold',
    };
    return map[status];
  };

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
        <Button icon={<Plus size={16} />}>Novo Curso</Button>
      </div>

      {/* Course List */}
      <div className="space-y-6">
        {filtered.map((course, i) => {
          const isExpanded = expandedCourse === i;
          return (
            <motion.div key={course.title} {...listItem(i)}>
              <Card variant="elevated">
                <CardBody className="space-y-4">
                  {/* Course Header */}
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-4">
                        <Heading level={3}>{course.title}</Heading>
                      </div>
                      <div className="flex items-center gap-6">
                        <Label>{course.modules.reduce((s, m) => s + m.lessons.length, 0)} aulas</Label>
                        <Label>{course.students} alunos</Label>
                        <Badge variant={statusBadge(course.status)}>{course.status}</Badge>
                        {course.tier !== 'Gratuito' && (
                          <Badge variant="gold">{course.tier}</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 max-w-md">
                        <ProgressBar value={course.completion} size="sm" />
                        <span className="text-[10px] font-mono text-gold font-bold whitespace-nowrap">
                          {course.completion}%
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button variant="secondary" size="sm">Editar</Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        iconOnly
                        icon={isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        onClick={() => setExpandedCourse(isExpanded ? null : i)}
                      />
                    </div>
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
                          {course.modules.map((mod) => {
                            const modKey = `${i}-${mod.title}`;
                            const isModExpanded = expandedModule === modKey;
                            const completedCount = mod.lessons.filter(l => l.completed).length;
                            return (
                              <div key={mod.title} className="border border-line">
                                <button
                                  onClick={() => setExpandedModule(isModExpanded ? null : modKey)}
                                  className="w-full p-6 flex items-center justify-between hover:bg-bg/30 transition-colors"
                                >
                                  <div className="flex items-center gap-4">
                                    {isModExpanded ? <ChevronDown size={14} className="text-gold" /> : <ChevronRight size={14} className="text-warm-gray" />}
                                    <span className="font-bold text-sm">{mod.title}</span>
                                    <Label>{mod.lessons.length} aulas</Label>
                                    {completedCount > 0 && (
                                      <Badge variant="success">{completedCount}/{mod.lessons.length}</Badge>
                                    )}
                                  </div>
                                </button>
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
                                        {mod.lessons.map((lesson, li) => (
                                          <div
                                            key={li}
                                            className="px-6 py-4 flex items-center justify-between hover:bg-bg/20 transition-colors border-b border-line last:border-b-0"
                                          >
                                            <div className="flex items-center gap-4">
                                              {lesson.completed ? (
                                                <CheckCircle size={14} className="text-emerald-500" />
                                              ) : (
                                                <div className="w-3.5 h-3.5 border border-line rounded-full" />
                                              )}
                                              <span className="text-sm">{lesson.title}</span>
                                            </div>
                                            <div className="flex items-center gap-4">
                                              <Label>{lesson.duration}</Label>
                                              {lesson.type === 'video' ? (
                                                <Play size={12} className="text-warm-gray/40" />
                                              ) : (
                                                <FileText size={12} className="text-warm-gray/40" />
                                              )}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            );
                          })}
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
        <StatCard label="Total de Aulas" value={String(totalLessons)} trend="+6" />
        <StatCard label="Horas de Conteúdo" value={totalHours} trend="+4h" />
        <StatCard label="Conclusão Média" value={`${avgCompletion}%`} trend="+5%" />
      </div>
    </div>
  );
}
