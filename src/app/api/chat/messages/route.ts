import { NextResponse } from 'next/server';
import { getChatMessages, addChatMessage, markChatMessagesAsRead, getConversationByUserId, createConversation, getConversationById } from '@/lib/db';
import { Message, Conversation } from '@/types';
import { auth } from '@/auth';

export async function GET(request: Request) {
  const session = await auth();
  
  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get('conversationId');

  if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID required' }, { status: 400 });
  }

  // Fetch conversation to check ownership
  const conversation = await getConversationById(conversationId);
  
  if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
  }

  // Security Check
  if (session && session.user) {
      const userRole = (session.user as any).role;
      // Admin can see any
      if (userRole !== 'admin') {
          // User can only see their own
          if (conversation.userId !== session.user.id) {
               return NextResponse.json({ error: 'Unauthorized access to this conversation' }, { status: 403 });
          }
          // If closed, user cannot see history (as requested: "chat clears from the user alone")
          if (conversation.status === 'closed') {
               return NextResponse.json({ error: 'This conversation is closed' }, { status: 403 });
          }
      }
  } else {
      // Guest (Unauthenticated)
      // Can only access if it's a guest conversation (starts with 'guest_')
      if (!conversation.userId.startsWith('guest_')) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      // If closed, guest cannot see history
      if (conversation.status === 'closed') {
           return NextResponse.json({ error: 'This conversation is closed' }, { status: 403 });
      }
  }

  const messages = await getChatMessages(conversationId);
  
  // Filter messages based on userClearedAt if not admin
  if (session?.user && (session.user as any).role === 'admin') {
      return NextResponse.json(messages);
  } else {
      // User or Guest
      if (conversation.userClearedAt) {
          const clearedTime = new Date(conversation.userClearedAt).getTime();
          console.log(`Filtering messages for user. Cleared at: ${conversation.userClearedAt} (${clearedTime})`);
          const filteredMessages = messages.filter(m => {
              const msgTime = new Date(m.createdAt).getTime();
              return msgTime > clearedTime;
          });
          console.log(`Filtered ${messages.length} -> ${filteredMessages.length} messages`);
          return NextResponse.json(filteredMessages);
      }
      return NextResponse.json(messages);
  }
}

export async function POST(request: Request) {
  const session = await auth();
  const body = await request.json();
  const { conversationId, content, image } = body;

  if (!content && !image) {
      return NextResponse.json({ error: 'Content or image required' }, { status: 400 });
  }

  let finalConversationId = conversationId;
  let senderId = '';
  let senderRole: 'admin' | 'user' = 'user';
  let targetConversation: Conversation | undefined;

  // AUTHENTICATED USER / ADMIN
  if (session && session.user) {
      senderId = session.user.id || '';
      senderRole = (session.user as any).role || 'user';

      // If no conversationId and user is not admin, assume user is starting/continuing their own
      if (!finalConversationId && senderRole !== 'admin') {
          const existing = await getConversationByUserId(session.user.id || '');
          if (existing && existing.status !== 'closed') {
              finalConversationId = existing.id;
              targetConversation = existing;
          } else {
              // Create new
              const newConv: Conversation = {
                  id: Math.random().toString(36).substr(2, 9),
                  userId: session.user.id || '',
                  userName: session.user.name || 'User',
                  userEmail: session.user.email || '',
                  lastMessageAt: new Date().toISOString(),
                  unreadCount: 0,
                  status: 'active'
              };
              await createConversation(newConv);
              finalConversationId = newConv.id;
              targetConversation = newConv;
          }
      }
  } 
  // GUEST USER
  else {
      if (!finalConversationId) {
          return NextResponse.json({ error: 'Conversation ID required for guest' }, { status: 400 });
      }
  }

  // If we haven't fetched the conversation yet (e.g. Admin provided ID, or Guest provided ID), fetch it
  if (!targetConversation && finalConversationId) {
      targetConversation = await getConversationById(finalConversationId);
  }

  if (!targetConversation) {
       return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
  }
  
  // Set senderId for Guest now that we have the conversation
  if (!session?.user) {
      senderId = targetConversation.userId;
      senderRole = 'user';
  }

  // Security Check for Write
  if (session && session.user) {
       const userRole = (session.user as any).role;
       if (userRole !== 'admin' && targetConversation.userId !== session.user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
       }
  } else {
       // Guest
       if (!targetConversation.userId.startsWith('guest_')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
       }
  }

  if (targetConversation.status === 'closed') {
      return NextResponse.json({ error: 'This conversation is closed' }, { status: 403 });
  }

  const newMessage: Message = {
      id: Math.random().toString(36).substr(2, 9),
      conversationId: targetConversation.id,
      senderId,
      senderRole,
      content: content || "",
      image: image || undefined,
      createdAt: new Date().toISOString(),
      isRead: false
  };

  await addChatMessage(newMessage);
  return NextResponse.json(newMessage);
}

export async function PUT(request: Request) {
    const session = await auth();
    const body = await request.json();
    const { conversationId } = body;
    
    if (!conversationId) {
        return NextResponse.json({ error: 'Conversation ID required' }, { status: 400 });
    }

    // Verify ownership/permissions
    const conversation = await getConversationById(conversationId);
    if (!conversation) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    let userRole: 'admin' | 'user' = 'user';
    if (session && session.user) {
        userRole = (session.user as any).role || 'user';
        if (userRole !== 'admin' && conversation.userId !== session.user.id) {
             return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
    } else {
        // Guest
        if (!conversation.userId.startsWith('guest_')) {
             return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    }

    await markChatMessagesAsRead(conversationId, userRole);
    return NextResponse.json({ success: true });
}
