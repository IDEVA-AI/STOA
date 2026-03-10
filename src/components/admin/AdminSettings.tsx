import { useState } from 'react';
import { AlertTriangle, Download, Trash2 } from 'lucide-react';
import {
  Card, CardHeader, CardBody, Button, Input, Textarea, Toggle, Divider,
} from '../ui';
import { Heading, Label, Text } from '../ui/Typography';

interface NotificationSetting {
  label: string;
  key: string;
  enabled: boolean;
}

export default function AdminSettings() {
  const [platformName, setPlatformName] = useState('STOA');
  const [platformDesc, setPlatformDesc] = useState('Plataforma de Conhecimento e Comunidade para Arquitetos de Sistemas Organizacionais');
  const [platformUrl, setPlatformUrl] = useState('https://stoa.juliocarvalho.com');

  const [notifications, setNotifications] = useState<NotificationSetting[]>([
    { label: 'E-mail para novos membros', key: 'newMembers', enabled: true },
    { label: 'Alerta de posts reportados', key: 'reportedPosts', enabled: true },
    { label: 'Resumo semanal por e-mail', key: 'weeklyDigest', enabled: false },
    { label: 'Notificação de pagamento falhado', key: 'failedPayment', enabled: true },
  ]);

  const [twoFactor, setTwoFactor] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState('60');
  const [allowedIps, setAllowedIps] = useState('');
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  const toggleNotification = (key: string) => {
    setNotifications(prev => prev.map(n =>
      n.key === key ? { ...n, enabled: !n.enabled } : n
    ));
  };

  return (
    <div className="space-y-12">
      {/* General Info */}
      <Card variant="elevated">
        <CardHeader>
          <Heading level={3}>Informações Gerais</Heading>
        </CardHeader>
        <CardBody className="space-y-6">
          <Input
            label="Nome da Plataforma"
            value={platformName}
            onChange={(e) => setPlatformName(e.target.value)}
          />
          <Textarea
            label="Descrição"
            value={platformDesc}
            onChange={(e) => setPlatformDesc(e.target.value)}
            rows={3}
          />
          <Input
            label="URL da Plataforma"
            value={platformUrl}
            onChange={(e) => setPlatformUrl(e.target.value)}
          />
          <div className="flex justify-end">
            <Button>Salvar Alterações</Button>
          </div>
        </CardBody>
      </Card>

      {/* Notifications */}
      <Card variant="elevated">
        <CardHeader>
          <Heading level={3}>Notificações</Heading>
        </CardHeader>
        <CardBody className="space-y-1">
          {notifications.map((notification, i) => (
            <div key={notification.key}>
              <Toggle
                label={notification.label}
                checked={notification.enabled}
                onChange={() => toggleNotification(notification.key)}
                className="py-4"
              />
              {i < notifications.length - 1 && <Divider />}
            </div>
          ))}
        </CardBody>
      </Card>

      {/* Security */}
      <Card variant="elevated">
        <CardHeader>
          <Heading level={3}>Segurança</Heading>
        </CardHeader>
        <CardBody className="space-y-6">
          <Toggle
            label="Autenticação em dois fatores (2FA)"
            checked={twoFactor}
            onChange={setTwoFactor}
          />
          <Divider />
          <Input
            label="Timeout de sessão (minutos)"
            type="number"
            value={sessionTimeout}
            onChange={(e) => setSessionTimeout(e.target.value)}
          />
          <Textarea
            label="IPs permitidos (um por linha)"
            hint="Deixe vazio para permitir todos os IPs"
            value={allowedIps}
            onChange={(e) => setAllowedIps(e.target.value)}
            rows={3}
            placeholder="192.168.1.1&#10;10.0.0.0/24"
          />
          <div className="flex justify-end">
            <Button>Salvar Configurações</Button>
          </div>
        </CardBody>
      </Card>

      {/* Danger Zone */}
      <Card variant="elevated" className="border border-red-500/20">
        <CardHeader className="flex items-center gap-4">
          <AlertTriangle size={18} className="text-red-500" />
          <Heading level={3}>Zona de Perigo</Heading>
        </CardHeader>
        <CardBody className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Text size="sm" className="font-bold">Modo Manutenção</Text>
              <Text size="xs" muted>Desativa o acesso público à plataforma</Text>
            </div>
            <Toggle
              checked={maintenanceMode}
              onChange={setMaintenanceMode}
            />
          </div>
          <Divider />
          <div className="flex items-center justify-between">
            <div>
              <Text size="sm" className="font-bold">Exportar Dados</Text>
              <Text size="xs" muted>Baixe todos os dados da plataforma em formato JSON</Text>
            </div>
            <Button variant="secondary" size="sm" icon={<Download size={14} />}>
              Exportar
            </Button>
          </div>
          <Divider />
          <div className="flex items-center justify-between">
            <div>
              <Text size="sm" className="font-bold">Resetar Plataforma</Text>
              <Text size="xs" muted>Remove todos os dados permanentemente. Esta ação não pode ser desfeita.</Text>
            </div>
            <Button variant="danger" size="sm" icon={<Trash2 size={14} />}>
              Resetar
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
