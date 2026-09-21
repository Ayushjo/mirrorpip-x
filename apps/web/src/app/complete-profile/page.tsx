import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/session';
import { MediaBanner } from '@/components/media-banner';
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
    <div className="mx-auto w-full max-w-xl space-y-6 py-6">
      <MediaBanner src="/media/profile-globe.webp" position="right center" className="min-h-[180px]">
        <div className="p-8">
          <h1 className="text-3xl text-black" style={{ letterSpacing: '-0.03em' }}>
            One last step
          </h1>
          <p className="mt-1.5 max-w-sm text-sm text-black/60">
            Tell us where you&rsquo;re based{needsConsent ? ' and accept the terms' : ''} — required for compliance before you
            start copying.
          </p>
        </div>
      </MediaBanner>
      <CompleteProfileForm needsConsent={needsConsent} defaultRole={user.intendedRole ?? ''} />
    </div>
  );
}
