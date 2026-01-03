
import { NextResponse } from 'next/server'
import { addUser, getSettings, getUserByEmail } from '@/lib/db'
import { User } from '@/types'
import bcrypt from 'bcryptjs'
import { sendWelcomeEmail } from '@/lib/email'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, password, name } = body

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase();

    // Check if user already exists
    const existingUser = await getUserByEmail(normalizedEmail)
    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)
    
    const newUser: User = {
      id: Math.random().toString(36).substring(2, 11),
      email: normalizedEmail,
      password: hashedPassword,
      name,
      role: 'user', // Force user role
      createdAt: new Date().toISOString()
    }

    await addUser(newUser)
    
    // Send Welcome Email
    try {
        const settings = await getSettings();
        if (settings.welcomeEmail?.enabled) {
            await sendWelcomeEmail(email, name);
        }
    } catch (e) {
        console.error('Failed to send welcome email:', e);
        // Don't fail the registration if email fails
    }

    const { password: _, ...safeUser } = newUser
    return NextResponse.json(safeUser)
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 })
  }
}
