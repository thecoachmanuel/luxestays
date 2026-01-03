
import { NextResponse } from 'next/server'
import { getUsers, updateUser, deleteUser, getUserByEmail } from '@/lib/db'
import { auth } from '@/auth'
import bcrypt from 'bcryptjs'

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  const { id } = await params
  
  if (!session) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  // Get user from DB to check permissions
  const users = await getUsers()
  const userToUpdate = users.find(u => u.id === id)

  if (!userToUpdate) {
    return new NextResponse('User not found', { status: 404 })
  }

  // Allow admin or the user themselves
  const isSelf = session.user?.email === userToUpdate.email
  const isAdmin = (session.user as any)?.role === 'admin'

  if (!isSelf && !isAdmin) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  try {
    const body = await req.json()
    const { name, email, password, role, image, phone } = body

    const updatedUser = { ...userToUpdate }

    if (name) updatedUser.name = name
    if (email) updatedUser.email = email // Note: Changing email might require re-verification in a real app
    if (role && isAdmin) updatedUser.role = role // Only admin can change role
    if (image) updatedUser.image = image
    if (phone) updatedUser.phone = phone
    
    if (password) {
        updatedUser.password = await bcrypt.hash(password, 10)
    }

    await updateUser(updatedUser)
    
    const { password: _, ...safeUser } = updatedUser
    return NextResponse.json(safeUser)
  } catch (error) {
    console.error(error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  const { id } = await params
  
  if (!session || (session.user as any)?.role !== 'admin') {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    await deleteUser(id)
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    return new NextResponse('Internal Error', { status: 500 })
  }
}
