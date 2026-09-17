import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import { getSessionUser, isAdmin } from '@/lib/session';
import { UserMenu } from '@/components/user-menu';
import { LogoIcon } from '@/components/icons';

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
          href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <header className="sticky top-0 z-40 border-b border-border bg-[rgba(245,245,245,0.8)] backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-[88rem] items-center justify-between px-6">
            <Link href="/" className="flex items-center gap-2">
              <LogoIcon className="h-6 w-6 text-black" />
              <span className="text-xl font-medium tracking-tight text-black">MirrorPip</span>
            </Link>

            <nav className="hidden items-center gap-8 text-base font-medium text-gray-700 md:flex">
              <Link href="/leaders" className="transition-colors duration-200 hover:text-black">
                Leaderboard
              </Link>
              {user && (
                <>
                  <Link href="/dashboard" className="transition-colors duration-200 hover:text-black">
                    Dashboard
                  </Link>
                  <Link href="/connect" className="transition-colors duration-200 hover:text-black">
                    Accounts
                  </Link>
                </>
              )}
              {admin && (
                <Link href="/admin" className="transition-colors duration-200 hover:text-black">
                  Admin
                </Link>
              )}
            </nav>

            <UserMenu user={user ? { name: user.name, email: user.email } : null} />
          </div>
        </header>

        <main className="mx-auto max-w-[88rem] px-6 py-10">{children}</main>

        <footer className="mx-auto max-w-[88rem] px-6 py-12 text-xs text-faint">
          <div className="flex items-center gap-2 text-black">
            <LogoIcon className="h-5 w-5" />
            <span className="font-medium">MirrorPip</span>
          </div>
          <p className="mt-3 max-w-2xl">
            Copy-trading is high risk. You keep custody of your funds; the platform only places orders via your own API
            keys. Not investment advice.
          </p>
        </footer>
      </body>
    </html>
  );
}
