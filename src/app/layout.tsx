import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MusicPlayer from "@/components/MusicPlayer";
import { siteConfig } from "@/lib/site";
import { auth } from "@/auth";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: `${siteConfig.name} | ${siteConfig.tagline}`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [
    "mental wellness",
    "psychologist",
    "behavioural specialist",
    "therapy",
    "counselling",
    "Jamaica",
    "Dr. Coretta Brown-Johnson",
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const isAuthenticated = !!session?.user;
  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col pb-20 sm:pb-0">
        <Header isAuthenticated={isAuthenticated} isAdmin={isAdmin} />
        <main className="flex-1">{children}</main>
        <Footer />
        <MusicPlayer />
      </body>
    </html>
  );
}
