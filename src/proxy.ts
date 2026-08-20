import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function proxy(request: Request) {
  const { pathname } = new URL(request.url);
  const session = await auth();

  const isAdminRoute = pathname.startsWith("/admin");
  const isClientRoute = pathname.startsWith("/dashboard");

  if (isAdminRoute && session?.user?.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (isClientRoute && !session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isClientRoute && session?.user?.role === "ADMIN") {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  if (isAdminRoute && session?.user?.role === "CLIENT") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|assets).*)"],
};
