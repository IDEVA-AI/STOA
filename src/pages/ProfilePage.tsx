import { Share2 } from 'lucide-react';
import {
  PageTransition,
  Button,
  Input,
  Textarea,
  Avatar,
  Card,
  Toggle,
  FormGroup,
  PageHeader,
} from '../components/ui';
import { Heading, Label } from '../components/ui/Typography';

export default function ProfilePage() {
  return (
    <PageTransition id="profile" className="max-w-4xl mx-auto space-y-12">
      <PageHeader
        title="Meu Perfil"
        label="Configurações de Conta"
        actions={
          <Button size="md">Salvar Alterações</Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-1 space-y-8">
          <Card variant="default" padding="md" className="text-center">
            <div className="relative inline-block mb-6">
              <Avatar name="Julio" size="2xl" className="border-2 border-gold" />
              <button className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-gold text-paper flex items-center justify-center border-4 border-surface hover:scale-110 transition-transform">
                <Share2 size={16} />
              </button>
            </div>
            <Heading level={4}>Julio Carvalho</Heading>
            <Label className="mt-1">Arquiteto de Sistemas</Label>
            <div className="mt-8 pt-8 border-t border-line grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="font-serif text-xl font-bold">12</p>
                <Label className="text-[8px]">Cursos</Label>
              </div>
              <div className="text-center">
                <p className="font-serif text-xl font-bold">1.2k</p>
                <Label className="text-[8px]">Seguidores</Label>
              </div>
            </div>
          </Card>

          <Card variant="default" padding="sm" className="space-y-4">
            <Label variant="gold">Privacidade</Label>
            <Toggle label="Perfil Público" checked onChange={() => {}} />
            <Toggle label="Mostrar Progresso" checked={false} onChange={() => {}} />
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-8">
          <Card variant="default" padding="lg" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <FormGroup label="Nome de Exibição">
                <Input type="text" defaultValue="Julio Carvalho" />
              </FormGroup>
              <FormGroup label="Título Profissional">
                <Input type="text" defaultValue="Arquiteto de Sistemas" />
              </FormGroup>
            </div>

            <FormGroup label="Biografia Curta">
              <Textarea
                defaultValue="Especialista em arquitetura de sistemas organizacionais e liderança sistêmica. Focado em criar estruturas que escalam sem perder a essência."
                className="h-32"
              />
            </FormGroup>

            <FormGroup label="Website / Portfólio">
              <div className="flex">
                <div className="bg-surface px-4 py-3 border border-r-0 border-line text-warm-gray text-sm flex items-center">https://</div>
                <Input type="text" defaultValue="juliocarvalho.com" className="flex-1" />
              </div>
            </FormGroup>
          </Card>

          <Card variant="default" padding="lg" className="space-y-6">
            <Heading level={4}>Segurança e Acesso</Heading>
            <div className="flex items-center justify-between py-4 border-b border-line">
              <div>
                <p className="text-sm font-bold">Alterar Senha</p>
                <p className="text-xs text-warm-gray">Última alteração há 3 meses</p>
              </div>
              <Button variant="link" className="text-xs">Atualizar</Button>
            </div>
            <div className="flex items-center justify-between py-4 border-b border-line">
              <div>
                <p className="text-sm font-bold">Autenticação em Duas Etapas</p>
                <p className="text-xs text-warm-gray">Aumente a segurança da sua conta</p>
              </div>
              <Button variant="link" className="text-xs">Ativar</Button>
            </div>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
}
