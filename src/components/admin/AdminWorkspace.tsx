import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Save, Trash2, UserPlus, ChevronDown } from 'lucide-react';
import { Button, Input, FormGroup, Badge, Avatar, Card, CardBody } from '../ui';
import { Heading, Label, Text } from '../ui/Typography';
import { useWorkspace } from '@/src/hooks/useWorkspace';
import * as api from '@/src/services/api';
import type { WorkspaceMember } from '@/src/types';

// ── Section A: Workspace Info ──────────────────────────────────────────

function WorkspaceInfo() {
  const { activeWorkspace, refreshWorkspaces } = useWorkspace();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [logo, setLogo] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (activeWorkspace) {
      setName(activeWorkspace.name);
      setSlug(activeWorkspace.slug);
      setLogo(activeWorkspace.logo || '');
    }
  }, [activeWorkspace]);

  async function handleSave() {
    if (!activeWorkspace) return;
    setError('');
    setSuccess(false);
    setSaving(true);
    try {
      await api.updateWorkspace(activeWorkspace.id, {
        name: name.trim(),
        slug: slug.trim(),
        logo: logo.trim() || undefined,
      });
      await refreshWorkspaces();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Falha ao salvar.');
    } finally {
      setSaving(false);
    }
  }

  if (!activeWorkspace) {
    return (
      <Card>
        <CardBody>
          <Text className="text-warm-gray">Nenhum workspace selecionado.</Text>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardBody className="space-y-6">
        <div className="flex items-center justify-between mb-2">
          <Heading level={3}>Informacoes do Workspace</Heading>
          <Badge variant="gold">{activeWorkspace.plan}</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormGroup label="Nome">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={saving}
            />
          </FormGroup>

          <FormGroup label="Slug">
            <Input
              value={slug}
              onChange={(e) =>
                setSlug(
                  e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9-]/g, '-')
                    .replace(/--+/g, '-')
                )
              }
              disabled={saving}
            />
          </FormGroup>
        </div>

        <FormGroup label="Logo URL">
          <Input
            type="url"
            placeholder="https://exemplo.com/logo.png"
            value={logo}
            onChange={(e) => setLogo(e.target.value)}
            disabled={saving}
          />
        </FormGroup>

        <div className="flex items-center gap-4">
          <Label className="text-warm-gray">Criado em:</Label>
          <Text className="text-sm">
            {new Date(activeWorkspace.created_at).toLocaleDateString('pt-BR')}
          </Text>
        </div>

        {error && (
          <div className="p-3 rounded bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="p-3 rounded bg-green-500/10 border border-green-500/20 text-green-500 text-sm">
            Workspace atualizado com sucesso.
          </div>
        )}

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            <Save size={16} className="mr-2" />
            {saving ? 'Salvando...' : 'Salvar Alteracoes'}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

// ── Section B: Team Members ────────────────────────────────────────────

const ROLES = ['owner', 'admin', 'member'] as const;

function roleBadgeVariant(role: string): 'gold' | 'default' | 'outline' {
  if (role === 'owner') return 'gold';
  if (role === 'admin') return 'default';
  return 'outline';
}

