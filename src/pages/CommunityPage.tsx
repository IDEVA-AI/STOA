import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Share2, Send, MessageSquare, BarChart3, Settings, Image, Pin, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Post, Comment, Community, CommunityCategory } from '../types';
import { useWorkspace } from '../hooks/useWorkspace';
import * as api from '../services/api';
import {
  PageTransition,
  Button,
  Textarea,
  Avatar,
  Card,
} from '../components/ui';
import { Heading, Label } from '../components/ui/Typography';

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return 'Agora';
  if (diff < 3600) return `Ha ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Ha ${Math.floor(diff / 3600)}h`;
  return `Ha ${Math.floor(diff / 86400)}d`;
}

interface CommunityPageProps {
  communityId?: number;
}

export default function CommunityPage({ communityId }: CommunityPageProps) {
  const { activeWorkspace } = useWorkspace();
  const navigate = useNavigate();

  // Community list state (when no communityId)
  const [communities, setCommunities] = useState<Community[]>([]);
  const [accessibleIds, setAccessibleIds] = useState<Set<number>>(new Set());
  const [loadingList, setLoadingList] = useState(true);

  // Scoped community state
  const [community, setCommunity] = useState<Community | null>(null);
  const [categories, setCategories] = useState<CommunityCategory[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [newPost, setNewPost] = useState('');

  // Comments state
  const [expandedComments, setExpandedComments] = useState<Record<number, boolean>>({});
  const [commentsCache, setCommentsCache] = useState<Record<number, Comment[]>>({});
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>({});
  const [loadingComments, setLoadingComments] = useState<Record<number, boolean>>({});

  // Load communities list when no communityId
  useEffect(() => {
    if (communityId || !activeWorkspace) return;
    setLoadingList(true);

    Promise.all([
      api.getCommunities(activeWorkspace.id),
      api.getMyAccessibleCourseIds(),
    ])
      .then(([comms, access]) => {
        setCommunities(comms);
        setAccessibleIds(new Set(access.courseIds));
      })
      .catch(() => {
        setCommunities([]);
      })
      .finally(() => setLoadingList(false));
  }, [communityId, activeWorkspace]);

  // Auto-redirect if only one community
  useEffect(() => {
    if (!communityId && communities.length === 1) {
      navigate(`/comunidade/${communities[0].id}`, { replace: true });
    }
  }, [communityId, communities, navigate]);

  // Load community detail + posts when communityId is set
  const loadCommunity = useCallback(async () => {
    if (!communityId) return;
    setLoadingPosts(true);
    try {
      const [comm, cats, postList] = await Promise.all([
        api.getCommunity(communityId),
        api.getCommunityCategories(communityId),
        api.getCommunityPosts(communityId),
      ]);
      setCommunity(comm);
      setCategories(cats);
      setPosts(postList);
    } catch (err) {
      console.error('Failed to load community:', err);
    } finally {
      setLoadingPosts(false);
    }
  }, [communityId]);

  useEffect(() => {
    loadCommunity();
  }, [loadCommunity]);

  // Filter posts by category
  const loadPostsByCategory = useCallback(
    async (categoryId: number | null) => {
      if (!communityId) return;
      setActiveCategory(categoryId);
      setLoadingPosts(true);
      try {
        const postList = await api.getCommunityPosts(communityId, {
          categoryId: categoryId ?? undefined,
        });
        setPosts(postList);
      } catch (err) {
        console.error('Failed to load posts:', err);
      } finally {
        setLoadingPosts(false);
      }
    },
    [communityId]
  );

  // Post actions
  async function handlePostSubmit(e: FormEvent) {
    e.preventDefault();
    if (!newPost.trim() || !communityId) return;
    try {
      await api.createCommunityPost(communityId, newPost, activeCategory ?? undefined);
      setNewPost('');
      loadPostsByCategory(activeCategory);
    } catch (err) {
      console.error('Failed to create post:', err);
    }
  }

  function handleToggleLike(postId: number) {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? {
              ...post,
              has_liked: !post.has_liked,
              likes: post.has_liked ? post.likes - 1 : post.likes + 1,
            }
          : post
      )
    );
    api.toggleLike(postId).catch(() => {
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                has_liked: !post.has_liked,
                likes: post.has_liked ? post.likes - 1 : post.likes + 1,
              }
            : post
        )
      );
    });
  }

  async function toggleComments(postId: number) {
    const isExpanded = expandedComments[postId];
    setExpandedComments((prev) => ({ ...prev, [postId]: !isExpanded }));

    if (!isExpanded && !commentsCache[postId]) {
      setLoadingComments((prev) => ({ ...prev, [postId]: true }));
      try {
        const comments = await api.getComments(postId);
        setCommentsCache((prev) => ({ ...prev, [postId]: comments }));
      } catch {
        // silently fail
      } finally {
        setLoadingComments((prev) => ({ ...prev, [postId]: false }));
      }
    }
  }

  async function handleSubmitComment(postId: number) {
    const content = commentInputs[postId]?.trim();
    if (!content) return;
    try {
      const comment = await api.createComment(postId, 1, content);
      setCommentsCache((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), comment],
      }));
      setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
    } catch {
      // silently fail
    }
  }

  function getCommentCount(postId: number): number {
    return commentsCache[postId]?.length ?? 0;
  }

  // Sort posts: pinned first, then by date
  const sortedPosts = [...posts].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  // ── Community list view (no communityId) ──────────────────────────

  if (!communityId) {
    return (
      <PageTransition id="community-list" className="space-y-8 sm:space-y-16">
        <div className="space-y-4">
          <h1 className="font-serif text-3xl sm:text-5xl font-black tracking-tight">
            Comunidades
          </h1>
          <p className="text-warm-gray text-base sm:text-lg font-light max-w-2xl">
            Conecte-se com outros membros, compartilhe insights e evolua junto.
          </p>
        </div>

        {loadingList ? (
          <div className="flex items-center justify-center py-16 sm:py-32">
            <span className="mono-label text-warm-gray/40 animate-pulse tracking-widest">
              Carregando comunidades...
            </span>
          </div>
        ) : communities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 sm:py-32 space-y-4">
            <Users size={48} className="text-warm-gray/20" />
            <span className="mono-label text-warm-gray/40 tracking-widest">
              Nenhuma comunidade disponivel.
            </span>
            <p className="text-warm-gray/30 text-sm font-light">
              Adquira um curso para ter acesso a sua comunidade.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-12">
            {communities.map((comm) => {
              const hasAccess =
                !comm.course_id || accessibleIds.has(comm.course_id);
              return (
                <motion.div
                  key={comm.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  onClick={() =>
                    hasAccess && navigate(`/comunidade/${comm.id}`)
                  }
                  className={`card-editorial bg-surface-elevated hover:border-gold/50 transition-all duration-700 shadow-xl shadow-black/5 hover:shadow-gold/10 p-4 sm:p-5 lg:p-10 space-y-4 sm:space-y-6 ${
                    hasAccess ? 'cursor-pointer' : 'cursor-default opacity-50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center text-gold">
                      <Users size={22} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-serif text-xl sm:text-2xl font-bold tracking-tight truncate">
                        {comm.name}
                      </h3>
                      {comm.post_count !== undefined && (
                        <Label className="text-warm-gray/50 text-[10px] tracking-widest">
                          {comm.post_count}{' '}
                          {comm.post_count === 1 ? 'post' : 'posts'}
                        </Label>
                      )}
                    </div>
                  </div>
                  {comm.description && (
                    <p className="text-sm text-warm-gray/60 font-light leading-relaxed line-clamp-2">
                      {comm.description}
                    </p>
                  )}
                  {!hasAccess && (
                    <Label className="text-warm-gray/40 tracking-widest text-[10px]">
                      Adquira o curso para acessar
                    </Label>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </PageTransition>
    );
  }

  // ── Scoped community view ─────────────────────────────────────────

  return (
    <PageTransition id="community" className="space-y-6 sm:space-y-12">
      {/* Community header */}
      {community && (
        <div className="space-y-4 sm:space-y-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/comunidade')}
              className="mono-label text-[10px] text-warm-gray/50 hover:text-gold tracking-widest transition-colors"
            >
              Comunidades
            </button>
            <span className="text-warm-gray/20">/</span>
            <span className="mono-label text-[10px] text-gold tracking-widest">
              {community.name}
            </span>
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl font-black tracking-tight">
            {community.name}
          </h1>
          {community.description && (
            <p className="text-warm-gray text-base sm:text-lg font-light max-w-2xl">
              {community.description}
            </p>
          )}
        </div>
      )}

      {/* Category tabs */}
      {categories.length > 0 && (
        <div className="flex gap-4 sm:gap-8 border-b border-line pb-0 overflow-x-auto">
          <button
            onClick={() => loadPostsByCategory(null)}
            className={`mono-label pb-4 tracking-[0.2em] transition-colors whitespace-nowrap border-b-2 -mb-px ${
              activeCategory === null
                ? 'text-gold border-gold font-bold'
                : 'text-warm-gray hover:text-text border-transparent'
            }`}
          >
            Todos
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => loadPostsByCategory(cat.id)}
              className={`mono-label pb-4 tracking-[0.2em] transition-colors whitespace-nowrap border-b-2 -mb-px ${
                activeCategory === cat.id
                  ? 'text-gold border-gold font-bold'
                  : 'text-warm-gray hover:text-text border-transparent'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-16">
        <div className="lg:col-span-2 space-y-6 sm:space-y-12">
          {/* Post creation form */}
          <Card variant="elevated" padding="lg" className="border-none">
            <form onSubmit={handlePostSubmit}>
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
                <Avatar name="Julio" size="lg" interactive />
                <div className="flex-1 space-y-4 sm:space-y-8">
                  <Textarea
                    variant="editorial"
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    placeholder="O que voce esta arquitetando hoje?"
                    rows={3}
                    className="text-text"
                  />
                  <div className="flex justify-between items-center pt-3 sm:pt-8 border-t border-line">
                    <div className="flex gap-3 sm:gap-8 text-warm-gray/40">
                      <Button variant="ghost" iconOnly icon={<Share2 size={16} />} size="sm" />
                      <Button variant="ghost" iconOnly icon={<BarChart3 size={16} />} size="sm" />
                      <Button variant="ghost" iconOnly icon={<Image size={16} />} size="sm" />
                    </div>
                    <Button
                      type="submit"
                      icon={<Send size={18} />}
                      size="lg"
                      className="shadow-lg hover:shadow-gold/20"
                    >
                      Publicar Insight
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          </Card>

          {/* Posts */}
          {loadingPosts ? (
            <div className="flex items-center justify-center py-16">
              <span className="mono-label text-warm-gray/40 animate-pulse tracking-widest">
                Carregando posts...
              </span>
            </div>
          ) : sortedPosts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <MessageSquare size={40} className="text-warm-gray/20" />
              <span className="mono-label text-warm-gray/40 tracking-widest text-sm">
                Nenhum post ainda. Seja o primeiro!
              </span>
            </div>
          ) : (
            <div className="space-y-6 sm:space-y-12">
              {sortedPosts.map((post) => (
                <Card
                  key={post.id}
                  variant="elevated"
                  padding="lg"
                  className={`space-y-4 sm:space-y-10 border-none group ${
                    post.pinned ? 'ring-1 ring-gold/20' : ''
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex gap-3 sm:gap-6">
                      <Avatar name={post.user_name} size="lg" interactive />
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <h4 className="font-black text-base sm:text-xl tracking-tighter group-hover:text-gold transition-colors">
                            {post.user_name}
                          </h4>
                          {post.pinned && (
                            <Pin
                              size={14}
                              className="text-gold fill-gold/30 -rotate-45"
                            />
                          )}
                        </div>
                        <Label className="text-warm-gray/60 tracking-widest">
                          {relativeTime(post.created_at)}
                        </Label>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      iconOnly
                      icon={<Settings size={18} />}
                      className="w-10 h-10 rounded-full text-warm-gray/20 hover:text-gold hover:bg-bg/50"
                    />
                  </div>

                  <p className="text-text/80 leading-relaxed text-base sm:text-2xl font-light whitespace-pre-line font-serif italic">
                    {post.content}
                  </p>

                  {/* Poll section (kept from original) */}
                  {post.content.includes('sistema') && (
                    <div className="p-3 sm:p-5 lg:p-10 border border-line bg-bg/30 space-y-4 sm:space-y-8 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-10">
                        <BarChart3 size={80} />
                      </div>
                      <div className="relative z-10">
                        <Label
                          variant="gold"
                          className="tracking-[0.3em] mb-6 block text-[11px]"
                        >
                          Enquete do Arquiteto
                        </Label>
                        <div className="space-y-4">
                          <div className="relative h-10 sm:h-14 bg-bg border border-line flex items-center px-6 cursor-pointer group/poll overflow-hidden transition-all hover:border-gold/50">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: '75%' }}
                              transition={{ duration: 1.5, ease: 'circOut' }}
                              className="absolute left-0 top-0 h-full bg-gold/10"
                            />
                            <span className="relative z-10 text-sm font-bold tracking-tight">
                              Sistemas Descentralizados
                            </span>
                            <span className="relative z-10 ml-auto text-xs font-mono font-bold text-gold">
                              75%
                            </span>
                          </div>
                          <div className="relative h-10 sm:h-14 bg-bg border border-line flex items-center px-6 cursor-pointer group/poll overflow-hidden transition-all hover:border-gold/50">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: '25%' }}
                              transition={{ duration: 1.5, ease: 'circOut' }}
                              className="absolute left-0 top-0 h-full bg-gold/5"
                            />
                            <span className="relative z-10 text-sm font-bold tracking-tight opacity-60">
                              Controle Centralizado
                            </span>
                            <span className="relative z-10 ml-auto text-xs font-mono font-bold text-warm-gray">
                              25%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-3 sm:gap-12 pt-4 sm:pt-10 border-t border-line">
                    <button
                      onClick={() => handleToggleLike(post.id)}
                      className={`flex items-center gap-3 text-[11px] mono-label transition-all group/btn ${
                        post.has_liked
                          ? 'text-gold'
                          : 'text-warm-gray hover:text-gold'
                      }`}
                    >
                      <Heart
                        size={16}
                        className={`group-hover/btn:scale-125 transition-transform ${
                          post.has_liked ? 'fill-gold' : ''
                        }`}
                      />
                      <span className="font-bold tracking-widest">
                        {post.likes} Curtidas
                      </span>
                    </button>
                    <button
                      onClick={() => toggleComments(post.id)}
                      className={`flex items-center gap-3 text-[11px] mono-label transition-all group/btn ${
                        expandedComments[post.id]
                          ? 'text-gold'
                          : 'text-warm-gray hover:text-gold'
                      }`}
                    >
                      <MessageSquare
                        size={16}
                        className={`group-hover/btn:scale-125 transition-transform ${
                          expandedComments[post.id] ? 'fill-gold/20' : ''
                        }`}
                      />
                      <span className="font-bold tracking-widest">
                        {getCommentCount(post.id) > 0
                          ? `${getCommentCount(post.id)} Comentario${
                              getCommentCount(post.id) > 1 ? 's' : ''
                            }`
                          : 'Comentar Insight'}
                      </span>
                    </button>
                    <button className="flex items-center gap-3 text-[11px] mono-label text-warm-gray hover:text-gold transition-all ml-auto group/btn">
                      <Share2
                        size={16}
                        className="group-hover/btn:scale-125 transition-transform"
                      />
                    </button>
                  </div>

                  {/* Comments Section */}
                  <AnimatePresence>
                    {expandedComments[post.id] && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <div className="pt-4 sm:pt-6 border-t border-line space-y-4 sm:space-y-6">
                          {loadingComments[post.id] && (
                            <div className="flex justify-center py-4">
                              <Label className="text-warm-gray/40 tracking-widest animate-pulse">
                                Carregando...
                              </Label>
                            </div>
                          )}

                          {(commentsCache[post.id] || []).map((comment) => (
                            <div
                              key={comment.id}
                              className="flex gap-4 group/comment"
                            >
                              <Avatar name={comment.user_name} size="md" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-baseline gap-3">
                                  <span className="text-sm font-black tracking-tight group-hover/comment:text-gold transition-colors">
                                    {comment.user_name}
                                  </span>
                                  <Label className="text-[10px] text-warm-gray/40 tracking-widest">
                                    {relativeTime(comment.created_at)}
                                  </Label>
                                </div>
                                <p className="text-sm text-text/70 leading-relaxed mt-1 font-serif italic">
                                  {comment.content}
                                </p>
                              </div>
                            </div>
                          ))}

                          {!loadingComments[post.id] &&
                            (commentsCache[post.id] || []).length === 0 && (
                              <div className="text-center py-4">
                                <Label className="text-warm-gray/30 tracking-widest text-[10px]">
                                  Seja o primeiro a comentar
                                </Label>
                              </div>
                            )}

                          <div className="flex gap-4 pt-4">
                            <Avatar name="Julio" size="md" />
                            <div className="flex-1 flex gap-3 items-end">
                              <Textarea
                                variant="editorial"
                                value={commentInputs[post.id] || ''}
                                onChange={(e) =>
                                  setCommentInputs((prev) => ({
                                    ...prev,
                                    [post.id]: e.target.value,
                                  }))
                                }
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmitComment(post.id);
                                  }
                                }}
                                placeholder="Escreva um comentario..."
                                rows={1}
                                className="text-sm !min-h-0"
                              />
                              <Button
                                variant="ghost"
                                iconOnly
                                icon={<Send size={16} />}
                                size="sm"
                                className="text-warm-gray/40 hover:text-gold shrink-0"
                                onClick={() => handleSubmitComment(post.id)}
                              />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-8 sm:space-y-16">
          {community && (
            <Card variant="elevated" padding="lg" className="border-none">
              <Heading level={3} className="mb-4">
                {community.name}
              </Heading>
              {community.description && (
                <p className="text-sm text-warm-gray/60 font-light leading-relaxed mb-6">
                  {community.description}
                </p>
              )}
              {community.post_count !== undefined && (
                <Label className="text-warm-gray/40 tracking-widest text-[10px]">
                  {community.post_count}{' '}
                  {community.post_count === 1 ? 'post' : 'posts'}
                </Label>
              )}
            </Card>
          )}

          {categories.length > 0 && (
            <Card variant="elevated" padding="lg" className="border-none">
              <Heading level={3} className="mb-4 sm:mb-8">
                Categorias
              </Heading>
              <div className="space-y-3">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => loadPostsByCategory(cat.id)}
                    className={`block w-full text-left px-4 py-3 text-sm font-bold tracking-tight transition-all hover:text-gold hover:translate-x-1 ${
                      activeCategory === cat.id
                        ? 'text-gold border-l-2 border-gold pl-3'
                        : 'text-text/70'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
