import { Send, Search, Phone, Video, MoreVertical, Paperclip, Mic, CheckCheck } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import {
  PageTransition,
  Button,
  Input,
  Avatar,
  Badge,
  Card,
} from '../components/ui';
import { Heading, Label } from '../components/ui/Typography';

export default function MessagesPage() {
  return (
    <PageTransition id="messages" className="h-[calc(100vh-200px)] flex gap-12">
      {/* Conversations List */}
      <div className="w-96 flex flex-col gap-8">
        <div className="flex justify-between items-end">
          <Heading level={1} className="text-5xl">Caixa de Entrada</Heading>
          <Button variant="ghost" iconOnly icon={<Send size={18} />} className="w-12 h-12 rounded-full bg-gold/10 text-gold hover:bg-gold hover:text-paper shadow-lg shadow-gold/10" />
        </div>

        <div className="relative group">
          <Input
            icon={<Search size={16} />}
            placeholder="Buscar conversas estratégicas..."
            className="bg-surface py-4 shadow-sm group-hover:border-warm-gray/30"
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
              <Avatar
                name={chat.name}
                size="xl"
                interactive
                status={chat.online ? 'online' : undefined}
              />
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex justify-between items-start">
                  <h4 className="text-base font-black tracking-tight group-hover:text-gold transition-colors">{chat.name}</h4>
                  <Label className="text-[9px] text-warm-gray/60">{chat.time}</Label>
                </div>
                <p className="text-xs text-warm-gray/80 truncate font-light italic leading-relaxed">{chat.lastMsg}</p>
                <Label className="text-[8px] text-warm-gray/40">{chat.role}</Label>
              </div>
              {chat.unread > 0 && <Badge count={chat.unread} />}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Window */}
      <Card variant="elevated" className="flex-1 flex flex-col overflow-hidden shadow-2xl">
        {/* Chat Header */}
        <div className="p-8 border-b border-line flex justify-between items-center bg-bg/30 backdrop-blur-md">
          <div className="flex items-center gap-6">
            <Avatar name="Julio" size="xl" />
            <div className="space-y-0.5">
              <Heading level={3}>Julio Carvalho</Heading>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                <Label className="text-success font-bold">Online agora</Label>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-6 text-warm-gray/40">
            <Button variant="ghost" iconOnly icon={<Search size={20} />} size="sm" />
            <Button variant="ghost" iconOnly icon={<Phone size={20} />} size="sm" />
            <Button variant="ghost" iconOnly icon={<Video size={20} />} size="sm" />
            <div className="w-px h-6 bg-line mx-2" />
            <Button variant="ghost" iconOnly icon={<MoreVertical size={20} />} size="sm" />
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-12 space-y-12 custom-scrollbar bg-bg/5">
          <div className="flex justify-center">
            <Label className="bg-bg/50 px-6 py-2 rounded-full tracking-[0.3em]">Hoje, 04 de Março</Label>
          </div>

          <div className="flex gap-6 max-w-[70%] group">
            <Avatar name="Julio" size="md" />
            <div className="space-y-3">
              <div className="bg-bg border border-line p-6 text-lg leading-relaxed font-light shadow-sm hover:border-gold/30 transition-all">
                Olá Julio! Analisei a estrutura que você propôs para o novo módulo. Acredito que a delegação de autoridade precisa ser mais explícita no Módulo 04.
              </div>
              <Label className="text-warm-gray/40">14:15</Label>
            </div>
          </div>

          <div className="flex gap-6 max-w-[70%] ml-auto flex-row-reverse group">
            <Avatar name="You" size="md" variant="gold" />
            <div className="space-y-3 text-right">
              <div className="bg-gold text-paper p-6 text-lg leading-relaxed font-light shadow-xl shadow-gold/10">
                Concordo plenamente. Vou ajustar os diagramas e te envio ainda hoje para revisão final.
              </div>
              <div className="flex items-center justify-end gap-2">
                <Label className="text-warm-gray/40">14:18</Label>
                <CheckCheck size={14} className="text-gold" />
              </div>
            </div>
          </div>

          <div className="flex gap-6 max-w-[70%] group">
            <Avatar name="Julio" size="md" />
            <div className="space-y-3">
              <div className="bg-bg border border-line p-6 text-lg leading-relaxed font-light shadow-sm hover:border-gold/30 transition-all">
                Perfeito. Lembre-se que o sistema deve ser invisível, mas a autoridade deve ser sentida.
              </div>
              <Label className="text-warm-gray/40">14:20</Label>
            </div>
          </div>
        </div>

        {/* Chat Input */}
        <div className="p-10 border-t border-line bg-bg/30 backdrop-blur-md">
          <div className="flex items-center gap-6 bg-bg border border-line p-3 pl-6 shadow-inner group focus-within:border-gold transition-all">
            <Button variant="ghost" iconOnly icon={<Paperclip size={22} />} size="sm" />
            <input
              type="text"
              placeholder="Escreva sua mensagem estratégica..."
              className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none text-lg py-3 placeholder:text-warm-gray/20 font-light"
            />
            <div className="flex items-center gap-4 pr-2">
              <Button variant="ghost" iconOnly icon={<Mic size={22} />} size="sm" />
              <Button icon={<Send size={22} />} iconOnly size="md" />
            </div>
          </div>
        </div>
      </Card>
    </PageTransition>
  );
}
