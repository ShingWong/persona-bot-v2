'use client';

import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';

export default function Navigation() {
  const { isAuthenticated, user, logout } = useAuthStore();

  return (
    <nav className="border-b bg-card">
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        <div className="flex items-center space-x-8">
          <Link href="/" className="text-xl font-bold">
            Persona Bot
          </Link>
          {isAuthenticated && (
            <div className="hidden space-x-6 md:flex">
              <Link
                href="/dashboard"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Dashboard
              </Link>
              <Link
                href="/personas"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Personas
              </Link>
              <Link
                href="/conversations"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Conversations
              </Link>
              <Link
                href="/settings"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Settings
              </Link>
              {user?.role === 'ADMIN' && (
                <Link
                  href="/admin/models"
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Admin
                </Link>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-4">
          {isAuthenticated ? (
            <>
              <div className="hidden text-right md:block">
                <p className="text-sm font-medium">{user?.name || user?.email}</p>
                <p className="text-xs text-muted-foreground">{user?.role}</p>
              </div>
              <button
                onClick={() => logout()}
                className="rounded-lg border border-destructive/20 px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
              >
                Sign Out
              </button>
            </>
          ) : (
            <div className="flex space-x-3">
              <Link
                href="/auth/login"
                className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
              >
                Sign In
              </Link>
              <Link
                href="/auth/register"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}