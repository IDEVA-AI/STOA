import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { KeyRound, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button, Input, FormGroup } from '../components/ui';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (password !== confirm) {
      setError('As senhas nao coincidem.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao redefinir senha.');
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Erro ao redefinir senha.');
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg p-6">
        <div className="card-editorial max-w-md w-full p-6 sm:p-8 bg-surface text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
            <AlertTriangle size={28} className="text-red-500" />
          </div>
          <h2 className="font-serif text-3xl font-black">Link Invalido</h2>
          <p className="text-warm-gray text-sm">Este link de redefinicao de senha e invalido.</p>
          <Button onClick={() => navigate('/login')} fullWidth size="lg">Ir para Login</Button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg p-6">
        <div className="card-editorial max-w-md w-full p-6 sm:p-8 bg-surface text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
            <CheckCircle size={28} className="text-green-500" />
          </div>
          <h2 className="font-serif text-3xl font-black">Senha Redefinida</h2>
          <p className="text-warm-gray text-sm">Sua senha foi alterada com sucesso.</p>
          <Button onClick={() => navigate('/login')} fullWidth size="lg">Fazer Login</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-6">
      <div className="card-editorial max-w-md w-full p-6 sm:p-8 bg-surface space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center mx-auto">
            <KeyRound size={28} className="text-gold" />
          </div>
          <h2 className="font-serif text-3xl font-black">Nova Senha</h2>
          <p className="text-warm-gray text-sm">Digite sua nova senha abaixo.</p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
            {error}
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <FormGroup label="Nova Senha">
            <Input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </FormGroup>
          <FormGroup label="Confirmar Senha">
            <Input
              type="password"
              required
              placeholder="••••••••"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              disabled={loading}
            />
          </FormGroup>
          <Button type="submit" fullWidth size="lg" disabled={loading}>
            {loading ? 'Redefinindo...' : 'Redefinir Senha'}
          </Button>
        </form>
      </div>
    </div>
  );
}
