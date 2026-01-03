import { NextResponse } from 'next/server';
import { getConversationById, updateConversation, deleteConversation } from '@/lib/db';
import { auth } from '@/auth';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    // Only admin can perform this action
    if (!session || (session.user as any).role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status } = body;
    
    if (!status || !['active', 'closed', 'archived'].includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const conversation = await getConversationById(id);
    if (!conversation) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    try {
        const updates: any = { status };
        if (status === 'archived') {
            updates.archivedAt = new Date().toISOString();
        } else {
            updates.archivedAt = undefined;
        }

        await updateConversation({ ...conversation, ...updates });
        return NextResponse.json({ success: true, conversation: { ...conversation, ...updates } });
    } catch (error) {
        console.error(`Error updating conversation: ${error}`);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session || (session.user as any).role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await deleteConversation(id);
    return NextResponse.json({ success: true });
}
