/** Accounts actions without an API yet — UI contract only (see profile-actions.ts). */
const wait = (ms = 500) => new Promise((r) => setTimeout(r, ms));
export async function renameCredential(id: string, label: string): Promise<{ ok: true } | { ok: false; error: string }> {
  // TODO(api): PATCH /api/credentials/:id { label }
  await wait();
  void id;
  void label;
  return { ok: true };
}
