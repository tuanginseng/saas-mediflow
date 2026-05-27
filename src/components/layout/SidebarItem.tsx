'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface SidebarItemProps {
  href: string
  icon: LucideIcon
  label: string
  sublabel?: string
  badge?: string | number
  collapsed?: boolean
}

export default function SidebarItem({
  href,
  icon: Icon,
  label,
  sublabel,
  badge,
  collapsed = false,
}: SidebarItemProps) {
  const pathname = usePathname()
  const isActive = pathname === href || pathname.startsWith(href + '/')

  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={cn(
        'group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 relative',
        collapsed ? 'justify-center' : '',
        isActive
          ? 'text-white'
          : 'hover:text-white'
      )}
      style={{
        color: isActive ? 'var(--sidebar-text-active)' : 'var(--sidebar-text)',
        background: isActive ? 'var(--sidebar-item-active)' : 'transparent',
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = 'var(--sidebar-item-hover)'
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = 'transparent'
        }
      }}
    >
      {/* Active indicator */}
      {isActive && (
        <span
          className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full"
          style={{ background: 'var(--gradient-brand)' }}
        />
      )}

      {/* Icon */}
      <span
        className={cn(
          'flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg transition-all duration-200',
          isActive ? 'glow-brand' : 'group-hover:scale-110'
        )}
        style={{
          background: isActive
            ? 'var(--gradient-brand)'
            : 'rgba(255,255,255,0.05)',
        }}
      >
        <Icon className="w-4.5 h-4.5" size={18} />
      </span>

      {/* Label */}
      {!collapsed && (
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium leading-tight truncate">{label}</div>
          {sublabel && (
            <div className="text-xs leading-tight mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
              {sublabel}
            </div>
          )}
        </div>
      )}

      {/* Badge */}
      {!collapsed && badge !== undefined && (
        <span
          className="flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full min-w-[20px] text-center"
          style={{
            background: 'rgba(40, 149, 239, 0.15)',
            color: 'var(--brand-400)',
          }}
        >
          {badge}
        </span>
      )}
    </Link>
  )
}
