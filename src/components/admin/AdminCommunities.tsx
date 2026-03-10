import { useState } from 'react';
import { motion } from 'motion/react';
import { Search, Plus } from 'lucide-react';
import {
  Card, CardBody, Button, Avatar, Badge, ProgressBar, Input,
} from '../ui';
import { Heading, Label, Text } from '../ui/Typography';
import { listItem } from '@/src/lib/motion';

const communities = [
  {
    name: 'Arquitetos de Elite',
    description: 'Grupo exclusivo para alunos do programa avançado',
    members: 342,
    engagement: 85,
    status: 'Ativa',
    topMembers: ['Ana Silva', 'Marcos Reus', 'Carla Duarte'],
  },
  {
    name: 'Liderança Sistêmica',
    description: 'Discussões sobre liderança e gestão de sistemas',
    members: 128,
    engagement: 62,
    status: 'Ativa',
    topMembers: ['Felipe Nunes', 'Renata Lima', 'Paulo Costa'],
  },
  {
    name: 'Estratégia & Escala',
    description: 'Planejamento estratégico e crescimento organizacional',
    members: 89,
    engagement: 34,
    status: 'Nova',
    topMembers: ['Diego Alves', 'Juliana Martins', 'Ricardo Santos'],
  },
  {
    name: 'Operações Internas',
    description: 'Equipe de operações e suporte da plataforma',
    members: 24,
    engagement: 91,
    status: 'Privada',
    topMembers: ['Julio Carvalho', 'Ana Silva', 'Sistema'],
  },
];

const topActiveMembers = [
  { name: 'Ana Silva', posts: 47, lastAccess: 'Há 5 min', role: 'Moderadora' },
  { name: 'Marcos Reus', posts: 38, lastAccess: 'Há 12 min', role: 'Membro' },
  { name: 'Carla Duarte', posts: 31, lastAccess: 'Há 1 hora', role: 'Membro' },
  { name: 'Felipe Nunes', posts: 28, lastAccess: 'Há 2 horas', role: 'Membro' },
  { name: 'Renata Lima', posts: 24, lastAccess: 'Há 3 horas', role: 'Moderadora' },
];

export default function AdminCommunities() {
  const [search, setSearch] = useState('');

  const filtered = communities.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-16">
      {/* Toolbar */}
      <div className="flex items-center gap-6">
        <div className="flex-1">
          <Input
            icon={<Search size={16} />}
            placeholder="Buscar comunidades..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button icon={<Plus size={16} />}>Nova Comunidade</Button>
      </div>

      {/* Community Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filtered.map((community, i) => {
          const badgeVariant = community.status === 'Nova' ? 'gold' : community.status === 'Privada' ? 'muted' : 'success';
          return (
            <motion.div key={community.name} {...listItem(i)}>
              <Card variant="elevated" interactive className="h-full">
                <CardBody className="space-y-6">
                  <div className="flex justify-between items-start">
                    <Heading level={4}>{community.name}</Heading>
                    <Badge variant={badgeVariant}>{community.status}</Badge>
                  </div>
                  <Text size="sm" muted>{community.description}</Text>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label>{community.members} membros</Label>
                      <Label variant="gold">{community.engagement}%</Label>
                    </div>
                    <ProgressBar value={community.engagement} size="sm" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex -space-x-2">
                      {community.topMembers.map((name) => (
                        <Avatar key={name} name={name} size="sm" />
                      ))}
                    </div>
                    <Button variant="secondary" size="sm">Gerenciar</Button>
                  </div>
                </CardBody>
              </Card>
            </motion.div>
          );
        })}

        {/* Ghost card */}
        <motion.div {...listItem(filtered.length)}>
          <button className="h-full min-h-[240px] w-full border-2 border-dashed border-line hover:border-gold/50 flex flex-col items-center justify-center gap-4 transition-colors duration-300 cursor-pointer group">
            <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center group-hover:bg-gold/10 transition-colors">
              <Plus size={20} className="text-warm-gray group-hover:text-gold transition-colors" />
            </div>
            <Text size="sm" muted>Criar Nova Comunidade</Text>
          </button>
        </motion.div>
      </div>

      {/* Top Active Members */}
      <Card variant="elevated">
        <div className="p-10 border-b border-line flex justify-between items-center">
          <Heading level={3}>Membros Mais Ativos</Heading>
          <Label className="text-warm-gray/40">Top 5 da plataforma</Label>
        </div>
        <div className="divide-y divide-line">
          {topActiveMembers.map((member, i) => (
            <motion.div
              key={member.name}
              {...listItem(i)}
              className="p-8 flex items-center justify-between hover:bg-bg/30 transition-all"
            >
              <div className="flex items-center gap-6">
                <span className="text-[10px] font-mono text-warm-gray/40 w-6">{String(i + 1).padStart(2, '0')}</span>
                <Avatar name={member.name} size="md" interactive />
                <div>
                  <span className="font-bold tracking-tight">{member.name}</span>
                  <Badge variant="muted" className="ml-3">{member.role}</Badge>
                </div>
              </div>
              <div className="flex items-center gap-10">
                <div className="text-right">
                  <Label>Posts</Label>
                  <p className="font-serif font-bold text-lg">{member.posts}</p>
                </div>
                <Label className="text-warm-gray/40">{member.lastAccess}</Label>
              </div>
            </motion.div>
          ))}
        </div>
      </Card>
    </div>
  );
}
