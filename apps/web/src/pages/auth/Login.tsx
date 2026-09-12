import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../hooks/useAuth';
import { GraduationCap } from 'lucide-react';
import { clsx } from 'clsx';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

type LoginForm = z.infer<typeof loginSchema>;

export function Login() {
  const { login, isLoading: authLoading } = useAuth();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setError('');
    try {
      await login(data.email, data.password);
    } catch (err) {
      setError((err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Credenciales inválidas');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-primary-600 mb-6">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-secondary-900">SIGRADE</h1>
          <p className="text-secondary-600 mt-2">Sistema de Gestión del Registro Académico</p>
        </div>

        <div className="rounded-xl border bg-white text-secondary-900 shadow-sm">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-secondary-900 mb-6">Iniciar sesión</h2>
            
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-danger-50 text-danger-700 text-sm border border-danger-200" role="alert">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-secondary-700 mb-1.5">Email</label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  {...register('email')}
                  className={clsx(
                    'flex h-9 w-full rounded-md border border-secondary-300 bg-white px-3 py-1 text-base shadow-sm transition-colors',
                    'placeholder:text-secondary-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-600',
                    'disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
                    errors.email && 'border-danger-500 focus-visible:ring-danger-500'
                  )}
                  disabled={isLoading || authLoading}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-danger-600">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-secondary-700 mb-1.5">Contraseña</label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  {...register('password')}
                  className={clsx(
                    'flex h-9 w-full rounded-md border border-secondary-300 bg-white px-3 py-1 text-base shadow-sm transition-colors',
                    'placeholder:text-secondary-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-600',
                    'disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
                    errors.password && 'border-danger-500 focus-visible:ring-danger-500'
                  )}
                  disabled={isLoading || authLoading}
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-danger-600">{errors.password.message}</p>
                )}
              </div>

              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary-600 text-white shadow hover:bg-primary-700 h-10 px-4 py-2 w-full"
                disabled={isLoading || authLoading}
              >
                {isLoading || authLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Iniciando sesión...
                  </span>
                ) : (
                  'Iniciar sesión'
                )}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-secondary-500">
              <p>SIGRADE - Ministerio de Educación de la República Dominicana</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
