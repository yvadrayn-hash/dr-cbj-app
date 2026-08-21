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

  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true },
  });

  if (admins.length !== 1) {
    return <main>Admin account check failed.</main>;
  }

  const conflictingUser = await prisma.user.findUnique({
    where: { email: adminEmail },
    select: { id: true },
  });

  if (conflictingUser && conflictingUser.id !== admins[0].id) {
    return <main>The requested admin email is already in use.</main>;
  }

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await prisma.user.update({
    where: { id: admins[0].id },
    data: {
      email: adminEmail,
      passwordHash,
    },
  });

  return <main>Admin access restored.</main>;
}
