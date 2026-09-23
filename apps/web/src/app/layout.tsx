import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import { getSessionUser, isAdmin } from '@/lib/session';
import { getMaintenanceMode } from '@/lib/services/admin';
import { UserMenu } from '@/components/user-menu';
import { BrandMark } from '@/components/icons';
import { MobileNav } from '@/components/mobile-nav';
import { UsageTracker } from '@/components/usage-tracker';
import { NotificationBell } from '@/components/notification-bell';
import { OnboardingGate } from '@/components/consent-gate';
import { SmoothScroll } from '@/components/smooth-scroll';
import { Toaster } from '@/components/toaster';

export const metadata: Metadata = {
  title: 'BelieveMeGuys — Copy the best crypto traders',
  description:
    'Connect your exchange, follow verified leaders, and mirror their trades automatically. Your funds stay in your own account.',
  icons: { icon: '/media/believemeguysjsutlogo.png', apple: '/media/believemeguysjsutlogo.png' },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  const admin = await isAdmin(user);
  const maintenance = await getMaintenanceMode().catch(() => ({ enabled: false, message: '' }));

  const navLinks = [
    { href: '/leaders', label: 'Leaderboard' },
    ...(user
      ? [
          { href: '/dashboard', label: 'Dashboard' },
          { href: '/connect', label: 'Accounts' },
        ]
      : []),
    ...(admin ? [{ href: '/admin', label: 'Admin' }] : []),
  ];

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="flex min-h-screen flex-col">
        <SmoothScroll />
        <Toaster />
        <header className="sticky top-0 z-40 border-b border-border bg-[rgba(5,11,23,0.7)] backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-[88rem] items-center justify-between gap-3 px-6">
            <Link href="/" className="flex shrink-0 items-center gap-2">
              <BrandMark className="h-7 w-7" />
              <span className="text-lg font-semibold tracking-tight text-fg sm:text-xl">
                BelieveMe<span className="text-brand">Guys</span>
              </span>
            </Link>

            <nav className="hidden items-center gap-1 rounded-2xl bg-white/[0.05] p-1.5 text-[15px] font-medium text-muted md:flex">
              {navLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="rounded-xl px-4 py-2 transition-colors duration-200 hover:bg-white/[0.06] hover:text-fg"
                >
                  {l.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              {user && <NotificationBell />}
              <MobileNav links={navLinks} user={user ? { name: user.name, email: user.email } : null} />
              <div className="hidden md:block">
                <UserMenu user={user ? { name: user.name, email: user.email, image: user.image } : null} />
              </div>
            </div>
          </div>
        </header>

        {maintenance.enabled && (
          <div className="border-b border-warn/30 bg-warn/15 px-6 py-2 text-center text-sm text-warn">
            {maintenance.message || 'BelieveMeGuys is under scheduled maintenance — copying may be paused.'}
          </div>
        )}
        {user && (
          <OnboardingGate
            needsOnboarding={
              !user.tosAcceptedAt ||
              !user.riskDisclosureAcceptedAt ||
              !user.country ||
              !user.city ||
              !user.postalCode
            }
          />
        )}
        {user && <UsageTracker />}

        <main className="mx-auto w-full max-w-[88rem] flex-1 px-6 py-10">{children}</main>

        <footer className="mx-auto w-full max-w-[88rem] border-t border-border px-6 py-10 text-xs text-faint">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-fg">
                <BrandMark className="h-6 w-6" />
                <span className="font-medium">BelieveMeGuys</span>
              </div>
              <p className="mt-3 max-w-md">
                Copy-trading is high risk. You keep custody of your funds; the platform only places orders via your own
                API keys. Not investment advice.
              </p>
            </div>
            <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
              <Link href="/leaders" className="transition-colors hover:text-fg">
                Leaderboard
              </Link>
              <Link href="/#how-it-works" className="transition-colors hover:text-fg">
                How it works
              </Link>
              <Link href="/connect" className="transition-colors hover:text-fg">
                Accounts
              </Link>
              <Link href={user ? '/dashboard' : '/register'} className="transition-colors hover:text-fg">
                {user ? 'Dashboard' : 'Get started'}
              </Link>
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}
