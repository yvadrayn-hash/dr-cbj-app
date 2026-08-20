import Link from "next/link";
import Image from "next/image";
import { auth, signOut } from "@/auth";

export default async function Header() {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";
  const isClient = session?.user?.role === "CLIENT";

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/services", label: "Services" },
    { href: "/about", label: "About" },
    { href: "/wellness-library", label: "Wellness Library" },
    { href: "/chat", label: "AI Assistant" },
    { href: "/faq", label: "FAQ" },
    { href: "/testimonials", label: "Testimonials" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <header className="bg-teal-900 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link href="/" className="flex items-center gap-3 min-w-0">
            <Image
              src="/assets/Dr. CBJ Logo.png"
              alt="Dr. CBJ Mental Wellness"
              width={56}
              height={56}
              className="rounded-full object-contain shrink-0"
              priority
            />

            <div className="hidden sm:block min-w-0">
              <span className="text-lg font-bold block">
                Dr. CBJ Mental Wellness
              </span>

              <span className="block text-xs text-teal-200">
                ... of Manor Group Health
                <span className="text-amber-400 font-semibold">+</span>
              </span>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-teal-100 hover:text-white transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {session ? (
              <>
                {isAdmin && (
                  <>
                    <Link
                      href="/admin"
                      className="btn-gold !px-4 !py-2 text-xs"
                    >
                      Admin Dashboard
                    </Link>

                    <Link
                      href="/admin/settings"
                      className="text-sm text-teal-100 hover:text-white transition-colors"
                    >
                      Settings
                    </Link>
                  </>
                )}

                {isClient && (
                  <Link
                    href="/dashboard"
                    className="btn-gold !px-4 !py-2 text-xs"
                  >
                    Dashboard
                  </Link>
                )}

                <form
                  action={async () => {
                    "use server";
                    await signOut({ redirectTo: "/" });
                  }}
                >
                  <button
                    type="submit"
                    className="text-sm text-teal-100 hover:text-white transition-colors"
                  >
                    Sign Out
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm text-teal-100 hover:text-white transition-colors"
                >
                  Log In
                </Link>

                <Link
                  href="/register"
                  className="btn-primary !px-4 !py-2 text-xs"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="lg:hidden border-t border-teal-800">
        <details className="group">
          <summary className="px-4 py-3 cursor-pointer list-none flex items-center justify-between text-sm font-medium text-teal-100">
            <span>Menu</span>
            <span className="text-lg group-open:rotate-180 transition-transform">
              ▾
            </span>
          </summary>

          <nav className="border-t border-teal-800 px-4 py-3 grid grid-cols-2 gap-2 bg-teal-950/30">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg px-3 py-3 text-sm text-teal-100 hover:bg-teal-800 hover:text-white transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </details>
      </div>
    </header>
  );
}