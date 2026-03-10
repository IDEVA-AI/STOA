import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  MessageSquare,
  Settings,
  LogOut,
  ShieldCheck,
  FolderOpen,
  ShoppingCart,
  Lock,
  Flag,
  ArrowRight,
  Palette
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import NavItem from '../ui/NavItem';
import type { TabId, AdminSection, Theme } from '@/src/types';

interface SidebarProps {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  adminSection: AdminSection;
  setAdminSection: (section: AdminSection) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  onLogout: () => void;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  adminSection,
  setAdminSection,
  theme,
  setTheme,
  onLogout
}: SidebarProps) {
  return (
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
          {(activeTab as TabId) !== 'admin' ? (
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
                <NavItem
                  icon={<Palette size={18} />}
                  label="Design System"
                  active={activeTab === 'design-system'}
                  onClick={() => setActiveTab('design-system')}
                  className="text-warm-gray/60 hover:text-warm-gray"
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
          onClick={onLogout}
        />
      </div>
    </aside>
  );
}
