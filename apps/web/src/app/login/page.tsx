import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/session';
import { AuthForm } from '@/components/auth-form';
import { AuthShell } from '@/components/auth-shell';

export default async function LoginPage() {
  if (await getSessionUser()) redirect('/dashboard');
  return (
    <AuthShell>
      <AuthForm mode="login" />
    </AuthShell>
  );
}
