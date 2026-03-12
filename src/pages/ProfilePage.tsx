import { useState, useEffect, useCallback } from 'react';
import { Share2, Check, X } from 'lucide-react';
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
import { useAuth } from '../hooks/useAuth';
import * as api from '../services/api';

type FeedbackState = { type: 'success' | 'error'; message: string } | null;

export default function ProfilePage() {
  const { user, updateUser } = useAuth();

  // Profile form state
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>(null);

  // Password form state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<FeedbackState>(null);

  // Load profile from API
  useEffect(() => {
    api.getProfile()
      .then((profile) => {
        setName(profile.name || '');
        setRole(profile.role || '');
        setBio(profile.bio || '');
      })
      .catch(() => {
        // Fallback to auth context user
        if (user) {
          setName(user.name || '');
          setRole(user.role || '');
        }
      })
      .finally(() => setLoading(false));
  }, [user]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setFeedback(null);
    try {
      const updated = await api.updateProfile({ name, bio });
      updateUser({ name: updated.name, avatar: updated.avatar || '' });
      setFeedback({ type: 'success', message: 'Perfil atualizado com sucesso!' });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Erro ao salvar perfil.' });
    } finally {
      setSaving(false);
    }
  }, [name, bio, updateUser]);

  const handleChangePassword = useCallback(async () => {
    setPasswordFeedback(null);

    if (newPassword !== confirmPassword) {
      setPasswordFeedback({ type: 'error', message: 'As senhas não coincidem.' });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordFeedback({ type: 'error', message: 'A nova senha deve ter pelo menos 6 caracteres.' });
      return;
    }

    setSavingPassword(true);
    try {
      await api.changePassword(currentPassword, newPassword);
      setPasswordFeedback({ type: 'success', message: 'Senha alterada com sucesso!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setPasswordFeedback(null);
        setShowPasswordForm(false);
      }, 2000);
    } catch (err: any) {
      setPasswordFeedback({ type: 'error', message: err.message || 'Erro ao alterar senha.' });
    } finally {
      setSavingPassword(false);
    }
  }, [currentPassword, newPassword, confirmPassword]);

  return (
    <PageTransition id="profile" className="max-w-4xl mx-auto space-y-12">
      <PageHeader
        title="Meu Perfil"
        label="Configurações de Conta"
        actions={
          <Button size="md" onClick={handleSave} loading={saving} disabled={loading}>
            Salvar Alterações
          </Button>
        }
      />

      {feedback && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm ${
          feedback.type === 'success'
            ? 'bg-green-900/20 text-green-400 border border-green-800'
            : 'bg-red-900/20 text-red-400 border border-red-800'
        }`}>
          {feedback.type === 'success' ? <Check size={16} /> : <X size={16} />}
          {feedback.message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-1 space-y-8">
          <Card variant="default" padding="md" className="text-center">
            <div className="relative inline-block mb-6">
              <Avatar name={name || user?.name || ''} size="2xl" className="border-2 border-gold" />
              <button className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-gold text-paper flex items-center justify-center border-4 border-surface hover:scale-110 transition-transform">
                <Share2 size={16} />
              </button>
            </div>
            <Heading level={4}>{name || user?.name || ''}</Heading>
            <Label className="mt-1">{role || user?.role || ''}</Label>
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
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                />
              </FormGroup>
              <FormGroup label="Título Profissional">
                <Input
                  type="text"
                  value={role}
                  disabled
                />
              </FormGroup>
            </div>

            <FormGroup label="Biografia Curta">
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="h-32"
                disabled={loading}
              />
            </FormGroup>

            <FormGroup label="Website / Portfólio">
              <div className="flex">
                <div className="bg-surface px-4 py-3 border border-r-0 border-line text-warm-gray text-sm flex items-center">https://</div>
                <Input type="text" defaultValue="" className="flex-1" disabled />
              </div>
            </FormGroup>
          </Card>

          <Card variant="default" padding="lg" className="space-y-6">
            <Heading level={4}>Segurança e Acesso</Heading>
            <div className="flex items-center justify-between py-4 border-b border-line">
              <div>
                <p className="text-sm font-bold">Alterar Senha</p>
                <p className="text-xs text-warm-gray">Atualize sua senha de acesso</p>
              </div>
              <Button
                variant="link"
                className="text-xs"
                onClick={() => {
                  setShowPasswordForm(!showPasswordForm);
                  setPasswordFeedback(null);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
              >
                {showPasswordForm ? 'Cancelar' : 'Atualizar'}
              </Button>
            </div>

            {showPasswordForm && (
              <div className="space-y-4 pt-2">
                {passwordFeedback && (
                  <div className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm ${
                    passwordFeedback.type === 'success'
                      ? 'bg-green-900/20 text-green-400 border border-green-800'
                      : 'bg-red-900/20 text-red-400 border border-red-800'
                  }`}>
                    {passwordFeedback.type === 'success' ? <Check size={16} /> : <X size={16} />}
                    {passwordFeedback.message}
                  </div>
                )}
                <FormGroup label="Senha Atual">
                  <Input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Digite sua senha atual"
                  />
                </FormGroup>
                <FormGroup label="Nova Senha">
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                  />
                </FormGroup>
                <FormGroup label="Confirmar Nova Senha">
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita a nova senha"
                  />
                </FormGroup>
                <Button
                  size="md"
                  onClick={handleChangePassword}
                  loading={savingPassword}
                  disabled={!currentPassword || !newPassword || !confirmPassword}
                >
                  Alterar Senha
                </Button>
              </div>
            )}

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
