import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Bell, BookOpen, MessageSquare, Loader2, ChevronDown, Plus } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { popover } from '@/src/lib/motion';
import { Input, Avatar, Badge } from '../ui';
import { Label } from '../ui/Typography';
import { useNavigation } from '@/src/hooks/useNavigation';
import { useCourses } from '@/src/hooks/useCourses';
import { useWorkspace } from '@/src/hooks/useWorkspace';
import CreateWorkspaceModal from '../workspace/CreateWorkspaceModal';
import * as api from '@/src/services/api';
import type { SearchResults } from '@/src/types';

export default function Header() {
  const { setActiveTab } = useNavigation();
  const { courses, enterCourse } = useCourses();
  const { workspaces, activeWorkspace, setActiveWorkspace } = useWorkspace();

  const [showNotifications, setShowNotifications] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Workspace selector state
  const [showWsDropdown, setShowWsDropdown] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const wsRef = useRef<HTMLDivElement>(null);

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
      if (wsRef.current && !wsRef.current.contains(e.target as Node)) {
        setShowWsDropdown(false);
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
    <header className="sticky top-0 z-10 px-4 py-4 sm:px-10 sm:py-8 flex items-center justify-between bg-bg/80 backdrop-blur-md border-b border-line transition-colors duration-500">
      {/* Workspace Selector */}
      <div ref={wsRef} className="relative mr-6">
        <button
          onClick={() => setShowWsDropdown(!showWsDropdown)}
          className="flex items-center gap-3 px-3 py-2 rounded hover:bg-surface transition-colors"
        >
          {activeWorkspace?.logo ? (
            <img
              src={activeWorkspace.logo}
              alt={activeWorkspace.name}
              className="w-7 h-7 rounded object-cover border border-line"
            />
          ) : (
            <div className="w-7 h-7 rounded bg-gold/20 border border-gold/30 flex items-center justify-center text-gold font-serif font-bold text-sm">
              {activeWorkspace?.name?.charAt(0).toUpperCase() || 'W'}
            </div>
          )}
          <span className="text-sm font-medium truncate max-w-[140px] hidden sm:block">
            {activeWorkspace?.name || 'Workspace'}
          </span>
          <ChevronDown size={14} className={cn(
            "text-warm-gray transition-transform duration-200",
            showWsDropdown && "rotate-180"
          )} />
        </button>

        <AnimatePresence>
          {showWsDropdown && (
            <motion.div
              initial={popover.initial}
              animate={popover.animate}
              exit={popover.exit}
              className="absolute left-0 top-full mt-2 w-[calc(100vw-2rem)] sm:w-72 bg-surface border border-line rounded shadow-lg z-50 overflow-hidden"
            >
              <div className="px-4 py-3 border-b border-line bg-bg/20">
                <Label className="text-[9px] uppercase tracking-widest">Workspaces</Label>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {workspaces.map((ws) => (
                  <button
                    key={ws.id}
                    onClick={() => {
                      setActiveWorkspace(ws);
                      setShowWsDropdown(false);
                    }}
                    className={cn(
                      "w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-bg/40 transition-colors",
                      activeWorkspace?.id === ws.id && "bg-bg/30"
                    )}
                  >
                    {ws.logo ? (
                      <img
                        src={ws.logo}
                        alt={ws.name}
                        className="w-8 h-8 rounded object-cover border border-line flex-shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded bg-gold/15 border border-gold/20 flex items-center justify-center text-gold font-serif font-bold text-sm flex-shrink-0">
                        {ws.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{ws.name}</span>
                        {activeWorkspace?.id === ws.id && (
                          <div className="w-1.5 h-1.5 rounded-full bg-gold flex-shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-[8px] px-1.5 py-0">{ws.plan}</Badge>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <div className="border-t border-line">
                <button
                  onClick={() => {
                    setShowWsDropdown(false);
                    setShowCreateModal(true);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-gold hover:bg-bg/40 transition-colors"
                >
                  <Plus size={16} />
                  <span className="text-sm font-medium">Criar Workspace</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

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
                className="absolute right-0 mt-6 w-[calc(100vw-2rem)] sm:w-80 card-editorial bg-surface shadow-2xl z-50 overflow-hidden transition-colors duration-500"
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

      <CreateWorkspaceModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </header>
  );
}
