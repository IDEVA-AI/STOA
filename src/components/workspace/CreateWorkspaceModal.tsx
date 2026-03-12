import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { Button, Input, FormGroup } from '../ui';
import * as api from '@/src/services/api';
import { useWorkspace } from '@/src/hooks/useWorkspace';

interface CreateWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function CreateWorkspaceModal({ isOpen, onClose }: CreateWorkspaceModalProps) {
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

  useEffect(() => {
    if (isOpen) {
      setName('');
      setSlug('');
      setLogo('');
      setSlugEdited(false);
      setError('');
      setLoading(false);
    }
  }, [isOpen]);

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
      // Select the newly created workspace
      const workspaces = await api.getMyWorkspaces();
      const created = workspaces.find((w) => w.id === result.id);
      if (created) {
        setActiveWorkspace(created);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Falha ao criar workspace.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-md bg-surface border border-line rounded shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-line">
              <h2 className="font-serif text-xl font-bold">Criar Workspace</h2>
              <button
                onClick={onClose}
                className="text-warm-gray hover:text-text transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {error && (
              <div className="mx-6 mt-4 p-3 rounded bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <FormGroup label="Nome do Workspace">
                <Input
                  type="text"
                  required
                  placeholder="Meu Workspace"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                />
              </FormGroup>

              <FormGroup label="Slug">
                <Input
                  type="text"
                  required
                  placeholder="meu-workspace"
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

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="ghost" type="button" onClick={onClose} disabled={loading}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Criando...' : 'Criar'}
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
