import { NextResponse } from 'next/server';
import { getConversationById, updateConversation } from '@/lib/db';
import { auth } from '@/auth';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: 'Conversation ID required' }, { status: 400 });
  }

  const conversation = await getConversationById(id);
  if (!conversation) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
  }

  let isAuthorized = false;

  // 1. Admin is always authorized
  if (session?.user && (session.user as any).role === 'admin') {
      isAuthorized = true;
  }
  // 2. Authenticated user is authorized if they own the conversation
  else if (session?.user && session.user.id === conversation.userId) {
      isAuthorized = true;
  }
  // 3. Guest user (allow if conversation is a guest conversation)
  else if (conversation.userId.startsWith('guest_')) {
      isAuthorized = true;
  }

  if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    console.log(`Clearing history for conversation ${id} at ${new Date().toISOString()}`);
    await updateConversation({
        ...conversation,
        userClearedAt: new Date().toISOString()
    });
    console.log(`History cleared successfully for ${id}`);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error clearing chat history:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
