'use client'

import { Bell, Search } from 'lucide-react'
import { getInitials } from '@/lib/utils'

interface TopBarProps {
  pageTitle: string
  pageDescription?: string
  userFullName?: string
  userRole?: string
  userAvatarUrl?: string | null
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Quản trị viên',
  doctor: 'Thẩm định y khoa',
  marketer: 'Triển khai',
  telesale: 'Chốt sale',
}

export default function TopBar({
  pageTitle,
  pageDescription,
  userFullName = 'User',
  userRole = 'admin',
  userAvatarUrl,
}: TopBarProps) {
  return (
    <header
      className="flex items-center gap-4 px-6 py-4 flex-shrink-0"
      style={{
        borderBottom: '1px solid var(--surface-border)',
        background: 'rgba(10, 15, 30, 0.6)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      {/* Page title */}
      <div className="flex-1 min-w-0">
        <h1 className="text-lg font-semibold text-white leading-tight truncate">{pageTitle}</h1>
        {pageDescription && (
          <p className="text-xs leading-tight mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {pageDescription}
          </p>
        )}
      </div>

      {/* Search */}
      <div
        className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.07)',
          minWidth: '200px',
        }}
      >
        <Search className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
        <input
          id="topbar-search"
          type="search"
          placeholder="Tìm kiếm..."
          className="bg-transparent text-sm outline-none w-full"
          style={{ color: 'var(--text-secondary)' }}
        />
      </div>

      {/* Notifications */}
      <button
        id="notifications-button"
        className="relative flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-200"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.07)',
          color: 'var(--text-secondary)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
          e.currentTarget.style.color = 'var(--text-primary)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
          e.currentTarget.style.color = 'var(--text-secondary)'
        }}
      >
        <Bell className="w-4 h-4" />
        {/* Notification dot */}
        <span
          className="absolute top-2 right-2 w-2 h-2 rounded-full"
          style={{ background: '#ef4444', boxShadow: '0 0 6px rgba(239,68,68,0.6)' }}
        />
      </button>

      {/* User avatar */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {userAvatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={userAvatarUrl}
            alt={userFullName}
            className="w-9 h-9 rounded-xl object-cover"
            style={{ border: '2px solid rgba(40,149,239,0.4)' }}
          />
        ) : (
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white"
            style={{ background: 'var(--gradient-brand)' }}
          >
            {getInitials(userFullName)}
          </div>
        )}
        <div className="hidden lg:block">
          <div className="text-sm font-medium text-white leading-tight">{userFullName}</div>
          <div className="text-xs leading-tight" style={{ color: 'var(--text-muted)' }}>
            {ROLE_LABELS[userRole] ?? userRole}
          </div>
        </div>
      </div>
    </header>
  )
}
