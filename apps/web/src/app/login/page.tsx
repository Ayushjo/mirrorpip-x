import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { getSessionUser } from '@/lib/session';
import { AuthForm } from '@/components/auth-form';
import { AuthShell } from '@/components/auth-shell';

export default async function LoginPage() {
  if (await getSessionUser()) redirect('/dashboard');
  return (
    <AuthShell>
      <Suspense>
        <AuthForm mode="login" />
      </Suspense>
    </AuthShell>
  );
}
