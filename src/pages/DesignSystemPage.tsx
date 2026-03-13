import { useState, useRef, useEffect } from 'react';
import { motion, useInView } from 'motion/react';
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
  CardFooter,
  Toggle,
  FormGroup,
  EmptyState,
  LoadingState,
  Divider,
} from '../components/ui';
import { Heading, Text, Label } from '../components/ui/Typography';
import {
  Search, Plus, Settings, Heart, Send, BookOpen, Users, Star, Clock,
  CheckCircle, ArrowRight, Calendar, Play, Sparkles, Zap, Eye,
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { SPEC_LABELS, PALETTE_SWATCHES, VALID_PALETTES } from '../types';
import type { StyleSpec, ColorPalette } from '../types';
import { cn } from '@/src/lib/utils';

/* ── Staggered reveal on scroll ── */
function Reveal({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── Section wrapper ── */
function Section({ id, label, title, subtitle, children }: {
  id: string; label: string; title: string; subtitle?: string; children: React.ReactNode;
}) {
  return (
    <section id={id} className="space-y-12">
      <Reveal>
        <Label variant="gold">{label}</Label>
        <Heading level={2} className="mt-2">{title}</Heading>
        {subtitle && <Text muted className="mt-2 max-w-2xl">{subtitle}</Text>}
      </Reveal>
      {children}
    </section>
  );
}

/* ── Color swatch card ── */
function ColorSwatch({ name, cssVar, hex, usage }: { name: string; cssVar: string; hex: string; usage: string }) {
  return (
    <div className="group relative">
      <div
        className="w-full aspect-[4/3] border border-line transition-transform duration-300 group-hover:scale-[1.02]"
        style={{ backgroundColor: hex }}
      />
      <div className="mt-3 space-y-0.5">
        <p className="font-mono text-[11px] font-medium text-text">{name}</p>
        <p className="font-mono text-[10px] text-warm-gray">{hex}</p>
        <p className="font-mono text-[10px] text-warm-gray/60">{cssVar}</p>
        <p className="text-[11px] text-warm-gray mt-1">{usage}</p>
      </div>
    </div>
  );
}

/* ── Artesanal palette data ── */
const ARTESANAL_COLORS = [
  { name: 'Gold', cssVar: '--theme-gold', hex: '#b8873a', usage: 'Accent, CTAs, active states' },
  { name: 'Gold Light', cssVar: '--theme-gold-light', hex: '#e8d5b0', usage: 'Highlights, hover fills' },
  { name: 'Paper', cssVar: '--theme-bg', hex: '#f4f0e8', usage: 'Background (light)' },
  { name: 'Ink', cssVar: '--theme-text', hex: '#0e0c0a', usage: 'Primary text' },
  { name: 'Surface', cssVar: '--theme-surface', hex: '#ffffff', usage: 'Cards, panels' },
  { name: 'Line', cssVar: '--theme-line', hex: '#ddd8cc', usage: 'Borders, dividers' },
  { name: 'Warm Gray', cssVar: '--theme-warm-gray', hex: '#7a7268', usage: 'Secondary text, labels' },
  { name: 'Rust', cssVar: '--color-rust', hex: '#5c2418', usage: 'Palette accent, danger variant' },
];

const MINIMAL_COLORS = [
  { name: 'Blue', cssVar: '--theme-gold', hex: '#2563eb', usage: 'Accent, CTAs, active states' },
  { name: 'Blue Light', cssVar: '--theme-gold-light', hex: '#dbeafe', usage: 'Highlights, hover fills' },
  { name: 'White', cssVar: '--theme-bg', hex: '#fafafa', usage: 'Background (light)' },
  { name: 'Black', cssVar: '--theme-text', hex: '#111111', usage: 'Primary text' },
  { name: 'Surface', cssVar: '--theme-surface', hex: '#ffffff', usage: 'Cards, panels' },
  { name: 'Line', cssVar: '--theme-line', hex: '#e5e5e5', usage: 'Borders, dividers' },
  { name: 'Gray', cssVar: '--theme-warm-gray', hex: '#737373', usage: 'Secondary text, labels' },
];

export default function DesignSystemPage() {
  const { spec, setSpec, palette, setPalette } = useTheme();
  const [toggleA, setToggleA] = useState(true);
  const [toggleB, setToggleB] = useState(false);
  const [demoProgress, setDemoProgress] = useState(68);

  // Animate progress on mount
  useEffect(() => {
    const timer = setTimeout(() => setDemoProgress(68), 500);
    return () => clearTimeout(timer);
  }, []);

  const colors = spec === 'artesanal' ? ARTESANAL_COLORS : MINIMAL_COLORS;

  return (
    <PageTransition id="design-system" className="space-y-32">

      {/* ━━━ HERO ━━━ */}
      <Reveal>
        <div className="relative py-8">
          <div className="space-y-6 max-w-3xl">
            <div className="flex items-center gap-3">
              <Label variant="gold">STOA DESIGN SYSTEM</Label>
              <Badge variant="gold">{SPEC_LABELS[spec]}</Badge>
            </div>
            <h1 className="serif-display text-6xl md:text-7xl text-text leading-[0.95]">
              Cada pixel{' '}
              <span className="text-gold">com propósito</span>
            </h1>
            <Text size="lg" muted className="max-w-xl">
              Catálogo vivo de componentes, tipografia e paletas.
              Troque o spec e a paleta para ver tudo se transformar em tempo real.
            </Text>
          </div>

          {/* Inline spec + palette switcher */}
          <div className="mt-10 flex flex-wrap items-center gap-6">
            <div className="flex gap-1">
              {(['artesanal', 'minimal'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSpec(s)}
                  className={cn(
                    "px-4 py-2 text-[11px] font-mono uppercase tracking-widest border transition-all duration-300",
                    spec === s
                      ? "bg-gold/10 border-gold text-gold font-bold"
                      : "border-line text-warm-gray/60 hover:text-warm-gray hover:border-warm-gray/40"
                  )}
                >
                  {SPEC_LABELS[s]}
                </button>
              ))}
            </div>
            <div className="flex gap-2 items-center">
              {PALETTE_SWATCHES[spec].map((swatch) => (
                <button
                  key={swatch.palette}
                  onClick={() => setPalette(swatch.palette)}
                  className={cn(
                    "w-7 h-7 rounded-full border border-line transition-all duration-300",
                    palette === swatch.palette && "ring-2 ring-gold ring-offset-2 ring-offset-bg"
                  )}
                  style={{ backgroundColor: swatch.color }}
                  title={swatch.label}
                />
              ))}
              <span className="text-[10px] font-mono text-warm-gray/60 ml-2 uppercase tracking-wider">
                {PALETTE_SWATCHES[spec].find(s => s.palette === palette)?.label || palette}
              </span>
            </div>
          </div>
        </div>
      </Reveal>

      {/* ━━━ FOUNDATIONS: TYPOGRAPHY ━━━ */}
      <Section id="typography" label="01 — FUNDAÇÕES" title="Tipografia" subtitle="A hierarquia visual que guia o olhar. Cada nível tem peso, escala e intenção.">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Display hierarchy */}
          <Reveal>
            <div className="space-y-8">
              <Label variant="gold">DISPLAY / SERIF</Label>
              <div className="space-y-6 mt-4">
                <div className="border-b border-line pb-6">
                  <p className="font-mono text-[10px] text-warm-gray/50 mb-2">H1 — {spec === 'artesanal' ? 'Fraunces 6xl Black' : 'Space Grotesk 6xl Bold'}</p>
                  <Heading level={1}>Arquitetura Visual</Heading>
                </div>
                <div className="border-b border-line pb-6">
                  <p className="font-mono text-[10px] text-warm-gray/50 mb-2">H2 — {spec === 'artesanal' ? 'Fraunces 3xl Black' : 'Space Grotesk 3xl Bold'}</p>
                  <Heading level={2}>Sistema de Tipos</Heading>
                </div>
                <div className="border-b border-line pb-6">
                  <p className="font-mono text-[10px] text-warm-gray/50 mb-2">H3 — {spec === 'artesanal' ? 'Fraunces 2xl' : 'Space Grotesk 2xl'}</p>
                  <Heading level={3}>Componentes Base</Heading>
                </div>
                <div>
                  <p className="font-mono text-[10px] text-warm-gray/50 mb-2">H4 — {spec === 'artesanal' ? 'Fraunces xl' : 'Space Grotesk xl'}</p>
                  <Heading level={4}>Seção Interna</Heading>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Body + Mono */}
          <Reveal delay={0.1}>
            <div className="space-y-8">
              <Label variant="gold">BODY / SANS</Label>
              <div className="space-y-4 mt-4">
                <div className="border-b border-line pb-4">
                  <p className="font-mono text-[10px] text-warm-gray/50 mb-2">XL</p>
                  <Text size="xl">Texto principal com presença e clareza</Text>
                </div>
                <div className="border-b border-line pb-4">
                  <p className="font-mono text-[10px] text-warm-gray/50 mb-2">LG</p>
                  <Text size="lg">Subtítulos e introduções de seção</Text>
                </div>
                <div className="border-b border-line pb-4">
                  <p className="font-mono text-[10px] text-warm-gray/50 mb-2">MD (default)</p>
                  <Text>Corpo do texto corrido para leitura confortável</Text>
                </div>
                <div className="border-b border-line pb-4">
                  <p className="font-mono text-[10px] text-warm-gray/50 mb-2">SM</p>
                  <Text size="sm">Descrições, metadados, informação secundária</Text>
                </div>
                <div className="border-b border-line pb-4">
                  <p className="font-mono text-[10px] text-warm-gray/50 mb-2">XS</p>
                  <Text size="xs">Captions, timestamps, notas de rodapé</Text>
                </div>
              </div>

              <Label variant="gold" className="mt-8">MONO</Label>
              <div className="space-y-3 mt-4">
                <div className="flex items-center gap-4">
                  <Label>LABEL DEFAULT</Label>
                  <Label variant="gold">LABEL GOLD</Label>
                </div>
                <p className="font-mono text-[12px] text-warm-gray">
                  {spec === 'artesanal' ? 'DM Mono' : 'JetBrains Mono'} — código, labels, metadados técnicos
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* ━━━ FOUNDATIONS: COLORS ━━━ */}
      <Section id="colors" label="02 — FUNDAÇÕES" title="Paleta de Cores" subtitle={`Cores do spec ${SPEC_LABELS[spec]}. Cada cor tem papel definido no sistema.`}>
        <Reveal>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-6">
            {colors.map((c) => (
              <ColorSwatch key={c.name} {...c} />
            ))}
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-6">
            {[
              { name: 'Success', hex: 'var(--theme-success)', usage: 'Confirmação, progresso completo' },
              { name: 'Danger', hex: 'var(--theme-danger)', usage: 'Erro, exclusão, alerta' },
            ].map((c) => (
              <div key={c.name} className="group">
                <div className={cn("w-full aspect-[4/3] border border-line", c.name === 'Success' ? 'bg-success' : 'bg-danger')} />
                <div className="mt-3 space-y-0.5">
                  <p className="font-mono text-[11px] font-medium text-text">{c.name}</p>
                  <p className="text-[11px] text-warm-gray">{c.usage}</p>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </Section>

      {/* ━━━ COMPONENTS: BUTTONS ━━━ */}
      <Section id="buttons" label="03 — COMPONENTES" title="Botões" subtitle="Ações com hierarquia clara. Primary para ações principais, secondary para complementares.">
        <Reveal>
          <Card variant="elevated" padding="lg">
            <CardHeader>
              <Heading level={4}>Criar novo curso</Heading>
              <Text size="sm" muted>Preencha as informações iniciais do seu curso.</Text>
            </CardHeader>
            <CardBody>
              <div className="space-y-4 max-w-md">
                <FormGroup label="Nome do Curso" required>
                  <Input placeholder="Ex: Arquitetura de Software Moderna" />
                </FormGroup>
                <FormGroup label="Descrição">
                  <Textarea placeholder="O que seus alunos vão aprender?" rows={3} />
                </FormGroup>
              </div>
            </CardBody>
            <CardFooter>
              <div className="flex items-center justify-between pt-4 border-t border-line">
                <Button variant="ghost">Cancelar</Button>
                <div className="flex gap-3">
                  <Button variant="secondary">Salvar Rascunho</Button>
                  <Button variant="primary" icon={<Plus size={16} />}>Criar Curso</Button>
                </div>
              </div>
            </CardFooter>
          </Card>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="space-y-6">
            <Label variant="gold">VARIANTES</Label>
            <div className="flex flex-wrap items-center gap-4">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">Danger</Button>
              <Button variant="link">Link</Button>
            </div>
            <Label variant="gold">TAMANHOS</Label>
            <div className="flex flex-wrap items-center gap-4">
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
            </div>
            <Label variant="gold">ESTADOS</Label>
            <div className="flex flex-wrap items-center gap-4">
              <Button icon={<Plus size={16} />}>Com Ícone</Button>
              <Button iconRight={<Send size={16} />}>Ícone Direita</Button>
              <Button icon={<Heart size={16} />} iconOnly size="md" />
              <Button loading>Carregando</Button>
            </div>
          </div>
        </Reveal>
      </Section>

      {/* ━━━ COMPONENTS: INPUTS ━━━ */}
      <Section id="inputs" label="04 — COMPONENTES" title="Campos de Entrada" subtitle="Forms que respeitam o usuário. Claros, acessíveis, com feedback imediato.">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <Reveal>
            <Card variant="elevated" padding="lg">
              <CardHeader>
                <Heading level={4}>Configurações do Perfil</Heading>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  <FormGroup label="Nome Completo" required>
                    <Input placeholder="Seu nome" />
                  </FormGroup>
                  <FormGroup label="Email">
                    <Input icon={<Send size={16} />} placeholder="voce@exemplo.com" />
                  </FormGroup>
                  <FormGroup label="Buscar membros">
                    <Input icon={<Search size={16} />} placeholder="Nome ou email..." />
                  </FormGroup>
                  <FormGroup label="Senha" labelAction={<button className="text-[10px] mono-label text-gold hover:underline">Esqueceu?</button>}>
                    <Input type="password" placeholder="********" />
                  </FormGroup>
                  <FormGroup label="Campo com erro" error="Este campo é obrigatório">
                    <Input placeholder="..." />
                  </FormGroup>
                </div>
              </CardBody>
            </Card>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="space-y-6">
              <Label variant="gold">TEXTAREA</Label>
              <Textarea placeholder="Textarea padrão..." rows={3} />
              <Textarea variant="editorial" placeholder="Editorial: o que você está arquitetando?" rows={4} />

              <Label variant="gold" className="mt-8">INPUT GHOST</Label>
              <Input variant="ghost" placeholder="Busca minimalista..." />
            </div>
          </Reveal>
        </div>
      </Section>

      {/* ━━━ COMPONENTS: CARDS ━━━ */}
      <Section id="cards" label="05 — COMPONENTES" title="Cards" subtitle="Containers que dão estrutura ao conteúdo. De flat a elevated, cada variante comunica importância.">
        <Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Course card mock */}
            <Card variant="elevated" interactive className="overflow-hidden">
              <div className="aspect-video bg-gradient-to-br from-gold/20 to-gold/5 flex items-center justify-center">
                <Play size={40} className="text-gold/40" />
              </div>
              <CardBody>
                <Badge variant="gold" className="mb-2">12 aulas</Badge>
                <Heading level={4}>Arquitetura de Software</Heading>
                <Text size="sm" muted className="mt-1">Princípios SOLID, padrões e decisões arquiteturais para sistemas escaláveis.</Text>
                <ProgressBar value={demoProgress} size="sm" showLabel className="mt-4" />
              </CardBody>
            </Card>

            <Card variant="elevated" interactive className="overflow-hidden">
              <div className="aspect-video bg-gradient-to-br from-warm-gray/20 to-warm-gray/5 flex items-center justify-center">
                <BookOpen size={40} className="text-warm-gray/40" />
              </div>
              <CardBody>
                <Badge variant="muted" className="mb-2">8 aulas</Badge>
                <Heading level={4}>Design Systems</Heading>
                <Text size="sm" muted className="mt-1">Como criar sistemas de design consistentes e escaláveis do zero.</Text>
                <ProgressBar value={35} size="sm" showLabel className="mt-4" />
              </CardBody>
            </Card>

            <Card variant="elevated" interactive className="overflow-hidden">
              <div className="aspect-video bg-gradient-to-br from-success/20 to-success/5 flex items-center justify-center">
                <CheckCircle size={40} className="text-success/40" />
              </div>
              <CardBody>
                <Badge variant="success" className="mb-2">Completo</Badge>
                <Heading level={4}>Fundamentos de UX</Heading>
                <Text size="sm" muted className="mt-1">Pesquisa, wireframes, prototipação e testes de usabilidade.</Text>
                <ProgressBar value={100} size="sm" className="mt-4" />
              </CardBody>
            </Card>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="space-y-4 mt-8">
            <Label variant="gold">VARIANTES</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card variant="default" padding="md">
                <Text size="sm" muted>Default — borda sutil</Text>
              </Card>
              <Card variant="elevated" padding="md">
                <Text size="sm" muted>Elevated — sombra e destaque</Text>
              </Card>
              <Card variant="flat" padding="md">
                <Text size="sm" muted>Flat — fundo sutil, sem borda</Text>
              </Card>
            </div>
          </div>
        </Reveal>
      </Section>

      {/* ━━━ COMPONENTS: AVATARS & BADGES ━━━ */}
      <Section id="avatars" label="06 — COMPONENTES" title="Avatares & Badges" subtitle="Identidade e status em elementos compactos.">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Avatars in context: member list */}
          <Reveal>
            <Card variant="elevated" padding="lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Heading level={4}>Membros da Comunidade</Heading>
                  <Badge count={5} />
                </div>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  {[
                    { name: 'Julio Carvalho', role: 'Fundador', status: 'online' as const },
                    { name: 'Ana Silva', role: 'Mentora', status: 'online' as const },
                    { name: 'Marcos Lima', role: 'Membro', status: 'offline' as const },
                    { name: 'Carla Santos', role: 'Membro', status: 'online' as const },
                    { name: 'Dev Almeida', role: 'Convidado', status: 'offline' as const },
                  ].map((m) => (
                    <div key={m.name} className="flex items-center gap-3 py-2 border-b border-line last:border-0">
                      <Avatar name={m.name} size="md" status={m.status} />
                      <div className="flex-1 min-w-0">
                        <Text size="sm" className="font-medium truncate">{m.name}</Text>
                        <Text size="xs" muted>{m.role}</Text>
                      </div>
                      {m.role === 'Fundador' && <Badge variant="gold">Admin</Badge>}
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          </Reveal>

          {/* Avatar sizes + Badge variants */}
          <Reveal delay={0.1}>
            <div className="space-y-8">
              <div>
                <Label variant="gold">TAMANHOS</Label>
                <div className="flex items-end gap-4 mt-4">
                  <div className="text-center space-y-2">
                    <Avatar name="J" size="xs" />
                    <Text size="xs" muted>XS</Text>
                  </div>
                  <div className="text-center space-y-2">
                    <Avatar name="J" size="sm" />
                    <Text size="xs" muted>SM</Text>
                  </div>
                  <div className="text-center space-y-2">
                    <Avatar name="J" size="md" />
                    <Text size="xs" muted>MD</Text>
                  </div>
                  <div className="text-center space-y-2">
                    <Avatar name="J" size="lg" />
                    <Text size="xs" muted>LG</Text>
                  </div>
                  <div className="text-center space-y-2">
                    <Avatar name="J" size="xl" />
                    <Text size="xs" muted>XL</Text>
                  </div>
                  <div className="text-center space-y-2">
                    <Avatar name="J" size="2xl" />
                    <Text size="xs" muted>2XL</Text>
                  </div>
                </div>
              </div>

              <div>
                <Label variant="gold">BADGES</Label>
                <div className="space-y-4 mt-4">
                  {/* Badges in scheduling context */}
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge variant="default">Pendente</Badge>
                    <Badge variant="gold">Confirmado</Badge>
                    <Badge variant="success">Realizado</Badge>
                    <Badge variant="muted">Cancelado</Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge count={3} />
                    <Badge count={12} />
                    <Badge count={99} />
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* ━━━ COMPONENTS: PROGRESS & TOGGLES ━━━ */}
      <Section id="progress" label="07 — COMPONENTES" title="Progresso & Toggles" subtitle="Feedback visual de progresso e configurações binárias.">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Progress in context: course progress card */}
          <Reveal>
            <Card variant="elevated" padding="lg">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gold/10 flex items-center justify-center">
                    <Star size={20} className="text-gold" />
                  </div>
                  <div>
                    <Heading level={4}>Seu Progresso</Heading>
                    <Text size="xs" muted>Arquitetura de Software</Text>
                  </div>
                </div>
              </CardHeader>
              <CardBody>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-2">
                      <Text size="sm">Módulo 1 — Fundamentos</Text>
                      <Text size="sm" className="text-success font-medium">100%</Text>
                    </div>
                    <ProgressBar value={100} size="sm" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <Text size="sm">Módulo 2 — Padrões</Text>
                      <Text size="sm" className="text-gold font-medium">68%</Text>
                    </div>
                    <ProgressBar value={68} size="md" showLabel />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <Text size="sm">Módulo 3 — Práticas</Text>
                      <Text size="sm" muted>25%</Text>
                    </div>
                    <ProgressBar value={25} size="sm" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <Text size="sm">Módulo 4 — Avançado</Text>
                      <Text size="sm" muted>0%</Text>
                    </div>
                    <ProgressBar value={0} size="sm" />
                  </div>
                </div>
              </CardBody>
            </Card>
          </Reveal>

          {/* Toggles in context: notification settings */}
          <Reveal delay={0.1}>
            <Card variant="elevated" padding="lg">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gold/10 flex items-center justify-center">
                    <Settings size={20} className="text-gold" />
                  </div>
                  <div>
                    <Heading level={4}>Preferências</Heading>
                    <Text size="xs" muted>Notificações e privacidade</Text>
                  </div>
                </div>
              </CardHeader>
              <CardBody>
                <div className="space-y-1">
                  <div className="py-3 border-b border-line">
                    <Toggle label="Perfil Público" checked={toggleA} onChange={setToggleA} />
                    <Text size="xs" muted className="mt-1 pl-14">Outros membros podem ver seu perfil e progresso</Text>
                  </div>
                  <div className="py-3 border-b border-line">
                    <Toggle label="Notificações por Email" checked={toggleB} onChange={setToggleB} />
                    <Text size="xs" muted className="mt-1 pl-14">Receber resumo semanal de atividades</Text>
                  </div>
                  <div className="py-3">
                    <Toggle label="Modo Zen" checked={false} disabled />
                    <Text size="xs" muted className="mt-1 pl-14">Em breve — oculta métricas de progresso</Text>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Reveal>
        </div>
      </Section>

      {/* ━━━ COMPOSITES ━━━ */}
      <Section id="composites" label="08 — COMPOSIÇÕES" title="Padrões da Plataforma" subtitle="Combinações de componentes que formam os blocos reais do STOA.">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Empty state */}
          <Reveal>
            <Card variant="default" padding="lg">
              <EmptyState
                icon={<Sparkles size={40} className="text-gold/30" />}
                title="Nenhum curso publicado"
                description="Crie seu primeiro curso e comece a transformar conhecimento em experiência"
              />
              <div className="flex justify-center mt-6">
                <Button variant="primary" icon={<Plus size={16} />}>Criar Curso</Button>
              </div>
            </Card>
          </Reveal>

          {/* Loading state */}
          <Reveal delay={0.1}>
            <Card variant="default" padding="lg">
              <div className="flex justify-center py-8">
                <LoadingState
                  message="Arquitetando sua experiência..."
                  description="Preparando o ambiente de aprendizado"
                />
              </div>
            </Card>
          </Reveal>
        </div>

        {/* Dashboard-like composition */}
        <Reveal delay={0.2}>
          <div className="mt-12">
            <Label variant="gold" className="mb-4 block">RESUMO DO PAINEL</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Cursos Ativos', value: '12', icon: BookOpen, trend: '+2 este mês' },
                { label: 'Membros', value: '847', icon: Users, trend: '+23 esta semana' },
                { label: 'Taxa de Conclusão', value: '72%', icon: CheckCircle, trend: '+5% vs mês anterior' },
                { label: 'Agendamentos', value: '34', icon: Calendar, trend: '8 hoje' },
              ].map((stat) => (
                <Card key={stat.label} variant="elevated" padding="md" interactive>
                  <div className="flex items-start justify-between">
                    <div>
                      <Text size="xs" muted>{stat.label}</Text>
                      <p className="serif-display text-3xl text-text mt-1">{stat.value}</p>
                      <Text size="xs" className="text-success mt-2">{stat.trend}</Text>
                    </div>
                    <div className="w-10 h-10 bg-gold/10 flex items-center justify-center">
                      <stat.icon size={20} className="text-gold" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </Reveal>
      </Section>

      {/* ━━━ SPEC COMPARISON ━━━ */}
      <Section id="comparison" label="09 — COMPARAÇÃO" title="Artesanal vs Minimal" subtitle="Dois idiomas visuais, uma mesma plataforma. Compare as características de cada spec.">
        <Reveal>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card variant={spec === 'artesanal' ? 'elevated' : 'default'} padding="lg">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Heading level={4}>Artesanal</Heading>
                  {spec === 'artesanal' && <Badge variant="gold">Ativo</Badge>}
                </div>
                <Divider />
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Text size="sm" muted>Display</Text>
                    <Text size="sm" className="font-medium">Fraunces</Text>
                  </div>
                  <div className="flex justify-between">
                    <Text size="sm" muted>Body</Text>
                    <Text size="sm" className="font-medium">DM Sans</Text>
                  </div>
                  <div className="flex justify-between">
                    <Text size="sm" muted>Mono</Text>
                    <Text size="sm" className="font-medium">DM Mono</Text>
                  </div>
                  <div className="flex justify-between">
                    <Text size="sm" muted>Accent</Text>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#b8873a' }} />
                      <Text size="sm" className="font-medium">Gold #b8873a</Text>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <Text size="sm" muted>Paletas</Text>
                    <Text size="sm" className="font-medium">Light, Dark, Rust</Text>
                  </div>
                  <div className="flex justify-between">
                    <Text size="sm" muted>Personalidade</Text>
                    <Text size="sm" className="font-medium">Editorial, luxury</Text>
                  </div>
                </div>
                {spec !== 'artesanal' && (
                  <Button variant="ghost" size="sm" className="w-full mt-4" onClick={() => setSpec('artesanal')}>
                    Ativar Artesanal
                  </Button>
                )}
              </div>
            </Card>

            <Card variant={spec === 'minimal' ? 'elevated' : 'default'} padding="lg">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Heading level={4}>Minimal</Heading>
                  {spec === 'minimal' && <Badge variant="gold">Ativo</Badge>}
                </div>
                <Divider />
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Text size="sm" muted>Display</Text>
                    <Text size="sm" className="font-medium">Space Grotesk</Text>
                  </div>
                  <div className="flex justify-between">
                    <Text size="sm" muted>Body</Text>
                    <Text size="sm" className="font-medium">Space Grotesk</Text>
                  </div>
                  <div className="flex justify-between">
                    <Text size="sm" muted>Mono</Text>
                    <Text size="sm" className="font-medium">JetBrains Mono</Text>
                  </div>
                  <div className="flex justify-between">
                    <Text size="sm" muted>Accent</Text>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#2563eb' }} />
                      <Text size="sm" className="font-medium">Blue #2563eb</Text>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <Text size="sm" muted>Paletas</Text>
                    <Text size="sm" className="font-medium">Light, Dark</Text>
                  </div>
                  <div className="flex justify-between">
                    <Text size="sm" muted>Personalidade</Text>
                    <Text size="sm" className="font-medium">Clean, tecnológico</Text>
                  </div>
                </div>
                {spec !== 'minimal' && (
                  <Button variant="ghost" size="sm" className="w-full mt-4" onClick={() => setSpec('minimal')}>
                    Ativar Minimal
                  </Button>
                )}
              </div>
            </Card>
          </div>
        </Reveal>
      </Section>

      {/* ━━━ FOOTER ━━━ */}
      <Reveal>
        <div className="text-center py-16 space-y-4">
          <Label variant="gold">STOA DESIGN SYSTEM</Label>
          <Text muted>
            Spec <span className="text-gold font-medium">{SPEC_LABELS[spec]}</span> · Paleta <span className="text-gold font-medium">{palette}</span>
          </Text>
          <Text size="xs" muted>Zero mudanças em componentes — a mágica está nas CSS variables.</Text>
        </div>
      </Reveal>
    </PageTransition>
  );
}
