'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, MessageSquare, Clock, Trash2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { sessionApi } from '@/lib/api/session';
import { personaApi } from '@/lib/api/persona';
import { useRouter } from 'next/navigation';

interface Session {
  id: string;
  title: string;
  personaId: string | null;
  status: string;
  lastActiveAt: string;
  messageCount: number;
  tokensUsed: number;
}

interface Persona {
  id: string;
  name: string;
  displayName: string;
  shortDescription: string;
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    loadData();
  }, [isAuthenticated, router]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sessionsData, personasData] = await Promise.all([
        sessionApi.getSessions(),
        personaApi.getPersonas()
      ]);
      setSessions(sessionsData);
      setPersonas(personasData);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async () => {
    try {
      // Create a new session with first persona
      const firstPersona = personas[0];
      if (!firstPersona) {
        setError('No personas available. Please create a persona first.');
        return;
      }

      const newSession = await sessionApi.createSession({
        title: `Chat with ${firstPersona.displayName}`,
        personaId: firstPersona.id
      });

      router.push(`/sessions/${newSession.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create session');
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this session?')) return;

    try {
      await sessionApi.deleteSession(sessionId);
      setSessions(sessions.filter(s => s.id !== sessionId));
    } catch (err: any) {
      setError(err.message || 'Failed to delete session');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getPersonaName = (personaId: string | null) => {
    if (!personaId) return 'No persona';
    const persona = personas.find(p => p.id === personaId);
    return persona ? persona.displayName : 'Unknown persona';
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading sessions...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Chat Sessions</h1>
          <p className="text-muted-foreground mt-2">
            Manage your conversations with AI personas
          </p>
        </div>
        <div className="flex gap-4">
          <Link href="/personas">
            <Button variant="outline">Manage Personas</Button>
          </Link>
          <Button onClick={handleCreateSession} className="gap-2">
            <Plus className="h-4 w-4" />
            New Chat
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/15 text-destructive p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {sessions.length === 0 ? (
        <Card className="text-center p-12">
          <CardHeader>
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <CardTitle>No chat sessions yet</CardTitle>
            <CardDescription>
              Start a new conversation with one of your AI personas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleCreateSession} size="lg" className="gap-2">
              <Plus className="h-5 w-5" />
              Start Your First Chat
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sessions.map((session) => (
            <Card key={session.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg truncate">{session.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {getPersonaName(session.personaId)}
                    </CardDescription>
                  </div>
                  <Badge variant={session.status === 'ACTIVE' ? 'default' : 'secondary'}>
                    {session.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    <span>{session.messageCount} messages</span>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>Last active: {formatDate(session.lastActiveAt)}</span>
                  </div>
                  {session.tokensUsed > 0 && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Tokens used:</span>
                      <span className="ml-2 font-medium">{session.tokensUsed.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Link href={`/sessions/${session.id}`}>
                  <Button variant="default" size="sm">
                    Continue Chat
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteSession(session.id)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}