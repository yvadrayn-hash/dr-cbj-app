import bcrypt from "bcryptjs";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ token: string }>;
};

export default async function CbjSyncPage({ params }: PageProps) {
  const { token } = await params;
  const resetToken = process.env.ADMIN_RESET_TOKEN;
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!resetToken || token !== resetToken) {
    notFound();
  }

  if (!adminEmail || !adminPassword) {
    return <main>Admin setup is unavailable.</main>;
  }

  const legacyEmail = "dr.cbj@manorgrouphealth.com";
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true },
  });

  if (admins.length > 1) {
    return <main>Multiple admin accounts require manual review.</main>;
  }

  const intendedAccounts = await prisma.user.findMany({
    where: {
      email: {
        in:
          adminEmail === legacyEmail
            ? [adminEmail]
            : [adminEmail, legacyEmail],
      },
    },
    select: { id: true, email: true },
  });

  if (admins.length === 0 && intendedAccounts.length > 1) {
    return <main>Conflicting intended admin accounts require manual review.</main>;
  }

  const accountId = admins[0]?.id ?? intendedAccounts[0]?.id;
  const targetConflict = intendedAccounts.find(
    (user) => user.email === adminEmail && user.id !== accountId,
  );

  if (targetConflict) {
    return <main>The requested admin email is already in use.</main>;
  }

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  if (accountId) {
    await prisma.user.update({
      where: { id: accountId },
      data: {
        email: adminEmail,
        passwordHash,
        role: "ADMIN",
      },
    });
  } else {
    await prisma.user.create({
      data: {
        name: "Dr. Coretta Brown-Johnson, JP",
        email: adminEmail,
        passwordHash,
        role: "ADMIN",
      },
    });
  }

  return <main>Admin access restored.</main>;
}
