import { NextResponse } from 'next/server';
import { addMessage } from '@/lib/db';
import { ContactMessage } from '@/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, subject, message } = body;

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const newMessage: ContactMessage = {
      id: crypto.randomUUID(),
      name,
      email,
      phone,
      subject,
      message,
      createdAt: new Date().toISOString(),
      read: false,
    };

    await addMessage(newMessage);

    return NextResponse.json({ success: true, message: 'Message sent successfully' });
  } catch (error) {
    console.error('Error submitting contact form:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
