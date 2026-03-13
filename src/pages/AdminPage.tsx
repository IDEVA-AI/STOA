import type { JSX } from 'react';
import { ShieldCheck, ChevronRight } from 'lucide-react';
import {
  PageTransition,
  Button,
} from '../components/ui';
import { Label } from '../components/ui/Typography';
import type { AdminSection } from '../types';
import {
  AdminDashboard,
  AdminCommunities,
  AdminCourses,
  AdminMedia,
  AdminIntegrations,
  AdminUnlocks,
  AdminModeration,
  AdminSettings,
  AdminProducts,
  AdminTrails,
  AdminWorkspace,
  AdminTemplates,
  AdminInvites,
  AdminScheduling,
} from '../components/admin';

interface AdminPageProps {
  adminSection: AdminSection;
}

const sectionTitles: Record<AdminSection, string> = {
  dashboard: 'Painel de Administração',
  communities: 'Comunidades',
  courses: 'Cursos',
  templates: 'Templates de Aula',
  products: 'Produtos',
  trails: 'Trilhas',
  media: 'Biblioteca de Mídia',
  integrations: 'Integrações',
  unlocks: 'Acessos',
  moderation: 'Moderação',
  settings: 'Configurações',
  workspace: 'Workspace',
  invites: 'Convites',
  scheduling: 'Agenda',
};

const sectionComponents: Record<AdminSection, () => JSX.Element> = {
  dashboard: AdminDashboard,
  communities: AdminCommunities,
  courses: AdminCourses,
  templates: AdminTemplates,
  products: AdminProducts,
  trails: AdminTrails,
  media: AdminMedia,
  integrations: AdminIntegrations,
  unlocks: AdminUnlocks,
  moderation: AdminModeration,
  settings: AdminSettings,
  workspace: AdminWorkspace,
  invites: AdminInvites,
  scheduling: AdminScheduling,
};

export default function AdminPage({ adminSection }: AdminPageProps) {
  const SectionComponent = sectionComponents[adminSection];

  return (
    <PageTransition id="admin" className="space-y-8 sm:space-y-16">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 border-b border-line pb-12">
        <div className="space-y-4">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-10 h-10 rounded-full bg-gold flex items-center justify-center shadow-lg shadow-gold/20">
              <ShieldCheck size={20} className="text-paper" />
            </div>
            <Label variant="gold" className="tracking-[0.4em]">Sistema de Gestão de Elite</Label>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-warm-gray/40 text-[10px] font-mono tracking-widest uppercase">Admin</span>
            <ChevronRight size={10} className="text-warm-gray/20" />
            <span className="text-gold text-[10px] font-mono tracking-widest uppercase font-bold">{adminSection}</span>
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-7xl font-black tracking-tighter leading-none">
            {sectionTitles[adminSection]}
          </h1>
        </div>
        <div className="w-full sm:w-auto flex gap-6">
          <Button size="lg" className="w-full sm:w-auto text-sm">
            Exportar Relatórios Estratégicos
          </Button>
        </div>
      </div>

      <div className="space-y-8 sm:space-y-16">
        <SectionComponent />
      </div>
    </PageTransition>
  );
}
