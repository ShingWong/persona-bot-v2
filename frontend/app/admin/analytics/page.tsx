'use client';

import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { 
  Download, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Users,
  MessageSquare,
  Activity
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { UsageStat, CostBreakdown, TopUser, TopPersona } from '@/lib/api/admin';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export default function AdminAnalyticsPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [usageStats, setUsageStats] = useState<UsageStat[]>([]);
  const [costBreakdown, setCostBreakdown] = useState<CostBreakdown[]>([]);
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);
  const [topPersonas, setTopPersonas] = useState<TopPersona[]>([]);
  const [systemSummary, setSystemSummary] = useState<any>(null);

  useEffect(() => {
    if (user?.role !== 'ADMIN') return;
    loadAnalyticsData();
  }, [user, timeRange]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Mock data for now - will replace with actual API calls
      const mockUsageStats: UsageStat[] = Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        return {
          date: date.toISOString().split('T')[0],
          totalTokens: Math.floor(Math.random() * 1000000) + 500000,
          totalCost: Math.random() * 100 + 50,
          userCount: Math.floor(Math.random() * 50) + 30,
          sessionCount: Math.floor(Math.random() * 200) + 100,
        };
      });
      
      const mockCostBreakdown: CostBreakdown[] = [
        { provider: 'OpenAI', model: 'GPT-4', totalCost: 450.25, totalTokens: 1250000, percentage: 35 },
        { provider: 'OpenAI', model: 'GPT-3.5', totalCost: 320.75, totalTokens: 1850000, percentage: 25 },
        { provider: 'Anthropic', model: 'Claude-3', totalCost: 280.50, totalTokens: 950000, percentage: 22 },
        { provider: 'Google', model: 'Gemini Pro', totalCost: 150.30, totalTokens: 750000, percentage: 12 },
        { provider: 'Other', model: 'Various', totalCost: 43.87, totalTokens: 250000, percentage: 6 },
      ];
      
      const mockTopUsers: TopUser[] = Array.from({ length: 10 }, (_, i) => ({
        userId: `user-${i + 1}`,
        email: `user${i + 1}@example.com`,
        name: i % 2 === 0 ? `User ${i + 1}` : null,
        totalTokens: Math.floor(Math.random() * 500000) + 100000,
        totalCost: Math.random() * 100 + 20,
        sessionCount: Math.floor(Math.random() * 50) + 10,
      })).sort((a, b) => b.totalTokens - a.totalTokens);
      
      const mockTopPersonas: TopPersona[] = Array.from({ length: 8 }, (_, i) => ({
        personaId: `persona-${i + 1}`,
        name: `Persona ${i + 1}`,
        description: i % 2 === 0 ? 'Helpful assistant' : 'Creative writer',
        totalTokens: Math.floor(Math.random() * 300000) + 50000,
        totalCost: Math.random() * 50 + 10,
        userCount: Math.floor(Math.random() * 20) + 5,
      })).sort((a, b) => b.totalTokens - a.totalTokens);
      
      const mockSystemSummary = {
        totalCost: 1245.67,
        totalTokens: 5000000,
        totalUsers: 142,
        totalSessions: 1256,
        totalMessages: 89234,
        avgCostPerUser: 8.77,
        avgTokensPerSession: 3980,
        costChange: 12.5,
        usageChange: 8.3,
      };
      
      setUsageStats(mockUsageStats);
      setCostBreakdown(mockCostBreakdown);
      setTopUsers(mockTopUsers);
      setTopPersonas(mockTopPersonas);
      setSystemSummary(mockSystemSummary);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleExportData = () => {
    // Implement export functionality
    console.log('Exporting analytics data...');
  };

  if (user?.role !== 'ADMIN') {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-6">
          <h2 className="text-lg font-semibold text-destructive">Access Denied</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Admin access is required to view analytics.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
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
          <h1 className="text-3xl font-bold">Usage Analytics</h1>
          <p className="mt-2 text-muted-foreground">
            System-wide usage statistics and cost analysis
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex rounded-md border">
            {(['7d', '30d', '90d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 text-sm font-medium ${
                  timeRange === range
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
          <button
            onClick={handleExportData}
            className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Cost</p>
              <p className="mt-2 text-3xl font-bold">
                {formatCurrency(systemSummary?.totalCost || 0)}
              </p>
              <div className="mt-2 flex items-center text-sm">
                {systemSummary?.costChange > 0 ? (
                  <TrendingUp className="mr-1 h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="mr-1 h-4 w-4 text-red-600" />
                )}
                <span className={systemSummary?.costChange > 0 ? 'text-green-600' : 'text-red-600'}>
                  {Math.abs(systemSummary?.costChange || 0)}%
                </span>
                <span className="ml-2 text-muted-foreground">from last period</span>
              </div>
            </div>
            <div className="rounded-full bg-primary/10 p-3">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Tokens</p>
              <p className="mt-2 text-3xl font-bold">
                {formatNumber(systemSummary?.totalTokens || 0)}
              </p>
              <div className="mt-2 flex items-center text-sm">
                {systemSummary?.usageChange > 0 ? (
                  <TrendingUp className="mr-1 h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="mr-1 h-4 w-4 text-red-600" />
                )}
                <span className={systemSummary?.usageChange > 0 ? 'text-green-600' : 'text-red-600'}>
                  {Math.abs(systemSummary?.usageChange || 0)}%
                </span>
                <span className="ml-2 text-muted-foreground">from last period</span>
              </div>
            </div>
            <div className="rounded-full bg-blue-100 p-3">
              <Activity className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Users</p>
              <p className="mt-2 text-3xl font-bold">{systemSummary?.totalUsers || 0}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Avg cost: {formatCurrency(systemSummary?.avgCostPerUser || 0)}
              </p>
            </div>
            <div className="rounded-full bg-green-100 p-3">
              <Users className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Sessions</p>
              <p className="mt-2 text-3xl font-bold">{systemSummary?.totalSessions || 0}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Avg tokens: {formatNumber(systemSummary?.avgTokensPerSession || 0)}
              </p>
            </div>
            <div className="rounded-full bg-purple-100 p-3">
              <MessageSquare className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Usage Trends Chart */}
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-lg font-semibold">Usage Trends</h3>
          <p className="mt-1 text-sm text-muted-foreground">Daily token usage over time</p>
          <div className="mt-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={usageStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  stroke="#9CA3AF"
                />
                <YAxis 
                  stroke="#9CA3AF"
                  tickFormatter={formatNumber}
                />
                <Tooltip 
                  formatter={(value: any) => [formatCurrency(value as number), 'Cost']}
                />
                <Area 
                  type="monotone" 
                  dataKey="totalTokens" 
                  stroke="#3B82F6" 
                  fill="#3B82F6" 
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cost Breakdown Chart */}
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-lg font-semibold">Cost Breakdown</h3>
          <p className="mt-1 text-sm text-muted-foreground">Cost distribution by provider/model</p>
          <div className="mt-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={costBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(props) => {
                    const { name, percent } = props;
                    return `${name}: ${((percent || 0) * 100).toFixed(0)}%`;
                  }}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="totalCost"
                >
                  {costBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [formatCurrency(value as number), 'Cost']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Users */}
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-lg font-semibold">Top Users by Usage</h3>
          <p className="mt-1 text-sm text-muted-foreground">Users with highest token consumption</p>
          <div className="mt-4">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-3 text-left text-sm font-semibold">User</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Tokens</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Cost</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Sessions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {topUsers.map((user) => (
                    <tr key={user.userId} className="hover:bg-muted/50">
                      <td className="px-4 py-3">
                        <div className="font-medium">{user.name || user.email}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {formatNumber(user.totalTokens)}
                      </td>
                      <td className="px-4 py-3">
                        {formatCurrency(user.totalCost)}
                      </td>
                      <td className="px-4 py-3">
                        {user.sessionCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Top Personas */}
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-lg font-semibold">Top Personas by Usage</h3>
          <p className="mt-1 text-sm text-muted-foreground">Most used personas</p>
          <div className="mt-4">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-3 text-left text-sm font-semibold">Persona</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Tokens</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Cost</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Users</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {topPersonas.map((persona) => (
                    <tr key={persona.personaId} className="hover:bg-muted/50">
                      <td className="px-4 py-3">
                        <div className="font-medium">{persona.name}</div>
                        {persona.description && (
                          <div className="text-sm text-muted-foreground">{persona.description}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {formatNumber(persona.totalTokens)}
                      </td>
                      <td className="px-4 py-3">
                        {formatCurrency(persona.totalCost)}
                      </td>
                      <td className="px-4 py-3">
                        {persona.userCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="rounded-lg border bg-card p-6">
        <h3 className="text-lg font-semibold">Cost vs Usage</h3>
        <p className="mt-1 text-sm text-muted-foreground">Cost per token by provider</p>
        <div className="mt-4 h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={costBreakdown}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="model" 
                stroke="#9CA3AF"
              />
              <YAxis 
                stroke="#9CA3AF"
                tickFormatter={formatCurrency}
              />
                <Tooltip 
                  formatter={(value: any, name: any) => {
                    if (name === 'totalCost') return [formatCurrency(value as number), 'Cost'];
                    if (name === 'totalTokens') return [formatNumber(value as number), 'Tokens'];
                    return [value, name];
                  }}
                />
              <Legend />
              <Bar 
                dataKey="totalCost" 
                name="Total Cost" 
                fill="#3B82F6" 
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                dataKey="totalTokens" 
                name="Total Tokens" 
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