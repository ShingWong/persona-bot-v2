import ChatInterface from '@/components/chat/ChatInterface';
import { getPersonas } from '@/lib/api/persona';
import { getSessions } from '@/lib/api/session';
import { redirect } from 'next/navigation';

export default async function ChatPage() {
  // In a real implementation, we would fetch data here
  // For now, redirect to sessions page
  redirect('/sessions');
}