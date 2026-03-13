import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PlayCircle, Lock, ShoppingCart, Check } from 'lucide-react';
import type { Course, Product } from '../types';
import { useWorkspace } from '../hooks/useWorkspace';
import * as api from '../services/api';
import {
  PageTransition,
  Badge,
  ProgressBar,
  PageHeader,
  Button,
} from '../components/ui';

type FilterTab = 'all' | 'in_progress' | 'completed' | 'available';

interface CoursesPageProps {
  courses: Course[];
  onEnterCourse: (course: Course) => void;
}

export default function CoursesPage({ courses, onEnterCourse }: CoursesPageProps) {
  const { activeWorkspace } = useWorkspace();
  const [accessibleIds, setAccessibleIds] = useState<Set<number>>(new Set());
  const [products, setProducts] = useState<Product[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [purchasing, setPurchasing] = useState<number | null>(null);
  const [justPurchased, setJustPurchased] = useState<Set<number>>(new Set());
  const [loaded, setLoaded] = useState(false);

  const loadAccessAndProducts = useCallback(async () => {
    try {
      const [accessRes, productsRes] = await Promise.all([
        api.getMyAccessibleCourseIds(),
        activeWorkspace ? api.getProducts(activeWorkspace.id) : Promise.resolve([]),
      ]);
      setAccessibleIds(new Set(accessRes.courseIds));
      setProducts(productsRes);
    } catch (err) {
      console.error('Failed to load access/products:', err);
    } finally {
      setLoaded(true);
    }
  }, [activeWorkspace]);

  useEffect(() => {
    loadAccessAndProducts();
  }, [loadAccessAndProducts]);

  const findProductForCourse = useCallback(
    (courseId: number): Product | undefined => {
      return products.find(
        (p) => p.courses?.some((c) => c.id === courseId) || false
      );
    },
    [products]
  );

  const handlePurchase = useCallback(
    async (courseId: number) => {
      if (!activeWorkspace) return;
      const product = findProductForCourse(courseId);
      if (!product) return;

      setPurchasing(courseId);
      try {
        await api.createPurchase({
          product_id: product.id,
          workspace_id: activeWorkspace.id,
        });
        setJustPurchased((prev) => new Set(prev).add(courseId));
        // Refresh accessible IDs
        const accessRes = await api.getMyAccessibleCourseIds();
        setAccessibleIds(new Set(accessRes.courseIds));
      } catch (err) {
        console.error('Purchase failed:', err);
      } finally {
        setPurchasing(null);
      }
    },
    [activeWorkspace, findProductForCourse]
  );

  const formatPrice = (price: number) => {
    if (price === 0) return 'Gratis';
    return `R$ ${price.toFixed(2).replace('.', ',')}`;
  };

  const isAccessible = (courseId: number) => accessibleIds.has(courseId);

  const filteredCourses = courses.filter((course) => {
    switch (activeFilter) {
      case 'in_progress':
        return isAccessible(course.id) && course.progress > 0 && course.progress < 100;
      case 'completed':
        return isAccessible(course.id) && course.progress >= 100;
      case 'available':
        return !isAccessible(course.id);
      default:
        return true;
    }
  });

  const filterTabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'Todos' },
    { key: 'in_progress', label: 'Em Andamento' },
    { key: 'completed', label: 'Concluidos' },
    { key: 'available', label: 'Disponiveis' },
  ];

  if (!loaded) {
    return (
      <PageTransition id="courses" className="space-y-8 sm:space-y-16">
        <PageHeader
          title="Conhecimento"
          subtitle="Arquitetura, Estrategia e Sistemas Organizacionais."
        />
        <div className="flex items-center justify-center py-32">
          <span className="mono-label text-warm-gray/40 animate-pulse tracking-widest">
            Carregando cursos...
          </span>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition id="courses" className="space-y-8 sm:space-y-16">
      <PageHeader
        title="Conhecimento"
        subtitle="Arquitetura, Estrategia e Sistemas Organizacionais."
        actions={
          <div className="flex flex-wrap gap-4 sm:gap-10">
            {filterTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key)}
                className={`mono-label pb-2 tracking-[0.2em] transition-colors ${
                  activeFilter === tab.key
                    ? 'text-gold border-b-2 border-gold font-bold'
                    : 'text-warm-gray hover:text-text'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        }
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={activeFilter}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-12"
        >
          {filteredCourses.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-24 space-y-4">
              <span className="mono-label text-warm-gray/40 tracking-widest text-sm">
                Nenhum curso nesta categoria.
              </span>
            </div>
          ) : (
            filteredCourses.map((course) => {
              const accessible = isAccessible(course.id);
              const product = !accessible ? findProductForCourse(course.id) : undefined;
              const isPurchasing = purchasing === course.id;
              const wasJustPurchased = justPurchased.has(course.id);

              return (
                <motion.div
                  key={course.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4 }}
                  onClick={() => accessible ? onEnterCourse(course) : undefined}
                  className={`group card-editorial bg-surface-elevated hover:border-gold/50 transition-all duration-700 shadow-xl shadow-black/5 hover:shadow-gold/10 flex flex-col h-full shadow-elevated ${
                    accessible ? 'cursor-pointer' : 'cursor-default'
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="aspect-[16/10] relative overflow-hidden">
                    <img
                      src={course.thumbnail}
                      className={`w-full h-full object-cover transition-all duration-[1500ms] ease-out ${
                        accessible
                          ? 'group-hover:scale-110'
                          : 'grayscale brightness-50'
                      }`}
                      referrerPolicy="no-referrer"
                    />
                    <div
                      className={`absolute inset-0 transition-colors duration-700 ${
                        accessible
                          ? 'bg-black/20 group-hover:bg-black/0'
                          : 'bg-black/40'
                      }`}
                    />

                    {/* Top badges */}
                    <div className="absolute top-6 right-6 flex gap-2">
                      {accessible && (
                        <Badge variant="default" className="px-4 py-1.5 shadow-2xl">
                          {course.lessons_count} Aulas
                        </Badge>
                      )}
                      {!accessible && product && (
                        <Badge
                          variant="default"
                          className="px-4 py-1.5 shadow-2xl bg-gold/90 text-ink font-bold"
                        >
                          {formatPrice(product.price)}
                        </Badge>
                      )}
                    </div>

                    {/* Center overlay */}
                    {accessible ? (
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        <div className="w-16 h-16 rounded-full bg-bg/20 backdrop-blur-xl border border-text/20 flex items-center justify-center text-paper scale-90 group-hover:scale-100 transition-transform duration-500">
                          <PlayCircle size={32} />
                        </div>
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.1 }}
                          className="w-16 h-16 rounded-full bg-bg/30 backdrop-blur-xl border border-warm-gray/20 flex items-center justify-center text-warm-gray/60"
                        >
                          <Lock size={28} />
                        </motion.div>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-5 sm:p-10 flex flex-col flex-1 space-y-8">
                    <div className="space-y-4">
                      <h3
                        className={`font-serif text-3xl font-bold leading-tight tracking-tight transition-colors duration-500 ${
                          accessible
                            ? 'group-hover:text-gold'
                            : 'text-text/60'
                        }`}
                      >
                        {course.title}
                      </h3>
                      <p
                        className={`text-sm line-clamp-3 leading-relaxed font-light transition-opacity ${
                          accessible
                            ? 'text-warm-gray opacity-80 group-hover:opacity-100'
                            : 'text-warm-gray/50 opacity-70'
                        }`}
                      >
                        {course.description}
                      </p>
                    </div>

                    <div className="mt-auto">
                      {accessible ? (
                        <ProgressBar value={course.progress} size="sm" showLabel />
                      ) : wasJustPurchased ? (
                        <motion.div
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEnterCourse(course);
                            }}
                            icon={<Check size={18} />}
                            className="w-full bg-green-600/20 text-green-400 border border-green-500/30 hover:bg-green-600/30"
                          >
                            Acesso Liberado — Comecar
                          </Button>
                        </motion.div>
                      ) : (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePurchase(course.id);
                          }}
                          disabled={isPurchasing || !product}
                          icon={<ShoppingCart size={18} />}
                          className="w-full"
                        >
                          {isPurchasing
                            ? 'Processando...'
                            : product
                              ? product.price === 0
                                ? 'Obter Gratis'
                                : `Comprar — ${formatPrice(product.price)}`
                              : 'Ver Detalhes'}
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </motion.div>
      </AnimatePresence>
    </PageTransition>
  );
}
