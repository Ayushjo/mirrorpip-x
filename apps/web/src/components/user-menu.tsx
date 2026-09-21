'use client';

import Link from 'next/link';
import { useState } from 'react';
import { signOut } from '@/lib/auth-client';
import { Button, LinkButton } from './ui';

export function UserMenu({ user }: { user: { name: string; email: string } | null }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/login" className="hidden rounded-lg px-3 py-2 text-sm text-muted hover:text-fg sm:block">
          Sign in
        </Link>
        <LinkButton href="/register" className="px-3.5 py-2">
          Get started
        </LinkButton>
      </div>
    );
  }

  const initials = user.name.slice(0, 1).toUpperCase();

  async function handleSignOut() {
    setBusy(true);
    try {
      await signOut();
    } finally {
      // Hard navigation guarantees the server layout re-renders logged-out and
      // the button never gets stuck in the "Signing out…" state.
      window.location.assign('/');
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="grid h-9 w-9 place-items-center rounded-full border border-border bg-surface-2 text-sm font-semibold"
        aria-label="Account menu"
      >
        {initials}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-56 rounded-xl border border-border bg-surface p-2 shadow-xl">
            <div className="px-3 py-2">
              <div className="truncate text-sm font-medium">{user.name}</div>
              <div className="truncate text-xs text-muted">{user.email}</div>
            </div>
            <div className="my-1 h-px bg-border" />
            <Link href="/dashboard" className="block rounded-lg px-3 py-2 text-sm hover:bg-surface-2" onClick={() => setOpen(false)}>
              Dashboard
            </Link>
            <Link href="/connect" className="block rounded-lg px-3 py-2 text-sm hover:bg-surface-2" onClick={() => setOpen(false)}>
              Connected accounts
            </Link>
            <div className="my-1 h-px bg-border" />
            <div className="px-1 pt-1">
              <Button variant="ghost" className="w-full" onClick={handleSignOut} disabled={busy}>
                {busy ? 'Signing out…' : 'Sign out'}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
