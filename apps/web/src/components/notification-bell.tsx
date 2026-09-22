'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Bell } from 'lucide-react';

interface Item {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  href: string | null;
  readAt: string | null;
  createdAt: string;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications');
      if (!res.ok) return;
      const { data } = await res.json();
      setItems(data.items);
      setUnread(data.unread);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    void load();
    const id = window.setInterval(load, 30_000);
    return () => window.clearInterval(id);
  }, [load]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (ref.current?.contains(t) || panelRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) {
      setUnread(0);
      setItems((prev) => prev.map((i) => ({ ...i, readAt: i.readAt ?? new Date().toISOString() })));
      void fetch('/api/notifications', { method: 'POST' }).catch(() => undefined);
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-label="Notifications"
        className="relative grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-fg transition-colors hover:bg-white/10 md:h-9 md:w-9"
      >
        <Bell className="h-[18px] w-[18px] md:h-4 md:w-4" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-down px-1 text-[10px] font-semibold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      {mounted && open &&
        createPortal(
        <div
          ref={panelRef}
          className="fixed right-3 top-[4.25rem] z-[70] w-[min(22rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-border bg-surface shadow-xl sm:right-6"
        >
          <div className="border-b border-border-soft px-4 py-3 text-sm font-semibold">Notifications</div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted">Nothing yet.</p>
            ) : (
              items.map((n) => {
                const inner = (
                  <div className={`border-b border-border-soft px-4 py-3 last:border-0 ${n.readAt ? 'opacity-60' : ''}`}>
                    <div className="text-sm font-medium">{n.title}</div>
                    {n.body && <div className="mt-0.5 text-xs text-muted">{n.body}</div>}
                    <div className="mt-1 text-[10px] text-faint" suppressHydrationWarning>{new Date(n.createdAt).toLocaleString()}</div>
                  </div>
                );
                return n.href ? (
                  <Link key={n.id} href={n.href} onClick={() => setOpen(false)} className="block transition hover:bg-surface-2">
                    {inner}
                  </Link>
                ) : (
                  <div key={n.id}>{inner}</div>
                );
              })
            )}
          </div>
        </div>,
          document.body,
        )}
    </div>
  );
}
