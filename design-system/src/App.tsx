/**
 * FOCO: Interface (Frontend/UI/UX)
 * NOTA: A lógica de backend é secundária. Priorizar excelência visual e experiência do usuário.
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  MessageSquare, 
  Bell, 
  Search, 
  Settings, 
  LogOut,
  PlayCircle,
  Heart,
  Share2,
  Send,
  ArrowRight,
  ShieldCheck,
  BarChart3,
  Globe,
  FolderOpen,
  ShoppingCart,
  Lock,
  Flag,
  CheckCircle,
  MoreVertical,
  Bookmark,
  FileText,
  Lightbulb,
  Quote,
  PenTool,
  Maximize2,
  Minimize2,
  Paperclip,
  CheckCheck,
  UserCircle,
  ChevronRight,
  AlertCircle,
  Image,
  Phone,
  Video,
  Mic
} from 'lucide-react';
import { cn } from './lib/utils';
import { Course, Post, User, Module, Lesson } from './types';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'courses' | 'community' | 'admin' | 'profile' | 'messages'>('dashboard');
  const [adminSection, setAdminSection] = useState<'dashboard' | 'communities' | 'courses' | 'media' | 'integrations' | 'unlocks' | 'moderation' | 'settings'>('dashboard');
  const [theme, setTheme] = useState<'light' | 'dark' | 'rust'>('light');
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [courseContent, setCourseContent] = useState<Module[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(true);
  const [courseLoading, setCourseLoading] = useState(false);
  const [courseError, setCourseError] = useState<string | null>(null);
  const [notes, setNotes] = useState<string>('');
  const [bookmarks, setBookmarks] = useState<number[]>([]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    document.body.classList.remove('theme-dark', 'theme-rust');
    if (theme === 'dark') document.body.classList.add('theme-dark');
    if (theme === 'rust') document.body.classList.add('theme-rust');
  }, [theme]);

  const fetchData = async () => {
    try {
      const [coursesRes, feedRes] = await Promise.all([
        fetch('/api/courses'),
        fetch('/api/feed')
      ]);
      const coursesData = await coursesRes.json();
      const feedData = await feedRes.json();
      setCourses(coursesData);
      setPosts(feedData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim()) return;

    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newPost, userId: 1 })
      });
      if (res.ok) {
        setNewPost('');
        fetchData();
      }
    } catch (error) {
      console.error('Error posting:', error);
    }
  };

  const fetchCourseContent = async (courseId: number) => {
    setCourseLoading(true);
    setCourseError(null);
    try {
      const res = await fetch(`/api/courses/${courseId}/content`);
      if (!res.ok) throw new Error('Falha ao carregar o conteúdo do curso.');
      
      const data = await res.json();
      setCourseContent(data);
      
      // Find the first lesson in the first module that has lessons
      const firstModuleWithLessons = data.find((m: any) => m.lessons && m.lessons.length > 0);
      if (firstModuleWithLessons) {
        setSelectedLesson(firstModuleWithLessons.lessons[0]);
      } else {
        setCourseError('Este curso ainda não possui aulas cadastradas.');
      }
    } catch (error) {
      console.error('Error fetching course content:', error);
      setCourseError('Ocorreu um erro ao conectar com o servidor. Tente novamente.');
    } finally {
      setCourseLoading(false);
    }
  };

  const handleEnterCourse = (course: Course) => {
    console.log('Entering course:', course.id);
    setSelectedCourse(course);
    setSelectedLesson(null); // Clear old lesson
    fetchCourseContent(course.id);
  };

  const toggleLessonCompletion = (lessonId: number) => {
    setCourseContent(prev => prev.map(module => ({
      ...module,
      lessons: module.lessons?.map(lesson => 
        lesson.id === lessonId ? { ...lesson, completed: !lesson.completed } : lesson
      )
    })));

    if (selectedLesson?.id === lessonId) {
      setSelectedLesson(prev => prev ? { ...prev, completed: !prev.completed } : null);
    }

    // Update course progress in the main list
    if (selectedCourse) {
      setCourses(prev => prev.map(c => {
        if (c.id === selectedCourse.id) {
          // Calculate new progress
          const allLessons = courseContent.flatMap(m => m.lessons || []);
          const completedCount = allLessons.filter(l => l.id === lessonId ? !l.completed : l.completed).length;
          const newProgress = Math.round((completedCount / allLessons.length) * 100);
          return { ...c, progress: newProgress };
        }
        return c;
      }));
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg transition-colors duration-500 p-6">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 card-editorial overflow-hidden bg-surface transition-colors duration-500">
          {/* Left Side: Brand/Visual */}
          <div className="hidden lg:flex flex-col justify-between p-16 bg-text text-bg transition-colors duration-500 relative overflow-hidden">
            <div className="relative z-10">
              <span className="font-serif font-black text-3xl tracking-tight">Julio Carvalho</span>
              <p className="mono-label text-gold mt-2">Arquiteto de Sistemas</p>
            </div>
            
            <div className="relative z-10">
              <h1 className="font-serif text-6xl font-black leading-[0.9] mb-8">A estrutura precede o sucesso.</h1>
              <p className="text-bg/60 text-lg font-light max-w-sm">
                Entre na plataforma exclusiva para arquitetos de sistemas organizacionais e líderes de elite.
              </p>
            </div>

            {/* Abstract Decorative Element */}
            <div className="absolute -bottom-20 -right-20 w-96 h-96 border border-gold/20 rounded-full" />
            <div className="absolute -bottom-10 -right-10 w-96 h-96 border border-gold/10 rounded-full" />
          </div>

          {/* Right Side: Form */}
          <div className="p-12 lg:p-20 flex flex-col justify-center">
            <div className="mb-12">
              <h2 className="font-serif text-4xl font-black mb-2">
                {authMode === 'login' ? 'Bem-vindo de volta' : 'Crie sua conta'}
              </h2>
              <p className="text-warm-gray text-sm">
                {authMode === 'login' 
                  ? 'Acesse seu painel de controle e continue sua jornada.' 
                  : 'Inicie sua transformação como arquiteto de sistemas.'}
              </p>
            </div>

            <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); setIsAuthenticated(true); }}>
              {authMode === 'register' && (
                <div className="space-y-1.5">
                  <label className="mono-label text-[10px] text-warm-gray">Nome Completo</label>
                  <input 
                    type="text" 
                    required
                    className="w-full bg-bg border border-line px-4 py-3 focus:outline-none focus:border-gold transition-colors text-sm"
                    placeholder="Seu nome"
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <label className="mono-label text-[10px] text-warm-gray">Endereço de E-mail</label>
                <input 
                  type="email" 
                  required
                  className="w-full bg-bg border border-line px-4 py-3 focus:outline-none focus:border-gold transition-colors text-sm"
                  placeholder="exemplo@email.com"
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="mono-label text-[10px] text-warm-gray">Senha</label>
                  {authMode === 'login' && (
                    <button type="button" className="text-[10px] mono-label text-gold hover:underline">Esqueceu a senha?</button>
                  )}
                </div>
                <input 
                  type="password" 
                  required
                  className="w-full bg-bg border border-line px-4 py-3 focus:outline-none focus:border-gold transition-colors text-sm"
                  placeholder="••••••••"
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-text text-bg py-4 font-bold hover:bg-gold transition-colors duration-500 mt-4"
              >
                {authMode === 'login' ? 'Entrar no Sistema' : 'Finalizar Cadastro'}
              </button>
            </form>

            <div className="mt-12 pt-8 border-t border-line text-center">
              <p className="text-sm text-warm-gray">
                {authMode === 'login' ? 'Ainda não é membro?' : 'Já possui uma conta?'}
                <button 
                  onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                  className="ml-2 font-bold text-text hover:text-gold transition-colors"
                >
                  {authMode === 'login' ? 'Solicitar Acesso' : 'Fazer Login'}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (selectedCourse) {
    const toggleBookmark = (id: number) => {
      setBookmarks(prev => prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]);
    };

    if (!selectedLesson) {
      return (
        <div className="h-screen w-full flex items-center justify-center bg-bg p-8">
          <div className="flex flex-col items-center gap-8 max-w-md text-center">
            {courseError ? (
              <>
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-2">
                  <AlertCircle size={32} />
                </div>
                <div className="space-y-4">
                  <h3 className="font-serif text-2xl font-bold">Ops! Algo deu errado.</h3>
                  <p className="text-warm-gray text-sm leading-relaxed">{courseError}</p>
                </div>
                <button 
                  onClick={() => {
                    setSelectedCourse(null);
                    setCourseError(null);
                  }}
                  className="mt-4 px-8 py-3 bg-text text-bg font-bold hover:bg-gold transition-colors"
                >
                  Voltar ao Catálogo
                </button>
              </>
            ) : (
              <>
                <div className="w-12 h-12 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                <div className="space-y-2">
                  <p className="mono-label text-gold text-[10px] animate-pulse">Arquitetando sua experiência...</p>
                  <p className="text-warm-gray text-xs font-light italic">Preparando o ambiente de aprendizado para {selectedCourse.title}</p>
                </div>
                <button 
                  onClick={() => {
                    setSelectedCourse(null);
                    setCourseError(null);
                  }}
                  className="mt-8 text-[10px] mono-label text-warm-gray hover:text-gold transition-colors"
                >
                  Cancelar carregamento
                </button>
              </>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="flex h-screen overflow-hidden font-sans transition-colors duration-500 bg-bg text-text">
        {/* LEFT SIDEBAR — LESSON NAVIGATION */}
        <aside className="w-80 border-r border-line flex flex-col bg-surface transition-colors duration-500 z-20 shadow-xl shadow-black/5">
          <div className="p-10 border-b border-line">
            <button 
              onClick={() => {
                setSelectedCourse(null);
                setSelectedLesson(null);
              }}
              className="flex items-center gap-2 text-[10px] mono-label text-warm-gray hover:text-gold transition-all mb-10 group"
            >
              <ArrowRight size={12} className="rotate-180 group-hover:-translate-x-1 transition-transform" /> 
              <span className="opacity-60 group-hover:opacity-100">Voltar ao Catálogo</span>
            </button>
            <div className="space-y-1 mb-8">
              <p className="mono-label text-[9px] text-gold">Arquitetura de Sistemas</p>
              <h2 className="font-serif text-2xl font-black leading-tight tracking-tight">{selectedCourse.title}</h2>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] mono-label text-warm-gray/60">Progresso Geral</span>
                <span className="font-mono text-[10px] text-gold font-bold">{selectedCourse.progress}%</span>
              </div>
              <div className="h-1 bg-line/20 relative overflow-hidden rounded-full">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${selectedCourse.progress}%` }}
                  transition={{ duration: 1, ease: "circOut" }}
                  className="absolute top-0 left-0 h-full bg-gold shadow-[0_0_8px_rgba(184,135,58,0.4)]" 
                />
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto py-8 custom-scrollbar">
            {courseContent.map((module, mIdx) => (
              <div key={module.id} className="mb-10">
                <div className="px-10 mb-4">
                  <h3 className="text-[9px] mono-label text-warm-gray/40 mb-1">Módulo {String(mIdx + 1).padStart(2, '0')}</h3>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-text/80">{module.title}</p>
                </div>
                <div className="space-y-0.5">
                  {module.lessons?.map((lesson, lIdx) => (
                    <button
                      key={lesson.id}
                      onClick={() => setSelectedLesson(lesson)}
                      className={cn(
                        "w-full flex items-center gap-4 px-10 py-3.5 text-left transition-all group relative",
                        selectedLesson.id === lesson.id 
                          ? "bg-gold/5 text-gold" 
                          : "text-warm-gray hover:text-text hover:bg-bg/40"
                      )}
                    >
                      {selectedLesson.id === lesson.id && (
                        <motion.div 
                          layoutId="activeLessonIndicator" 
                          className="absolute left-0 w-1 h-full bg-gold" 
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}
                      <div className={cn(
                        "w-6 h-6 rounded-full border flex items-center justify-center flex-shrink-0 transition-all duration-500",
                        selectedLesson.id === lesson.id 
                          ? "border-gold bg-gold text-paper shadow-lg shadow-gold/20" 
                          : "border-line group-hover:border-gold/50"
                      )}>
                        {lesson.completed ? (
                          <CheckCircle size={12} weight="bold" />
                        ) : (
                          <span className="font-mono text-[9px] font-bold">{lIdx + 1}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "text-xs transition-all duration-300",
                          selectedLesson.id === lesson.id ? "font-bold tracking-tight" : "font-medium opacity-70 group-hover:opacity-100"
                        )}>
                          {lesson.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1 opacity-40">
                          <PlayCircle size={10} />
                          <span className="text-[9px] mono-label tracking-tighter">{Math.floor(lesson.duration! / 60)}m</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* CENTER CANVAS — MAIN LESSON */}
        <main className="flex-1 overflow-y-auto bg-bg transition-colors duration-500 relative custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div 
              key={selectedLesson.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-5xl mx-auto px-16 py-20 space-y-16"
            >
              {/* Header */}
              <header className="space-y-8">
                <div className="flex items-center gap-4">
                  <span className="px-3 py-1 bg-gold/10 text-gold text-[10px] mono-label rounded-sm font-bold">Aula {selectedLesson.order}</span>
                  <span className="w-1.5 h-1.5 bg-line rounded-full" />
                  <span className="text-[10px] mono-label text-warm-gray/60 tracking-widest">{Math.floor(selectedLesson.duration! / 60)} minutos de imersão</span>
                </div>
                <div className="space-y-4">
                  <h1 className="serif-display text-7xl leading-[0.9] tracking-tighter">{selectedLesson.title}</h1>
                  <p className="text-2xl text-warm-gray font-light leading-relaxed max-w-3xl italic font-serif">
                    Uma exploração profunda sobre como os sistemas invisíveis moldam o comportamento e a escalabilidade das organizações modernas.
                  </p>
                </div>
              </header>

              {/* Video Player Stage */}
              <div className="relative group">
                <div className="absolute -inset-4 bg-gold/5 rounded-[2rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                <div className="aspect-video bg-ink shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] overflow-hidden relative z-10 border border-line/10">
                  {selectedLesson.content_type === 'video' ? (
                    <iframe 
                      src={selectedLesson.content_url} 
                      className="w-full h-full" 
                      allowFullScreen 
                      title={selectedLesson.title}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-surface">
                      <div className="text-center space-y-4">
                        <FileText size={48} className="mx-auto text-gold/20" />
                        <p className="text-warm-gray font-serif italic">Conteúdo em formato {selectedLesson.content_type}</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="absolute top-8 right-8 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0">
                    <button className="p-4 bg-paper/10 backdrop-blur-xl text-paper hover:bg-paper/20 transition-colors rounded-full border border-white/10 shadow-2xl">
                      <Maximize2 size={20} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Content Blocks — Editorial Style */}
              <div className="max-w-4xl">
                <div className="space-y-20 text-warm-gray font-light leading-relaxed">
                  <section className="space-y-8 relative">
                    <div className="absolute -left-12 top-0 text-gold/20">
                      <Lightbulb size={32} />
                    </div>
                    <div className="space-y-4">
                      <h3 className="mono-label text-[11px] text-gold font-bold tracking-[0.3em]">Insight Estrutural</h3>
                      <p className="text-3xl font-serif italic text-text leading-tight border-l-4 border-gold/20 pl-10 py-4">
                        "A estrutura não é apenas o que você vê no organograma; é o fluxo invisível de autoridade e informação que define o que é possível."
                      </p>
                    </div>
                  </section>

                  <section className="space-y-10">
                    <div className="flex items-baseline gap-4">
                      <span className="font-serif text-4xl font-black text-gold/20">01</span>
                      <h3 className="text-text font-black text-2xl tracking-tight">O Framework da Invisibilidade</h3>
                    </div>
                    <p className="text-xl leading-relaxed text-text/70">
                      Para construir sistemas que escalam, o arquiteto deve focar em três pilares fundamentais que operam abaixo da superfície da consciência organizacional:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      {[
                        { title: "Protocolos", desc: "Regras automáticas de decisão que eliminam a necessidade de microgestão constante." },
                        { title: "Canais", desc: "Caminhos de menor resistência que guiam o fluxo de energia e informação." },
                        { title: "Filtros", desc: "Mecanismos de seleção que garantem que apenas o essencial chegue ao topo." }
                      ].map((item, i) => (
                        <div key={i} className="p-8 border border-line bg-surface/30 hover:bg-surface transition-all duration-500 group cursor-default">
                          <h4 className="mono-label text-[10px] text-gold mb-4 group-hover:tracking-[0.4em] transition-all">{item.title}</h4>
                          <p className="text-xs text-warm-gray leading-relaxed opacity-80 group-hover:opacity-100">{item.desc}</p>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="p-12 bg-gold/5 border border-gold/10 relative overflow-hidden group">
                    <div className="absolute -right-10 -bottom-10 text-gold/5 rotate-12 transition-transform duration-1000 group-hover:rotate-0">
                      <Quote size={200} />
                    </div>
                    <div className="relative z-10 space-y-6">
                      <div className="flex items-center gap-4 text-gold">
                        <Quote size={24} />
                        <h3 className="mono-label text-xs font-bold">Nota do Arquiteto</h3>
                      </div>
                      <p className="text-xl font-serif italic text-text/80 leading-relaxed">
                        Muitos líderes tentam resolver problemas de comportamento com treinamento, quando na verdade o problema é o sistema. 
                        Se você coloca uma pessoa boa em um sistema ruim, o sistema vence todas as vezes. 
                        Nossa tarefa é projetar sistemas onde o comportamento desejado seja o caminho natural.
                      </p>
                    </div>
                  </section>
                </div>
              </div>

              {/* Navigation Footer */}
              <footer className="pt-20 border-t border-line flex justify-between items-center">
                <button className="flex items-center gap-6 text-warm-gray hover:text-gold transition-all group">
                  <div className="w-12 h-12 rounded-full border border-line flex items-center justify-center group-hover:border-gold group-hover:bg-gold/5 transition-all">
                    <ArrowRight size={20} className="rotate-180 group-hover:-translate-x-1 transition-transform" />
                  </div>
                  <div className="text-left">
                    <p className="text-[9px] mono-label opacity-40 mb-1">Anterior</p>
                    <p className="text-sm font-bold tracking-tight">O Mito da Eficiência</p>
                  </div>
                </button>
                <button className="flex items-center gap-6 text-warm-gray hover:text-gold transition-all group text-right">
                  <div className="text-right">
                    <p className="text-[9px] mono-label opacity-40 mb-1">Próxima</p>
                    <p className="text-sm font-bold tracking-tight">Escalabilidade Vertical</p>
                  </div>
                  <div className="w-12 h-12 rounded-full border border-line flex items-center justify-center group-hover:border-gold group-hover:bg-gold/5 transition-all">
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              </footer>
            </motion.div>
          </AnimatePresence>
        </main>

        {/* RIGHT PANEL — LEARNING TOOLS */}
        <aside className="w-80 border-l border-line bg-surface flex flex-col transition-colors duration-500 z-20 shadow-[-20px_0_40px_rgba(0,0,0,0.02)]">
          <div className="p-10 border-b border-line space-y-10">
            <div className="flex justify-between items-center">
              <h3 className="mono-label text-[10px] text-gold font-bold tracking-widest">Ferramentas</h3>
              <button 
                onClick={() => toggleBookmark(selectedLesson.id)}
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                  bookmarks.includes(selectedLesson.id) 
                    ? "bg-gold/10 text-gold shadow-lg shadow-gold/10" 
                    : "text-warm-gray hover:bg-bg/50 hover:text-gold"
                )}
              >
                <Bookmark size={18} fill={bookmarks.includes(selectedLesson.id) ? "currentColor" : "none"} />
              </button>
            </div>

            <button 
              onClick={() => toggleLessonCompletion(selectedLesson.id)}
              className={cn(
                "w-full py-5 font-bold transition-all duration-700 flex items-center justify-center gap-4 border text-sm tracking-tight",
                selectedLesson.completed 
                  ? "bg-emerald-500 text-paper border-emerald-500 shadow-xl shadow-emerald-500/20" 
                  : "bg-text text-bg border-text hover:bg-gold hover:border-gold hover:shadow-xl hover:shadow-gold/20"
              )}
            >
              {selectedLesson.completed ? <CheckCircle size={20} weight="fill" /> : <PlayCircle size={20} />}
              {selectedLesson.completed ? 'Aula Concluída' : 'Concluir Aula'}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-10 space-y-12 custom-scrollbar">
            <section className="space-y-6">
              <div className="flex items-center gap-3 text-gold">
                <PenTool size={16} />
                <h4 className="mono-label text-[10px] font-bold">Notas Pessoais</h4>
              </div>
              <div className="relative group">
                <textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="O que você aprendeu nesta aula? Suas notas são salvas automaticamente..."
                  className="w-full h-64 bg-bg/30 border border-line p-6 text-xs leading-relaxed resize-none focus:outline-none focus:border-gold focus:bg-surface transition-all duration-500 placeholder:text-warm-gray/20 font-serif italic"
                />
                <div className="absolute bottom-4 right-4 opacity-20 group-hover:opacity-100 transition-opacity">
                  <CheckCheck size={14} className="text-gold" />
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <div className="flex items-center gap-3 text-gold">
                <FileText size={16} />
                <h4 className="mono-label text-[10px] font-bold">Principais Aprendizados</h4>
              </div>
              <ul className="space-y-6">
                {[
                  "Sistemas precedem comportamentos.",
                  "A autoridade deve ser invisível.",
                  "Escalabilidade requer protocolos."
                ].map((item, i) => (
                  <li key={i} className="flex gap-4 text-[12px] text-text/70 leading-relaxed group cursor-default">
                    <span className="w-1.5 h-1.5 rounded-full bg-gold mt-1.5 flex-shrink-0 group-hover:scale-150 transition-transform" />
                    <span className="group-hover:text-text transition-colors">{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="space-y-6 pt-10 border-t border-line">
              <div className="flex justify-between items-center">
                <h4 className="mono-label text-[10px] text-warm-gray/60">Progresso da Aula</h4>
                <span className="font-mono text-[10px] text-gold font-bold">75%</span>
              </div>
              <div className="h-1.5 bg-line/20 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '75%' }}
                  className="h-full bg-gold shadow-[0_0_10px_rgba(184,135,58,0.3)]" 
                />
              </div>
            </section>
          </div>
        </aside>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden font-sans transition-colors duration-500 bg-bg text-text">
      {/* Sidebar */}
      <aside className="w-20 lg:w-72 border-r border-line flex flex-col items-center lg:items-stretch py-10 px-6 bg-surface transition-all duration-500 relative overflow-hidden">
        <div className="flex flex-col gap-1 px-4 mb-16 relative z-10">
          <div className="flex items-center justify-between mb-1">
            <span className="font-serif font-black text-2xl tracking-tight">Julio Carvalho</span>
            {activeTab === 'admin' && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-2 h-2 rounded-full bg-gold shadow-[0_0_8px_rgba(184,135,58,0.5)]"
                title="Modo Admin Ativo"
              />
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="mono-label text-gold text-[10px] tracking-widest uppercase">
              {activeTab === 'admin' ? 'Admin • Fundador' : 'Arquiteto de Sistemas'}
            </span>
            {activeTab === 'admin' && (
              <span className="text-[8px] font-mono text-warm-gray/40 border border-line px-1.5 py-0.5 rounded tracking-tighter">MODO</span>
            )}
          </div>
        </div>

        <nav className="flex-1 space-y-1 relative z-10">
          <AnimatePresence mode="wait">
            {activeTab !== 'admin' ? (
              <motion.div
                key="member-nav"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.3 }}
                className="space-y-1"
              >
                <NavItem 
                  icon={<LayoutDashboard size={18} />} 
                  label="Painel" 
                  active={activeTab === 'dashboard'} 
                  onClick={() => setActiveTab('dashboard')} 
                />
                <NavItem 
                  icon={<BookOpen size={18} />} 
                  label="Conhecimento" 
                  active={activeTab === 'courses'} 
                  onClick={() => setActiveTab('courses')} 
                />
                <NavItem 
                  icon={<Users size={18} />} 
                  label="Comunidade" 
                  active={activeTab === 'community'} 
                  onClick={() => setActiveTab('community')} 
                />
                <NavItem 
                  icon={<MessageSquare size={18} />} 
                  label="Mensagens" 
                  active={activeTab === 'messages'} 
                  onClick={() => setActiveTab('messages')} 
                />
                
                <div className="pt-8 pb-4">
                  <p className="mono-label text-[9px] text-warm-gray px-5 mb-2 uppercase tracking-[0.2em]">Gestão</p>
                  <NavItem 
                    icon={<ShieldCheck size={18} />} 
                    label="Painel Admin" 
                    active={activeTab === 'admin'} 
                    onClick={() => setActiveTab('admin')}
                    className="text-gold/80 hover:text-gold"
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="admin-nav"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.3 }}
                className="space-y-1"
              >
                <p className="mono-label text-[9px] text-warm-gray px-5 mb-4 uppercase tracking-[0.3em] font-bold">Painel Administrativo</p>
                
                <NavItem 
                  icon={<LayoutDashboard size={18} />} 
                  label="Visão Geral" 
                  active={adminSection === 'dashboard'} 
                  onClick={() => setAdminSection('dashboard')} 
                  layoutId="activeAdminNav"
                />
                <NavItem 
                  icon={<Users size={18} />} 
                  label="Comunidades" 
                  active={adminSection === 'communities'} 
                  onClick={() => setAdminSection('communities')} 
                  layoutId="activeAdminNav"
                />
                <NavItem 
                  icon={<BookOpen size={18} />} 
                  label="Cursos" 
                  active={adminSection === 'courses'} 
                  onClick={() => setAdminSection('courses')} 
                  layoutId="activeAdminNav"
                />
                <NavItem 
                  icon={<FolderOpen size={18} />} 
                  label="Biblioteca de Mídia" 
                  active={adminSection === 'media'} 
                  onClick={() => setAdminSection('media')} 
                  layoutId="activeAdminNav"
                />
                <NavItem 
                  icon={<ShoppingCart size={18} />} 
                  label="Integrações" 
                  active={adminSection === 'integrations'} 
                  onClick={() => setAdminSection('integrations')} 
                  layoutId="activeAdminNav"
                />
                <NavItem 
                  icon={<Lock size={18} />} 
                  label="Acessos" 
                  active={adminSection === 'unlocks'} 
                  onClick={() => setAdminSection('unlocks')} 
                  layoutId="activeAdminNav"
                />
                <NavItem 
                  icon={<Flag size={18} />} 
                  label="Moderação" 
                  active={adminSection === 'moderation'} 
                  onClick={() => setAdminSection('moderation')} 
                  layoutId="activeAdminNav"
                />
                <NavItem 
                  icon={<Settings size={18} />} 
                  label="Configurações" 
                  active={adminSection === 'settings'} 
                  onClick={() => setAdminSection('settings')} 
                  layoutId="activeAdminNav"
                />

                <div className="pt-12">
                  <button 
                    onClick={() => setActiveTab('dashboard')}
                    className="w-full flex items-center gap-3 px-5 py-3 text-warm-gray hover:text-gold transition-all duration-300 group"
                  >
                    <ArrowRight size={14} className="rotate-180 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-[10px] mono-label tracking-widest uppercase font-bold">Voltar para Área de Membro</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </nav>

        {/* Theme Switcher */}
        <div className="mt-auto mb-8 px-4">
          <p className="mono-label text-[9px] text-warm-gray mb-4">Estilo Visual</p>
          <div className="flex gap-2">
            <button 
              onClick={() => setTheme('light')}
              className={cn("w-6 h-6 rounded-full border border-line bg-paper", theme === 'light' && "ring-2 ring-gold ring-offset-2 ring-offset-surface")}
              title="Light"
            />
            <button 
              onClick={() => setTheme('dark')}
              className={cn("w-6 h-6 rounded-full border border-line bg-ink", theme === 'dark' && "ring-2 ring-gold ring-offset-2 ring-offset-surface")}
              title="Dark"
            />
            <button 
              onClick={() => setTheme('rust')}
              className={cn("w-6 h-6 rounded-full border border-line bg-rust", theme === 'rust' && "ring-2 ring-gold ring-offset-2 ring-offset-surface")}
              title="Rust"
            />
          </div>
        </div>

        <div className="space-y-1 border-t border-line pt-10">
          <NavItem icon={<Settings size={18} />} label="Configurações" />
          <NavItem 
            icon={<LogOut size={18} />} 
            label="Sair" 
            className="text-rust/70 hover:text-rust" 
            onClick={() => setIsAuthenticated(false)}
          />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative bg-bg transition-colors duration-500">
        {/* Header */}
        <header className="sticky top-0 z-10 px-10 py-8 flex items-center justify-between bg-bg/80 backdrop-blur-md border-b border-line transition-colors duration-500">
          <div className="flex items-center gap-4 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray/40" size={16} />
              <input 
                type="text" 
                placeholder="Pesquisar no sistema..." 
                className="w-full bg-surface border border-line rounded-none py-2.5 pl-10 pr-4 focus:outline-none focus:border-gold transition-all text-sm placeholder:text-warm-gray/30"
              />
            </div>
          </div>

          <div className="flex items-center gap-8">
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className={cn(
                  "relative text-warm-gray hover:text-text transition-colors",
                  showNotifications && "text-gold"
                )}
              >
                <Bell size={20} />
                <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-gold rounded-full" />
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-6 w-80 card-editorial bg-surface shadow-2xl z-50 overflow-hidden transition-colors duration-500"
                  >
                    <div className="p-5 border-b border-line flex justify-between items-center bg-bg/20">
                      <h3 className="mono-label text-[10px] text-gold">Notificações</h3>
                      <button className="text-[9px] mono-label text-warm-gray hover:text-gold">Limpar todas</button>
                    </div>
                    <div className="max-h-96 overflow-y-auto custom-scrollbar">
                      {[
                        { id: 1, title: "Novo Post na Comunidade", desc: "Julio Carvalho publicou: 'A arquitetura do amanhã...'", time: "Há 5 min", unread: true },
                        { id: 2, title: "Aula Concluída", desc: "Você finalizou 'Sistemas Invisíveis - Aula 12'", time: "Há 2 horas", unread: false },
                        { id: 3, title: "Novo Comentário", desc: "Ana Silva comentou no seu post", time: "Há 4 horas", unread: true },
                        { id: 4, title: "Atualização de Sistema", desc: "Novas ferramentas de gestão liberadas", time: "Ontem", unread: false }
                      ].map((notif) => (
                        <div 
                          key={notif.id} 
                          className={cn(
                            "p-5 border-b border-line last:border-0 hover:bg-bg/30 transition-colors cursor-pointer group",
                            notif.unread && "bg-gold/5"
                          )}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="text-xs font-bold group-hover:text-gold transition-colors">{notif.title}</h4>
                            <span className="text-[8px] mono-label text-warm-gray">{notif.time}</span>
                          </div>
                          <p className="text-[11px] text-warm-gray leading-relaxed">{notif.desc}</p>
                        </div>
                      ))}
                    </div>
                    <button 
                      onClick={() => setShowNotifications(false)}
                      className="w-full p-4 text-[10px] mono-label text-center text-warm-gray hover:text-gold border-t border-line transition-colors"
                    >
                      Ver todas as atividades
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="flex items-center gap-4 pl-8 border-l border-line">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium">Julio Carvalho</p>
                <p className="mono-label text-[9px] text-warm-gray">Membro Fundador</p>
              </div>
              <button 
                onClick={() => setActiveTab('profile')}
                className="w-11 h-11 rounded-full bg-text flex items-center justify-center border border-line transition-colors duration-500 hover:border-gold"
              >
                <span className="font-serif font-bold text-gold text-lg">J</span>
              </button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-10 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-16"
              >
                <section className="relative py-10">
                  <div className="absolute -top-10 -left-16 text-[180px] font-serif font-black text-gold-light/10 pointer-events-none select-none leading-none">01</div>
                  <div className="relative z-10 space-y-6">
                    <h1 className="serif-display text-8xl tracking-tighter leading-[0.85]">
                      A marca que você <br />
                      <em className="font-light italic text-warm-gray/60">é.</em>
                    </h1>
                    <p className="text-warm-gray max-w-xl text-xl leading-relaxed font-light">
                      O problema nunca é a peça. É o sistema. <br />
                      Você completou <span className="text-gold font-bold">45%</span> da sua arquitetura atual.
                    </p>
                  </div>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
                  <div className="lg:col-span-2 space-y-12">
                    <div className="flex items-center justify-between">
                      <h2 className="mono-label text-gold font-bold tracking-[0.3em]">✦ Continuar Construindo</h2>
                      <button className="text-[10px] mono-label text-warm-gray hover:text-gold transition-colors">Ver Histórico</button>
                    </div>
                    <div 
                      onClick={() => courses[0] && handleEnterCourse(courses[0])}
                      className="group relative aspect-[21/9] card-editorial overflow-hidden cursor-pointer shadow-2xl shadow-black/10 border-none"
                    >
                      <img 
                        src="https://picsum.photos/seed/system/1600/900" 
                        className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-[2000ms] ease-out"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent opacity-90" />
                      <div className="absolute inset-0 bg-gold/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                      
                      <div className="absolute bottom-12 left-12 right-12 text-paper space-y-8">
                        <div className="space-y-2">
                          <p className="mono-label text-gold-light text-[10px] tracking-[0.4em] opacity-80">Módulo 04 — Sistemas Invisíveis</p>
                          <h3 className="font-serif text-4xl font-black leading-tight tracking-tight text-paper group-hover:text-gold transition-colors duration-500">Aula 12 — O Segredo da Delegação de Autoridade</h3>
                        </div>
                        
                        <div className="flex items-center gap-10">
                          <button className="flex items-center gap-4 bg-paper text-ink px-10 py-4 font-bold hover:bg-gold hover:text-paper transition-all duration-500 shadow-xl group-hover:shadow-gold/20">
                            <PlayCircle size={24} />
                            Acessar Aula
                          </button>
                          <div className="flex-1 space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] mono-label text-paper/40">Progresso do Módulo</span>
                              <span className="font-mono text-xs text-gold-light font-bold">45%</span>
                            </div>
                            <div className="h-1 bg-white/10 relative overflow-hidden rounded-full">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: '45%' }}
                                transition={{ duration: 1.5, ease: "circOut" }}
                                className="absolute top-0 left-0 h-full bg-gold shadow-[0_0_10px_rgba(184,135,58,0.5)]" 
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-12">
                    <h2 className="mono-label text-gold font-bold tracking-[0.3em]">✦ Pulso da Comunidade</h2>
                    <div className="card-editorial p-10 space-y-10 bg-surface transition-colors duration-500 shadow-xl shadow-black/5">
                      {posts.slice(0, 3).map(post => (
                        <div key={post.id} className="flex gap-6 group cursor-pointer">
                          <div className="w-12 h-12 rounded-full bg-text flex-shrink-0 flex items-center justify-center transition-all duration-500 group-hover:bg-gold group-hover:rotate-12">
                            <span className="font-serif text-gold text-sm group-hover:text-paper">{post.user_name[0]}</span>
                          </div>
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
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'courses' && (
              <motion.div
                key="courses"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-16"
              >
                <div className="flex justify-between items-end border-b border-line pb-12">
                  <div className="space-y-4">
                    <h1 className="font-serif text-6xl font-black tracking-tighter">Conhecimento</h1>
                    <p className="text-warm-gray text-lg font-light">Arquitetura, Estratégia e Sistemas Organizacionais.</p>
                  </div>
                  <div className="flex gap-10">
                    <button className="mono-label text-gold border-b-2 border-gold pb-2 font-bold tracking-[0.2em]">Todos</button>
                    <button className="mono-label text-warm-gray hover:text-text pb-2 tracking-[0.2em] transition-colors">Em Andamento</button>
                    <button className="mono-label text-warm-gray hover:text-text pb-2 tracking-[0.2em] transition-colors">Concluídos</button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                  {courses.map(course => (
                    <div 
                      key={course.id} 
                      onClick={() => handleEnterCourse(course)}
                      className="group card-editorial bg-surface hover:border-gold/50 cursor-pointer transition-all duration-700 shadow-xl shadow-black/5 hover:shadow-gold/10 flex flex-col h-full"
                    >
                      <div className="aspect-[16/10] relative overflow-hidden">
                        <img 
                          src={course.thumbnail} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1500ms] ease-out"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-ink/20 group-hover:bg-ink/0 transition-colors duration-700" />
                        <div className="absolute top-6 right-6 px-4 py-1.5 bg-text text-bg mono-label text-[9px] font-bold tracking-widest shadow-2xl">
                          {course.lessons_count} Aulas
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                          <div className="w-16 h-16 rounded-full bg-paper/20 backdrop-blur-xl border border-white/20 flex items-center justify-center text-paper scale-90 group-hover:scale-100 transition-transform duration-500">
                            <PlayCircle size={32} />
                          </div>
                        </div>
                      </div>
                      <div className="p-10 flex flex-col flex-1 space-y-8">
                        <div className="space-y-4">
                          <h3 className="font-serif text-3xl font-bold leading-tight group-hover:text-gold transition-colors duration-500 tracking-tight">{course.title}</h3>
                          <p className="text-sm text-warm-gray line-clamp-3 leading-relaxed font-light opacity-80 group-hover:opacity-100 transition-opacity">{course.description}</p>
                        </div>
                        
                        <div className="mt-auto space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] mono-label text-warm-gray/60">Progresso</span>
                            <span className="font-mono text-[10px] text-gold font-bold">{course.progress}%</span>
                          </div>
                          <div className="h-1 bg-line/30 relative overflow-hidden rounded-full">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${course.progress}%` }}
                              transition={{ duration: 1, ease: "circOut" }}
                              className="absolute top-0 left-0 h-full bg-gold shadow-[0_0_8px_rgba(184,135,58,0.3)]" 
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'community' && (
              <motion.div
                key="community"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-16"
              >
                <div className="lg:col-span-2 space-y-16">
                  <div className="card-editorial p-12 bg-surface transition-colors duration-500 shadow-xl shadow-black/5 border-none">
                    <form onSubmit={handlePostSubmit}>
                      <div className="flex gap-8">
                        <div className="w-14 h-14 rounded-full bg-text flex-shrink-0 flex items-center justify-center transition-all duration-500 hover:rotate-12">
                          <span className="font-serif text-gold text-2xl">J</span>
                        </div>
                        <div className="flex-1 space-y-8">
                          <textarea 
                            value={newPost}
                            onChange={(e) => setNewPost(e.target.value)}
                            placeholder="O que você está arquitetando hoje?"
                            className="w-full bg-transparent border-none focus:ring-0 text-2xl resize-none placeholder:text-warm-gray/20 font-serif italic text-text leading-tight"
                            rows={3}
                          />
                          <div className="flex justify-between items-center pt-8 border-t border-line">
                            <div className="flex gap-8 text-warm-gray/40">
                              <button type="button" className="hover:text-gold transition-all hover:scale-110"><Share2 size={20} /></button>
                              <button type="button" className="hover:text-gold transition-all hover:scale-110"><BarChart3 size={20} /></button>
                              <button type="button" className="hover:text-gold transition-all hover:scale-110"><Image size={20} /></button>
                            </div>
                            <button 
                              type="submit"
                              className="bg-text text-bg px-12 py-4 font-bold flex items-center gap-4 hover:bg-gold transition-all duration-500 shadow-lg hover:shadow-gold/20 tracking-tight"
                            >
                              <Send size={18} />
                              Publicar Insight
                            </button>
                          </div>
                        </div>
                      </div>
                    </form>
                  </div>

                  <div className="space-y-12">
                    {posts.map(post => (
                      <div key={post.id} className="card-editorial p-12 space-y-10 bg-surface transition-colors duration-500 shadow-xl shadow-black/5 border-none group">
                        <div className="flex justify-between items-start">
                          <div className="flex gap-6">
                            <div className="w-14 h-14 rounded-full bg-text flex items-center justify-center transition-all duration-500 group-hover:bg-gold group-hover:rotate-12">
                              <span className="font-serif text-gold text-2xl group-hover:text-paper">{post.user_name[0]}</span>
                            </div>
                            <div className="space-y-1">
                              <h4 className="font-black text-xl tracking-tighter group-hover:text-gold transition-colors">{post.user_name}</h4>
                              <p className="mono-label text-[10px] text-warm-gray/60 tracking-widest uppercase">✦ Há 2 horas • Arquiteto Sênior</p>
                            </div>
                          </div>
                          <button className="w-10 h-10 rounded-full flex items-center justify-center text-warm-gray/20 hover:text-gold hover:bg-bg/50 transition-all"><Settings size={18} /></button>
                        </div>
                        <p className="text-text/80 leading-relaxed text-2xl font-light whitespace-pre-line font-serif italic">
                          {post.content}
                        </p>
                        
                        {post.content.includes("sistema") && (
                          <div className="p-10 border border-line bg-bg/30 space-y-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                              <BarChart3 size={80} />
                            </div>
                            <div className="relative z-10">
                              <p className="mono-label text-[11px] text-gold font-bold tracking-[0.3em] mb-6">Enquete do Arquiteto</p>
                              <div className="space-y-4">
                                <div className="relative h-14 bg-bg border border-line flex items-center px-6 cursor-pointer group/poll overflow-hidden transition-all hover:border-gold/50">
                                  <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: '75%' }}
                                    transition={{ duration: 1.5, ease: "circOut" }}
                                    className="absolute left-0 top-0 h-full bg-gold/10" 
                                  />
                                  <span className="relative z-10 text-sm font-bold tracking-tight">Sistemas Descentralizados</span>
                                  <span className="relative z-10 ml-auto text-xs font-mono font-bold text-gold">75%</span>
                                </div>
                                <div className="relative h-14 bg-bg border border-line flex items-center px-6 cursor-pointer group/poll overflow-hidden transition-all hover:border-gold/50">
                                  <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: '25%' }}
                                    transition={{ duration: 1.5, ease: "circOut" }}
                                    className="absolute left-0 top-0 h-full bg-gold/5" 
                                  />
                                  <span className="relative z-10 text-sm font-bold tracking-tight opacity-60">Controle Centralizado</span>
                                  <span className="relative z-10 ml-auto text-xs font-mono font-bold text-warm-gray">25%</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="flex gap-12 pt-10 border-t border-line">
                          <button className="flex items-center gap-3 text-[11px] mono-label text-warm-gray hover:text-gold transition-all group/btn">
                            <Heart size={20} className="group-hover/btn:scale-125 transition-transform" />
                            <span className="font-bold tracking-widest">{post.likes} Curtidas</span>
                          </button>
                          <button className="flex items-center gap-3 text-[11px] mono-label text-warm-gray hover:text-gold transition-all group/btn">
                            <MessageSquare size={20} className="group-hover/btn:scale-125 transition-transform" />
                            <span className="font-bold tracking-widest">Comentar Insight</span>
                          </button>
                          <button className="flex items-center gap-3 text-[11px] mono-label text-warm-gray hover:text-gold transition-all ml-auto group/btn">
                            <Share2 size={20} className="group-hover/btn:scale-125 transition-transform" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-16">
                  <div className="card-editorial p-10 bg-surface transition-colors duration-500 shadow-xl shadow-black/5 border-none">
                    <h3 className="font-serif text-2xl font-black mb-8 tracking-tighter">Assuntos em Alta</h3>
                    <div className="space-y-6">
                      {[
                        { tag: "#ArquiteturaSistêmica", count: "1.2k posts" },
                        { tag: "#SistemasInvisíveis", count: "850 posts" },
                        { tag: "#LiderançaDeElite", count: "420 posts" },
                        { tag: "#Escalabilidade", count: "310 posts" }
                      ].map((item, i) => (
                        <div key={i} className="flex justify-between items-center group cursor-pointer">
                          <span className="text-sm font-bold group-hover:text-gold transition-all tracking-tight group-hover:translate-x-1">{item.tag}</span>
                          <span className="mono-label text-[10px] text-warm-gray/60 font-mono">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="card-editorial p-10 bg-surface transition-colors duration-500 shadow-xl shadow-black/5 border-none">
                    <h3 className="font-serif text-2xl font-black mb-8 tracking-tighter">Membros em Destaque</h3>
                    <div className="space-y-8">
                      {[
                        { name: "Ana Silva", role: "Líder de Operações" },
                        { name: "Marcos Reus", role: "Arquiteto Sênior" },
                        { name: "Carla Dias", role: "Estrategista" }
                      ].map((member, i) => (
                        <div key={i} className="flex items-center gap-5 group">
                          <div className="w-12 h-12 rounded-full bg-text flex items-center justify-center transition-all group-hover:bg-gold group-hover:rotate-12">
                            <span className="font-serif text-gold text-sm group-hover:text-paper">{member.name[0]}</span>
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-sm font-black tracking-tight group-hover:text-gold transition-colors">{member.name}</p>
                            <p className="mono-label text-[9px] text-warm-gray/60 tracking-widest uppercase">{member.role}</p>
                          </div>
                          <button className="ml-auto text-[10px] mono-label text-gold hover:underline font-bold tracking-widest">Seguir</button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'admin' && (
              <motion.div
                key="admin"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-16"
              >
                <div className="flex justify-between items-end border-b border-line pb-12">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 mb-2">
                      <div className="w-10 h-10 rounded-full bg-gold flex items-center justify-center shadow-lg shadow-gold/20">
                        <ShieldCheck size={20} className="text-paper" />
                      </div>
                      <h1 className="mono-label text-gold font-bold tracking-[0.4em] text-[10px]">Sistema de Gestão de Elite</h1>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-warm-gray/40 text-[10px] font-mono tracking-widest uppercase">Admin</span>
                      <ChevronRight size={10} className="text-warm-gray/20" />
                      <span className="text-gold text-[10px] font-mono tracking-widest uppercase font-bold">{adminSection}</span>
                    </div>
                    <h1 className="font-serif text-7xl font-black tracking-tighter leading-none">
                      {adminSection === 'dashboard' ? 'Painel de Administração' : 
                       adminSection.charAt(0).toUpperCase() + adminSection.slice(1)}
                    </h1>
                  </div>
                  <div className="flex gap-6">
                    <button className="bg-text text-bg px-10 py-4 font-bold text-sm hover:bg-gold transition-all duration-500 shadow-xl hover:shadow-gold/20 tracking-tight">
                      Exportar Relatórios Estratégicos
                    </button>
                  </div>
                </div>

                <div className="space-y-16">
                  {/* Admin Content Area */}
                  {adminSection === 'dashboard' ? (
                    <div className="space-y-16">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                        <StatCard label="Membros Ativos" value="1,284" trend="+12%" />
                        <StatCard label="Receita Mensal" value="R$ 42.500" trend="+8%" />
                        <StatCard label="Taxa de Retenção" value="94.2%" trend="+2%" />
                      </div>

                      <div className="card-editorial bg-surface transition-colors duration-500 shadow-xl shadow-black/5 border-none">
                        <div className="p-10 border-b border-line flex justify-between items-center bg-bg/10">
                          <h3 className="font-serif text-2xl font-black tracking-tight">Atividade Recente do Sistema</h3>
                          <button className="text-[10px] mono-label text-gold hover:underline font-bold tracking-widest">Ver Logs Completos</button>
                        </div>
                        <div className="divide-y divide-line">
                          {[
                            { user: "Ana Silva", action: "concluiu o curso", target: "Sistemas Invisíveis", time: "Há 5 min" },
                            { user: "Marcos Reus", action: "entrou na comunidade", target: "Arquitetos de Elite", time: "Há 12 min" },
                            { user: "Sistema", action: "backup automático", target: "concluído com sucesso", time: "Há 1 hora" },
                            { user: "Julio Carvalho", action: "publicou novo post", target: "no feed geral", time: "Há 2 horas" }
                          ].map((log, i) => (
                            <div key={i} className="p-8 flex items-center justify-between hover:bg-bg/30 transition-all group">
                              <div className="flex items-center gap-6">
                                <div className="w-12 h-12 rounded-full bg-text flex items-center justify-center transition-all group-hover:bg-gold group-hover:rotate-12 shadow-sm">
                                  <span className="font-serif text-gold text-sm group-hover:text-paper">{log.user[0]}</span>
                                </div>
                                <p className="text-lg font-light">
                                  <span className="font-black tracking-tight">{log.user}</span> {log.action} <span className="text-gold italic font-serif">{log.target}</span>
                                </p>
                              </div>
                              <span className="mono-label text-[10px] text-warm-gray/40 font-mono">{log.time}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-32 space-y-8 opacity-40">
                      <div className="w-24 h-24 rounded-full border-2 border-dashed border-warm-gray/30 flex items-center justify-center">
                        <Settings size={40} className="text-warm-gray/20 animate-spin-slow" />
                      </div>
                      <div className="text-center space-y-2">
                        <h3 className="font-serif text-3xl font-black tracking-tighter">Módulo em Construção</h3>
                        <p className="mono-label text-[10px] tracking-widest uppercase">A arquitetura desta seção está sendo refinada</p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'messages' && (
              <motion.div
                key="messages"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="h-[calc(100vh-200px)] flex gap-12"
              >
                {/* Conversations List */}
                <div className="w-96 flex flex-col gap-8">
                  <div className="flex justify-between items-end">
                    <h2 className="font-serif text-5xl font-black tracking-tighter">Caixa de Entrada</h2>
                    <button className="w-12 h-12 rounded-full bg-gold/10 text-gold flex items-center justify-center hover:bg-gold hover:text-paper transition-all shadow-lg shadow-gold/10">
                      <Send size={18} />
                    </button>
                  </div>
                  
                  <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-warm-gray/40 group-focus-within:text-gold transition-colors" size={16} />
                    <input 
                      type="text" 
                      placeholder="Buscar conversas estratégicas..." 
                      className="w-full bg-surface border border-line py-4 pl-12 pr-6 text-sm focus:outline-none focus:border-gold transition-all shadow-sm group-hover:border-warm-gray/30"
                    />
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                    {[
                      { id: 1, name: "Julio Carvalho", lastMsg: "A arquitetura está pronta?", time: "14:20", unread: 2, online: true, role: "Arquiteto Sênior" },
                      { id: 2, name: "Ana Silva", lastMsg: "Obrigada pelo feedback!", time: "Ontem", unread: 0, online: true, role: "Líder de Operações" },
                      { id: 3, name: "Suporte Técnico", lastMsg: "Seu ticket foi resolvido.", time: "Segunda", unread: 0, online: false, role: "Sistema" },
                      { id: 4, name: "Comunidade Elite", lastMsg: "Novo evento amanhã!", time: "Dom", unread: 5, online: false, role: "Comunidade" }
                    ].map((chat) => (
                      <button 
                        key={chat.id}
                        className={cn(
                          "w-full p-6 flex gap-5 text-left transition-all duration-500 border-none group relative overflow-hidden",
                          chat.id === 1 ? "bg-surface shadow-xl shadow-black/5" : "hover:bg-surface/50"
                        )}
                      >
                        {chat.id === 1 && <div className="absolute left-0 top-0 w-1 h-full bg-gold" />}
                        <div className="relative flex-shrink-0">
                          <div className="w-14 h-14 rounded-full bg-text flex items-center justify-center transition-all group-hover:bg-gold group-hover:rotate-12">
                            <span className="font-serif text-gold text-xl group-hover:text-paper">{chat.name[0]}</span>
                          </div>
                          {chat.online && <div className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-surface rounded-full shadow-sm" />}
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex justify-between items-start">
                            <h4 className="text-base font-black tracking-tight group-hover:text-gold transition-colors">{chat.name}</h4>
                            <span className="text-[9px] mono-label text-warm-gray/60 font-mono">{chat.time}</span>
                          </div>
                          <p className="text-xs text-warm-gray/80 truncate font-light italic leading-relaxed">{chat.lastMsg}</p>
                          <p className="text-[8px] mono-label text-warm-gray/40 tracking-widest uppercase">{chat.role}</p>
                        </div>
                        {chat.unread > 0 && (
                          <div className="w-5 h-5 rounded-full bg-gold text-paper text-[10px] font-black flex items-center justify-center shadow-lg shadow-gold/20">
                            {chat.unread}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Chat Window */}
                <div className="flex-1 card-editorial bg-surface flex flex-col overflow-hidden transition-colors duration-500 shadow-2xl shadow-black/5 border-none">
                  {/* Chat Header */}
                  <div className="p-8 border-b border-line flex justify-between items-center bg-bg/30 backdrop-blur-md">
                    <div className="flex items-center gap-6">
                      <div className="w-14 h-14 rounded-full bg-text flex items-center justify-center transition-all hover:rotate-12">
                        <span className="font-serif text-gold text-2xl">J</span>
                      </div>
                      <div className="space-y-0.5">
                        <h3 className="font-serif text-2xl font-black tracking-tighter">Julio Carvalho</h3>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <p className="text-[10px] mono-label text-emerald-500 font-bold tracking-widest uppercase">Online agora</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-warm-gray/40">
                      <button className="hover:text-gold transition-all hover:scale-110"><Search size={20} /></button>
                      <button className="hover:text-gold transition-all hover:scale-110"><Phone size={20} /></button>
                      <button className="hover:text-gold transition-all hover:scale-110"><Video size={20} /></button>
                      <div className="w-px h-6 bg-line mx-2" />
                      <button className="hover:text-gold transition-all hover:scale-110"><MoreVertical size={20} /></button>
                    </div>
                  </div>

                  {/* Messages Area */}
                  <div className="flex-1 overflow-y-auto p-12 space-y-12 custom-scrollbar bg-bg/5">
                    <div className="flex justify-center">
                      <span className="mono-label text-[10px] text-warm-gray/40 bg-bg/50 px-6 py-2 rounded-full tracking-[0.3em] uppercase font-bold">Hoje, 04 de Março</span>
                    </div>

                    <div className="flex gap-6 max-w-[70%] group">
                      <div className="w-10 h-10 rounded-full bg-text flex-shrink-0 flex items-center justify-center transition-all group-hover:rotate-12">
                        <span className="font-serif text-gold text-xs">J</span>
                      </div>
                      <div className="space-y-3">
                        <div className="bg-bg border border-line p-6 text-lg leading-relaxed font-light shadow-sm hover:border-gold/30 transition-all">
                          Olá Julio! Analisei a estrutura que você propôs para o novo módulo. Acredito que a delegação de autoridade precisa ser mais explícita no Módulo 04.
                        </div>
                        <span className="text-[10px] mono-label text-warm-gray/40 font-mono">14:15</span>
                      </div>
                    </div>

                    <div className="flex gap-6 max-w-[70%] ml-auto flex-row-reverse group">
                      <div className="w-10 h-10 rounded-full bg-gold flex-shrink-0 flex items-center justify-center transition-all group-hover:rotate-12 shadow-lg shadow-gold/20">
                        <span className="font-serif text-paper text-xs">Y</span>
                      </div>
                      <div className="space-y-3 text-right">
                        <div className="bg-gold text-paper p-6 text-lg leading-relaxed font-light shadow-xl shadow-gold/10">
                          Concordo plenamente. Vou ajustar os diagramas e te envio ainda hoje para revisão final.
                        </div>
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-[10px] mono-label text-warm-gray/40 font-mono">14:18</span>
                          <CheckCheck size={14} className="text-gold" />
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-6 max-w-[70%] group">
                      <div className="w-10 h-10 rounded-full bg-text flex-shrink-0 flex items-center justify-center transition-all group-hover:rotate-12">
                        <span className="font-serif text-gold text-xs">J</span>
                      </div>
                      <div className="space-y-3">
                        <div className="bg-bg border border-line p-6 text-lg leading-relaxed font-light shadow-sm hover:border-gold/30 transition-all">
                          Perfeito. Lembre-se que o sistema deve ser invisível, mas a autoridade deve ser sentida.
                        </div>
                        <span className="text-[10px] mono-label text-warm-gray/40 font-mono">14:20</span>
                      </div>
                    </div>
                  </div>

                  {/* Chat Input */}
                  <div className="p-10 border-t border-line bg-bg/30 backdrop-blur-md">
                    <div className="flex items-center gap-6 bg-bg border border-line p-3 pl-6 shadow-inner group focus-within:border-gold transition-all">
                      <button className="text-warm-gray/40 hover:text-gold transition-all hover:scale-110">
                        <Paperclip size={22} />
                      </button>
                      <input 
                        type="text" 
                        placeholder="Escreva sua mensagem estratégica..."
                        className="flex-1 bg-transparent border-none focus:ring-0 text-lg py-3 placeholder:text-warm-gray/20 font-light"
                      />
                      <div className="flex items-center gap-4 pr-2">
                        <button className="text-warm-gray/40 hover:text-gold transition-all hover:scale-110">
                          <Mic size={22} />
                        </button>
                        <button className="bg-text text-bg p-4 hover:bg-gold transition-all duration-500 shadow-lg hover:shadow-gold/20">
                          <Send size={22} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'profile' && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-4xl mx-auto space-y-12"
              >
                <div className="flex justify-between items-end border-b border-line pb-8">
                  <div>
                    <h1 className="mono-label text-gold mb-2">Configurações de Conta</h1>
                    <h1 className="font-serif text-5xl font-black">Meu Perfil</h1>
                  </div>
                  <button className="bg-text text-bg px-8 py-3 font-medium hover:bg-gold transition-colors duration-500">
                    Salvar Alterações
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                  <div className="lg:col-span-1 space-y-8">
                    <div className="card-editorial p-8 text-center bg-surface transition-colors duration-500">
                      <div className="relative inline-block mb-6">
                        <div className="w-32 h-32 rounded-full bg-text flex items-center justify-center border-2 border-gold transition-colors duration-500">
                          <span className="font-serif font-bold text-gold text-4xl">J</span>
                        </div>
                        <button className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-gold text-paper flex items-center justify-center border-4 border-surface hover:scale-110 transition-transform">
                          <Share2 size={16} />
                        </button>
                      </div>
                      <h3 className="font-serif text-xl font-bold">Julio Carvalho</h3>
                      <p className="mono-label text-[10px] text-warm-gray mt-1">Arquiteto de Sistemas</p>
                      <div className="mt-8 pt-8 border-t border-line grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <p className="font-serif text-xl font-bold">12</p>
                          <p className="mono-label text-[8px] text-warm-gray">Cursos</p>
                        </div>
                        <div className="text-center">
                          <p className="font-serif text-xl font-bold">1.2k</p>
                          <p className="mono-label text-[8px] text-warm-gray">Seguidores</p>
                        </div>
                      </div>
                    </div>

                    <div className="card-editorial p-6 space-y-4 bg-surface transition-colors duration-500">
                      <h4 className="mono-label text-[10px] text-gold">Privacidade</h4>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Perfil Público</span>
                        <div className="w-10 h-5 bg-gold rounded-full relative cursor-pointer">
                          <div className="absolute right-1 top-1 w-3 h-3 bg-paper rounded-full" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Mostrar Progresso</span>
                        <div className="w-10 h-5 bg-line rounded-full relative cursor-pointer">
                          <div className="absolute left-1 top-1 w-3 h-3 bg-paper rounded-full" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-2 space-y-8">
                    <div className="card-editorial p-10 space-y-8 bg-surface transition-colors duration-500">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                          <label className="mono-label text-[10px] text-warm-gray">Nome de Exibição</label>
                          <input 
                            type="text" 
                            defaultValue="Julio Carvalho"
                            className="w-full bg-bg border border-line px-4 py-3 focus:outline-none focus:border-gold transition-colors text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="mono-label text-[10px] text-warm-gray">Título Profissional</label>
                          <input 
                            type="text" 
                            defaultValue="Arquiteto de Sistemas"
                            className="w-full bg-bg border border-line px-4 py-3 focus:outline-none focus:border-gold transition-colors text-sm"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="mono-label text-[10px] text-warm-gray">Biografia Curta</label>
                        <textarea 
                          defaultValue="Especialista em arquitetura de sistemas organizacionais e liderança sistêmica. Focado em criar estruturas que escalam sem perder a essência."
                          className="w-full bg-bg border border-line px-4 py-3 focus:outline-none focus:border-gold transition-colors text-sm h-32 resize-none"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="mono-label text-[10px] text-warm-gray">Website / Portfólio</label>
                        <div className="flex">
                          <div className="bg-line px-4 py-3 border border-r-0 border-line text-warm-gray text-sm flex items-center">https://</div>
                          <input 
                            type="text" 
                            defaultValue="juliocarvalho.com"
                            className="flex-1 bg-bg border border-line px-4 py-3 focus:outline-none focus:border-gold transition-colors text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="card-editorial p-10 space-y-6 bg-surface transition-colors duration-500">
                      <h3 className="font-serif text-xl font-bold">Segurança e Acesso</h3>
                      <div className="flex items-center justify-between py-4 border-b border-line">
                        <div>
                          <p className="text-sm font-bold">Alterar Senha</p>
                          <p className="text-xs text-warm-gray">Última alteração há 3 meses</p>
                        </div>
                        <button className="text-xs mono-label text-gold hover:underline">Atualizar</button>
                      </div>
                      <div className="flex items-center justify-between py-4 border-b border-line">
                        <div>
                          <p className="text-sm font-bold">Autenticação em Duas Etapas</p>
                          <p className="text-xs text-warm-gray">Aumente a segurança da sua conta</p>
                        </div>
                        <button className="text-xs mono-label text-gold hover:underline">Ativar</button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function AdminTabItem({ 
  icon, 
  label, 
  active = false 
}: { 
  icon: React.ReactNode; 
  label: string; 
  active?: boolean;
}) {
  return (
    <button className={cn(
      "flex items-center gap-2 px-1 py-4 transition-all duration-300 group relative whitespace-nowrap",
      active ? "text-text font-bold" : "text-warm-gray hover:text-text"
    )}>
      <span className={cn("transition-colors", active ? "text-gold" : "group-hover:text-gold")}>
        {icon}
      </span>
      <span className="text-[9px] mono-label tracking-widest">{label}</span>
      {active && (
        <motion.div 
          layoutId="activeAdminTab"
          className="absolute bottom-0 left-0 w-full h-0.5 bg-gold"
        />
      )}
    </button>
  );
}

function AdminNavItem({ 
  icon, 
  label, 
  active = false, 
  hasSubmenu = false 
}: { 
  icon: React.ReactNode; 
  label: string; 
  active?: boolean;
  hasSubmenu?: boolean;
}) {
  return (
    <button className={cn(
      "w-full flex items-center justify-between px-4 py-3 transition-all duration-300 group",
      active ? "bg-bg text-text font-medium" : "text-warm-gray hover:text-text hover:bg-bg/50"
    )}>
      <div className="flex items-center gap-3">
        <span className={cn("transition-colors", active ? "text-gold" : "group-hover:text-gold")}>
          {icon}
        </span>
        <span className="text-sm tracking-tight">{label}</span>
      </div>
      {hasSubmenu && <ChevronRight size={14} className="text-warm-gray/40" />}
    </button>
  );
}

function StatCard({ label, value, trend }: { label: string; value: string; trend: string }) {
  return (
    <div className="card-editorial p-6 bg-surface transition-colors duration-500">
      <p className="mono-label text-[9px] text-warm-gray mb-2">{label}</p>
      <div className="flex items-end justify-between">
        <h4 className="font-serif text-2xl font-black">{value}</h4>
        <span className="text-[10px] font-mono text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">{trend}</span>
      </div>
    </div>
  );
}

function NavItem({ 
  icon, 
  label, 
  active = false, 
  onClick,
  className,
  layoutId = "activeNav"
}: { 
  icon: React.ReactNode; 
  label: string; 
  active?: boolean;
  onClick?: () => void;
  className?: string;
  layoutId?: string;
}) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-4 px-5 py-3.5 transition-all duration-300 group relative",
        active ? "bg-bg text-gold font-medium" : "text-warm-gray hover:text-text hover:bg-bg/50",
        className
      )}
    >
      <span className={cn("transition-transform duration-300", active ? "scale-110" : "group-hover:scale-110")}>
        {icon}
      </span>
      <span className="hidden lg:block text-sm tracking-tight">{label}</span>
      {active && (
        <motion.div 
          layoutId={layoutId}
          className="absolute left-0 w-1 h-full bg-gold"
        />
      )}
    </button>
  );
}
