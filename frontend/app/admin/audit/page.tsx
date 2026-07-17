'use client';

import { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  User, 
  FileText,
  Calendar,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { AuditLog } from '@/lib/api/admin';

export default function AdminAuditPage() {
  const { user } = useAuthStore();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [resourceFilter, setResourceFilter] = useState<string>('all');
  const [, setUserFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'24h' | '7d' | '30d' | 'all'>('7d');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const limit = 50;

  useEffect(() => {
    if (user?.role !== 'ADMIN') return;
    loadAuditLogs();
  }, [user, page, dateRange]);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Mock data for now - will replace with actual API call
      const actions = [
        'user_login', 'user_logout', 'user_create', 'user_update', 'user_delete',
        'persona_create', 'persona_update', 'persona_delete',
        'session_create', 'session_update', 'session_delete',
        'message_send', 'message_receive',
        'quota_exceeded', 'quota_alert',
        'system_backup', 'system_update',
      ];
      
      const resourceTypes = ['user', 'persona', 'session', 'message', 'system', 'quota'];
      
      const mockLogs: AuditLog[] = Array.from({ length: 50 }, (_, i) => {
        const action = actions[Math.floor(Math.random() * actions.length)];
        const resourceType = resourceTypes[Math.floor(Math.random() * resourceTypes.length)];
        const hasUser = Math.random() > 0.2;
        
        return {
          id: `log-${i + 1}`,
          userId: hasUser ? `user-${Math.floor(Math.random() * 20) + 1}` : null,
          userEmail: hasUser ? `user${Math.floor(Math.random() * 20) + 1}@example.com` : null,
          action,
          resourceType,
          resourceId: Math.random() > 0.3 ? `resource-${Math.floor(Math.random() * 100) + 1}` : null,
          metadata: {
            ipAddress: Math.random() > 0.5 ? `192.168.1.${Math.floor(Math.random() * 255)}` : null,
            userAgent: Math.random() > 0.5 ? 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' : null,
            details: Math.random() > 0.7 ? 'Additional details about this action' : undefined,
          },
          ipAddress: Math.random() > 0.5 ? `192.168.1.${Math.floor(Math.random() * 255)}` : null,
          userAgent: Math.random() > 0.5 ? 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' : null,
          createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        };
      }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setLogs(mockLogs);
      setTotalPages(3);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const handleExportLogs = async () => {
    try {
      // Implement export functionality
      console.log('Exporting audit logs...');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to export logs');
    }
  };

  const handleViewDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setShowDetails(true);
  };

  const filteredLogs = logs.filter(log => {
    if (search) {
      const searchLower = search.toLowerCase();
      if (
        !log.userEmail?.toLowerCase().includes(searchLower) &&
        !log.action.toLowerCase().includes(searchLower) &&
        !log.resourceType.toLowerCase().includes(searchLower) &&
        !JSON.stringify(log.metadata).toLowerCase().includes(searchLower)
      ) {
        return false;
      }
    }
    if (actionFilter !== 'all' && log.action !== actionFilter) {
      return false;
    }
    if (resourceFilter !== 'all' && log.resourceType !== resourceFilter) {
      return false;
    }
    // if (userFilter !== 'all' && log.userId !== userFilter) {
    //   return false;
    // }
    return true;
  });

  const getActionIcon = (action: string) => {
    if (action.includes('login') || action.includes('create')) {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
    if (action.includes('delete') || action.includes('error') || action.includes('alert')) {
      return <XCircle className="h-4 w-4 text-red-600" />;
    }
    if (action.includes('update') || action.includes('modify')) {
      return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    }
    return <FileText className="h-4 w-4 text-gray-600" />;
  };

  const getActionColor = (action: string) => {
    if (action.includes('login') || action.includes('create')) {
      return 'bg-green-100 text-green-800';
    }
    if (action.includes('delete') || action.includes('error') || action.includes('alert')) {
      return 'bg-red-100 text-red-800';
    }
    if (action.includes('update') || action.includes('modify')) {
      return 'bg-yellow-100 text-yellow-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
  };

  const formatAction = (action: string) => {
    return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getUniqueActions = () => {
    const actions = new Set(logs.map(log => log.action));
    return Array.from(actions).sort();
  };

  const getUniqueResources = () => {
    const resources = new Set(logs.map(log => log.resourceType));
    return Array.from(resources).sort();
  };

  // const getUniqueUsers = () => {
  //   const users = new Map<string, string>();
  //   logs.forEach(log => {
  //     if (log.userId && log.userEmail) {
  //       users.set(log.userId, log.userEmail);
  //     }
  //   });
  //   return Array.from(users.entries()).map(([id, email]) => ({ id, email }));
  // };

  if (user?.role !== 'ADMIN') {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-6">
          <h2 className="text-lg font-semibold text-destructive">Access Denied</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Admin access is required to view audit logs.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Audit Logs</h1>
          <p className="mt-2 text-muted-foreground">
            System audit trail and security event monitoring
          </p>
        </div>
        <button
          onClick={handleExportLogs}
          className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          <Download className="mr-2 h-4 w-4" />
          Export Logs
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Filters */}
      <div className="rounded-lg border bg-card p-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search logs..."
                className="w-full rounded-md border bg-background pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          
          <div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <select
                className="w-full rounded-md border bg-background pl-10 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
              >
                <option value="all">All Actions</option>
                {getUniqueActions().map(action => (
                  <option key={action} value={action}>
                    {formatAction(action)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <select
                className="w-full rounded-md border bg-background pl-10 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                value={resourceFilter}
                onChange={(e) => setResourceFilter(e.target.value)}
              >
                <option value="all">All Resources</option>
                {getUniqueResources().map(resource => (
                  <option key={resource} value={resource}>
                    {resource.charAt(0).toUpperCase() + resource.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <select
                className="w-full rounded-md border bg-background pl-10 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as any)}
              >
                <option value="24h">Last 24 hours</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="all">All time</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="rounded-lg border bg-card">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-6 py-3 text-left text-sm font-semibold">Action</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">User</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Resource</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">IP Address</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Timestamp</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-muted/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {getActionIcon(log.action)}
                          <span className={`ml-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getActionColor(log.action)}`}>
                            {formatAction(log.action)}
                          </span>
                        </div>
                        {log.resourceId && (
                          <div className="mt-1 text-xs text-muted-foreground">
                            ID: {log.resourceId}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {log.userEmail ? (
                          <div className="flex items-center">
                            <User className="mr-2 h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">{log.userEmail}</div>
                              {log.userId && (
                                <div className="text-xs text-muted-foreground">
                                  {log.userId}
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">System</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span className="capitalize">{log.resourceType}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {log.ipAddress ? (
                          <code className="rounded bg-muted px-2 py-1 text-xs">
                            {log.ipAddress}
                          </code>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          {formatDate(log.createdAt)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(log.createdAt).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleViewDetails(log)}
                          className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-muted"
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t px-6 py-4">
              <div className="text-sm text-muted-foreground">
                Showing <span className="font-medium">{(page - 1) * limit + 1}</span> to{' '}
                <span className="font-medium">{Math.min(page * limit, filteredLogs.length)}</span> of{' '}
                <span className="font-medium">{filteredLogs.length}</span> logs
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-md border p-2 hover:bg-muted disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded-md border p-2 hover:bg-muted disabled:opacity-50"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Log Details Modal */}
      {showDetails && selectedLog && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50"
            onClick={() => setShowDetails(false)}
          />
          <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-background p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Audit Log Details</h3>
              <button
                onClick={() => setShowDetails(false)}
                className="rounded-md p-1 hover:bg-muted"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground">Action</label>
                  <div className="mt-1 flex items-center">
                    {getActionIcon(selectedLog.action)}
                    <span className="ml-2 font-medium">{formatAction(selectedLog.action)}</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-muted-foreground">Resource Type</label>
                  <div className="mt-1 font-medium capitalize">{selectedLog.resourceType}</div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-muted-foreground">User</label>
                  <div className="mt-1">
                    {selectedLog.userEmail ? (
                      <>
                        <div className="font-medium">{selectedLog.userEmail}</div>
                        {selectedLog.userId && (
                          <div className="text-sm text-muted-foreground">{selectedLog.userId}</div>
                        )}
                      </>
                    ) : (
                      <span className="text-muted-foreground">System</span>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-muted-foreground">Timestamp</label>
                  <div className="mt-1">
                    <div className="font-medium">
                      {new Date(selectedLog.createdAt).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(selectedLog.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </div>
              
              {selectedLog.resourceId && (
                <div>
                  <label className="block text-sm font-medium text-muted-foreground">Resource ID</label>
                  <code className="mt-1 block rounded bg-muted p-2 font-mono text-sm">
                    {selectedLog.resourceId}
                  </code>
                </div>
              )}
              
              {selectedLog.ipAddress && (
                <div>
                  <label className="block text-sm font-medium text-muted-foreground">IP Address</label>
                  <code className="mt-1 block rounded bg-muted p-2 font-mono text-sm">
                    {selectedLog.ipAddress}
                  </code>
                </div>
              )}
              
              {selectedLog.userAgent && (
                <div>
                  <label className="block text-sm font-medium text-muted-foreground">User Agent</label>
                  <code className="mt-1 block rounded bg-muted p-2 font-mono text-sm">
                    {selectedLog.userAgent}
                  </code>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-muted-foreground">Metadata</label>
                <pre className="mt-1 max-h-60 overflow-auto rounded bg-muted p-3 text-sm">
                  {JSON.stringify(selectedLog.metadata, null, 2)}
                </pre>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowDetails(false)}
                className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                Close
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}