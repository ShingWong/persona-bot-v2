'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout, isLoading } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/50">
        <header className="border-b bg-card">
          <div className="container mx-auto flex h-16 items-center justify-between px-6">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold">Persona Bot Dashboard</h1>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                {user?.role || 'User'}
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium">{user?.name || user?.email}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="rounded-lg border border-destructive/20 px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
              >
                Sign Out
              </button>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-6 py-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight">Welcome to Persona Bot</h2>
            <p className="mt-2 text-muted-foreground">
              Manage your AI personas, conversations, and settings from your dashboard.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border bg-card p-6">
              <h3 className="font-semibold">AI Personas</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Create and manage multiple AI personas with unique personalities and capabilities.
              </p>
              <button className="mt-4 w-full rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20">
                Manage Personas
              </button>
            </div>

            <div className="rounded-xl border bg-card p-6">
              <h3 className="font-semibold">Conversations</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                View and continue your conversations with different AI personas.
              </p>
              <button className="mt-4 w-full rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20">
                View Conversations
              </button>
            </div>

            <div className="rounded-xl border bg-card p-6">
              <h3 className="font-semibold">Settings</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Configure your account preferences, API keys, and notification settings.
              </p>
              <button className="mt-4 w-full rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20">
                Account Settings
              </button>
            </div>
          </div>

          <div className="mt-8 rounded-xl border bg-card p-6">
            <h3 className="text-lg font-semibold">Account Information</h3>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{user?.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Role</p>
                <p className="font-medium">{user?.role}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Member Since</p>
                <p className="font-medium">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="font-medium">
                  {user?.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}