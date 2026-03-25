import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Navigate, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

function parseLockMessage(message) {
  const iso = message?.match(/until\s(.+)$/)?.[1];
  if (!iso) return null;
  return new Date(iso);
}

export default function Login() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get('next') || '/predict';
  const { isAuthenticated, login } = useAuthStore();
  const [form, setForm] = useState({ username: '', password: '', rememberMe: true });
  const [error, setError] = useState('');
  const [lockedUntil, setLockedUntil] = useState(null);
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    if (!lockedUntil) { setCountdown(''); return undefined; }
    const tick = () => {
      const seconds = Math.max(0, Math.floor((lockedUntil.getTime() - Date.now()) / 1000));
      const minutes = Math.floor(seconds / 60);
      setCountdown(`${minutes}m ${seconds % 60}s`);
    };
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [lockedUntil]);

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: () => { toast.success('Login successful'); navigate(next, { replace: true }); },
    onError: (err) => {
      const message = err?.response?.data?.message ?? 'Login failed';
      setError(message);
      setLockedUntil(parseLockMessage(message));
    },
  });

  if (isAuthenticated) return <Navigate to={next} replace />;

  return (
    <div className="flex items-center justify-center py-8 lg:py-16">
      <div className="w-full max-w-xl rounded-xl bg-surface-container-lowest p-8 shadow-cloud md:p-10">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-fixed text-primary">
            <span className="material-symbols-outlined text-3xl">shield</span>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">System Account</p>
            <h2 className="mt-2 font-headline text-3xl font-extrabold tracking-tight">Welcome Back</h2>
            <p className="mt-2 text-sm text-on-surface-variant">Sign in to access full diagnostic features. Guest mode is available for preview.</p>
          </div>
        </div>
        <div className="mt-8 space-y-4">
          <input className="field" placeholder="Username" value={form.username} onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))} />
          <input className="field" placeholder="Password" type="password" value={form.password} onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))} />
          <label className="flex items-center gap-3 text-sm text-on-surface-variant">
            <input type="checkbox" checked={form.rememberMe} onChange={(e) => setForm((prev) => ({ ...prev, rememberMe: e.target.checked }))} />
            Remember me on this browser
          </label>
          {error ? <p className="rounded-xl bg-error-container px-4 py-3 text-sm font-medium text-error">{error}</p> : null}
          {countdown ? <p className="text-sm font-semibold text-amber-700">Account temporarily locked: {countdown}</p> : null}
          <div className="flex flex-col gap-3 md:flex-row">
            <button
              className="btn-primary flex-1"
              disabled={mutation.isPending}
              onClick={() => {
                if (!form.username || !form.password) { setError('Please enter both username and password'); return; }
                setError('');
                mutation.mutate(form);
              }}
            >
              {mutation.isPending ? 'Signing in...' : 'Sign In'}
            </button>
            <button className="btn-secondary flex-1" onClick={() => navigate('/predict')}>
              Continue as Guest
            </button>
          </div>
          <p className="text-sm text-on-surface-variant">
            Don&apos;t have an account? <Link className="font-semibold text-primary" to={`/register?next=${encodeURIComponent(next)}`}>Register now</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
