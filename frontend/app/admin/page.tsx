'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, 
  MessageSquare, 
  CreditCard, 
  Activity,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  BarChart3,
  FileText
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { adminApi } from '@/lib/api/admin';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalSessions: number;
  totalMessages: number;
  totalCost: number;
  systemHealth: 'healthy' | 'degraded' | 'unhealthy';
  recentAlerts: number;
  avgResponseTime: number;
}

export default function AdminDashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role !== 'ADMIN') return;

    loadDashboardStats();
    
    // Refresh stats every 30 seconds
    const interval = setInterval(loadDashboardStats, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // For now, mock data - will replace with actual API calls
      const mockStats: DashboardStats = {
        totalUsers: 142,
        activeUsers: 89,
        totalSessions: 1256,
        totalMessages: 89234,
        totalCost: 1245.67,
        systemHealth: 'healthy',
        recentAlerts: 3,
        avgResponseTime: 1.2,
      };
      
      setStats(mockStats);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'degraded': return 'text-yellow-600 bg-yellow-100';
      case 'unhealthy': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'healthy': return <CheckCircle2 className="h-5 w-5" />;
      case 'degraded': return <AlertCircle className="h-5 w-5" />;
      case 'unhealthy': return <AlertCircle className="h-5 w-5" />;
      default: return <Activity className="h-5 w-5" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          Overview of system performance, usage, and health
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Users</p>
              <p className="mt-2 text-3xl font-bold">{stats?.totalUsers || 0}</p>
            </div>
            <div className="rounded-full bg-primary/10 p-3">
              <Users className="h-6 w-6 text-primary" />
            </div>
          </div>
          <div className="mt-4">
            <Link
              href="/admin/users"
              className="text-sm font-medium text-primary hover:underline"
            >
              View all users →
            </Link>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Sessions</p>
              <p className="mt-2 text-3xl font-bold">{stats?.totalSessions || 0}</p>
            </div>
            <div className="rounded-full bg-blue-100 p-3">
              <MessageSquare className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4">
            <Link
              href="/admin/analytics"
              className="text-sm font-medium text-primary hover:underline"
            >
              View analytics →
            </Link>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Cost</p>
              <p className="mt-2 text-3xl font-bold">${stats?.totalCost?.toFixed(2) || '0.00'}</p>
            </div>
            <div className="rounded-full bg-green-100 p-3">
              <CreditCard className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4">
            <Link
              href="/admin/analytics"
              className="text-sm font-medium text-primary hover:underline"
            >
              View costs →
            </Link>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">System Health</p>
              <div className="mt-2 flex items-center space-x-2">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getHealthColor(stats?.systemHealth || 'healthy')}`}>
                  {getHealthIcon(stats?.systemHealth || 'healthy')}
                  <span className="ml-1 capitalize">{stats?.systemHealth || 'healthy'}</span>
                </span>
              </div>
            </div>
            <div className="rounded-full bg-purple-100 p-3">
              <Activity className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4">
            <Link
              href="/admin/monitoring"
              className="text-sm font-medium text-primary hover:underline"
            >
              View monitoring →
            </Link>
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-lg border bg-card p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Performance Metrics</h3>
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-muted p-4">
              <div className="flex items-center">
                <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Avg Response Time</span>
              </div>
              <p className="mt-2 text-2xl font-bold">{stats?.avgResponseTime?.toFixed(2) || '0.00'}s</p>
            </div>
            <div className="rounded-lg bg-muted p-4">
              <div className="flex items-center">
                <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Active Users</span>
              </div>
              <p className="mt-2 text-2xl font-bold">{stats?.activeUsers || 0}</p>
            </div>
            <div className="rounded-lg bg-muted p-4">
              <div className="flex items-center">
                <MessageSquare className="mr-2 h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Total Messages</span>
              </div>
              <p className="mt-2 text-2xl font-bold">{stats?.totalMessages?.toLocaleString() || '0'}</p>
            </div>
            <div className="rounded-lg bg-muted p-4">
              <div className="flex items-center">
                <AlertCircle className="mr-2 h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Recent Alerts</span>
              </div>
              <p className="mt-2 text-2xl font-bold">{stats?.recentAlerts || 0}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-lg font-semibold">Quick Actions</h3>
          <div className="mt-6 space-y-3">
            <Link
              href="/admin/users"
              className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted"
            >
              <div className="flex items-center">
                <Users className="mr-3 h-5 w-5 text-muted-foreground" />
                <span>Manage Users</span>
              </div>
              <span className="text-sm text-muted-foreground">→</span>
            </Link>
            <Link
              href="/admin/analytics"
              className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted"
            >
              <div className="flex items-center">
                <BarChart3 className="mr-3 h-5 w-5 text-muted-foreground" />
                <span>View Analytics</span>
              </div>
              <span className="text-sm text-muted-foreground">→</span>
            </Link>
            <Link
              href="/admin/audit"
              className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted"
            >
              <div className="flex items-center">
                <FileText className="mr-3 h-5 w-5 text-muted-foreground" />
                <span>Audit Logs</span>
              </div>
              <span className="text-sm text-muted-foreground">→</span>
            </Link>
            <Link
              href="/admin/monitoring"
              className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted"
            >
              <div className="flex items-center">
                <Activity className="mr-3 h-5 w-5 text-muted-foreground" />
                <span>System Monitoring</span>
              </div>
              <span className="text-sm text-muted-foreground">→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-lg border bg-card p-6">
        <h3 className="text-lg font-semibold">Recent Activity</h3>
        <div className="mt-4">
          <div className="divide-y">
            {[
              { user: 'John Doe', action: 'created a new persona', time: '2 minutes ago' },
              { user: 'Jane Smith', action: 'updated model configuration', time: '15 minutes ago' },
              { user: 'Bob Johnson', action: 'exceeded usage quota', time: '1 hour ago' },
              { user: 'System', action: 'performed nightly backup', time: '3 hours ago' },
            ].map((activity, index) => (
              <div key={index} className="flex items-center justify-between py-3">
                <div>
                  <span className="font-medium">{activity.user}</span>
                  <span className="text-muted-foreground"> {activity.action}</span>
                </div>
                <span className="text-sm text-muted-foreground">{activity.time}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 text-center">
            <Link
              href="/admin/audit"
              className="text-sm font-medium text-primary hover:underline"
            >
              View all activity →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}