
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { getUserByEmail, getReviewsByUserId } from '@/lib/db'
import { ProfileEditor } from '@/components/ProfileEditor'
import { ReviewList } from '@/components/ReviewList'

export default async function ProfilePage() {
  const session = await auth()
  
  if (!session || !session.user?.email) {
    redirect('/')
  }

  const user = await getUserByEmail(session.user.email)
  
  if (!user) {
    redirect('/')
  }

  const reviews = await getReviewsByUserId(user.email)

  return (
    <div className="container mx-auto py-12 px-4 xl:px-20">
      <h1 className="mb-2 text-3xl font-bold text-[var(--foreground)]">Account</h1>
      <p className="mb-8 text-lg text-[var(--secondary)]/70">Manage your personal information and reviews.</p>
      
      <div className="grid gap-12 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <div className="rounded-xl border border-[var(--secondary)]/20 bg-[var(--background)] p-6 shadow-sm">
            <h2 className="mb-6 text-xl font-semibold text-[var(--foreground)]">Personal Info</h2>
            <ProfileEditor user={user} />
          </div>
        </div>

        <div className="lg:col-span-2">
          <h2 className="mb-6 text-xl font-semibold text-[var(--foreground)]">My Reviews</h2>
          <ReviewList reviews={reviews} currentUserId={session.user.email} />
        </div>
      </div>
    </div>
  )
}
