import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Copy, Trash2, Ban, Loader2, Ticket, Check } from 'lucide-react';
import {
  Card, CardBody, Button, Badge, Input, StatCard,
} from '../ui';
import { Heading, Label, Text } from '../ui/Typography';
import { listItem } from '@/src/lib/motion';
import * as api from '@/src/services/api';
import { useWorkspace } from '@/src/hooks/useWorkspace';
import type { Product } from '@/src/types';

interface Invite {
  id: number;
  code: string;
  workspace_id: number;
  product_id: number | null;
  max_uses: number | null;
  used_count: number;
  status: 'active' | 'used' | 'revoked' | 'expired';
  expires_at: string | null;
  created_at: string;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR');
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'gold' | 'muted' }> = {
  active: { label: 'Ativo', variant: 'gold' },
  used: { label: 'Esgotado', variant: 'muted' },
  revoked: { label: 'Revogado', variant: 'muted' },
  expired: { label: 'Expirado', variant: 'muted' },
};

export default function AdminInvites() {
  const { activeWorkspace } = useWorkspace();
  const workspaceId = activeWorkspace?.id;

  const [invites, setInvites] = useState<Invite[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Create form
  const [showNewInvite, setShowNewInvite] = useState(false);
  const [newProductId, setNewProductId] = useState<string>('');
  const [newMaxUses, setNewMaxUses] = useState('');
  const [newExpiresAt, setNewExpiresAt] = useState('');
  const [creating, setCreating] = useState(false);

  // Copied state
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    if (!workspaceId) return;
    try {
      const [inv, prods] = await Promise.all([
        api.getWorkspaceInvites(workspaceId),
        api.getProducts(workspaceId),
      ]);
      setInvites(inv);
      setProducts(prods);
    } catch (err) {
      console.error('Failed to load invites:', err);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    if (workspaceId) loadData();
  }, [workspaceId, loadData]);

  const handleCreate = async () => {
    if (!workspaceId) return;
    setCreating(true);
    try {
      await api.createInvite({
        workspace_id: workspaceId,
        product_id: newProductId ? Number(newProductId) : undefined,
        max_uses: newMaxUses ? Number(newMaxUses) : undefined,
        expires_at: newExpiresAt || undefined,
      });
      setShowNewInvite(false);
      setNewProductId('');
      setNewMaxUses('');
      setNewExpiresAt('');
      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (id: number) => {
    try {
      await api.revokeInvite(id);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Excluir este convite?')) return;
    try {
      await api.deleteInvite(id);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const copyLink = (invite: Invite) => {
    const link = `https://membros.jcarv.in/login?invite=${invite.code}`;
    navigator.clipboard.writeText(link);
    setCopiedId(invite.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const activeCount = invites.filter((i) => i.status === 'active').length;
  const totalRedemptions = invites.reduce((sum, i) => sum + i.used_count, 0);

  if (!workspaceId) {
    return (
      <div className="flex items-center justify-center py-20">
        <Text muted>Selecione um workspace</Text>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-gold" size={24} />
      </div>
    );
  }

  return (
    <div className="space-y-16">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <StatCard label="Total de Convites" value={String(invites.length)} />
        <StatCard label="Ativos" value={String(activeCount)} />
        <StatCard label="Resgates" value={String(totalRedemptions)} />
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-6">
        <Heading level={3}>Convites</Heading>
        <Button icon={<Plus size={16} />} onClick={() => setShowNewInvite(true)}>
          Criar Convite
        </Button>
      </div>

      {/* New Invite Form */}
      <AnimatePresence>
        {showNewInvite && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <Card variant="elevated">
              <CardBody className="space-y-4">
                <Heading level={3}>Novo Convite</Heading>

                {products.length > 0 && (
                  <div className="space-y-1">
                    <Label>Produto (opcional)</Label>
                    <select
                      value={newProductId}
                      onChange={(e) => setNewProductId(e.target.value)}
                      className="w-full h-10 px-4 bg-surface border border-line text-sm focus:outline-none focus:border-gold transition-colors"
                    >
                      <option value="">Nenhum (acesso geral)</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>{p.title}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Usos maximos (opcional)</Label>
                    <Input
                      type="number"
                      placeholder="Ilimitado"
                      value={newMaxUses}
                      onChange={(e) => setNewMaxUses(e.target.value)}
                      min={1}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Expira em (opcional)</Label>
                    <Input
                      type="date"
                      value={newExpiresAt}
                      onChange={(e) => setNewExpiresAt(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button onClick={handleCreate} disabled={creating}>
                    {creating ? 'Criando...' : 'Criar Convite'}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setShowNewInvite(false);
                      setNewProductId('');
                      setNewMaxUses('');
                      setNewExpiresAt('');
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </CardBody>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Invite List */}
      <div className="space-y-6">
        {invites.map((invite, i) => {
          const status = statusConfig[invite.status] || statusConfig.active;
          const product = products.find((p) => p.id === invite.product_id);

          return (
            <motion.div key={invite.id} {...listItem(i)}>
              <Card variant="elevated">
                <CardBody>
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-4">
                        <code className="font-mono text-sm bg-bg px-3 py-1 rounded border border-line select-all">
                          {invite.code}
                        </code>
                        <Badge variant={status.variant}>
                          {status.label}
                        </Badge>
                        {product && (
                          <Badge variant="default">{product.title}</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-6">
                        <Label>
                          {invite.used_count}{invite.max_uses ? `/${invite.max_uses}` : ''} usos
                        </Label>
                        {invite.expires_at && (
                          <Label className="text-warm-gray/60">
                            Expira: {formatDate(invite.expires_at)}
                          </Label>
                        )}
                        <Label className="text-warm-gray/60">
                          Criado: {formatDate(invite.created_at)}
                        </Label>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={copiedId === invite.id ? <Check size={14} /> : <Copy size={14} />}
                        onClick={() => copyLink(invite)}
                      >
                        {copiedId === invite.id ? 'Copiado' : 'Copiar Link'}
                      </Button>
                      {invite.status === 'active' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          iconOnly
                          icon={<Ban size={14} className="text-amber-500" />}
                          onClick={() => handleRevoke(invite.id)}
                          title="Revogar"
                        />
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        iconOnly
                        icon={<Trash2 size={14} className="text-red-400" />}
                        onClick={() => handleDelete(invite.id)}
                        title="Excluir"
                      />
                    </div>
                  </div>
                </CardBody>
              </Card>
            </motion.div>
          );
        })}

        {invites.length === 0 && !loading && (
          <div className="text-center py-16">
            <Ticket size={32} className="mx-auto mb-4 text-warm-gray/30" />
            <Text muted>Nenhum convite criado</Text>
          </div>
        )}
      </div>
    </div>
  );
}
