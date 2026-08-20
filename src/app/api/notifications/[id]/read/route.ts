import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const notification = await prisma.notification.findFirst({
    where: {
      id,
      userId: user.id,
    },
  });

  if (!notification) {
    return NextResponse.json(
      { error: "Notification not found" },
      { status: 404 }
    );
  }

  await prisma.notification.update({
    where: { id },
    data: { isRead: true },
  });

  return NextResponse.json({ success: true });
}