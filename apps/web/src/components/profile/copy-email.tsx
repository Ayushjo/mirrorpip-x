'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

export function CopyEmail({ email }: { email: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => { try { await navigator.clipboard.writeText(email); setOk(true); setTimeout(() => setOk(false), 1500); } catch {} }}
      className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.05] px-2.5 py-1 text-xs text-muted transition-colors hover:text-fg"
      aria-label="Copy email"
    >
      {email}
      {ok ? <Check className="h-3 w-3 text-up" strokeWidth={3} /> : <Copy className="h-3 w-3" />}
    </button>
  );
}
