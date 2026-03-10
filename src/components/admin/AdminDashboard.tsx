import { motion } from 'motion/react';
import { AlertTriangle, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import {
  Card, CardHeader, CardBody, Button, Avatar, Badge, StatCard, ProgressBar,
} from '../ui';
import { Heading, Label } from '../ui/Typography';
import { listItem } from '@/src/lib/motion';

const kpis = [
  { label: 'Membros Ativos', value: '1,284', trend: '+12%' },
  { label: 'Receita Mensal', value: 'R$ 42.500', trend: '+8%' },
  { label: 'Taxa de Retenção', value: '94.2%', trend: '+2.1%' },
  { label: 'Aulas Concluídas', value: '3,847', trend: '+18%' },
];

const weeklyEngagement = [
  { day: 'Seg', value: 72 },
  { day: 'Ter', value: 85 },
  { day: 'Qua', value: 64 },
  { day: 'Qui', value: 91 },
  { day: 'Sex', value: 78 },
  { day: 'Sáb', value: 45 },
  { day: 'Dom', value: 38 },
];

const contentDistribution = [
  { category: 'Vídeo-aulas', count: 42, percent: 48 },
  { category: 'Artigos', count: 24, percent: 27 },
  { category: 'Exercícios', count: 14, percent: 16 },
  { category: 'Downloads', count: 8, percent: 9 },
];

const activityLogs = [
  { user: 'Ana Silva', action: 'concluiu o curso', target: 'Sistemas Invisíveis', time: 'Há 5 min' },
  { user: 'Marcos Reus', action: 'entrou na comunidade', target: 'Arquitetos de Elite', time: 'Há 12 min' },
  { user: 'Sistema', action: 'backup automático', target: 'concluído com sucesso', time: 'Há 1 hora' },
  { user: 'Julio Carvalho', action: 'publicou novo post', target: 'no feed geral', time: 'Há 2 horas' },
  { user: 'Carla Duarte', action: 'completou módulo', target: 'Liderança Sistêmica', time: 'Há 3 horas' },
  { user: 'Felipe Nunes', action: 'realizou pagamento', target: 'Plano Premium', time: 'Há 4 horas' },
  { user: 'Sistema', action: 'atualização aplicada', target: 'v2.4.1 estável', time: 'Há 5 horas' },
  { user: 'Renata Lima', action: 'reportou conteúdo', target: 'Post #127', time: 'Há 6 horas' },
];

const alerts = [
  { type: 'warning' as const, message: '3 posts aguardando moderação', icon: AlertTriangle },
  { type: 'info' as const, message: 'Backup agendado para 02:00', icon: Clock },
  { type: 'success' as const, message: 'Atualização do sistema concluída', icon: CheckCircle },
];

const maxEngagement = Math.max(...weeklyEngagement.map(d => d.value));

export default function AdminDashboard() {
  return (
    <div className="space-y-16">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {kpis.map((kpi, i) => (
          <motion.div key={kpi.label} {...listItem(i)}>
            <StatCard label={kpi.label} value={kpi.value} trend={kpi.trend} />
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Weekly Engagement */}
        <Card variant="elevated">
          <CardHeader className="flex justify-between items-center">
            <Heading level={3}>Engajamento Semanal</Heading>
            <Label className="text-warm-gray/40">Últimos 7 dias</Label>
          </CardHeader>
          <CardBody>
            <div className="flex items-end justify-between gap-3 h-40">
              {weeklyEngagement.map((day) => (
                <div key={day.day} className="flex-1 flex flex-col items-center gap-2">
                  <motion.div
                    className="w-full bg-gold/80 rounded-sm relative group cursor-default"
                    initial={{ height: 0 }}
                    animate={{ height: `${(day.value / maxEngagement) * 100}%` }}
                    transition={{ duration: 0.8, ease: 'circOut' }}
                  >
                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-mono text-gold opacity-0 group-hover:opacity-100 transition-opacity">
                      {day.value}%
                    </span>
                  </motion.div>
                  <span className="text-[10px] font-mono text-warm-gray/60">{day.day}</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Content Distribution */}
        <Card variant="elevated">
          <CardHeader className="flex justify-between items-center">
            <Heading level={3}>Distribuição de Conteúdo</Heading>
            <div className="flex items-center gap-2">
              <TrendingUp size={14} className="text-gold" />
              <Label variant="gold">88 itens</Label>
            </div>
          </CardHeader>
          <CardBody className="space-y-6">
            {contentDistribution.map((item) => (
              <div key={item.category} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">{item.category}</span>
                  <span className="text-[10px] font-mono text-warm-gray">{item.count} itens</span>
                </div>
                <ProgressBar value={item.percent} size="sm" glow={false} />
              </div>
            ))}
          </CardBody>
        </Card>
      </div>

      {/* Activity Log */}
      <Card variant="elevated">
        <CardHeader className="flex justify-between items-center">
          <Heading level={3}>Atividade Recente do Sistema</Heading>
          <Button variant="link" className="text-[10px]">Ver Logs Completos</Button>
        </CardHeader>
        <div className="divide-y divide-line">
          {activityLogs.map((log, i) => (
            <motion.div
              key={i}
              {...listItem(i)}
              className="p-8 flex items-center justify-between hover:bg-bg/30 transition-all group"
            >
              <div className="flex items-center gap-6">
                <Avatar name={log.user} size="lg" interactive />
                <p className="text-lg font-light">
                  <span className="font-black tracking-tight">{log.user}</span>{' '}
                  {log.action}{' '}
                  <span className="text-gold italic font-serif">{log.target}</span>
                </p>
              </div>
              <Label className="text-warm-gray/40">{log.time}</Label>
            </motion.div>
          ))}
        </div>
      </Card>

      {/* Alerts */}
      <Card variant="elevated">
        <CardHeader>
          <Heading level={3}>Alertas do Sistema</Heading>
        </CardHeader>
        <div className="divide-y divide-line">
          {alerts.map((alert, i) => {
            const Icon = alert.icon;
            const colorMap = {
              warning: 'text-amber-500 bg-amber-500/10',
              info: 'text-blue-400 bg-blue-400/10',
              success: 'text-emerald-500 bg-emerald-500/10',
            };
            const badgeMap = {
              warning: 'gold' as const,
              info: 'muted' as const,
              success: 'success' as const,
            };
            return (
              <div key={i} className="p-8 flex items-center gap-6">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${colorMap[alert.type]}`}>
                  <Icon size={18} />
                </div>
                <span className="text-sm flex-1">{alert.message}</span>
                <Badge variant={badgeMap[alert.type]}>
                  {alert.type === 'warning' ? 'Ação necessária' : alert.type === 'info' ? 'Agendado' : 'Concluído'}
                </Badge>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
