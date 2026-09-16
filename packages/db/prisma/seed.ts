import { prisma } from '../src/index.js';

/**
 * Idempotent seed. Initializes the global kill-switch (off) and promotes any
 * existing users whose email is in ADMIN_EMAILS to the "admin" role.
 */
async function main(): Promise<void> {
  await prisma.systemSetting.upsert({
    where: { key: 'killSwitch' },
    update: {},
    create: { key: 'killSwitch', value: { enabled: false } },
  });

  const adminEmails = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (adminEmails.length > 0) {
    const res = await prisma.user.updateMany({
      where: { email: { in: adminEmails } },
      data: { role: 'admin' },
    });
    console.log(`Promoted ${res.count} user(s) to admin.`);
  }

  console.log('Seed complete.');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
