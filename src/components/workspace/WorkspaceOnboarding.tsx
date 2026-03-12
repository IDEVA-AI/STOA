import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Button, Input, FormGroup } from '../ui';
import * as api from '@/src/services/api';
import { useWorkspace } from '@/src/hooks/useWorkspace';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function WorkspaceOnboarding() {
  const { refreshWorkspaces, setActiveWorkspace } = useWorkspace();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [logo, setLogo] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!slugEdited) {
      setSlug(slugify(name));
    }
  }, [name, slugEdited]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Nome e obrigatorio.');
      return;
    }
    if (!slug.trim()) {
      setError('Slug e obrigatorio.');
      return;
    }

    setLoading(true);
    try {
      const result = await api.createWorkspace({
        name: name.trim(),
        slug: slug.trim(),
        logo: logo.trim() || undefined,
      });
      await refreshWorkspaces();
      const workspaces = await api.getMyWorkspaces();
      const created = workspaces.find((w) => w.id === result.id);
      if (created) {
        setActiveWorkspace(created);
      }
    } catch (err: any) {
      setError(err.message || 'Falha ao criar workspace.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg transition-colors duration-500 p-6">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 card-editorial overflow-hidden bg-surface transition-colors duration-500">
        {/* Left Side: Brand */}
        <div className="hidden lg:flex flex-col justify-between p-16 bg-text text-bg transition-colors duration-500 relative overflow-hidden">
          <div className="relative z-10">
            <span className="font-serif font-black text-3xl tracking-tight">STOA</span>
            <p className="mono-label text-gold mt-2">Plataforma de Conhecimento</p>
          </div>

          <div className="relative z-10">
            <h1 className="font-serif text-5xl font-black leading-[0.9] mb-8">
              Bem-vindo ao STOA!
            </h1>
            <p className="text-paper/60 text-lg font-light max-w-sm">
              Crie seu primeiro workspace para comecar a organizar seus cursos, comunidades e equipe.
            </p>
          </div>

          <div className="absolute -bottom-20 -right-20 w-96 h-96 border border-gold/20 rounded-full" />
          <div className="absolute -bottom-10 -right-10 w-96 h-96 border border-gold/10 rounded-full" />
        </div>

        {/* Right Side: Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="p-12 lg:p-20 flex flex-col justify-center"
        >
          <div className="mb-10">
            <h2 className="font-serif text-4xl font-black mb-2">
              Crie seu Workspace
            </h2>
            <p className="text-warm-gray text-sm">
              Um workspace e o espaco onde voce gerencia cursos, membros e comunidades.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <FormGroup label="Nome do Workspace">
              <Input
                type="text"
                required
                placeholder="Minha Escola"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
              />
            </FormGroup>

            <FormGroup label="Slug">
              <Input
                type="text"
                required
                placeholder="minha-escola"
                value={slug}
                onChange={(e) => {
                  setSlug(slugify(e.target.value));
                  setSlugEdited(true);
                }}
                disabled={loading}
              />
              <p className="text-[10px] text-warm-gray mt-1">
                Identificador unico. Apenas letras minusculas e hifens.
              </p>
            </FormGroup>

            <FormGroup label="Logo URL (opcional)">
              <Input
                type="url"
                placeholder="https://exemplo.com/logo.png"
                value={logo}
                onChange={(e) => setLogo(e.target.value)}
                disabled={loading}
              />
            </FormGroup>

            <Button type="submit" fullWidth size="lg" className="mt-4" disabled={loading}>
              {loading ? 'Criando...' : 'Criar Workspace'}
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
