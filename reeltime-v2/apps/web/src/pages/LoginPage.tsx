import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { ApiError, apiFetch } from '../services/api';
import { useToast } from '../components/ui/Toast';

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((s) => s.login);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  // Redirect if already authenticated
  if (isAuthenticated) {
    const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/';
    navigate(from, { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrors({
        email: !email ? 'Email requis' : undefined,
        password: !password ? 'Mot de passe requis' : undefined,
      });
      return;
    }

    setSubmitting(true);
    setErrors({});

    try {
      await login(email, password);

      // Process pending watchlist action if any
      const pendingAction = sessionStorage.getItem('pendingWatchlistAction');
      if (pendingAction) {
        try {
          const data = JSON.parse(pendingAction);
          await apiFetch('/api/v1/me/watchlist', {
            method: 'POST',
            body: JSON.stringify(data),
          });
          sessionStorage.removeItem('pendingWatchlistAction');
          showToast({ message: 'Ajoute au calendrier' });
        } catch {
          sessionStorage.removeItem('pendingWatchlistAction');
        }
      }

      const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/';
      navigate(from, { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 'INVALID_CREDENTIALS') {
          setErrors({ general: 'Email ou mot de passe incorrect' });
        } else if (err.status === 429) {
          setErrors({ general: 'Trop de tentatives, reessayez plus tard' });
        } else {
          setErrors({ general: err.message });
        }
      } else {
        setErrors({ general: 'Erreur de connexion au serveur' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-lg border border-sepia-chaud/20 bg-beige-papier p-8 shadow-vintage">
        <h1 className="mb-6 text-center font-playfair text-headline text-noir-velours">
          Connexion
        </h1>

        {errors.general && (
          <div className="mb-4 rounded bg-rouge-cinema/10 px-4 py-2 text-center font-crimson text-caption text-rouge-cinema">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Email */}
          <div className="mb-4">
            <label htmlFor="email" className="mb-1 block font-crimson text-body text-noir-velours">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full rounded border-2 bg-creme-ecran px-4 py-2 font-crimson text-body text-noir-velours transition-colors focus:outline-none ${
                errors.email ? 'border-rouge-cinema' : 'border-beige-papier focus:border-rouge-cinema'
              }`}
              required
              autoComplete="email"
            />
            {errors.email && (
              <p className="mt-1 font-crimson text-caption text-rouge-cinema">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div className="mb-6">
            <label htmlFor="password" className="mb-1 block font-crimson text-body text-noir-velours">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full rounded border-2 bg-creme-ecran px-4 py-2 font-crimson text-body text-noir-velours transition-colors focus:outline-none ${
                errors.password ? 'border-rouge-cinema' : 'border-beige-papier focus:border-rouge-cinema'
              }`}
              required
              autoComplete="current-password"
            />
            {errors.password && (
              <p className="mt-1 font-crimson text-caption text-rouge-cinema">{errors.password}</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded bg-rouge-cinema py-3 font-bebas text-label tracking-wider text-creme-ecran transition-colors hover:bg-bordeaux-profond disabled:opacity-50"
          >
            {submitting ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <p className="mt-6 text-center font-crimson text-caption text-sepia-chaud">
          Pas de compte ?{' '}
          <Link to="/register" className="text-rouge-cinema underline hover:text-bordeaux-profond">
            S&apos;inscrire
          </Link>
        </p>
      </div>
    </div>
  );
}
