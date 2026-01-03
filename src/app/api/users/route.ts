
import { NextResponse } from 'next/server'
import { getUsers, addUser, getSettings } from '@/lib/db'
import { auth } from '@/auth'
import { User } from '@/types'
import bcrypt from 'bcryptjs'
import { sendEmail } from '@/lib/email'

export async function GET() {
  const session = await auth()
  
  if (!session || (session.user as any)?.role !== 'admin') {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const users = await getUsers()
  // Remove passwords before returning
  const safeUsers = users.map(({ password, ...user }) => user)
  
  return NextResponse.json(safeUsers)
}

export async function POST(req: Request) {
  const session = await auth()
  
  if (!session || (session.user as any)?.role !== 'admin') {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const body = await req.json()
    const { email, password, name, role, phone, image } = body

    if (!email || !password || !name) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    
    const newUser: User = {
      id: Math.random().toString(36).substring(2, 11),
      email,
      password: hashedPassword,
      name,
      phone,
      image,
      role: role || 'user',
      createdAt: new Date().toISOString()
    }

    await addUser(newUser)
    
    const { password: _, ...safeUser } = newUser
    return NextResponse.json(safeUser)
  } catch (error) {
    return new NextResponse('Internal Error', { status: 500 })
  }
}
