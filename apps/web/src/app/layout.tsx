import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import { getSessionUser, isAdmin } from '@/lib/session';
import { UserMenu } from '@/components/user-menu';

export const metadata: Metadata = {
  title: 'MirrorPip-X — Copy the best crypto traders',
  description:
    'Connect your exchange, follow verified leaders, and mirror their trades automatically. Your funds stay in your own account.',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  const admin = await isAdmin(user);

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <header className="sticky top-0 z-40 border-b border-border bg-[rgba(7,11,20,0.72)] backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
            <Link href="/" className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand font-bold text-black">M</span>
              <span className="text-[15px] font-bold tracking-tight">
                MirrorPip<span className="text-brand">X</span>
              </span>
            </Link>

            <nav className="hidden items-center gap-1 text-sm text-muted sm:flex">
              <Link href="/leaders" className="rounded-lg px-3 py-2 hover:text-fg">
                Leaderboard
              </Link>
              {user && (
                <>
                  <Link href="/dashboard" className="rounded-lg px-3 py-2 hover:text-fg">
                    Dashboard
                  </Link>
                  <Link href="/connect" className="rounded-lg px-3 py-2 hover:text-fg">
                    Accounts
                  </Link>
                </>
              )}
              {admin && (
                <Link href="/admin" className="rounded-lg px-3 py-2 text-brand hover:brightness-125">
                  Admin
                </Link>
              )}
            </nav>

            <UserMenu user={user ? { name: user.name, email: user.email } : null} />
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-5 py-8">{children}</main>

        <footer className="mx-auto max-w-6xl px-5 py-10 text-xs text-faint">
          <p>
            MirrorPip-X · Copy-trading is high risk. You keep custody of your funds; the platform only places orders via
            your own API keys. Not investment advice.
          </p>
        </footer>
      </body>
    </html>
  );
}
