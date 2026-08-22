"use client";

import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isClient: boolean;
}

function AuthenticatedLinks({ isAdmin, isClient }: { isAdmin: boolean; isClient: boolean }) {
  return (
    <>
      <Link
        href="/dashboard"
        className="rounded-lg px-4 py-3 text-sm font-semibold text-teal-300 hover:bg-teal-800 hover:text-white transition-colors"
      >
        Dashboard
      </Link>

      <Link
        href="/dashboard/billing"
        className="rounded-lg px-4 py-3 text-sm font-semibold text-teal-300 hover:bg-teal-800 hover:text-white transition-colors"
      >
        Billing
      </Link>

      <Link
        href="/admin"
        className="rounded-lg px-4 py-3 text-sm font-semibold text-amber-300 hover:bg-teal-800 hover:text-white transition-colors"
      >
        Admin Dashboard
      </Link>

      <Link
        href="/admin/invoices"
        className="rounded-lg px-4 py-3 text-sm font-semibold text-amber-300 hover:bg-teal-800 hover:text-white transition-colors"
      >
        Invoices
      </Link>

       <button
         type="button"
         onClick={async () => {
           await signOut({ redirectTo: "/" });
         }}
         className="w-full rounded-lg px-4 py-3 text-sm font-semibold text-red-300 hover:bg-teal-800 hover:text-white transition-colors text-left"
       >
         Sign Out
       </button>
    </>
  );
}

function UnauthenticatedLinks() {
  return (
    <>
      <Link
        href="/login"
        className="rounded-lg px-4 py-3 text-sm text-teal-100 hover:bg-teal-800 hover:text-white transition-colors"
      >
        Log In
      </Link>

      <Link
        href="/register"
        className="rounded-lg px-4 py-3 text-sm font-semibold text-teal-100 bg-teal-700 hover:bg-teal-600 transition-colors"
      >
        Register
      </Link>
    </>
  );
}

export default function DrawerMenu({ isOpen, onClose, isAuthenticated, isAdmin, isClient }: DrawerProps) {
  const pathname = usePathname();
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeOnNavClick = () => {
    onClose();
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity"
          aria-hidden="true"
        />
      )}

      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation Menu"
        className={`fixed top-0 right-0 z-[60] h-full w-[85vw] max-w-sm bg-teal-900 text-white shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-teal-800 px-4 py-4">
            <Link href="/" className="flex items-center gap-3 min-w-0" onClick={closeOnNavClick}>
              <Image
                src="/assets/Dr. CBJ Logo.png"
                alt="Dr. CBJ Mental Wellness"
                width={48}
                height={48}
                className="rounded-full object-contain shrink-0"
              />
              <div className="min-w-0">
                <span className="text-base font-bold block leading-tight">
                  Dr. CBJ Mental Wellness
                </span>
                <span className="block text-[10px] text-teal-200 truncate">
                  ... of Manor Group Health
                  <span className="text-amber-400 font-semibold">+</span>
                </span>
              </div>
            </Link>
            <button
              id="mobile-menu-close"
              onClick={onClose}
              type="button"
              className="rounded-full p-2 text-teal-200 hover:bg-teal-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2 focus:ring-offset-teal-900 active:scale-95 transition-all"
              aria-label="Close navigation menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={closeOnNavClick}
                  className={`flex items-center rounded-lg px-4 py-3.5 text-sm font-medium transition-colors ${
                    isActive ? "bg-teal-700 text-white" : "text-teal-100 hover:bg-teal-800 hover:text-white"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}

            {isAuthenticated ? <hr className="border-teal-800 my-4" /> : null}

            {isAuthenticated ? (
              <AuthenticatedLinks isAdmin={isAdmin} isClient={isClient} />
            ) : (
              <UnauthenticatedLinks />
            )}
          </nav>

          <div className="border-t border-teal-800 px-4 py-3">
            <p className="text-[10px] text-teal-400 text-center">
              {new Date().getFullYear()} Dr. CBJ Mental Wellness
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

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