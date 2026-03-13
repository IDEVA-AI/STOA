import { useState } from 'react';
import { motion } from 'motion/react';
import { Check, X, VolumeX, AlertTriangle } from 'lucide-react';
import {
  Card, CardBody, Button, Avatar, Badge, StatCard, Divider,
} from '../ui';
import { Heading, Label, Text } from '../ui/Typography';
import { listItem } from '@/src/lib/motion';

type FilterType = 'all' | 'posts' | 'comments' | 'profiles';

const stats = [
  { label: 'Pendentes', value: '7', trend: '+3' },
  { label: 'Aprovados (mês)', value: '23', trend: '+8' },
  { label: 'Removidos (mês)', value: '4', trend: '-2' },
];

const filters: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'posts', label: 'Posts' },
  { key: 'comments', label: 'Comentários' },
  { key: 'profiles', label: 'Perfis' },
];

const queueItems = [
  {
    type: 'posts' as const,
    title: 'Post reportado',
    user: 'Carlos Mendes',
    role: 'Membro',
    preview: 'Eu acho que o sistema deveria permitir acesso ilimitado para todos, independente do plano...',
    reason: 'Conteúdo inadequado',
    reports: 3,
    time: 'Há 15 min',
  },
  {
    type: 'profiles' as const,
    title: 'Perfil suspeito',
    user: 'user_8847x',
    role: 'Membro',
    preview: 'Conta criada com dados inconsistentes e padrões de acesso irregular.',
    reason: 'Atividade suspeita',
    reports: 1,
    time: 'Há 2 horas',
  },
  {
    type: 'comments' as const,
    title: 'Comentário reportado',
    user: 'Roberto Dias',
    role: 'Membro',
    preview: 'Esse curso não vale o que cobram, é tudo a mesma coisa que se encontra de graça...',
    reason: 'Linguagem ofensiva',
    reports: 2,
    time: 'Há 4 horas',
  },
  {
    type: 'posts' as const,
    title: 'Post reportado',
    user: 'Sandra Oliveira',
    role: 'Membro',
    preview: 'Compartilhando link externo para material complementar gratuito sobre o mesmo assunto...',
    reason: 'Spam / Promoção',
    reports: 5,
    time: 'Há 6 horas',
  },
];

const recentActions = [
  { action: 'approved', icon: Check, label: 'Post #42 aprovado', by: 'Julio Carvalho', time: 'Há 30 min', color: 'text-emerald-500' },
  { action: 'removed', icon: X, label: 'Post #38 removido', by: 'Ana Silva', time: 'Há 1 hora', color: 'text-red-500' },
  { action: 'muted', icon: VolumeX, label: '@spam_bot silenciado', by: 'Sistema', time: 'Há 3 horas', color: 'text-amber-500' },
  { action: 'approved', icon: Check, label: 'Perfil #89 verificado', by: 'Ana Silva', time: 'Há 5 horas', color: 'text-emerald-500' },
  { action: 'removed', icon: X, label: 'Comentário #156 removido', by: 'Julio Carvalho', time: 'Há 8 horas', color: 'text-red-500' },
];

export default function AdminModeration() {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const filteredQueue = queueItems.filter(
    item => activeFilter === 'all' || item.type === activeFilter
  );

  return (
    <div className="space-y-8 sm:space-y-16">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {stats.map((stat, i) => (
          <motion.div key={stat.label} {...listItem(i)}>
            <StatCard label={stat.label} value={stat.value} trend={stat.trend} />
          </motion.div>
        ))}
      </div>

      {/* Queue */}
      <Card variant="elevated">
        <div className="p-10 border-b border-line space-y-6">
          <Heading level={3}>Fila de Moderação</Heading>
          <div className="flex gap-2">
            {filters.map((filter) => (
              <button
                key={filter.key}
                onClick={() => setActiveFilter(filter.key)}
                className={`px-4 py-2 text-xs font-bold tracking-tight transition-all ${
                  activeFilter === filter.key
                    ? 'bg-text text-bg'
                    : 'bg-surface border border-line text-warm-gray hover:text-gold hover:border-gold/50'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
        <div className="divide-y divide-line">
          {filteredQueue.map((item, i) => (
            <motion.div key={i} {...listItem(i)} className="p-8 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle size={14} className="text-amber-500" />
                  <span className="font-bold text-sm">{item.title}</span>
                </div>
                <Label className="text-warm-gray/40">{item.time}</Label>
              </div>
              <div className="flex items-center gap-4">
                <Avatar name={item.user} size="md" />
                <div>
                  <span className="font-bold text-sm">{item.user}</span>
                  <Badge variant="muted" className="ml-3">{item.role}</Badge>
                </div>
              </div>
              <div className="bg-bg/50 p-4 border-l-2 border-warm-gray/20">
                <Text size="sm" muted className="italic">"{item.preview}"</Text>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Label>Motivo:</Label>
                  <Text size="sm">{item.reason}</Text>
                  <Badge variant="gold">{item.reports} reports</Badge>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Button variant="secondary" size="sm" icon={<Check size={12} />}>Aprovar</Button>
                  <Button variant="danger" size="sm" icon={<X size={12} />}>Remover</Button>
                  <Button variant="ghost" size="sm" icon={<VolumeX size={12} />}>Silenciar</Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </Card>

      {/* Recent Actions */}
      <Card variant="elevated">
        <div className="p-10 border-b border-line">
          <Heading level={3}>Ações Recentes</Heading>
        </div>
        <div className="divide-y divide-line">
          {recentActions.map((action, i) => {
            const Icon = action.icon;
            return (
              <motion.div
                key={i}
                {...listItem(i)}
                className="p-8 flex items-center justify-between hover:bg-bg/30 transition-all"
              >
                <div className="flex items-center gap-6">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-surface ${action.color}`}>
                    <Icon size={14} />
                  </div>
                  <span className="text-sm">{action.label}</span>
                  <Divider className="w-px h-4 border-l border-line" />
                  <Text size="xs" muted>por {action.by}</Text>
                </div>
                <Label className="text-warm-gray/40">{action.time}</Label>
              </motion.div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
