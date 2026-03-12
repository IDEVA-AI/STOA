import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Bell, BookOpen, MessageSquare, Loader2 } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { popover } from '@/src/lib/motion';
import { Input, Avatar } from '../ui';
import { Label } from '../ui/Typography';
import { useNavigation } from '@/src/hooks/useNavigation';
import { useCourses } from '@/src/hooks/useCourses';
import * as api from '@/src/services/api';
import type { SearchResults } from '@/src/types';

export default function Header() {
  const { setActiveTab } = useNavigation();
  const { courses, enterCourse } = useCourses();

  const [showNotifications, setShowNotifications] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const performSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults(null);
      setShowResults(false);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    try {
      const data = await api.search(q);
      setResults(data);
      setShowResults(true);
    } catch {
      setResults(null);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.trim().length < 2) {
      setResults(null);
      setShowResults(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    debounceRef.current = setTimeout(() => {
      performSearch(value);
    }, 300);
  }, [performSearch]);

  const handleCourseClick = useCallback((courseId: number) => {
    const course = courses.find(c => c.id === courseId);
    if (course) {
      enterCourse(course);
    }
    setShowResults(false);
    setQuery('');
  }, [courses, enterCourse]);

  const handlePostClick = useCallback(() => {
    setActiveTab('community');
    setShowResults(false);
    setQuery('');
  }, [setActiveTab]);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on Escape
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowResults(false);
      (e.target as HTMLInputElement).blur();
    }
  }, []);

  const hasResults = results && (results.courses.length > 0 || results.posts.length > 0);
  const isEmpty = results && results.courses.length === 0 && results.posts.length === 0;

  return (
    <header className="sticky top-0 z-10 px-10 py-8 flex items-center justify-between bg-bg/80 backdrop-blur-md border-b border-line transition-colors duration-500">
      <div ref={searchRef} className="flex items-center gap-4 flex-1 max-w-md relative">
        <Input
          icon={isSearching ? <Loader2 size={16} className="animate-spin text-gold" /> : <Search size={16} />}
          placeholder="Pesquisar no sistema..."
          className="bg-surface rounded-none py-2.5 placeholder:text-warm-gray/30"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (results && query.trim().length >= 2) setShowResults(true); }}
        />

        <AnimatePresence>
          {showResults && (hasResults || isEmpty) && (
            <motion.div
              initial={popover.initial}
              animate={popover.animate}
              exit={popover.exit}
              className="absolute left-0 right-0 top-full mt-3 card-editorial bg-surface shadow-2xl z-50 overflow-hidden transition-colors duration-500"
            >
              {isEmpty && (
                <div className="p-8 text-center">
                  <p className="text-[11px] text-warm-gray">Nenhum resultado encontrado</p>
                </div>
              )}

              {hasResults && (
                <>
                  {results!.courses.length > 0 && (
                    <div>
                      <div className="px-5 py-3 border-b border-line bg-bg/20 flex items-center gap-2">
                        <BookOpen size={12} className="text-gold" />
                        <Label variant="gold" className="text-[9px]">Cursos</Label>
                      </div>
                      {results!.courses.map(course => (
                        <button
                          key={`course-${course.id}`}
                          onClick={() => handleCourseClick(course.id)}
                          className="w-full text-left px-5 py-3 hover:bg-bg/40 transition-colors border-b border-line/50 last:border-0"
                        >
                          <p className="text-sm font-medium text-text truncate">{course.title}</p>
                          <p className="text-[11px] text-warm-gray truncate mt-0.5">{course.description}</p>
                        </button>
                      ))}
                    </div>
                  )}

                  {results!.posts.length > 0 && (
                    <div>
                      <div className="px-5 py-3 border-b border-line bg-bg/20 flex items-center gap-2">
                        <MessageSquare size={12} className="text-gold" />
                        <Label variant="gold" className="text-[9px]">Posts</Label>
                      </div>
                      {results!.posts.map(post => (
                        <button
                          key={`post-${post.id}`}
                          onClick={handlePostClick}
                          className="w-full text-left px-5 py-3 hover:bg-bg/40 transition-colors border-b border-line/50 last:border-0"
                        >
                          <p className="text-sm text-text line-clamp-2">{post.content}</p>
                          <p className="text-[10px] text-warm-gray mt-1">por {post.user_name}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
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
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={popover.initial}
                animate={popover.animate}
                exit={popover.exit}
                className="absolute right-0 mt-6 w-80 card-editorial bg-surface shadow-2xl z-50 overflow-hidden transition-colors duration-500"
              >
                <div className="p-5 border-b border-line flex justify-between items-center bg-bg/20">
                  <Label variant="gold">Notificacoes</Label>
                </div>
                <div className="p-8 text-center">
                  <p className="text-[11px] text-warm-gray">Nenhuma notificacao</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="flex items-center gap-4 pl-8 border-l border-line">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium">Julio Carvalho</p>
            <Label className="text-[9px]">Membro Fundador</Label>
          </div>
          <Avatar
            name="Julio"
            size="md"
            className="border border-line hover:border-gold cursor-pointer"
            onClick={() => setActiveTab('profile')}
          />
        </div>
      </div>
    </header>
  );
}
