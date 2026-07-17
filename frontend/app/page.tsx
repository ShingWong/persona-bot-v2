'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';

export default function Home() {
  const { isAuthenticated, user, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, []); // Empty dependency array - run only once on mount

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-4xl text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          Persona Bot
          <span className="block text-3xl font-semibold text-muted-foreground mt-2">
            Multi-persona AI Assistant Platform
          </span>
        </h1>
        
        <p className="mt-6 text-lg leading-8 text-muted-foreground">
          A comprehensive platform for managing and interacting with multiple AI personas.
          Built with modern web technologies and designed for extensibility.
        </p>

        {isAuthenticated ? (
          <div className="mt-8">
            <div className="inline-flex items-center rounded-full border bg-card px-6 py-3">
              <div className="mr-4 h-2 w-2 rounded-full bg-green-500" />
              <span className="text-sm font-medium">
                Signed in as {user?.name || user?.email}
              </span>
            </div>
            <div className="mt-6">
              <Link
                href="/dashboard"
                className="inline-flex items-center rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-8 flex justify-center space-x-4">
            <Link
              href="/auth/login"
              className="rounded-lg border px-6 py-3 text-sm font-medium transition-colors hover:bg-accent"
            >
              Sign In
            </Link>
            <Link
              href="/auth/register"
              className="rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Get Started
            </Link>
          </div>
        )}
        
        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg border bg-card p-6">
            <h3 className="font-semibold">Multi-Persona</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Jane, Yoda, Bobby, and custom personas with unique capabilities
            </p>
          </div>
          
          <div className="rounded-lg border bg-card p-6">
            <h3 className="font-semibold">Voice & Chat</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Voice-enabled mobile interface and desktop power interface
            </p>
          </div>
          
          <div className="rounded-lg border bg-card p-6">
            <h3 className="font-semibold">Real-world Integrations</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Cloud storage, email, calendar, SMS, and MCP server support
            </p>
          </div>
        </div>
        
        <div className="mt-12">
          <div className="rounded-lg border bg-muted/50 p-6">
            <h2 className="text-xl font-semibold">Project Status</h2>
            <p className="mt-2 text-sm">
              Currently in development. Follow the progress in the orchestration directory.
            </p>
            <div className="mt-4 flex items-center justify-center space-x-4">
              <div className="h-2 w-32 rounded-full bg-primary/20">
                <div className="h-full w-1/4 rounded-full bg-primary"></div>
              </div>
              <span className="text-sm font-medium">Stage 0: Foundation</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}