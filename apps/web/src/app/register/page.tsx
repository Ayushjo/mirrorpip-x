import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { getSessionUser } from '@/lib/session';
import { AuthForm } from '@/components/auth-form';
import { AuthShell } from '@/components/auth-shell';

export default async function RegisterPage() {
  if (await getSessionUser()) redirect('/dashboard');
  return (
    <AuthShell>
      <Suspense>
        <AuthForm mode="register" />
      </Suspense>
    </AuthShell>
  );
}
