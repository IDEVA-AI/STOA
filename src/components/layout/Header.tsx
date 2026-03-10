import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Bell } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { popover } from '@/src/lib/motion';
import { Input, Avatar, Button } from '../ui';
import { Label } from '../ui/Typography';
import type { TabId } from '@/src/types';

interface HeaderProps {
  setActiveTab: (tab: TabId) => void;
}

export default function Header({ setActiveTab }: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  return (
    <header className="sticky top-0 z-10 px-10 py-8 flex items-center justify-between bg-bg/80 backdrop-blur-md border-b border-line transition-colors duration-500">
      <div className="flex items-center gap-4 flex-1 max-w-md">
        <Input
          icon={<Search size={16} />}
          placeholder="Pesquisar no sistema..."
          className="bg-surface rounded-none py-2.5 placeholder:text-warm-gray/30"
        />
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
                initial={popover.initial}
                animate={popover.animate}
                exit={popover.exit}
                className="absolute right-0 mt-6 w-80 card-editorial bg-surface shadow-2xl z-50 overflow-hidden transition-colors duration-500"
              >
                <div className="p-5 border-b border-line flex justify-between items-center bg-bg/20">
                  <Label variant="gold">Notificações</Label>
                  <Button variant="link" className="text-[9px] mono-label text-warm-gray hover:text-gold">Limpar todas</Button>
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
                        <Label className="text-[8px]">{notif.time}</Label>
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
