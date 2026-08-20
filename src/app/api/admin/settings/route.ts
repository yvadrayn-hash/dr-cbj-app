import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";

export async function PATCH(request: Request) {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();

  const email = String(body.email || "").trim().toLowerCase();
  const currentPassword = String(body.currentPassword || "");
  const newPassword = String(body.newPassword || "");

  const admin = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!admin) {
    return NextResponse.json({ error: "Admin not found" }, { status: 404 });
  }

  if (!admin.passwordHash) {
  return NextResponse.json(
    { error: "Password login is not configured for this account" },
    { status: 400 }
  );
}

const passwordValid = await bcrypt.compare(
  currentPassword,
  admin.passwordHash
);

  if (!passwordValid) {
    return NextResponse.json(
      { error: "Current password is incorrect" },
      { status: 400 }
    );
  }

  const data: {
    email?: string;
    passwordHash?: string;
  } = {};

  if (email && email !== admin.email) {
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json(
        { error: "That email address is already in use" },
        { status: 400 }
      );
    }

    data.email = email;
  }

  if (newPassword) {
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters" },
        { status: 400 }
      );
    }

    data.passwordHash = await bcrypt.hash(newPassword, 12);
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json(
      { error: "No changes were provided" },
      { status: 400 }
    );
  }

  const updated = await prisma.user.update({
    where: { id: admin.id },
    data,
  });

  return NextResponse.json({
    success: true,
    email: updated.email,
  });
}