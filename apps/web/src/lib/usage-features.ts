// Client-safe: maps app routes to a coarse feature name for usage analytics.
export function featureFromPath(path?: string): string | undefined {
  if (!path) return undefined;
  if (path.startsWith('/admin')) return 'admin';
  if (path.startsWith('/dashboard')) return 'dashboard';
  if (path.startsWith('/connect')) return 'connect';
  if (path.startsWith('/leaders')) return 'leaders';
  if (path.startsWith('/follow')) return 'follow';
  if (path.startsWith('/verify') || path.startsWith('/forgot-password')) return 'auth';
  return 'other';
}
