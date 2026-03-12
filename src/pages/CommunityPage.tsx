import { useState, useEffect, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Share2, Send, MessageSquare, BarChart3, Settings, Image } from 'lucide-react';
import type { Post, Comment, CommunitySidebar } from '../types';
import { getComments, createComment, getCommunitySidebar } from '../services/api';
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
  if (diff < 3600) return `Há ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Há ${Math.floor(diff / 3600)}h`;
  return `Há ${Math.floor(diff / 86400)}d`;
}

interface CommunityPageProps {
  posts: Post[];
  newPost: string;
  setNewPost: (value: string) => void;
  onPostSubmit: (e: FormEvent) => void;
  onToggleLike: (postId: number) => void;
}

export default function CommunityPage({ posts, newPost, setNewPost, onPostSubmit, onToggleLike }: CommunityPageProps) {
  const [expandedComments, setExpandedComments] = useState<Record<number, boolean>>({});
  const [commentsCache, setCommentsCache] = useState<Record<number, Comment[]>>({});
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>({});
  const [loadingComments, setLoadingComments] = useState<Record<number, boolean>>({});
  const [sidebar, setSidebar] = useState<CommunitySidebar | null>(null);
  const [loadingSidebar, setLoadingSidebar] = useState(true);

  useEffect(() => {
    getCommunitySidebar()
      .then(setSidebar)
      .catch(() => setSidebar({ topPosters: [], trendingPosts: [] }))
      .finally(() => setLoadingSidebar(false));
  }, []);

  async function toggleComments(postId: number) {
    const isExpanded = expandedComments[postId];
    setExpandedComments(prev => ({ ...prev, [postId]: !isExpanded }));

    if (!isExpanded && !commentsCache[postId]) {
      setLoadingComments(prev => ({ ...prev, [postId]: true }));
      try {
        const comments = await getComments(postId);
        setCommentsCache(prev => ({ ...prev, [postId]: comments }));
      } catch {
        // silently fail, user can retry
      } finally {
        setLoadingComments(prev => ({ ...prev, [postId]: false }));
      }
    }
  }

  async function handleSubmitComment(postId: number) {
    const content = commentInputs[postId]?.trim();
    if (!content) return;

    try {
      const comment = await createComment(postId, 1, content);
      setCommentsCache(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), comment],
      }));
      setCommentInputs(prev => ({ ...prev, [postId]: '' }));
    } catch {
      // silently fail
    }
  }

  function getCommentCount(postId: number): number {
    return commentsCache[postId]?.length ?? 0;
  }

  return (
    <PageTransition id="community" className="grid grid-cols-1 lg:grid-cols-3 gap-16">
      <div className="lg:col-span-2 space-y-16">
        <Card variant="elevated" padding="lg" className="border-none">
          <form onSubmit={onPostSubmit}>
            <div className="flex gap-8">
              <Avatar name="Julio" size="xl" interactive />
              <div className="flex-1 space-y-8">
                <Textarea
                  variant="editorial"
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  placeholder="O que você está arquitetando hoje?"
                  rows={3}
                  className="text-text"
                />
                <div className="flex justify-between items-center pt-8 border-t border-line">
                  <div className="flex gap-8 text-warm-gray/40">
                    <Button variant="ghost" iconOnly icon={<Share2 size={20} />} size="sm" />
                    <Button variant="ghost" iconOnly icon={<BarChart3 size={20} />} size="sm" />
                    <Button variant="ghost" iconOnly icon={<Image size={20} />} size="sm" />
                  </div>
                  <Button type="submit" icon={<Send size={18} />} size="lg" className="shadow-lg hover:shadow-gold/20">
                    Publicar Insight
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </Card>

        <div className="space-y-12">
          {posts.map(post => (
            <Card key={post.id} variant="elevated" padding="lg" className="space-y-10 border-none group">
              <div className="flex justify-between items-start">
                <div className="flex gap-6">
                  <Avatar name={post.user_name} size="xl" interactive />
                  <div className="space-y-1">
                    <h4 className="font-black text-xl tracking-tighter group-hover:text-gold transition-colors">{post.user_name}</h4>
                    <Label className="text-warm-gray/60 tracking-widest">Há 2 horas - Arquiteto Sênior</Label>
                  </div>
                </div>
                <Button variant="ghost" iconOnly icon={<Settings size={18} />} className="w-10 h-10 rounded-full text-warm-gray/20 hover:text-gold hover:bg-bg/50" />
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
                    <Label variant="gold" className="tracking-[0.3em] mb-6 block text-[11px]">Enquete do Arquiteto</Label>
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
                <button
                  onClick={() => onToggleLike(post.id)}
                  className={`flex items-center gap-3 text-[11px] mono-label transition-all group/btn ${post.has_liked ? 'text-gold' : 'text-warm-gray hover:text-gold'}`}
                >
                  <Heart size={20} className={`group-hover/btn:scale-125 transition-transform ${post.has_liked ? 'fill-gold' : ''}`} />
                  <span className="font-bold tracking-widest">{post.likes} Curtidas</span>
                </button>
                <button
                  onClick={() => toggleComments(post.id)}
                  className={`flex items-center gap-3 text-[11px] mono-label transition-all group/btn ${expandedComments[post.id] ? 'text-gold' : 'text-warm-gray hover:text-gold'}`}
                >
                  <MessageSquare size={20} className={`group-hover/btn:scale-125 transition-transform ${expandedComments[post.id] ? 'fill-gold/20' : ''}`} />
                  <span className="font-bold tracking-widest">
                    {getCommentCount(post.id) > 0
                      ? `${getCommentCount(post.id)} Comentário${getCommentCount(post.id) > 1 ? 's' : ''}`
                      : 'Comentar Insight'}
                  </span>
                </button>
                <button className="flex items-center gap-3 text-[11px] mono-label text-warm-gray hover:text-gold transition-all ml-auto group/btn">
                  <Share2 size={20} className="group-hover/btn:scale-125 transition-transform" />
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
                    <div className="pt-6 border-t border-line space-y-6">
                      {/* Loading state */}
                      {loadingComments[post.id] && (
                        <div className="flex justify-center py-4">
                          <Label className="text-warm-gray/40 tracking-widest animate-pulse">Carregando...</Label>
                        </div>
                      )}

                      {/* Comments list */}
                      {(commentsCache[post.id] || []).map(comment => (
                        <div key={comment.id} className="flex gap-4 group/comment">
                          <Avatar name={comment.user_name} size="md" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-3">
                              <span className="text-sm font-black tracking-tight group-hover/comment:text-gold transition-colors">
                                {comment.user_name}
                              </span>
                              <Label className="text-[9px] text-warm-gray/40 tracking-widest">
                                {relativeTime(comment.created_at)}
                              </Label>
                            </div>
                            <p className="text-sm text-text/70 leading-relaxed mt-1 font-serif italic">
                              {comment.content}
                            </p>
                          </div>
                        </div>
                      ))}

                      {/* Empty state */}
                      {!loadingComments[post.id] && (commentsCache[post.id] || []).length === 0 && (
                        <div className="text-center py-4">
                          <Label className="text-warm-gray/30 tracking-widest text-[10px]">Seja o primeiro a comentar</Label>
                        </div>
                      )}

                      {/* New comment input */}
                      <div className="flex gap-4 pt-4">
                        <Avatar name="Julio" size="md" />
                        <div className="flex-1 flex gap-3 items-end">
                          <Textarea
                            variant="editorial"
                            value={commentInputs[post.id] || ''}
                            onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmitComment(post.id);
                              }
                            }}
                            placeholder="Escreva um comentário..."
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
      </div>

      <div className="space-y-16">
        <Card variant="elevated" padding="lg" className="border-none">
          <Heading level={3} className="mb-8">Assuntos em Alta</Heading>
          <div className="space-y-6">
            {loadingSidebar ? (
              <Label className="text-warm-gray/40 tracking-widest animate-pulse">Carregando...</Label>
            ) : sidebar && sidebar.trendingPosts.length > 0 ? (
              sidebar.trendingPosts.map((post) => (
                <div key={post.id} className="flex justify-between items-start group cursor-pointer">
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-bold group-hover:text-gold transition-all tracking-tight group-hover:translate-x-1 line-clamp-2 block">
                      {post.content.length > 80 ? post.content.slice(0, 80) + '...' : post.content}
                    </span>
                    <Label className="text-[9px] text-warm-gray/40 mt-1 block">{post.user_name}</Label>
                  </div>
                  <Label className="text-warm-gray/60 shrink-0 ml-4">
                    {post.likes} {post.likes === 1 ? 'curtida' : 'curtidas'}
                  </Label>
                </div>
              ))
            ) : (
              <Label className="text-warm-gray/30 tracking-widest text-[10px]">Nenhum post em destaque</Label>
            )}
          </div>
        </Card>

        <Card variant="elevated" padding="lg" className="border-none">
          <Heading level={3} className="mb-8">Membros em Destaque</Heading>
          <div className="space-y-8">
            {loadingSidebar ? (
              <Label className="text-warm-gray/40 tracking-widest animate-pulse">Carregando...</Label>
            ) : sidebar && sidebar.topPosters.length > 0 ? (
              sidebar.topPosters.map((member) => (
                <div key={member.id} className="flex items-center gap-5 group">
                  <Avatar name={member.name} size="lg" interactive />
                  <div className="space-y-0.5">
                    <p className="text-sm font-black tracking-tight group-hover:text-gold transition-colors">{member.name}</p>
                    <Label className="text-[9px] text-warm-gray/60">
                      {member.post_count} {member.post_count === 1 ? 'post' : 'posts'}
                    </Label>
                  </div>
                </div>
              ))
            ) : (
              <Label className="text-warm-gray/30 tracking-widest text-[10px]">Nenhum membro em destaque</Label>
            )}
          </div>
        </Card>
      </div>
    </PageTransition>
  );
}
