import { motion } from 'motion/react';
import { Send, X, MoreHorizontal, UserPlus } from 'lucide-react';
import {
  Card, CardBody, Button, Avatar, Badge, ProgressBar, StatCard,
} from '../ui';
import { Heading, Label, Text } from '../ui/Typography';
import { listItem } from '@/src/lib/motion';

const stats = [
  { label: 'Total de Membros', value: '65', trend: '+4' },
  { label: 'Membros Ativos', value: '58', trend: '+3' },
  { label: 'Convites Pendentes', value: '3', trend: '0' },
];

const pendingInvites = [
  { email: 'rafael.costa@empresa.com', plan: 'Premium', sentAgo: '2 dias' },
  { email: 'marina.santos@corp.io', plan: 'Starter', sentAgo: '5 dias' },
  { email: 'lucas.pereira@tech.com', plan: 'Elite', sentAgo: '1 dia' },
];

const members = [
  { name: 'Julio Carvalho', role: 'Fundador', plan: 'Elite', status: 'online' as const, email: 'julio@stoa.com' },
  { name: 'Ana Silva', role: 'Admin', plan: 'Premium', status: 'online' as const, email: 'ana@stoa.com' },
  { name: 'Marcos Reus', role: 'Membro', plan: 'Starter', status: 'offline' as const, email: 'marcos@email.com' },
  { name: 'Carla Duarte', role: 'Membro', plan: 'Premium', status: 'online' as const, email: 'carla@email.com' },
  { name: 'Felipe Nunes', role: 'Membro', plan: 'Premium', status: 'offline' as const, email: 'felipe@email.com' },
  { name: 'Renata Lima', role: 'Moderadora', plan: 'Premium', status: 'online' as const, email: 'renata@email.com' },
  { name: 'Diego Alves', role: 'Membro', plan: 'Starter', status: 'offline' as const, email: 'diego@email.com' },
  { name: 'Juliana Martins', role: 'Membro', plan: 'Starter', status: 'offline' as const, email: 'juliana@email.com' },
];

const plans = [
  { name: 'Starter', members: 12, price: 'R$ 97/mês', percent: 18 },
  { name: 'Premium', members: 45, price: 'R$ 297/mês', percent: 69 },
  { name: 'Elite', members: 8, price: 'R$ 997/mês', percent: 13 },
];

const roleBadge: Record<string, 'gold' | 'success' | 'muted' | 'default'> = {
  'Fundador': 'gold',
  'Admin': 'default',
  'Moderadora': 'success',
  'Membro': 'muted',
};

export default function AdminUnlocks() {
  return (
    <div className="space-y-16">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {stats.map((stat, i) => (
          <motion.div key={stat.label} {...listItem(i)}>
            <StatCard label={stat.label} value={stat.value} trend={stat.trend} />
          </motion.div>
        ))}
      </div>

      {/* Pending Invites */}
      <Card variant="elevated">
        <div className="p-10 border-b border-line flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Heading level={3}>Convites Pendentes</Heading>
            <Badge count={pendingInvites.length} />
          </div>
        </div>
        <div className="divide-y divide-line">
          {pendingInvites.map((invite, i) => (
            <motion.div
              key={invite.email}
              {...listItem(i)}
              className="p-8 flex items-center justify-between hover:bg-bg/30 transition-all"
            >
              <div className="flex items-center gap-6">
                <Avatar name={invite.email} size="md" />
                <div>
                  <span className="text-sm font-bold">{invite.email}</span>
                  <div className="flex items-center gap-3 mt-1">
                    <Badge variant="gold">{invite.plan}</Badge>
                    <Label className="text-warm-gray/40">Enviado há {invite.sentAgo}</Label>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="secondary" size="sm" icon={<Send size={12} />}>Reenviar</Button>
                <Button variant="ghost" size="sm" icon={<X size={12} />} iconOnly />
              </div>
            </motion.div>
          ))}
        </div>
      </Card>

      {/* Members Table */}
      <Card variant="elevated">
        <div className="p-10 border-b border-line flex justify-between items-center">
          <Heading level={3}>Membros da Plataforma</Heading>
          <Button size="sm" icon={<UserPlus size={14} />}>Convidar</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-line">
                <th className="text-left p-6"><Label>Membro</Label></th>
                <th className="text-left p-6"><Label>Role</Label></th>
                <th className="text-left p-6"><Label>Plano</Label></th>
                <th className="text-left p-6"><Label>Status</Label></th>
                <th className="text-right p-6"><Label>Ações</Label></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {members.map((member, i) => (
                <motion.tr
                  key={member.name}
                  {...listItem(i)}
                  className="hover:bg-bg/30 transition-all"
                >
                  <td className="p-6">
                    <div className="flex items-center gap-4">
                      <Avatar name={member.name} size="sm" status={member.status} />
                      <div>
                        <span className="font-bold text-sm">{member.name}</span>
                        <Text size="xs" muted className="block">{member.email}</Text>
                      </div>
                    </div>
                  </td>
                  <td className="p-6">
                    <Badge variant={roleBadge[member.role] ?? 'muted'}>{member.role}</Badge>
                  </td>
                  <td className="p-6">
                    <span className="text-sm">{member.plan}</span>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${member.status === 'online' ? 'bg-emerald-500' : 'bg-warm-gray/30'}`} />
                      <Text size="xs" muted>{member.status === 'online' ? 'Online' : 'Offline'}</Text>
                    </div>
                  </td>
                  <td className="p-6 text-right">
                    <Button variant="ghost" size="sm" iconOnly icon={<MoreHorizontal size={14} />} />
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan, i) => (
          <motion.div key={plan.name} {...listItem(i)}>
            <Card variant="elevated" padding="lg" className="text-center space-y-6">
              <Heading level={3}>{plan.name}</Heading>
              <div>
                <span className="font-serif text-3xl font-black">{plan.price}</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <span className="font-serif text-xl font-bold">{plan.members}</span>
                <Text size="sm" muted>membros</Text>
              </div>
              <ProgressBar value={plan.percent} size="md" showLabel />
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
