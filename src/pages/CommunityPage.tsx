import type { FormEvent } from 'react';
import { motion } from 'motion/react';
import { Heart, Share2, Send, MessageSquare, BarChart3, Settings, Image } from 'lucide-react';
import type { Post } from '../types';
import {
  PageTransition,
  Button,
  Textarea,
  Avatar,
  Card,
} from '../components/ui';
import { Heading, Label } from '../components/ui/Typography';

interface CommunityPageProps {
  posts: Post[];
  newPost: string;
  setNewPost: (value: string) => void;
  onPostSubmit: (e: FormEvent) => void;
}

export default function CommunityPage({ posts, newPost, setNewPost, onPostSubmit }: CommunityPageProps) {
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
            </Card>
          ))}
        </div>
      </div>

      <div className="space-y-16">
        <Card variant="elevated" padding="lg" className="border-none">
          <Heading level={3} className="mb-8">Assuntos em Alta</Heading>
          <div className="space-y-6">
            {[
              { tag: "#ArquiteturaSistêmica", count: "1.2k posts" },
              { tag: "#SistemasInvisíveis", count: "850 posts" },
              { tag: "#LiderançaDeElite", count: "420 posts" },
              { tag: "#Escalabilidade", count: "310 posts" }
            ].map((item, i) => (
              <div key={i} className="flex justify-between items-center group cursor-pointer">
                <span className="text-sm font-bold group-hover:text-gold transition-all tracking-tight group-hover:translate-x-1">{item.tag}</span>
                <Label className="text-warm-gray/60">{item.count}</Label>
              </div>
            ))}
          </div>
        </Card>

        <Card variant="elevated" padding="lg" className="border-none">
          <Heading level={3} className="mb-8">Membros em Destaque</Heading>
          <div className="space-y-8">
            {[
              { name: "Ana Silva", role: "Líder de Operações" },
              { name: "Marcos Reus", role: "Arquiteto Sênior" },
              { name: "Carla Dias", role: "Estrategista" }
            ].map((member, i) => (
              <div key={i} className="flex items-center gap-5 group">
                <Avatar name={member.name} size="lg" interactive />
                <div className="space-y-0.5">
                  <p className="text-sm font-black tracking-tight group-hover:text-gold transition-colors">{member.name}</p>
                  <Label className="text-[9px] text-warm-gray/60">{member.role}</Label>
                </div>
                <Button variant="link" className="ml-auto text-[10px] mono-label font-bold tracking-widest">Seguir</Button>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </PageTransition>
  );
}
