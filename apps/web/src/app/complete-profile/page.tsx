import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/session';
import { CompleteProfileForm } from '@/components/complete-profile-form';

export const dynamic = 'force-dynamic';

/**
 * Compulsory onboarding step. Reached via OnboardingGate whenever a signed-in
 * user is missing consent (OAuth signups) or their address (email signups defer
 * location here after verification).
 */
export default async function CompleteProfilePage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  const needsConsent = !user.tosAcceptedAt || !user.riskDisclosureAcceptedAt;
  const needsProfile = !user.country || !user.city || !user.postalCode;
  // Already fully onboarded — don't show the form again.
  if (!needsConsent && !needsProfile) redirect('/dashboard');

  return (
    <div className="mx-auto w-full max-w-xl space-y-6 py-2 sm:py-6">
      <div className="text-center">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-brand to-accent shadow-[0_10px_30px_rgba(0,176,255,0.35)]">
          <span className="text-2xl">🌍</span>
        </div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand">One last step</div>
        <h1 className="mt-2 text-3xl text-fg sm:text-4xl" style={{ letterSpacing: '-0.03em' }}>
          Tell us where you&rsquo;re based
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
          Required for compliance before you start copying{needsConsent ? ', plus a quick agreement to the terms' : ''}.
        </p>
      </div>
      <CompleteProfileForm needsConsent={needsConsent} defaultRole={user.intendedRole ?? ''} />
    </div>
  );
}
