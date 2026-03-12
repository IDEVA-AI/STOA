import { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { MoreHorizontal, UserPlus, Shield, UserX, Loader2 } from 'lucide-react';
import {
  Card, CardBody, Button, Avatar, Badge, StatCard,
} from '../ui';
import { Heading, Label, Text } from '../ui/Typography';
import { listItem } from '@/src/lib/motion';
import { getAdminUsers, updateUser, deleteUser, type AdminUser } from '@/src/services/api';

const roleBadge: Record<string, 'gold' | 'success' | 'muted' | 'default'> = {
  'admin': 'gold',
  'moderator': 'success',
  'member': 'muted',
};

const roleOptions = ['admin', 'moderator', 'member'];

export default function AdminUnlocks() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMenuId, setActionMenuId] = useState<number | null>(null);
  const [changingRoleId, setChangingRoleId] = useState<number | null>(null);

  const loadUsers = useCallback(async () => {
    try {
      const data = await getAdminUsers();
      setUsers(data);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      await updateUser(userId, { role: newRole });
      setChangingRoleId(null);
      setActionMenuId(null);
      loadUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeactivate = async (userId: number) => {
    if (!confirm('Desativar este usuario?')) return;
    try {
      await deleteUser(userId);
      setActionMenuId(null);
      loadUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReactivate = async (userId: number) => {
    try {
      await updateUser(userId, { is_active: 1 });
      setActionMenuId(null);
      loadUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const activeUsers = users.filter((u) => u.is_active === 1);
  const inactiveUsers = users.filter((u) => u.is_active === 0);

  const stats = [
    { label: 'Total de Membros', value: String(users.length), trend: '' },
    { label: 'Membros Ativos', value: String(activeUsers.length), trend: '' },
    { label: 'Inativos', value: String(inactiveUsers.length), trend: '' },
  ];

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
        {stats.map((stat, i) => (
          <motion.div key={stat.label} {...listItem(i)}>
            <StatCard label={stat.label} value={stat.value} trend={stat.trend || undefined} />
          </motion.div>
        ))}
      </div>

      {/* Members Table */}
      <Card variant="elevated">
        <div className="p-10 border-b border-line flex justify-between items-center">
          <Heading level={3}>Membros da Plataforma</Heading>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-line">
                <th className="text-left p-6"><Label>Membro</Label></th>
                <th className="text-left p-6"><Label>Role</Label></th>
                <th className="text-left p-6"><Label>Status</Label></th>
                <th className="text-left p-6"><Label>Criado em</Label></th>
                <th className="text-right p-6"><Label>Acoes</Label></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {users.map((member, i) => (
                <motion.tr
                  key={member.id}
                  {...listItem(i)}
                  className="hover:bg-bg/30 transition-all"
                >
                  <td className="p-6">
                    <div className="flex items-center gap-4">
                      <Avatar name={member.name || member.email} size="sm" />
                      <div>
                        <span className="font-bold text-sm">{member.name || 'Sem nome'}</span>
                        <Text size="xs" muted className="block">{member.email}</Text>
                      </div>
                    </div>
                  </td>
                  <td className="p-6">
                    {changingRoleId === member.id ? (
                      <div className="flex items-center gap-2">
                        {roleOptions.map((role) => (
                          <button
                            key={role}
                            onClick={() => handleRoleChange(member.id, role)}
                            className={`px-3 py-1 text-xs rounded border transition-colors ${
                              member.role === role
                                ? 'border-gold text-gold'
                                : 'border-line text-warm-gray hover:border-gold/50'
                            }`}
                          >
                            {role}
                          </button>
                        ))}
                        <button
                          onClick={() => setChangingRoleId(null)}
                          className="text-xs text-warm-gray/50 hover:text-warm-gray ml-2"
                        >
                          cancelar
                        </button>
                      </div>
                    ) : (
                      <Badge variant={roleBadge[member.role] ?? 'muted'}>{member.role || 'member'}</Badge>
                    )}
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${member.is_active ? 'bg-emerald-500' : 'bg-warm-gray/30'}`} />
                      <Text size="xs" muted>{member.is_active ? 'Ativo' : 'Inativo'}</Text>
                    </div>
                  </td>
                  <td className="p-6">
                    <Text size="xs" muted>
                      {member.created_at ? new Date(member.created_at).toLocaleDateString('pt-BR') : '-'}
                    </Text>
                  </td>
                  <td className="p-6 text-right relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      iconOnly
                      icon={<MoreHorizontal size={14} />}
                      onClick={() => setActionMenuId(actionMenuId === member.id ? null : member.id)}
                    />
                    {actionMenuId === member.id && (
                      <div className="absolute right-6 top-12 z-10 bg-surface border border-line rounded-lg shadow-xl py-2 min-w-[180px]">
                        <button
                          className="w-full px-4 py-2 text-left text-sm hover:bg-bg/30 transition-colors flex items-center gap-3"
                          onClick={() => {
                            setChangingRoleId(member.id);
                            setActionMenuId(null);
                          }}
                        >
                          <Shield size={14} />
                          Alterar Role
                        </button>
                        {member.is_active ? (
                          <button
                            className="w-full px-4 py-2 text-left text-sm hover:bg-bg/30 transition-colors flex items-center gap-3 text-red-400"
                            onClick={() => handleDeactivate(member.id)}
                          >
                            <UserX size={14} />
                            Desativar
                          </button>
                        ) : (
                          <button
                            className="w-full px-4 py-2 text-left text-sm hover:bg-bg/30 transition-colors flex items-center gap-3 text-emerald-400"
                            onClick={() => handleReactivate(member.id)}
                          >
                            <UserPlus size={14} />
                            Reativar
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
