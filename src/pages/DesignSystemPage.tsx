import { useState } from 'react';
import {
  PageTransition,
  Button,
  Input,
  Textarea,
  Avatar,
  Badge,
  ProgressBar,
  Card,
  CardHeader,
  CardBody,
  Toggle,
  FormGroup,
  PageHeader,
  EmptyState,
  LoadingState,
  Divider,
} from '../components/ui';
import { Heading, Text, Label } from '../components/ui/Typography';
import { Search, Plus, Settings, Heart, Send } from 'lucide-react';

export default function DesignSystemPage() {
  const [toggleA, setToggleA] = useState(true);
  const [toggleB, setToggleB] = useState(false);

  return (
    <PageTransition id="design-system" className="space-y-20">
      <PageHeader
        title="Design System"
        label="STOA UI"
        subtitle="Catalogo de componentes reutilizaveis da plataforma."
      />

      {/* Section 1: Foundation */}
      <section className="space-y-12">
        <Heading level={2}>Fundacao</Heading>

        {/* Colors */}
        <div className="space-y-4">
          <Heading level={3}>Cores</Heading>
          <div className="flex flex-wrap gap-4">
            {[
              { name: 'gold', bg: 'bg-gold' },
              { name: 'gold-light', bg: 'bg-gold-light' },
              { name: 'ink', bg: 'bg-ink' },
              { name: 'paper', bg: 'bg-paper' },
              { name: 'warm-gray', bg: 'bg-warm-gray' },
              { name: 'rust', bg: 'bg-rust' },
            ].map(c => (
              <div key={c.name} className="space-y-2 text-center">
                <div className={`w-16 h-16 border border-line ${c.bg}`} />
                <Label>{c.name}</Label>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-4 mt-4">
            {[
              { name: 'bg', bg: 'bg-bg' },
              { name: 'text', bg: 'bg-text' },
              { name: 'surface', bg: 'bg-surface' },
              { name: 'line', bg: 'bg-line' },
            ].map(c => (
              <div key={c.name} className="space-y-2 text-center">
                <div className={`w-16 h-16 border border-line ${c.bg}`} />
                <Label variant="gold">{c.name}</Label>
              </div>
            ))}
          </div>
        </div>

        {/* Typography */}
        <div className="space-y-6">
          <Heading level={3}>Tipografia</Heading>
          <div className="space-y-4">
            <Heading level={1}>Heading 1 — Fraunces 6xl</Heading>
            <Heading level={2}>Heading 2 — Fraunces 3xl</Heading>
            <Heading level={3}>Heading 3 — Fraunces 2xl</Heading>
            <Heading level={4}>Heading 4 — Fraunces xl</Heading>
            <Divider />
            <Text size="xl">Text xl — DM Sans</Text>
            <Text size="lg">Text lg — DM Sans</Text>
            <Text>Text md (default) — DM Sans</Text>
            <Text size="sm">Text sm — DM Sans</Text>
            <Text size="xs">Text xs — DM Sans</Text>
            <Text muted>Text muted — warm-gray</Text>
            <Divider />
            <Label>Label default</Label>
            <span className="mx-4" />
            <Label variant="gold">Label gold</Label>
          </div>
        </div>
      </section>

      <Divider />

      {/* Section 2: Primitives */}
      <section className="space-y-12">
        <Heading level={2}>Primitivos</Heading>

        {/* Buttons */}
        <div className="space-y-4">
          <Heading level={3}>Button</Heading>
          <div className="flex flex-wrap items-center gap-4">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
            <Button variant="link">Link</Button>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Button icon={<Plus size={16} />}>Com Icone</Button>
            <Button iconRight={<Send size={16} />}>Icone Direita</Button>
            <Button icon={<Heart size={16} />} iconOnly size="md" />
            <Button loading>Carregando</Button>
            <Button fullWidth>Full Width</Button>
          </div>
        </div>

        {/* Input */}
        <div className="space-y-4 max-w-md">
          <Heading level={3}>Input</Heading>
          <Input placeholder="Input padrao" />
          <Input icon={<Search size={16} />} placeholder="Com icone" />
          <Input label="Com label" placeholder="Campo com label" />
          <Input error="Campo obrigatorio" placeholder="Com erro" />
          <Input variant="ghost" placeholder="Variante ghost..." />
        </div>

        {/* Textarea */}
        <div className="space-y-4 max-w-md">
          <Heading level={3}>Textarea</Heading>
          <Textarea placeholder="Textarea padrao..." rows={3} />
          <Textarea variant="editorial" placeholder="Editorial: o que voce esta arquitetando?" rows={3} />
        </div>

        {/* Avatar */}
        <div className="space-y-4">
          <Heading level={3}>Avatar</Heading>
          <div className="flex items-end gap-4">
            <Avatar name="Julio" size="xs" />
            <Avatar name="Julio" size="sm" />
            <Avatar name="Julio" size="md" />
            <Avatar name="Julio" size="lg" />
            <Avatar name="Julio" size="xl" />
            <Avatar name="Julio" size="2xl" />
          </div>
          <div className="flex items-center gap-4">
            <Avatar name="Ana" variant="gold" size="lg" />
            <Avatar name="Marcos" size="lg" status="online" />
            <Avatar name="Carla" size="lg" status="offline" />
            <Avatar name="Dev" size="lg" interactive />
          </div>
        </div>

        {/* Badge */}
        <div className="space-y-4">
          <Heading level={3}>Badge</Heading>
          <div className="flex flex-wrap items-center gap-4">
            <Badge variant="default">Default</Badge>
            <Badge variant="gold">Gold</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="muted">Muted</Badge>
            <Badge count={3} />
            <Badge count={12} />
          </div>
        </div>

        {/* ProgressBar */}
        <div className="space-y-4 max-w-md">
          <Heading level={3}>ProgressBar</Heading>
          <ProgressBar value={25} size="sm" />
          <ProgressBar value={50} size="md" />
          <ProgressBar value={75} size="sm" showLabel />
          <ProgressBar value={100} size="md" glow={false} />
        </div>

        {/* Card */}
        <div className="space-y-4">
          <Heading level={3}>Card</Heading>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card variant="default" padding="md">
              <Text size="sm" muted>Default card</Text>
            </Card>
            <Card variant="elevated" padding="md">
              <Text size="sm" muted>Elevated card</Text>
            </Card>
            <Card variant="flat" padding="md">
              <Text size="sm" muted>Flat card</Text>
            </Card>
          </div>
          <Card variant="elevated" interactive>
            <CardHeader>
              <Heading level={4}>Card com sub-componentes</Heading>
            </CardHeader>
            <CardBody>
              <Text muted size="sm">Card.Header + Card.Body + interactive</Text>
            </CardBody>
          </Card>
        </div>

        {/* Toggle */}
        <div className="space-y-4 max-w-xs">
          <Heading level={3}>Toggle</Heading>
          <Toggle label="Perfil Publico" checked={toggleA} onChange={setToggleA} />
          <Toggle label="Mostrar Progresso" checked={toggleB} onChange={setToggleB} />
          <Toggle label="Desabilitado" checked={false} disabled />
        </div>
      </section>

      <Divider />

      {/* Section 3: Composites */}
      <section className="space-y-12">
        <Heading level={2}>Compostos</Heading>

        {/* FormGroup */}
        <div className="space-y-4 max-w-md">
          <Heading level={3}>FormGroup</Heading>
          <FormGroup label="Nome Completo" required>
            <Input placeholder="Seu nome" />
          </FormGroup>
          <FormGroup
            label="Senha"
            labelAction={
              <button className="text-[10px] mono-label text-gold hover:underline">Esqueceu?</button>
            }
          >
            <Input type="password" placeholder="********" />
          </FormGroup>
          <FormGroup label="Campo com erro" error="Este campo e obrigatorio">
            <Input placeholder="..." />
          </FormGroup>
        </div>

        {/* PageHeader */}
        <div className="space-y-4">
          <Heading level={3}>PageHeader</Heading>
          <PageHeader
            title="Exemplo de PageHeader"
            subtitle="Subtitulo descritivo da pagina."
            label="Secao"
            actions={<Button size="sm">Acao</Button>}
          />
        </div>

        {/* EmptyState */}
        <div className="space-y-4">
          <Heading level={3}>EmptyState</Heading>
          <EmptyState
            icon={<Settings size={40} className="text-warm-gray/20 animate-spin" />}
            title="Modulo em Construcao"
            description="A arquitetura desta secao esta sendo refinada"
          />
        </div>

        {/* LoadingState */}
        <div className="space-y-4">
          <Heading level={3}>LoadingState</Heading>
          <div className="flex justify-center py-8">
            <LoadingState
              message="Arquitetando sua experiencia..."
              description="Preparando o ambiente de aprendizado"
            />
          </div>
        </div>

        {/* Divider */}
        <div className="space-y-4">
          <Heading level={3}>Divider</Heading>
          <Text size="sm" muted>Conteudo acima</Text>
          <Divider />
          <Text size="sm" muted>Conteudo abaixo</Text>
        </div>
      </section>
    </PageTransition>
  );
}
