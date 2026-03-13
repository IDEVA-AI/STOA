import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Play,
  Pause,
  PlayCircle,
  ArrowRight,
  CheckCircle,
  Bookmark,
  FileText,
  Lightbulb,
  Quote,
  PenTool,
  Maximize2,
  CheckCheck,
  AlertCircle,
  Menu,
  PanelRight,
  X,
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import type { Course, Module, Lesson } from '../types';
import BlockRenderer from '../components/blocks/BlockRenderer';
import {
  Button,
  Avatar,
  Badge,
  ProgressBar,
  Textarea,
  LoadingState,
} from '../components/ui';
import { Label } from '../components/ui/Typography';

interface LessonPlayerPageProps {
  selectedCourse: Course;
  courseContent: Module[];
  selectedLesson: Lesson | null;
  courseError: string | null;
  onBack: () => void;
  onSelectLesson: (lesson: Lesson) => void;
  onToggleLessonCompletion: (lessonId: number) => void;
}

export default function LessonPlayerPage({
  selectedCourse,
  courseContent,
  selectedLesson,
  courseError,
  onBack,
  onSelectLesson,
  onToggleLessonCompletion
}: LessonPlayerPageProps) {
  const [notes, setNotes] = useState('');
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showModules, setShowModules] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const sendYTCommand = useCallback((func: string) => {
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: 'command', func, args: '' }),
      '*'
    );
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      sendYTCommand('pauseVideo');
    } else {
      sendYTCommand('playVideo');
    }
    setIsPlaying(prev => !prev);
  }, [isPlaying, sendYTCommand]);

  const toggleBookmark = (id: number) => {
    setBookmarks(prev => prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]);
  };

  if (!selectedLesson) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-bg p-8">
        <div className="flex flex-col items-center gap-5 sm:gap-8 max-w-md text-center">
          {courseError ? (
            <>
              <div className="w-16 h-16 rounded-full bg-danger/10 flex items-center justify-center text-danger mb-2">
                <AlertCircle size={32} />
              </div>
              <div className="space-y-4">
                <h3 className="font-serif text-2xl font-bold">Ops! Algo deu errado.</h3>
                <p className="text-warm-gray text-sm leading-relaxed">{courseError}</p>
              </div>
              <Button onClick={onBack} className="mt-4">
                Voltar ao Catálogo
              </Button>
            </>
          ) : (
            <LoadingState
              message="Arquitetando sua experiência..."
              description={`Preparando o ambiente de aprendizado para ${selectedCourse.title}`}
              onCancel={onBack}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden font-sans transition-colors duration-500 bg-bg text-text">
      {/* Mobile toggle buttons */}
      <button
        onClick={() => setShowModules(true)}
        className="lg:hidden fixed top-4 left-4 z-40 w-10 h-10 rounded-full bg-surface border border-line flex items-center justify-center text-warm-gray hover:text-gold shadow-lg transition-colors"
        aria-label="Abrir modulos"
      >
        <Menu size={18} />
      </button>
      <button
        onClick={() => setShowSidebar(true)}
        className="lg:hidden fixed top-4 right-4 z-40 w-10 h-10 rounded-full bg-surface border border-line flex items-center justify-center text-warm-gray hover:text-gold shadow-lg transition-colors"
        aria-label="Abrir ferramentas"
      >
        <PanelRight size={18} />
      </button>

      {/* LEFT SIDEBAR — Mobile backdrop */}
      {showModules && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setShowModules(false)} />
      )}

      {/* LEFT SIDEBAR — LESSON NAVIGATION */}
      <aside className={cn(
        "w-80 border-r border-line flex flex-col bg-surface transition-colors duration-500 z-50 shadow-xl shadow-black/10",
        "hidden lg:flex",
        showModules && "!flex fixed inset-y-0 left-0"
      )}>
        <div className="p-5 sm:p-10 border-b border-line">
          <div className="flex items-center justify-between mb-5 sm:mb-10">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-[10px] mono-label text-warm-gray hover:text-gold transition-all group"
            >
            <ArrowRight size={12} className="rotate-180 group-hover:-translate-x-1 transition-transform" />
            <span className="opacity-60 group-hover:opacity-100">Voltar ao Catálogo</span>
            </button>
            <button
              onClick={() => setShowModules(false)}
              className="lg:hidden w-8 h-8 rounded-full flex items-center justify-center text-warm-gray hover:text-gold transition-colors"
              aria-label="Fechar modulos"
            >
              <X size={16} />
            </button>
          </div>
          <div className="space-y-1 mb-4 sm:mb-8">
            <Label variant="gold" className="text-[9px]">Arquitetura de Sistemas</Label>
            <h2 className="font-serif text-xl sm:text-2xl font-black leading-tight tracking-tight">{selectedCourse.title}</h2>
          </div>

          <ProgressBar value={selectedCourse.progress} size="sm" showLabel glow />
        </div>

        <div className="flex-1 overflow-y-auto py-8 custom-scrollbar">
          {courseContent.map((module, mIdx) => (
            <div key={module.id} className="mb-10">
              <div className="px-5 sm:px-10 mb-4">
                <h3 className="text-[9px] mono-label text-warm-gray/40 mb-1">Módulo {String(mIdx + 1).padStart(2, '0')}</h3>
                <p className="text-[11px] font-bold uppercase tracking-widest text-text/80">{module.title}</p>
              </div>
              <div className="space-y-0.5">
                {module.lessons?.map((lesson, lIdx) => (
                  <button
                    key={lesson.id}
                    onClick={() => onSelectLesson(lesson)}
                    className={cn(
                      "w-full flex items-center gap-4 px-5 sm:px-10 py-3.5 text-left transition-all group relative",
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
                        <CheckCircle size={12} />
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
            className="max-w-5xl mx-auto px-4 sm:px-8 lg:px-16 py-8 sm:py-12 lg:py-20 space-y-8 sm:space-y-16"
          >
            {/* Header */}
            <header className="space-y-4 sm:space-y-8">
              <div className="flex items-center gap-4">
                <Badge variant="gold" className="rounded-sm">Aula {selectedLesson.order}</Badge>
                <span className="w-1.5 h-1.5 bg-line rounded-full" />
                <Label className="text-warm-gray/60 tracking-widest">{Math.floor(selectedLesson.duration! / 60)} minutos de imersão</Label>
              </div>
              <div className="space-y-4">
                <h1 className="serif-display text-4xl sm:text-5xl lg:text-7xl leading-[0.9] tracking-tighter">{selectedLesson.title}</h1>
                <p className="text-xl sm:text-2xl text-warm-gray font-light leading-relaxed max-w-3xl italic font-serif">
                  Uma exploração profunda sobre como os sistemas invisíveis moldam o comportamento e a escalabilidade das organizações modernas.
                </p>
              </div>
            </header>

            {/* Content: Blocks or Legacy Video */}
            {selectedLesson.blocks && selectedLesson.blocks.length > 0 ? (
              /* Block-based content */
              <div className="max-w-4xl space-y-6 sm:space-y-10">
                {selectedLesson.blocks
                  .sort((a, b) => a.position - b.position)
                  .map((block, idx) => (
                    <motion.div
                      key={block.id ?? idx}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: idx * 0.05 }}
                    >
                      <BlockRenderer block={block} />
                    </motion.div>
                  ))}
              </div>
            ) : (
              /* Legacy: single video embed + editorial placeholders */
              <>
                <div className="relative group">
                  <div className="absolute -inset-4 bg-gold/5 rounded-[2rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                  <div className="aspect-video bg-black shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] overflow-hidden relative z-10 border border-line">
                    {selectedLesson.content_type === 'video' ? (
                      <>
                        <iframe
                          ref={iframeRef}
                          src={`${selectedLesson.content_url}${selectedLesson.content_url?.includes('?') ? '&' : '?'}enablejsapi=1&modestbranding=1&rel=0&controls=0&disablekb=1&iv_load_policy=3&fs=0&playsinline=1&cc_load_policy=0&showinfo=0&autoplay=0`}
                          className="absolute inset-0 w-full h-full pointer-events-none"
                          title={selectedLesson.title}
                          allow="accelerometer; autoplay; encrypted-media; gyroscope"
                        />
                        <button
                          onClick={togglePlay}
                          className="absolute inset-0 z-10 cursor-pointer flex items-center justify-center group/play"
                          aria-label={isPlaying ? 'Pausar video' : 'Reproduzir video'}
                        >
                          <div className={cn(
                            'w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500',
                            isPlaying
                              ? 'bg-paper/0 opacity-0 group-hover/play:opacity-100 group-hover/play:bg-paper/10 backdrop-blur-sm'
                              : 'bg-paper/10 backdrop-blur-sm shadow-2xl border border-white/10'
                          )}>
                            {isPlaying ? (
                              <Pause size={32} className="text-paper drop-shadow-lg" />
                            ) : (
                              <Play size={32} className="text-paper drop-shadow-lg ml-1" />
                            )}
                          </div>
                        </button>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-surface">
                        <div className="text-center space-y-4">
                          <FileText size={48} className="mx-auto text-gold/20" />
                          <p className="text-warm-gray font-serif italic">Conteudo em formato {selectedLesson.content_type}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Static editorial content for legacy lessons */}
                <div className="max-w-4xl">
                  <div className="space-y-10 sm:space-y-20 text-warm-gray font-light leading-relaxed">
                    <section className="space-y-8 relative">
                      <div className="absolute -left-12 top-0 text-gold/20">
                        <Lightbulb size={32} />
                      </div>
                      <div className="space-y-4">
                        <Label variant="gold" className="text-[11px] tracking-[0.3em]">Insight Estrutural</Label>
                        <p className="text-2xl sm:text-3xl font-serif italic text-text leading-tight border-l-4 border-gold/20 pl-6 sm:pl-10 py-4">
                          "A estrutura nao e apenas o que voce ve no organograma; e o fluxo invisivel de autoridade e informacao que define o que e possivel."
                        </p>
                      </div>
                    </section>

                    <section className="space-y-10">
                      <div className="flex items-baseline gap-4">
                        <span className="font-serif text-4xl font-black text-gold/20">01</span>
                        <h3 className="text-text font-black text-xl sm:text-2xl tracking-tight">O Framework da Invisibilidade</h3>
                      </div>
                      <p className="text-lg sm:text-xl leading-relaxed text-text/70">
                        Para construir sistemas que escalam, o arquiteto deve focar em tres pilares fundamentais que operam abaixo da superficie da consciencia organizacional:
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8">
                        {[
                          { title: "Protocolos", desc: "Regras automaticas de decisao que eliminam a necessidade de microgestao constante." },
                          { title: "Canais", desc: "Caminhos de menor resistencia que guiam o fluxo de energia e informacao." },
                          { title: "Filtros", desc: "Mecanismos de selecao que garantem que apenas o essencial chegue ao topo." }
                        ].map((item, i) => (
                          <div key={i} className="p-4 sm:p-8 border border-line bg-surface/30 hover:bg-surface transition-all duration-500 group cursor-default">
                            <Label variant="gold" className="mb-4 block group-hover:tracking-[0.4em] transition-all">{item.title}</Label>
                            <p className="text-xs text-warm-gray leading-relaxed opacity-80 group-hover:opacity-100">{item.desc}</p>
                          </div>
                        ))}
                      </div>
                    </section>

                    <section className="p-6 sm:p-12 bg-gold/5 border border-gold/10 relative overflow-hidden group">
                      <div className="absolute -right-10 -bottom-10 text-gold/5 rotate-12 transition-transform duration-1000 group-hover:rotate-0">
                        <Quote size={200} />
                      </div>
                      <div className="relative z-10 space-y-6">
                        <div className="flex items-center gap-4 text-gold">
                          <Quote size={24} />
                          <Label variant="gold" className="text-xs">Nota do Arquiteto</Label>
                        </div>
                        <p className="text-lg sm:text-xl font-serif italic text-text/80 leading-relaxed">
                          Muitos lideres tentam resolver problemas de comportamento com treinamento, quando na verdade o problema e o sistema.
                          Se voce coloca uma pessoa boa em um sistema ruim, o sistema vence todas as vezes.
                          Nossa tarefa e projetar sistemas onde o comportamento desejado seja o caminho natural.
                        </p>
                      </div>
                    </section>
                  </div>
                </div>
              </>
            )}

            {/* Navigation Footer */}
            <footer className="pt-10 sm:pt-20 border-t border-line flex justify-between items-center">
              <button className="flex items-center gap-4 sm:gap-6 text-warm-gray hover:text-gold transition-all group">
                <div className="w-12 h-12 rounded-full border border-line flex items-center justify-center group-hover:border-gold group-hover:bg-gold/5 transition-all">
                  <ArrowRight size={20} className="rotate-180 group-hover:-translate-x-1 transition-transform" />
                </div>
                <div className="text-left">
                  <Label className="opacity-40 mb-1 block text-[9px]">Anterior</Label>
                  <p className="text-sm font-bold tracking-tight">O Mito da Eficiência</p>
                </div>
              </button>
              <button className="flex items-center gap-4 sm:gap-6 text-warm-gray hover:text-gold transition-all group text-right">
                <div className="text-right">
                  <Label className="opacity-40 mb-1 block text-[9px]">Próxima</Label>
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

      {/* RIGHT PANEL — Mobile backdrop */}
      {showSidebar && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setShowSidebar(false)} />
      )}

      {/* RIGHT PANEL — LEARNING TOOLS */}
      <aside className={cn(
        "w-80 border-l border-line bg-surface flex flex-col transition-colors duration-500 z-50 shadow-[-20px_0_40px_rgba(0,0,0,0.1)]",
        "hidden lg:flex",
        showSidebar && "!flex fixed inset-y-0 right-0"
      )}>
        <div className="p-5 sm:p-10 border-b border-line space-y-5 sm:space-y-10">
          <div className="flex justify-between items-center">
            <Label variant="gold" className="tracking-widest">Ferramentas</Label>
            <button
              onClick={() => setShowSidebar(false)}
              className="lg:hidden w-8 h-8 rounded-full flex items-center justify-center text-warm-gray hover:text-gold transition-colors"
              aria-label="Fechar ferramentas"
            >
              <X size={16} />
            </button>
            <Button
              variant="ghost"
              iconOnly
              icon={<Bookmark size={18} fill={bookmarks.includes(selectedLesson.id) ? "currentColor" : "none"} />}
              onClick={() => toggleBookmark(selectedLesson.id)}
              className={cn(
                "w-10 h-10 rounded-full",
                bookmarks.includes(selectedLesson.id)
                  ? "bg-gold/10 text-gold shadow-lg shadow-gold/10"
                  : "text-warm-gray hover:bg-bg/50 hover:text-gold"
              )}
            />
          </div>

          <Button
            onClick={() => onToggleLessonCompletion(selectedLesson.id)}
            icon={selectedLesson.completed ? <CheckCircle size={20} /> : <PlayCircle size={20} />}
            fullWidth
            className={cn(
              "py-5 text-sm tracking-tight border",
              selectedLesson.completed
                ? "!bg-success !text-paper !border-success shadow-xl shadow-success/20 hover:!brightness-110"
                : "!bg-gold !text-paper !border-gold hover:brightness-110 hover:shadow-xl hover:shadow-gold/20"
            )}
          >
            {selectedLesson.completed ? 'Aula Concluída' : 'Concluir Aula'}
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 sm:p-10 space-y-6 sm:space-y-12 custom-scrollbar">
          <section className="space-y-6">
            <div className="flex items-center gap-3 text-gold">
              <PenTool size={16} />
              <Label variant="gold">Notas Pessoais</Label>
            </div>
            <div className="relative group">
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="O que você aprendeu nesta aula? Suas notas são salvas automaticamente..."
                className="h-64 bg-bg/30 p-6 text-xs leading-relaxed focus:bg-surface transition-all duration-500 placeholder:text-warm-gray/20 font-serif italic"
              />
              <div className="absolute bottom-4 right-4 opacity-20 group-hover:opacity-100 transition-opacity">
                <CheckCheck size={14} className="text-gold" />
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex items-center gap-3 text-gold">
              <FileText size={16} />
              <Label variant="gold">Principais Aprendizados</Label>
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

          <section className="space-y-6 pt-5 sm:pt-10 border-t border-line">
            <ProgressBar value={75} size="md" showLabel />
          </section>
        </div>
      </aside>
    </div>
  );
}
