import { PlayCircle } from 'lucide-react';
import type { Course } from '../types';
import {
  PageTransition,
  Badge,
  ProgressBar,
  PageHeader,
} from '../components/ui';

interface CoursesPageProps {
  courses: Course[];
  onEnterCourse: (course: Course) => void;
}

export default function CoursesPage({ courses, onEnterCourse }: CoursesPageProps) {
  return (
    <PageTransition id="courses" className="space-y-16">
      <PageHeader
        title="Conhecimento"
        subtitle="Arquitetura, Estratégia e Sistemas Organizacionais."
        actions={
          <div className="flex gap-10">
            <button className="mono-label text-gold border-b-2 border-gold pb-2 font-bold tracking-[0.2em]">Todos</button>
            <button className="mono-label text-warm-gray hover:text-text pb-2 tracking-[0.2em] transition-colors">Em Andamento</button>
            <button className="mono-label text-warm-gray hover:text-text pb-2 tracking-[0.2em] transition-colors">Concluídos</button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
        {courses.map(course => (
          <div
            key={course.id}
            onClick={() => onEnterCourse(course)}
            className="group card-editorial bg-surface-elevated hover:border-gold/50 cursor-pointer transition-all duration-700 shadow-xl shadow-black/5 hover:shadow-gold/10 flex flex-col h-full shadow-elevated"
          >
            <div className="aspect-[16/10] relative overflow-hidden">
              <img
                src={course.thumbnail}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1500ms] ease-out"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors duration-700" />
              <div className="absolute top-6 right-6">
                <Badge variant="default" className="px-4 py-1.5 shadow-2xl">{course.lessons_count} Aulas</Badge>
              </div>
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="w-16 h-16 rounded-full bg-bg/20 backdrop-blur-xl border border-text/20 flex items-center justify-center text-paper scale-90 group-hover:scale-100 transition-transform duration-500">
                  <PlayCircle size={32} />
                </div>
              </div>
            </div>
            <div className="p-10 flex flex-col flex-1 space-y-8">
              <div className="space-y-4">
                <h3 className="font-serif text-3xl font-bold leading-tight group-hover:text-gold transition-colors duration-500 tracking-tight">{course.title}</h3>
                <p className="text-sm text-warm-gray line-clamp-3 leading-relaxed font-light opacity-80 group-hover:opacity-100 transition-opacity">{course.description}</p>
              </div>

              <div className="mt-auto">
                <ProgressBar value={course.progress} size="sm" showLabel />
              </div>
            </div>
          </div>
        ))}
      </div>
    </PageTransition>
  );
}
