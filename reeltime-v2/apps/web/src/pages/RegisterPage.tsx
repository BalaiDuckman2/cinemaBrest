import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { ApiError } from '../services/api';

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

function validateEmail(email: string): string | undefined {
  if (!email) return 'Email requis';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Format email invalide';
  return undefined;
}

function validatePassword(password: string): string | undefined {
  if (!password) return 'Mot de passe requis';
  if (password.length < 8) return 'Minimum 8 caracteres';
  return undefined;
}

export function RegisterPage() {
  const navigate = useNavigate();
  const register = useAuthStore((s) => s.register);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  // Redirect if already authenticated
  if (isAuthenticated) {
    navigate('/', { replace: true });
    return null;
  }

  const handleBlur = (field: 'email' | 'password') => {
    const newErrors = { ...errors };
    if (field === 'email') {
      newErrors.email = validateEmail(email);
    } else {
      newErrors.password = validatePassword(password);
    }
    newErrors.general = undefined;
    setErrors(newErrors);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);
    if (emailErr || passwordErr) {
      setErrors({ email: emailErr, password: passwordErr });
      return;
    }

    setSubmitting(true);
    setErrors({});

    try {
      await register(email, password, name || undefined);
      navigate('/');
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 'EMAIL_ALREADY_EXISTS') {
          setErrors({ email: 'Cet email est deja utilise' });
        } else if (err.code === 'VALIDATION_ERROR' && err.details) {
          const newErrors: FormErrors = {};
          for (const d of err.details) {
            if (d.path === 'email') newErrors.email = d.message;
            if (d.path === 'password') newErrors.password = d.message;
          }
          setErrors(newErrors);
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
          Inscription
        </h1>

        {errors.general && (
          <div className="mb-4 rounded bg-rouge-cinema/10 px-4 py-2 text-center font-crimson text-caption text-rouge-cinema">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Name */}
          <div className="mb-4">
            <label htmlFor="name" className="mb-1 block font-crimson text-body text-noir-velours">
              Nom (optionnel)
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded border-2 border-beige-papier bg-creme-ecran px-4 py-2 font-crimson text-body text-noir-velours transition-colors focus:border-rouge-cinema focus:outline-none"
              autoComplete="name"
            />
          </div>

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
              onBlur={() => handleBlur('email')}
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
              onBlur={() => handleBlur('password')}
              className={`w-full rounded border-2 bg-creme-ecran px-4 py-2 font-crimson text-body text-noir-velours transition-colors focus:outline-none ${
                errors.password ? 'border-rouge-cinema' : 'border-beige-papier focus:border-rouge-cinema'
              }`}
              required
              autoComplete="new-password"
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
            {submitting ? 'Inscription...' : "S'inscrire"}
          </button>
        </form>

        <p className="mt-6 text-center font-crimson text-caption text-sepia-chaud">
          Deja un compte ?{' '}
          <Link to="/login" className="text-rouge-cinema underline hover:text-bordeaux-profond">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
