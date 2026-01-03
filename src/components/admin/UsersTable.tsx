
'use client'

import { useState } from 'react'
import { User } from '@/types'
import { useRouter } from 'next/navigation'
import { Edit2, Trash2, Plus, X, Check, Loader2 } from 'lucide-react'

interface UsersTableProps {
  initialUsers: User[]
}

export function UsersTable({ initialUsers }: UsersTableProps) {
  const router = useRouter()
  const [users, setUsers] = useState(initialUsers)
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  
  // Form states
  const [formData, setFormData] = useState<Partial<User>>({})

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return

    try {
      await fetch(`/api/users/${id}`, { method: 'DELETE' })
      setUsers(users.filter(u => u.id !== id))
      router.refresh()
    } catch (error) {
      alert('Failed to delete user')
    }
  }

  const startEdit = (user: User) => {
    setEditingId(user.id)
    setFormData({ 
      name: user.name, 
      email: user.email, 
      phone: user.phone,
      image: user.image,
      role: user.role,
      password: '' // Don't show password, allow reset
    })
    setIsCreating(false)
  }

  const startCreate = () => {
    setEditingId(null)
    setFormData({ name: '', email: '', phone: '', image: '', password: '', role: 'user' })
    setIsCreating(true)
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      if (isCreating) {
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        })
        if (!res.ok) throw new Error('Failed to create')
        const newUser = await res.json()
        setUsers([...users, newUser])
      } else if (editingId) {
        const res = await fetch(`/api/users/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        })
        if (!res.ok) throw new Error('Failed to update')
        const updatedUser = await res.json()
        setUsers(users.map(u => u.id === editingId ? updatedUser : u))
      }
      
      setEditingId(null)
      setIsCreating(false)
      setFormData({})
      router.refresh()
    } catch (error) {
      alert('Operation failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-xl font-semibold">All Users</h2>
        <button
          onClick={startCreate}
          className="flex items-center gap-2 rounded-md bg-[var(--brand)] px-4 py-2 text-sm font-medium text-[var(--background)] hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Add User
        </button>
      </div>

      {isCreating && (
        <div className="mb-6 rounded-lg border border-[var(--secondary)]/20 bg-[var(--secondary)]/5 p-4">
          <h3 className="mb-4 font-medium">Create New User</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <input
              placeholder="Name"
              value={formData.name || ''}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="rounded-md border border-[var(--secondary)]/20 bg-[var(--background)] p-2"
            />
            <input
              placeholder="Email"
              value={formData.email || ''}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              className="rounded-md border border-[var(--secondary)]/20 bg-[var(--background)] p-2"
            />
            <input
              placeholder="Phone"
              value={formData.phone || ''}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              className="rounded-md border border-[var(--secondary)]/20 bg-[var(--background)] p-2"
            />
            <input
              placeholder="Image URL"
              value={formData.image || ''}
              onChange={e => setFormData({ ...formData, image: e.target.value })}
              className="rounded-md border border-[var(--secondary)]/20 bg-[var(--background)] p-2"
            />
            <input
              type="password"
              placeholder="Password"
              value={formData.password || ''}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
              className="rounded-md border border-[var(--secondary)]/20 bg-[var(--background)] p-2"
            />
            <select
              value={formData.role || 'user'}
              onChange={e => setFormData({ ...formData, role: e.target.value as 'admin' | 'user' })}
              className="rounded-md border border-[var(--secondary)]/20 bg-[var(--background)] p-2"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center gap-1 rounded bg-[var(--accent)] px-3 py-1 text-sm text-[var(--background)] hover:opacity-90"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Save
            </button>
            <button
              onClick={() => setIsCreating(false)}
              className="flex items-center gap-1 rounded bg-[var(--secondary)] px-3 py-1 text-sm text-[var(--background)] hover:opacity-90"
            >
              <X className="h-4 w-4" /> Cancel
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-[var(--secondary)]/20 bg-[var(--background)] shadow">
        <table className="w-full text-left text-sm text-[var(--secondary)]">
          <thead className="bg-[var(--secondary)]/5 text-xs uppercase text-[var(--foreground)]">
            <tr>
              <th className="px-6 py-3">Avatar</th>
              <th className="px-6 py-3">Name</th>
              <th className="px-6 py-3">Email</th>
              <th className="px-6 py-3">Phone</th>
              <th className="px-6 py-3">Role</th>
              <th className="px-6 py-3">Created At</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--secondary)]/20">
            {users.map((user) => (
              <tr key={user.id}>
                {editingId === user.id ? (
                  <>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2">
                        {formData.image && (
                          <img 
                            src={formData.image} 
                            alt="Preview" 
                            className="h-8 w-8 rounded-full object-cover border border-[var(--secondary)]/20" 
                          />
                        )}
                        <input
                          placeholder="Image URL"
                          value={formData.image || ''}
                          onChange={e => setFormData({ ...formData, image: e.target.value })}
                          className="w-full rounded border border-[var(--secondary)]/20 bg-[var(--background)] p-1 text-xs"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <input
                        value={formData.name || ''}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        className="w-full rounded border border-[var(--secondary)]/20 bg-[var(--background)] p-1"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        value={formData.email || ''}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        className="w-full rounded border border-[var(--secondary)]/20 bg-[var(--background)] p-1"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        value={formData.phone || ''}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full rounded border border-[var(--secondary)]/20 bg-[var(--background)] p-1"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={formData.role}
                        onChange={e => setFormData({ ...formData, role: e.target.value as 'admin' | 'user' })}
                        className="rounded border border-[var(--secondary)]/20 bg-[var(--background)] p-1"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                      <input
                        type="password"
                        placeholder="New Pass (optional)"
                        value={formData.password || ''}
                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                        className="mt-1 w-full rounded border border-[var(--secondary)]/20 bg-[var(--background)] p-1 text-xs"
                      />
                    </td>
                    <td className="px-6 py-4">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button onClick={handleSave} className="text-[var(--accent)] hover:opacity-80">
                          <Check className="h-4 w-4" />
                        </button>
                        <button onClick={() => setEditingId(null)} className="text-[var(--secondary)] hover:opacity-80">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-6 py-4">
                      {user.image ? (
                        <img 
                          src={user.image} 
                          alt={user.name} 
                          className="h-10 w-10 rounded-full object-cover border border-[var(--secondary)]/20"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-[var(--secondary)]/10 flex items-center justify-center text-[var(--secondary)] font-bold border border-[var(--secondary)]/20">
                          {user.name?.[0]?.toUpperCase() || 'U'}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">{user.name}</td>
                    <td className="px-6 py-4">{user.email}</td>
                    <td className="px-6 py-4 text-[var(--secondary)]/70">{user.phone || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                        user.role === 'admin' ? 'bg-[var(--brand)]/10 text-[var(--brand)]' : 'bg-[var(--accent)]/10 text-[var(--accent)]'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => startEdit(user)} className="text-[var(--brand)] hover:opacity-80">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(user.id)} className="text-[var(--accent)] hover:text-[var(--accent)]/80">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
