import { useEffect, useState } from 'react';
import { PlayCircle, ArrowRight } from 'lucide-react';
import type { Course, Post, TabId, DashboardProgress } from '../types';
import { getDashboardProgress } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import {
  PageTransition,
  Button,
  Avatar,
  Card,
  ProgressBar,
} from '../components/ui';
import { Label } from '../components/ui/Typography';

interface DashboardPageProps {
  courses: Course[];
  posts: Post[];
  onEnterCourse: (course: Course) => void;
  setActiveTab: (tab: TabId) => void;
}

export default function DashboardPage({ courses, posts, onEnterCourse, setActiveTab }: DashboardPageProps) {
  const { user } = useAuth();
  const [progress, setProgress] = useState<DashboardProgress | null>(null);

  useEffect(() => {
    getDashboardProgress().then(setProgress).catch(console.error);
  }, []);

  const percentage = progress?.overall.percentage ?? 0;
  const lastAccessed = progress?.lastAccessed;
  const firstName = user?.name?.split(' ')[0] || '';

  // Use course thumbnail if available, fallback to placeholder
  const heroImage = lastAccessed
    ? courses.find(c => c.id === lastAccessed.course_id)?.thumbnail
    : courses[0]?.thumbnail;

  return (
    <PageTransition id="dashboard" className="space-y-8 sm:space-y-16">
      <section className="relative py-6 sm:py-10">
        <div className="relative z-10 space-y-6">
          <h1 className="serif-display text-4xl sm:text-5xl lg:text-7xl tracking-tighter leading-[0.9]">
            Bem-vindo, <br />
            <span className="text-gold">{firstName}.</span>
          </h1>
          <p className="text-warm-gray max-w-xl text-lg leading-relaxed font-light">
            {percentage > 0 ? (
              <>Você completou <span className="text-gold font-medium">{percentage}%</span> da sua formação. Continue de onde parou.</>
            ) : (
              <>Sua jornada de aprendizado começa aqui.</>
            )}
          </p>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-16">
        <div className="lg:col-span-2 space-y-6 sm:space-y-12">
          <div className="flex items-center justify-between">
            <Label variant="gold" className="tracking-[0.3em]">Continuar Aprendendo</Label>
            <Button variant="link" className="text-[10px] mono-label text-warm-gray hover:text-gold">Ver Histórico</Button>
          </div>
          <div
            onClick={() => {
              if (lastAccessed) {
                const course = courses.find(c => c.id === lastAccessed.course_id);
                if (course) onEnterCourse(course);
              } else if (courses[0]) {
                onEnterCourse(courses[0]);
              }
            }}
            className="group relative aspect-[21/9] card-editorial overflow-hidden cursor-pointer shadow-2xl shadow-black/10 border-none"
          >
            <img
              src={heroImage || 'https://picsum.photos/seed/learn/1600/900'}
              className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-[2000ms] ease-out"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent opacity-90" />
            <div className="absolute inset-0 bg-gold/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

            <div className="absolute bottom-6 left-6 right-6 sm:bottom-12 sm:left-12 sm:right-12 text-paper space-y-8">
              <div className="space-y-2">
                {lastAccessed ? (
                  <>
                    <Label className="text-gold-light tracking-[0.4em] opacity-80">{lastAccessed.module_title}</Label>
                    <h3 className="font-serif text-2xl sm:text-4xl font-black leading-tight tracking-tight text-paper group-hover:text-gold transition-colors duration-500">{lastAccessed.lesson_title}</h3>
                  </>
                ) : (
                  <>
                    <Label className="text-gold-light tracking-[0.4em] opacity-80">Comece agora</Label>
                    <h3 className="font-serif text-2xl sm:text-4xl font-black leading-tight tracking-tight text-paper group-hover:text-gold transition-colors duration-500">Inicie sua primeira aula</h3>
                  </>
                )}
              </div>

              <div className="flex items-center gap-4 sm:gap-10">
                <Button
                  icon={<PlayCircle size={24} />}
                  size="lg"
                  className="!bg-paper !text-ink hover:!bg-gold hover:!text-paper shadow-xl group-hover:shadow-gold/20"
                >
                  Acessar Aula
                </Button>
                <div className="flex-1 space-y-3">
                  <ProgressBar value={percentage} size="sm" showLabel glow className="[&_span]:text-paper/40 [&_span:last-child]:text-gold-light" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6 sm:space-y-12">
          <Label variant="gold" className="tracking-[0.3em]">Pulso da Comunidade</Label>
          <Card variant="elevated" padding="lg" className="space-y-10">
            {posts.slice(0, 3).map(post => (
              <div key={post.id} className="flex gap-6 group cursor-pointer">
                <Avatar name={post.user_name} size="lg" interactive />
                <div className="space-y-2">
                  <p className="text-sm font-bold group-hover:text-gold transition-colors tracking-tight">{post.user_name}</p>
                  <p className="text-xs text-warm-gray line-clamp-2 leading-relaxed opacity-70 group-hover:opacity-100 transition-opacity">{post.content}</p>
                </div>
              </div>
            ))}
            <button
              onClick={() => setActiveTab('community')}
              className="w-full pt-10 text-[10px] mono-label text-warm-gray hover:text-gold transition-all border-t border-line flex items-center justify-center gap-3 group"
            >
              <span className="group-hover:tracking-[0.4em] transition-all">Ver feed completo</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
}
