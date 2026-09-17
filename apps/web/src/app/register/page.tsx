import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/session';
import { AuthForm } from '@/components/auth-form';
import { AuthShell } from '@/components/auth-shell';

export default async function RegisterPage() {
  if (await getSessionUser()) redirect('/dashboard');
  return (
    <AuthShell>
      <AuthForm mode="register" />
    </AuthShell>
  );
}