function TeamMembers() {
  const { activeWorkspace } = useWorkspace();
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Add member state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUserId, setNewUserId] = useState('');
  const [addingMember, setAddingMember] = useState(false);

  // Role dropdown state
  const [roleDropdownId, setRoleDropdownId] = useState<number | null>(null);

  // Confirm delete state
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const fetchMembers = useCallback(async () => {
    if (!activeWorkspace) return;
    setLoading(true);
    try {
      const data = await api.getWorkspaceMembers(activeWorkspace.id);
      setMembers(data);
    } catch {
      setError('Falha ao carregar membros.');
    } finally {
      setLoading(false);
    }
  }, [activeWorkspace]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    if (!activeWorkspace || !newUserId.trim()) return;
    setAddingMember(true);
    setError('');
    try {
      await api.addWorkspaceMember(activeWorkspace.id, Number(newUserId.trim()));
      setNewUserId('');
      setShowAddForm(false);
      await fetchMembers();
    } catch (err: any) {
      setError(err.message || 'Falha ao adicionar membro.');
    } finally {
      setAddingMember(false);
    }
  }

  async function handleRoleChange(userId: number, newRole: string) {
    if (!activeWorkspace) return;
    setError('');
    try {
      await api.updateWorkspaceMemberRole(activeWorkspace.id, userId, newRole);
      setRoleDropdownId(null);
      await fetchMembers();
    } catch (err: any) {
      setError(err.message || 'Falha ao atualizar role.');
    }
  }

  async function handleRemoveMember(userId: number) {
    if (!activeWorkspace) return;
    setError('');
    try {
      await api.removeWorkspaceMember(activeWorkspace.id, userId);
      setConfirmDeleteId(null);
      await fetchMembers();
    } catch (err: any) {
      setError(err.message || 'Falha ao remover membro.');
    }
  }

  if (!activeWorkspace) return null;

  return (
    <Card>
      <CardBody className="space-y-6">
        <div className="flex items-center justify-between">
          <Heading level={3}>Membros da Equipe</Heading>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            <UserPlus size={16} className="mr-2" />
            Adicionar Membro
          </Button>
        </div>

        <AnimatePresence>
          {showAddForm && (
            <motion.form
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
              onSubmit={handleAddMember}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3 p-4 border border-line rounded bg-bg/30">
                <FormGroup label="User ID" className="flex-1 w-full sm:w-auto">
                  <Input
                    type="number"
                    placeholder="ID do usuario"
                    value={newUserId}
                    onChange={(e) => setNewUserId(e.target.value)}
                    disabled={addingMember}
                  />
                </FormGroup>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <Button className="w-full sm:w-auto" type="submit" disabled={addingMember || !newUserId.trim()} size="sm">
                    {addingMember ? 'Adicionando...' : 'Adicionar'}
                  </Button>
                  <Button
                    className="w-full sm:w-auto"
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAddForm(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {error && (
          <div className="p-3 rounded bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-8 text-center">
            <Text className="text-warm-gray text-sm animate-pulse">Carregando membros...</Text>
          </div>
        ) : members.length === 0 ? (
          <div className="py-8 text-center">
            <Text className="text-warm-gray text-sm">Nenhum membro encontrado.</Text>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left">
                  <th className="pb-3 pr-4">
                    <Label className="text-[9px] uppercase tracking-widest">Membro</Label>
                  </th>
                  <th className="pb-3 pr-4 hidden md:table-cell">
                    <Label className="text-[9px] uppercase tracking-widest">Email</Label>
                  </th>
                  <th className="pb-3 pr-4">
                    <Label className="text-[9px] uppercase tracking-widest">Role</Label>
                  </th>
                  <th className="pb-3 pr-4 hidden sm:table-cell">
                    <Label className="text-[9px] uppercase tracking-widest">Entrada</Label>
                  </th>
                  <th className="pb-3 w-12">
                    <Label className="text-[9px] uppercase tracking-widest">Acoes</Label>
                  </th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.id} className="border-b border-line/50 last:border-0">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={member.name} src={member.avatar || undefined} size="sm" />
                        <span className="font-medium truncate max-w-[150px]">{member.name}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4 hidden md:table-cell">
                      <span className="text-warm-gray truncate">{member.email}</span>
                    </td>
                    <td className="py-3 pr-4 relative">
                      <button
                        onClick={() =>
                          setRoleDropdownId(roleDropdownId === member.user_id ? null : member.user_id)
                        }
                        className="flex items-center gap-1"
                      >
                        <Badge variant={roleBadgeVariant(member.role)}>
                          {member.role}
                        </Badge>
                        <ChevronDown size={12} className="text-warm-gray" />
                      </button>

                      <AnimatePresence>
                        {roleDropdownId === member.user_id && (
                          <motion.div
                            initial={{ opacity: 0, y: 5, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 5, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className="absolute left-0 top-full mt-1 z-20 bg-surface border border-line rounded shadow-lg py-1 min-w-[120px]"
                          >
                            {ROLES.map((role) => (
                              <button
                                key={role}
                                onClick={() => handleRoleChange(member.user_id, role)}
                                className={`w-full text-left px-4 py-2 text-sm hover:bg-bg/40 transition-colors ${
                                  member.role === role ? 'text-gold font-bold' : 'text-text'
                                }`}
                              >
                                {role}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </td>
                    <td className="py-3 pr-4 hidden sm:table-cell">
                      <span className="text-warm-gray text-xs">
                        {new Date(member.joined_at).toLocaleDateString('pt-BR')}
                      </span>
                    </td>
                    <td className="py-3">
                      {confirmDeleteId === member.user_id ? (
                        <div className="flex flex-col sm:flex-row items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveMember(member.user_id)}
                            className="text-red-500 hover:text-red-400 text-[10px] px-2"
                          >
                            Confirmar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setConfirmDeleteId(null)}
                            className="text-[10px] px-2"
                          >
                            Nao
                          </Button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(member.user_id)}
                          className="text-warm-gray hover:text-red-500 transition-colors p-1"
                          title="Remover membro"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

// ── Main AdminWorkspace ────────────────────────────────────────────────

export default function AdminWorkspace() {
  return (
    <div className="space-y-8">
      <WorkspaceInfo />
      <TeamMembers />
    </div>
  );
}
