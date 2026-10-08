'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { AlertCircle, Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react';
import { authApi } from '@/lib/api/auth';
import { homePathFor, setSession } from '@/lib/session';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/shared/FormField';

const loginSchema = z.object({
  email: z.email('Format email tidak valid'),
  password: z.string().min(1, 'Kata sandi wajib diisi'),
  remember: z.boolean(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', remember: false },
  });

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: ({ data }, { remember }) => {
      setSession(data.token, data.user.role, remember);
      router.replace(homePathFor(data.user.role));
    },
  });

  const pending = loginMutation.isPending;

  return (
    <form onSubmit={handleSubmit((data) => loginMutation.mutate(data))} className="space-y-5">
      <FormField label="Email" htmlFor="email" error={errors.email?.message}>
        <div className="relative">
          <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            placeholder="nama@email.com"
            autoComplete="email"
            className="h-11 pl-9"
            disabled={pending}
            aria-invalid={!!errors.email}
            {...register('email')}
          />
        </div>
      </FormField>

      <FormField label="Kata Sandi" htmlFor="password" error={errors.password?.message}>
        <div className="relative">
          <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Masukkan kata sandi"
            autoComplete="current-password"
            className="h-11 px-9"
            disabled={pending}
            aria-invalid={!!errors.password}
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
            aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </FormField>

      <label className="flex w-fit cursor-pointer items-center gap-2 text-sm select-none">
        <input
          type="checkbox"
          className="size-4 cursor-pointer rounded accent-primary"
          disabled={pending}
          {...register('remember')}
        />
        Ingat saya
      </label>

      {loginMutation.error && (
        <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          {loginMutation.error.message}
        </div>
      )}

      <Button type="submit" className="h-11 w-full text-base" disabled={pending}>
        {pending ? (
          <>
            <Loader2 className="animate-spin" /> Memproses...
          </>
        ) : (
          'Masuk'
        )}
      </Button>
    </form>
  );
}
