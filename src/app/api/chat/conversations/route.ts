import { NextResponse } from 'next/server';
import { getConversations, getConversationByUserId, createConversation, cleanupArchivedConversations } from '@/lib/db';
import { Conversation } from '@/types';
import { auth } from '@/auth';

export async function GET(request: Request) {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const status = searchParams.get('status');

  // If admin, can fetch all or specific user
  // We need to cast session.user to any to access role if not typed globally
  const userRole = session.user.role;

  if (userRole === 'admin') {
      if (userId) {
          const conversation = await getConversationByUserId(userId);
          return NextResponse.json(conversation ? [conversation] : []);
      }
      const conversations = await getConversations();
      
      if (status === 'archived') {
          await cleanupArchivedConversations();
          const freshConversations = await getConversations();
          return NextResponse.json(freshConversations.filter(c => c.status === 'archived'));
      } else {
          // Default: exclude archived
          return NextResponse.json(conversations.filter(c => c.status !== 'archived'));
      }
  }

  // If user, return their own conversation
  const conversation = await getConversationByUserId(session.user.id || '');
  return NextResponse.json(conversation ? [conversation] : []);
}

export async function POST(request: Request) {
    const session = await auth();
    const body = await request.json();
    
    // If logged in user
    if (session && session.user) {
        // User starts a conversation
        const existing = await getConversationByUserId(session.user.id || '');
        if (existing && existing.status !== 'closed') {
            return NextResponse.json(existing);
        }

        const newConversation: Conversation = {
            id: Math.random().toString(36).substr(2, 9),
            userId: session.user.id || '',
            userName: session.user.name || 'User',
            userEmail: session.user.email || '',
            lastMessageAt: new Date().toISOString(),
            unreadCount: 0,
            status: 'active'
        };

        await createConversation(newConversation);
        return NextResponse.json(newConversation);
    }

    // Guest user
    const { name, email } = body;
    if (!name || !email) {
        return NextResponse.json({ error: 'Name and email required for guest chat' }, { status: 400 });
    }

    const newConversation: Conversation = {
        id: Math.random().toString(36).substr(2, 9),
        userId: `guest_${Math.random().toString(36).substr(2, 9)}`,
        userName: name,
        userEmail: email,
        lastMessageAt: new Date().toISOString(),
        unreadCount: 0,
        status: 'active'
    };

    await createConversation(newConversation);
    return NextResponse.json(newConversation);
}
