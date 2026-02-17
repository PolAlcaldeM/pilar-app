import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (isSignup) {
      if (!name.trim()) {
        setError('Introduce tu nombre');
        setLoading(false);
        return;
      }
      const { error: err } = await signup(email, password, name.trim());
      if (err) {
        setError(err);
      } else {
        navigate('/home');
      }
    } else {
      const { error: err } = await login(email, password);
      if (err) {
        setError(err);
      } else {
        navigate('/home');
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-sm"
      >
        <div className="flex flex-col items-center mb-10">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="w-20 h-20 rounded-3xl gradient-warm flex items-center justify-center mb-4 shadow-float"
          >
            <Heart size={36} className="text-foreground" />
          </motion.div>
          <h1 className="text-4xl font-bold text-foreground">Pilar</h1>
          <p className="text-muted-foreground mt-2 text-center text-sm">
            Construyan su amor con propósito
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {isSignup && (
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre"
              className="w-full h-14 px-5 rounded-2xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all text-base"
              maxLength={50}
            />
          )}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            className="w-full h-14 px-5 rounded-2xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all text-base"
            required
            maxLength={255}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
            className="w-full h-14 px-5 rounded-2xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all text-base"
            required
            minLength={6}
          />

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-destructive text-sm text-center"
            >
              {error}
            </motion.p>
          )}

          <motion.button
            type="submit"
            whileTap={{ scale: 0.97 }}
            disabled={loading}
            className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-semibold text-base shadow-float hover:brightness-105 transition-all disabled:opacity-50"
          >
            {loading ? '...' : isSignup ? 'Crear cuenta' : 'Entrar'}
          </motion.button>
        </form>

        <button
          onClick={() => { setIsSignup(!isSignup); setError(''); }}
          className="w-full text-center mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {isSignup ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
        </button>
      </motion.div>
    </div>
  );
};

export default Login;
