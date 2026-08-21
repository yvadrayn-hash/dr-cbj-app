import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const resetToken = process.env.ADMIN_RESET_TOKEN;
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (
    !resetToken ||
    request.headers.get("authorization") !== `Bearer ${resetToken}`
  ) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!adminEmail || !adminPassword) {
    return Response.json(
      { error: "Admin reset is not configured" },
      { status: 500 },
    );
  }

  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true },
  });

  if (admins.length !== 1) {
    return Response.json(
      { error: "Expected exactly one admin account" },
      { status: 409 },
    );
  }

  const conflictingUser = await prisma.user.findUnique({
    where: { email: adminEmail },
    select: { id: true },
  });

  if (conflictingUser && conflictingUser.id !== admins[0].id) {
    return Response.json(
      { error: "Target email is already used" },
      { status: 409 },
    );
  }

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await prisma.user.update({
    where: { id: admins[0].id },
    data: {
      email: adminEmail,
      passwordHash,
    },
  });

  return Response.json({ ok: true });
}
