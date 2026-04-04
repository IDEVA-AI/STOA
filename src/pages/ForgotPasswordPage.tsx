import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import { Button, Input, FormGroup } from '../components/ui';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('E-mail invalido.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();

      if (data.token) {
        // Email found — redirect to reset page with token
        navigate(`/reset-password?token=${data.token}`);
      } else {
        setError('E-mail nao encontrado. Verifique e tente novamente.');
      }
    } catch {
      setError('Erro ao processar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-6">
      <div className="card-editorial max-w-md w-full p-6 sm:p-8 bg-surface space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center mx-auto">
            <Mail size={28} className="text-gold" />
          </div>
          <h2 className="font-serif text-3xl font-black">Esqueceu a Senha?</h2>
          <p className="text-warm-gray text-sm">
            Digite seu e-mail cadastrado para redefinir sua senha.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
            {error}
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <FormGroup label="E-mail">
            <Input
              type="email"
              required
              placeholder="exemplo@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              autoFocus
            />
          </FormGroup>
          <Button type="submit" fullWidth size="lg" disabled={loading}>
            {loading ? 'Verificando...' : 'Continuar'}
          </Button>
        </form>

        <div className="text-center">
          <Button
            variant="link"
            onClick={() => navigate('/login')}
            className="text-warm-gray hover:text-gold text-sm inline-flex items-center gap-1"
          >
            <ArrowLeft size={14} />
            Voltar para Login
          </Button>
        </div>
      </div>
    </div>
  );
}
