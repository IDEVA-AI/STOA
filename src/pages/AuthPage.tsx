import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2, AlertTriangle } from 'lucide-react';
import type { AuthMode, InviteInfo } from '../types';
import { Button, Input, FormGroup } from '../components/ui';
import * as api from '../services/api';

interface AuthPageProps {
  authMode: AuthMode;
  setAuthMode: (mode: AuthMode) => void;
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister: (name: string, email: string, password: string, phone?: string, inviteCode?: string) => Promise<void>;
}

export default function AuthPage({ authMode, setAuthMode, onLogin, onRegister }: AuthPageProps) {
  const [searchParams] = useSearchParams();
  const inviteCode = searchParams.get('invite') || undefined;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Invite validation state
  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [inviteLoading, setInviteLoading] = useState(!!inviteCode);

  // Validate invite on mount
  useEffect(() => {
    if (!inviteCode) return;
    setInviteLoading(true);
    setAuthMode('register');
    api.validateInvite(inviteCode)
      .then((info) => {
        setInviteInfo(info);
        if (!info.valid) {
          setError(info.reason || 'Convite invalido.');
        }
      })
      .catch(() => {
        setInviteInfo({ valid: false, reason: 'Erro ao validar convite.' });
      })
      .finally(() => setInviteLoading(false));
  }, [inviteCode, setAuthMode]);

  function validate(): string | null {
    if (authMode === 'register' && name.trim().length < 2) {
      return 'Nome deve ter pelo menos 2 caracteres.';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return 'E-mail invalido.';
    }
    if (password.length < 6) {
      return 'Senha deve ter pelo menos 6 caracteres.';
    }
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      if (authMode === 'login') {
        await onLogin(email, password);
      } else {
        await onRegister(
          name,
          email,
          password,
          phone.trim() || undefined,
          inviteCode,
        );
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  // Loading state while validating invite
  if (inviteLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-gold" size={32} />
          <p className="mono-label text-warm-gray text-sm">Validando convite...</p>
        </div>
      </div>
    );
  }

  // Invalid invite: full-screen error
  if (inviteCode && inviteInfo && !inviteInfo.valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg p-6">
        <div className="card-editorial max-w-md w-full p-12 bg-surface text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
            <AlertTriangle size={28} className="text-red-500" />
          </div>
          <h2 className="font-serif text-3xl font-black">Convite Invalido</h2>
          <p className="text-warm-gray text-sm">
            {inviteInfo.reason || 'Este convite nao e valido ou ja expirou.'}
          </p>
          <Button
            onClick={() => window.location.href = '/login'}
            fullWidth
            size="lg"
          >
            Ir para Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg transition-colors duration-500 p-6">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 card-editorial overflow-hidden bg-surface transition-colors duration-500">
        {/* Left Side: Brand/Visual */}
        <div className="hidden lg:flex flex-col justify-between p-16 bg-text text-bg transition-colors duration-500 relative overflow-hidden">
          <div className="relative z-10">
            <span className="font-serif font-black text-3xl tracking-tight">Julio Carvalho</span>
            <p className="mono-label text-gold mt-2">Arquiteto de Sistemas</p>
          </div>

          <div className="relative z-10">
            <h1 className="font-serif text-6xl font-black leading-[0.9] mb-8">A estrutura precede o sucesso.</h1>
            <p className="text-paper/60 text-lg font-light max-w-sm">
              Entre na plataforma exclusiva para arquitetos de sistemas organizacionais e lideres de elite.
            </p>
          </div>

          {/* Abstract Decorative Element */}
          <div className="absolute -bottom-20 -right-20 w-96 h-96 border border-gold/20 rounded-full" />
          <div className="absolute -bottom-10 -right-10 w-96 h-96 border border-gold/10 rounded-full" />
        </div>

        {/* Right Side: Form */}
        <div className="p-6 sm:p-12 lg:p-20 flex flex-col justify-center">
          <div className="mb-12">
            <h2 className="font-serif text-2xl sm:text-4xl font-black mb-2">
              {authMode === 'login' ? 'Bem-vindo de volta' : 'Crie sua conta'}
            </h2>
            <p className="text-warm-gray text-sm">
              {authMode === 'login'
                ? 'Acesse seu painel de controle e continue sua jornada.'
                : inviteCode
                  ? 'Preencha seus dados para acessar a plataforma.'
                  : 'Inicie sua transformacao como arquiteto de sistemas.'}
            </p>
          </div>

          {/* Invite badge */}
          {inviteCode && inviteInfo?.valid && inviteInfo.workspace && (
            <div className="mb-6 p-4 rounded-lg border border-gold/30 bg-gold/5">
              <p className="mono-label text-gold text-[10px] tracking-widest uppercase mb-1">Convite para</p>
              <p className="font-serif font-bold text-lg">{inviteInfo.workspace.name}</p>
            </div>
          )}

          {error && (
            <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {authMode === 'register' && (
              <FormGroup label="Nome Completo">
                <Input
                  type="text"
                  required
                  placeholder="Seu nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                />
              </FormGroup>
            )}
            <FormGroup label="Endereco de E-mail">
              <Input
                type="email"
                required
                placeholder="exemplo@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </FormGroup>
            <FormGroup
              label="Senha"
              labelAction={
                authMode === 'login' ? (
                  <button type="button" className="text-[10px] mono-label text-gold hover:underline">Esqueceu a senha?</button>
                ) : undefined
              }
            >
              <Input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </FormGroup>

            {/* Phone field: only shown in register mode with invite */}
            {authMode === 'register' && inviteCode && (
              <FormGroup label="WhatsApp (opcional)">
                <Input
                  type="tel"
                  placeholder="(11) 99999-9999"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={loading}
                />
              </FormGroup>
            )}

            <Button type="submit" fullWidth size="lg" className="mt-4" disabled={loading}>
              {loading
                ? 'Carregando...'
                : authMode === 'login'
                  ? 'Entrar no Sistema'
                  : 'Finalizar Cadastro'}
            </Button>
          </form>

          <div className="mt-12 pt-8 border-t border-line text-center">
            {inviteCode ? (
              <p className="text-sm text-warm-gray">
                Ja possui uma conta?
                <Button
                  variant="link"
                  onClick={() => window.location.href = '/login'}
                  className="ml-2 font-bold text-text hover:text-gold"
                >
                  Fazer Login
                </Button>
              </p>
            ) : (
              <p className="text-sm text-warm-gray">
                {authMode === 'login' ? 'Ainda nao e membro?' : 'Ja possui uma conta?'}
                <Button
                  variant="link"
                  onClick={() => {
                    setAuthMode(authMode === 'login' ? 'register' : 'login');
                    setError('');
                  }}
                  className="ml-2 font-bold text-text hover:text-gold"
                >
                  {authMode === 'login' ? 'Solicitar Acesso' : 'Fazer Login'}
                </Button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
