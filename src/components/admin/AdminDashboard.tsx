import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Users, BookOpen, CheckCircle, MessageSquare, Loader2 } from 'lucide-react';
import {
  Card, CardHeader, Avatar, StatCard,
} from '../ui';
import { Heading, Label } from '../ui/Typography';
import { listItem } from '@/src/lib/motion';
import { getAdminStats, type AdminStats, type AdminActivity } from '@/src/services/api';

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Agora';
  if (diffMin < 60) return `Ha ${diffMin} min`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `Ha ${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  return `Ha ${diffDays}d`;
}

function activityLabel(type: AdminActivity['type']): string {
  switch (type) {
    case 'lesson_completed': return 'Aula';
    case 'new_post': return 'Post';
    case 'new_user': return 'Novo';
  }
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAdminStats()
      .then(setStats)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-warm-gray">{error || 'Erro ao carregar dados.'}</p>
      </div>
    );
  }

  const kpis = [
    { label: 'Membros', value: stats.kpis.members.toLocaleString('pt-BR'), trend: `${stats.kpis.members}`, icon: Users },
    { label: 'Cursos', value: stats.kpis.courses.toLocaleString('pt-BR'), trend: `${stats.kpis.courses}`, icon: BookOpen },
    { label: 'Aulas Concluidas', value: stats.kpis.completedLessons.toLocaleString('pt-BR'), trend: `${stats.kpis.completedLessons}`, icon: CheckCircle },
    { label: 'Posts', value: stats.kpis.posts.toLocaleString('pt-BR'), trend: `${stats.kpis.posts}`, icon: MessageSquare },
  ];

  return (
    <div className="space-y-16">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {kpis.map((kpi, i) => (
          <motion.div key={kpi.label} {...listItem(i)}>
            <StatCard label={kpi.label} value={kpi.value} trend={`total: ${kpi.trend}`} />
          </motion.div>
        ))}
      </div>

      {/* Activity Log */}
      <Card variant="elevated">
        <CardHeader className="flex justify-between items-center">
          <Heading level={3}>Atividade Recente</Heading>
          <Label className="text-warm-gray/40">Dados em tempo real</Label>
        </CardHeader>
        <div className="divide-y divide-line">
          {stats.recentActivity.length === 0 ? (
            <div className="p-8 text-center">
              <Label className="text-warm-gray/40">Nenhuma atividade recente.</Label>
            </div>
          ) : (
            stats.recentActivity.map((activity, i) => (
              <motion.div
                key={`${activity.type}-${activity.created_at}-${i}`}
                {...listItem(i)}
                className="p-8 flex items-center justify-between hover:bg-bg/30 transition-all group"
              >
                <div className="flex items-center gap-6">
                  <Avatar name={activity.user_name} size="lg" interactive />
                  <div>
                    <p className="text-lg font-light">
                      <span className="font-black tracking-tight">{activity.user_name}</span>{' '}
                      <span className="text-warm-gray">{activity.description}</span>
                    </p>
                    <Label className="text-warm-gray/40 text-[10px]">{activityLabel(activity.type)}</Label>
                  </div>
                </div>
                <Label className="text-warm-gray/40">{formatTimeAgo(activity.created_at)}</Label>
              </motion.div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
