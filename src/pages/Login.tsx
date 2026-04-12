import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { isAuthenticated, login, user } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated && user?.isAdmin) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const success = await login(email, password);
      if (success) {
        navigate('/');
      } else {
        setError('Admin access is required for this workspace.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="section-shell flex min-h-screen items-center py-10">
      <div className="grid w-full gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="glass-panel rounded-[36px] p-8 md:p-10">
          <span className="pill">
            <Sparkles className="h-3.5 w-3.5" />
            Standalone admin
          </span>
          <h1 className="section-title mt-5">Manage the store separately from the storefront</h1>
          <p className="section-copy mt-4">Products, content, and analytics now live in an independent admin app connected to the FastAPI backend.</p>
          <div className="mt-8 rounded-[28px] bg-slate-950 p-6 text-white dark:bg-slate-900">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">Default admin credentials</p>
            <div className="mt-4 space-y-2 text-sm text-slate-200">
              <p>admin@example.com</p>
              <p>admin123</p>
            </div>
          </div>
        </section>

        <section className="glass-panel rounded-[36px] p-8 md:p-10">
          <h2 className="text-3xl font-bold text-slate-950 dark:text-slate-50">Admin sign in</h2>
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {error && <div className="rounded-[24px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">{error}</div>}

            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">Email address</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required className="w-full rounded-[24px] border border-slate-200 bg-white py-3 pl-12 pr-4 text-slate-900 outline-none focus:border-cyan-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50" placeholder="admin@example.com" />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">Password</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} required className="w-full rounded-[24px] border border-slate-200 bg-white py-3 pl-12 pr-12 text-slate-900 outline-none focus:border-cyan-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50" placeholder="Enter your password" />
                <button type="button" onClick={() => setShowPassword((prev) => !prev)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="primary-button w-full disabled:cursor-not-allowed disabled:opacity-60">
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};

export default Login;
