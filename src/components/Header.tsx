"use client";

import Link from "next/link";
import { useState } from "react";
import { signOut } from "next-auth/react";
import DrawerMenu from "./DrawerMenu";

interface HeaderProps {
  isAuthenticated: boolean;
  isAdmin: boolean;
}

export default function Header({ isAuthenticated, isAdmin }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="bg-teal-900 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link href="/" className="flex items-center gap-3 min-w-0">
              <img
                src="/assets/Dr. CBJ Logo.png"
                alt="Dr. CBJ Mental Wellness"
                className="rounded-full object-contain shrink-0 w-14 h-14"
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

            <DesktopNav
              isAuthenticated={isAuthenticated}
              isAdmin={isAdmin}
            />

            <button
              id="mobile-menu-toggle"
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden inline-flex items-center justify-center p-2 rounded-md text-teal-100 hover:text-white hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2 focus:ring-offset-teal-900 transition-colors"
              aria-label="Open navigation menu"
              aria-expanded={isMobileMenuOpen}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" x2="20" y1="12" y2="12" />
                <line x1="4" x2="20" y1="6" y2="6" />
                <line x1="4" x2="20" y1="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <DrawerMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        isAuthenticated={isAuthenticated}
        isAdmin={isAdmin}
        isClient={!isAdmin}
      />
    </>
  );
}

interface NavProps {
  isAuthenticated: boolean;
  isAdmin: boolean;
}

function DesktopNav({ isAuthenticated, isAdmin }: NavProps) {
  const publicLinks = [
    { href: "/services", label: "Services" },
    { href: "/about", label: "About" },
    { href: "/wellness-library", label: "Wellness Library" },
    { href: "/chat", label: "AI Assistant" },
    { href: "/faq", label: "FAQ" },
    { href: "/testimonials", label: "Testimonials" },
    { href: "/contact", label: "Contact" },
  ];

  if (!isAuthenticated) {
    return (
      <div className="hidden lg:flex items-center gap-3">
        <nav className="flex items-center gap-6 mr-4">
          {publicLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-teal-100 hover:text-white transition-colors"
              prefetch={false}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <Link
          href="/login"
          className="text-sm text-teal-100 hover:text-white transition-colors"
          prefetch={false}
        >
          Log In
        </Link>
        <Link
          href="/register"
          className="btn-primary !px-4 !py-2 text-xs"
          prefetch={false}
        >
          Register
        </Link>
      </div>
    );
  }

  const adminLinks = [
    { href: "/admin", label: "Admin Dashboard" },
    { href: "/admin/invoices", label: "Invoices" },
    { href: "/admin/companies", label: "Companies" },
  ];

  const clientLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/dashboard/billing", label: "Billing" },
  ];

  return (
    <div className="hidden lg:flex items-center gap-3">
      <nav className="flex items-center gap-6 mr-4">
        {publicLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-sm text-teal-100 hover:text-white transition-colors"
            prefetch={false}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      {isAdmin ? (
        <>
          {adminLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="btn-gold !px-4 !py-2 text-xs"
              prefetch={false}
            >
              {link.label}
            </Link>
          ))}
        </>
      ) : (
        <>
          {clientLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="btn-gold !px-4 !py-2 text-xs"
              prefetch={false}
            >
              {link.label}
            </Link>
          ))}
        </>
      )}
      <button
        type="button"
        onClick={async () => {
          await signOut({ redirectTo: "/" });
        }}
        className="text-sm text-teal-100 hover:text-white transition-colors"
      >
        Sign Out
      </button>
    </div>
  );
}