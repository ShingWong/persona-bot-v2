'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { 
  Activity, 
  Database, 
  Server, 
  Cpu, 
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { SystemHealth } from '@/lib/api/admin';

export default function AdminMonitoringPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<any[]>([]);
  const [providerStatus, setProviderStatus] = useState<Record<string, any>>({});
  const [timeframe, setTimeframe] = useState<'1h' | '24h' | '7d'>('1h');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const loadMonitoringData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Mock data for now - will replace with actual API calls
      const mockSystemHealth: SystemHealth = {
        status: Math.random() > 0.1 ? 'healthy' : Math.random() > 0.5 ? 'degraded' : 'unhealthy',
        services: {
          database: Math.random() > 0.1,
          redis: Math.random() > 0.05,
          llmProviders: {
            'OpenAI': Math.random() > 0.05,
            'Anthropic': Math.random() > 0.1,
            'Google': Math.random() > 0.15,
            'Azure': Math.random() > 0.2,
          },
        },
        metrics: {
          responseTime: Math.random() * 2 + 0.5,
          errorRate: Math.random() * 5,
          activeConnections: Math.floor(Math.random() * 500) + 100,
        },
        lastUpdated: new Date().toISOString(),
      };
      
      const mockPerformanceMetrics = Array.from({ length: timeframe === '1h' ? 60 : timeframe === '24h' ? 24 : 7 }, (_, i) => {
        const timestamp = new Date();
        if (timeframe === '1h') {
          timestamp.setMinutes(timestamp.getMinutes() - (59 - i));
        } else if (timeframe === '24h') {
          timestamp.setHours(timestamp.getHours() - (23 - i));
        } else {
          timestamp.setDate(timestamp.getDate() - (6 - i));
        }
        
        return {
          timestamp: timestamp.toISOString(),
          responseTime: Math.random() * 3 + 0.5,
          errorRate: Math.random() * 10,
          activeConnections: Math.floor(Math.random() * 600) + 50,
          requestsPerMinute: Math.floor(Math.random() * 1000) + 200,
          cpuUsage: Math.random() * 80 + 20,
          memoryUsage: Math.random() * 70 + 30,
        };
      });
      
      const mockProviderStatus = {
        'OpenAI': {
          status: Math.random() > 0.05 ? 'healthy' : 'degraded',
          latency: Math.random() * 500 + 100,
          successRate: Math.random() * 10 + 90,
          lastChecked: new Date().toISOString(),
        },
        'Anthropic': {
          status: Math.random() > 0.1 ? 'healthy' : 'degraded',
          latency: Math.random() * 600 + 150,
          successRate: Math.random() * 15 + 85,
          lastChecked: new Date().toISOString(),
        },
        'Google': {
          status: Math.random() > 0.15 ? 'healthy' : 'degraded',
          latency: Math.random() * 400 + 80,
          successRate: Math.random() * 8 + 92,
          lastChecked: new Date().toISOString(),
        },
        'Azure': {
          status: Math.random() > 0.2 ? 'healthy' : 'degraded',
          latency: Math.random() * 700 + 200,
          successRate: Math.random() * 20 + 80,
          lastChecked: new Date().toISOString(),
        },
      };
      
      setSystemHealth(mockSystemHealth);
      setPerformanceMetrics(mockPerformanceMetrics);
      setProviderStatus(mockProviderStatus);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load monitoring data');
    } finally {
      setLoading(false);
    }
  }, [timeframe]);

  useEffect(() => {
    if (user?.role !== 'ADMIN') return;
    loadMonitoringData();
    
    if (autoRefresh) {
      const interval = setInterval(loadMonitoringData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [user, timeframe, autoRefresh, loadMonitoringData]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'degraded': return 'text-yellow-600 bg-yellow-100';
      case 'unhealthy': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-5 w-5" />;
      case 'degraded': return <AlertCircle className="h-5 w-5" />;
      case 'unhealthy': return <XCircle className="h-5 w-5" />;
      default: return <Activity className="h-5 w-5" />;
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    if (timeframe === '1h') {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (timeframe === '24h') {
      return date.toLocaleTimeString([], { hour: '2-digit' }) + 'h';
    } else {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    }
  };

  const formatLatency = (ms: number) => {
    return `${ms.toFixed(0)}ms`;
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (user?.role !== 'ADMIN') {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-6">
          <h2 className="text-lg font-semibold text-destructive">Access Denied</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Admin access is required to view system monitoring.
          </p>
        </div>
      </div>
    );
  }

  if (loading && !systemHealth) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Monitoring</h1>
          <p className="mt-2 text-muted-foreground">
            Real-time system health, performance metrics, and service status
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex rounded-md border">
            {(['1h', '24h', '7d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeframe(range)}
                className={`px-4 py-2 text-sm font-medium ${
                  timeframe === range
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
          <button
            onClick={loadMonitoringData}
            className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="h-4 w-4 rounded"
            />
            <span className="text-sm">Auto-refresh</span>
          </label>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* System Health Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">System Status</p>
              <div className="mt-2 flex items-center">
                {getStatusIcon(systemHealth?.status || 'healthy')}
                <span className={`ml-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(systemHealth?.status || 'healthy')}`}>
                  {systemHealth?.status?.toUpperCase() || 'HEALTHY'}
                </span>
              </div>
            </div>
            <div className="rounded-full bg-primary/10 p-3">
              <Server className="h-6 w-6 text-primary" />
            </div>
          </div>
          <div className="mt-4 text-xs text-muted-foreground">
            Last updated: {systemHealth ? new Date(systemHealth.lastUpdated).toLocaleTimeString() : '—'}
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Avg Response Time</p>
              <p className="mt-2 text-3xl font-bold">
                {systemHealth?.metrics.responseTime?.toFixed(2) || '0.00'}s
              </p>
              <div className="mt-2 flex items-center text-sm">
                <TrendingDown className="mr-1 h-4 w-4 text-green-600" />
                <span className="text-green-600">12%</span>
                <span className="ml-2 text-muted-foreground">from last hour</span>
              </div>
            </div>
            <div className="rounded-full bg-blue-100 p-3">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Error Rate</p>
              <p className="mt-2 text-3xl font-bold">
                {systemHealth?.metrics.errorRate?.toFixed(2) || '0.00'}%
              </p>
              <div className="mt-2 flex items-center text-sm">
                <TrendingUp className="mr-1 h-4 w-4 text-red-600" />
                <span className="text-red-600">3%</span>
                <span className="ml-2 text-muted-foreground">from last hour</span>
              </div>
            </div>
            <div className="rounded-full bg-red-100 p-3">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Connections</p>
              <p className="mt-2 text-3xl font-bold">
                {systemHealth?.metrics.activeConnections || 0}
              </p>
              <div className="mt-2 flex items-center text-sm">
                <TrendingUp className="mr-1 h-4 w-4 text-green-600" />
                <span className="text-green-600">8%</span>
                <span className="ml-2 text-muted-foreground">from last hour</span>
              </div>
            </div>
            <div className="rounded-full bg-green-100 p-3">
              <Activity className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Service Status */}
      <div className="rounded-lg border bg-card p-6">
        <h3 className="text-lg font-semibold">Service Status</h3>
        <p className="mt-1 text-sm text-muted-foreground">Current status of all system services</p>
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Database className="mr-3 h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Database</span>
              </div>
              {systemHealth?.services.database ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              PostgreSQL 15
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Server className="mr-3 h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Redis Cache</span>
              </div>
              {systemHealth?.services.redis ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              Redis 7.2
            </div>
          </div>

          {Object.entries(systemHealth?.services.llmProviders || {}).map(([provider, status]) => (
            <div key={provider} className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Cpu className="mr-3 h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">{provider}</span>
                </div>
                {status ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                LLM Provider
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Response Time & Error Rate */}
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-lg font-semibold">Response Time & Error Rate</h3>
          <p className="mt-1 text-sm text-muted-foreground">Performance metrics over time</p>
          <div className="mt-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceMetrics}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={formatTime}
                  stroke="#9CA3AF"
                />
                <YAxis 
                  stroke="#9CA3AF"
                  yAxisId="left"
                  tickFormatter={(value) => `${value}s`}
                />
                <YAxis 
                  stroke="#9CA3AF"
                  yAxisId="right"
                  orientation="right"
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip 
                  formatter={(value: any, name: any) => {
                    if (name === 'responseTime') return [`${value}s`, 'Response Time'];
                    if (name === 'errorRate') return [`${value}%`, 'Error Rate'];
                    return [value, name];
                  }}
                  labelFormatter={(label) => formatTime(label as string)}
                />
                <Legend />
                <Area 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="responseTime" 
                  name="Response Time"
                  stroke="#3B82F6" 
                  fill="#3B82F6" 
                  fillOpacity={0.2}
                />
                <Area 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="errorRate" 
                  name="Error Rate"
                  stroke="#EF4444" 
                  fill="#EF4444" 
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Active Connections & Requests */}
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-lg font-semibold">Connections & Requests</h3>
          <p className="mt-1 text-sm text-muted-foreground">System load metrics</p>
          <div className="mt-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceMetrics}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={formatTime}
                  stroke="#9CA3AF"
                />
                <YAxis 
                  stroke="#9CA3AF"
                />
                <Tooltip 
                  formatter={(value: any, name: any) => {
                    if (name === 'activeConnections') return [value, 'Active Connections'];
                    if (name === 'requestsPerMinute') return [value, 'Requests/Min'];
                    return [value, name];
                  }}
                  labelFormatter={(label) => formatTime(label as string)}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="activeConnections" 
                  name="Active Connections"
                  stroke="#10B981" 
                  strokeWidth={2}
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="requestsPerMinute" 
                  name="Requests/Min"
                  stroke="#8B5CF6" 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Provider Status */}
      <div className="rounded-lg border bg-card p-6">
        <h3 className="text-lg font-semibold">LLM Provider Status</h3>
        <p className="mt-1 text-sm text-muted-foreground">Performance and availability of AI providers</p>
        <div className="mt-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="px-6 py-3 text-left text-sm font-semibold">Provider</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Latency</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Success Rate</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Last Checked</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {Object.entries(providerStatus).map(([provider, status]) => (
                  <tr key={provider} className="hover:bg-muted/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <Cpu className="mr-3 h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">{provider}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {getStatusIcon(status.status)}
                        <span className={`ml-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(status.status)}`}>
                          {status.status.toUpperCase()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium">{formatLatency(status.latency)}</div>
                      <div className="text-sm text-muted-foreground">
                        {status.latency < 300 ? 'Excellent' : status.latency < 600 ? 'Good' : 'Slow'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium">{formatPercentage(status.successRate)}</div>
                      <div className="h-2 w-full rounded-full bg-muted">
                        <div 
                          className="h-full rounded-full bg-green-600"
                          style={{ width: `${status.successRate}%` }}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {new Date(status.lastChecked).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* System Resources */}
      <div className="rounded-lg border bg-card p-6">
        <h3 className="text-lg font-semibold">System Resources</h3>
        <p className="mt-1 text-sm text-muted-foreground">CPU and memory utilization</p>
        <div className="mt-4 h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={performanceMetrics}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="timestamp" 
                tickFormatter={formatTime}
                stroke="#9CA3AF"
              />
              <YAxis 
                stroke="#9CA3AF"
                tickFormatter={(value) => `${value}%`}
              />
                <Tooltip 
                  formatter={(value: any, name: any) => {
                    if (name === 'cpuUsage') return [`${value}%`, 'CPU Usage'];
                    if (name === 'memoryUsage') return [`${value}%`, 'Memory Usage'];
                    return [value, name];
                  }}
                  labelFormatter={(label) => formatTime(label as string)}
                />
              <Legend />
              <Bar 
                dataKey="cpuUsage" 
                name="CPU Usage"
                fill="#3B82F6" 
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                dataKey="memoryUsage" 
                name="Memory Usage"
                fill="#10B981" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}