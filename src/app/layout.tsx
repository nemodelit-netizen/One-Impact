import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { getCurrentUser } from "@/lib/auth";
import { logout } from "./actions";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "One Impact",
  description: "People united by purpose, creating measurable, lasting change.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <div className="bg-warn-soft text-warn text-center text-xs py-1.5 px-4">
          Prototype with demo data. Projects, members and amounts shown are fictional.
        </div>
        <header className="border-b border-line bg-card">
          <nav className="mx-auto max-w-5xl px-4 h-14 flex items-center gap-6 text-sm">
            <Link href="/" className="font-semibold text-base tracking-tight">One Impact</Link>
            <Link href="/projects" className="text-muted hover:text-ink">Projects</Link>
            <Link href="/vote" className="text-muted hover:text-ink">Vote</Link>
            <Link href="/transparency" className="text-muted hover:text-ink">Transparency</Link>
            {user?.role === "ADMIN" && <Link href="/admin" className="text-muted hover:text-ink">Admin</Link>}
            <div className="ml-auto flex items-center gap-3">
              {user ? (
                <>
                  <span className="text-muted hidden sm:inline">{user.name}</span>
                  <form action={logout}><button className="text-muted hover:text-ink">Sign out</button></form>
                </>
              ) : (
                <Link href="/login" className="rounded-md bg-brand text-white px-3 py-1.5">Sign in</Link>
              )}
            </div>
          </nav>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-10">{children}</main>
        <footer className="mx-auto max-w-5xl px-4 pb-10 text-xs text-muted">
          The community helps decide what deserves support. Qualified people determine how it is delivered. Independent oversight checks the system works as promised.
        </footer>
      </body>
    </html>
  );
}
