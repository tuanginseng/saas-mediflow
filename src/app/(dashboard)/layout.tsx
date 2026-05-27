import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import TopBar from '@/components/layout/TopBar'
import type { Metadata } from 'next'
import type { UserRole } from '@/types/database'

export const metadata: Metadata = {
  title: {
    default: 'Dashboard',
    template: '%s | MediFlow',
  },
}

interface Profile {
  full_name: string
  role: UserRole
  avatar_url: string | null
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch user profile for display in TopBar
  const { data: profileData } = await supabase
    .from('profiles')
    .select('full_name, role, avatar_url')
    .eq('id', user.id)
    .single()

  const profile = profileData as Profile | null

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--surface-bg)' }}>
      {/* Sidebar */}
      <Sidebar />

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar
          pageTitle="MediFlow"
          userFullName={profile?.full_name || user.email?.split('@')[0] || 'User'}
          userRole={profile?.role || 'admin'}
          userAvatarUrl={profile?.avatar_url}
        />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
