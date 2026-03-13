import { useState } from 'react';
import { motion } from 'motion/react';
import { Plus, Settings, CreditCard, Mail, BarChart3, Brain, Cloud } from 'lucide-react';
import {
  Card, CardBody, Button, Badge, Toggle, Divider,
} from '../ui';
import { Heading, Label, Text } from '../ui/Typography';
import { listItem } from '@/src/lib/motion';

interface Integration {
  name: string;
  description: string;
  icon: typeof CreditCard;
  connected: boolean;
  enabled: boolean;
  lastSync?: string;
  metric?: string;
}

const initialIntegrations: Integration[] = [
  {
    name: 'Stripe',
    description: 'Pagamentos e assinaturas',
    icon: CreditCard,
    connected: true,
    enabled: true,
    lastSync: 'Há 5 min',
    metric: '142 transações/mês',
  },
  {
    name: 'Resend',
    description: 'Envio de e-mails transacionais',
    icon: Mail,
    connected: true,
    enabled: true,
    lastSync: 'Há 1 hora',
    metric: '2.4k enviados/mês',
  },
  {
    name: 'Plausible',
    description: 'Analytics e métricas de uso',
    icon: BarChart3,
    connected: false,
    enabled: false,
  },
  {
    name: 'OpenAI',
    description: 'Inteligência artificial e processamento',
    icon: Brain,
    connected: true,
    enabled: true,
    lastSync: 'Há 30 min',
    metric: '840 chamadas/mês',
  },
  {
    name: 'AWS S3',
    description: 'Armazenamento de arquivos e mídia',
    icon: Cloud,
    connected: true,
    enabled: true,
    lastSync: 'Há 2 min',
    metric: '3.2 GB utilizados',
  },
];

const webhookLogs = [
  { method: 'POST', path: '/webhook/stripe', status: 200, time: 'Há 5 min', detail: 'payment_intent.succeeded' },
  { method: 'POST', path: '/webhook/resend', status: 200, time: 'Há 1 hora', detail: 'email.delivered' },
  { method: 'POST', path: '/webhook/stripe', status: 500, time: 'Há 3 horas', detail: 'invoice.payment_failed' },
];

export default function AdminIntegrations() {
  const [integrations, setIntegrations] = useState(initialIntegrations);

  const toggleIntegration = (index: number) => {
    setIntegrations(prev => prev.map((item, i) =>
      i === index ? { ...item, enabled: !item.enabled } : item
    ));
  };

  return (
    <div className="space-y-8 sm:space-y-16">
      {/* Description */}
      <Text muted>
        Gerencie as conexões com serviços externos. Ative ou desative integrações conforme necessário.
      </Text>

      {/* Integration Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {integrations.map((integration, i) => {
          const Icon = integration.icon;
          return (
            <motion.div key={integration.name} {...listItem(i)}>
              <Card variant="elevated" className="h-full">
                <CardBody className="space-y-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center">
                        <Icon size={18} className="text-warm-gray" />
                      </div>
                      <div>
                        <Heading level={4}>{integration.name}</Heading>
                        <Text size="xs" muted>{integration.description}</Text>
                      </div>
                    </div>
                    <Badge variant={integration.connected ? 'success' : 'muted'}>
                      {integration.connected ? 'Conectado' : 'Desconectado'}
                    </Badge>
                  </div>

                  {integration.connected && (
                    <div className="space-y-2">
                      {integration.lastSync && (
                        <div className="flex justify-between">
                          <Label>Última sincronização</Label>
                          <Label className="text-warm-gray/40">{integration.lastSync}</Label>
                        </div>
                      )}
                      {integration.metric && (
                        <div className="flex justify-between">
                          <Label>Métrica</Label>
                          <Label variant="gold">{integration.metric}</Label>
                        </div>
                      )}
                    </div>
                  )}

                  <Divider />

                  <div className="flex items-center justify-between">
                    {integration.connected ? (
                      <Button variant="secondary" size="sm" icon={<Settings size={14} />}>
                        Configurar
                      </Button>
                    ) : (
                      <Button variant="primary" size="sm">Conectar</Button>
                    )}
                    <Toggle
                      checked={integration.enabled}
                      onChange={() => toggleIntegration(i)}
                    />
                  </div>
                </CardBody>
              </Card>
            </motion.div>
          );
        })}

        {/* Ghost card */}
        <motion.div {...listItem(integrations.length)}>
          <button className="h-full min-h-[200px] sm:min-h-[280px] w-full border-2 border-dashed border-line hover:border-gold/50 flex flex-col items-center justify-center gap-4 transition-colors duration-300 cursor-pointer group">
            <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center group-hover:bg-gold/10 transition-colors">
              <Plus size={20} className="text-warm-gray group-hover:text-gold transition-colors" />
            </div>
            <Text size="sm" muted>Adicionar Integração</Text>
          </button>
        </motion.div>
      </div>

      {/* Webhook Logs */}
      <Card variant="elevated">
        <div className="p-10 border-b border-line">
          <Heading level={3}>Webhooks Recentes</Heading>
        </div>
        <div className="divide-y divide-line">
          {webhookLogs.map((log, i) => (
            <motion.div
              key={i}
              {...listItem(i)}
              className="p-8 flex items-center justify-between hover:bg-bg/30 transition-all"
            >
              <div className="flex items-center gap-6">
                <Badge variant="muted">{log.method}</Badge>
                <span className="text-sm font-mono">{log.path}</span>
                <Text size="xs" muted>{log.detail}</Text>
              </div>
              <div className="flex items-center gap-6">
                <Badge variant={log.status === 200 ? 'success' : 'gold'}>
                  {log.status}
                </Badge>
                <Label className="text-warm-gray/40">{log.time}</Label>
              </div>
            </motion.div>
          ))}
        </div>
      </Card>
    </div>
  );
}
