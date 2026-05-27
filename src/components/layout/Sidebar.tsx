'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Stethoscope,
  Sparkles,
  ShieldCheck,
  Activity,
  CalendarDays,
  Users,
  BarChart3,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Settings,
} from 'lucide-react'
import SidebarItem from './SidebarItem'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const NAV_SECTIONS = [
  {
    label: 'Tổng quan',
    items: [
      {
        href: '/dashboard',
        icon: LayoutDashboard,
        label: 'Dashboard',
        sublabel: 'Tổng quan hệ thống',
      },
    ],
  },
  {
    label: 'Giai đoạn triển khai',
    items: [
      {
        href: '/trend-content',
        icon: Sparkles,
        label: 'Trend & Content',
        sublabel: 'Giai đoạn 0 & 2',
      },
      {
        href: '/medical-review',
        icon: ShieldCheck,
        label: 'Medical & Legal Review',
        sublabel: 'Giai đoạn 1',
      },
      {
        href: '/tracking',
        icon: Activity,
        label: 'Tracking & Integration',
        sublabel: 'Giai đoạn 3',
      },
      {
        href: '/campaign-booking',
        icon: CalendarDays,
        label: 'Campaign & Booking',
        sublabel: 'Giai đoạn 4',
      },
      {
        href: '/patient-crm',
        icon: Users,
        label: 'Patient CRM & After-care',
        sublabel: 'Giai đoạn 5',
      },
      {
        href: '/analytics',
        icon: BarChart3,
        label: 'Analytics & ROI',
        sublabel: 'Giai đoạn 6',
      },
    ],
  },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside
      className="relative flex flex-col h-screen transition-all duration-300 ease-in-out flex-shrink-0"
      style={{
        width: collapsed ? '72px' : '260px',
        background: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--sidebar-border)',
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-3 px-4 py-5 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--sidebar-border)' }}
      >
        <Link
          href="/dashboard"
          className="flex items-center gap-3 min-w-0"
        >
          <div
            className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center glow-brand"
            style={{ background: 'var(--gradient-brand)' }}
          >
            <Stethoscope className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="text-base font-bold text-white leading-tight gradient-text">
                MediFlow
              </div>
              <div className="text-xs leading-tight truncate" style={{ color: 'var(--text-muted)' }}>
                Clinic Platform
              </div>
            </div>
          )}
        </Link>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        id="sidebar-collapse-toggle"
        className="absolute -right-3 top-16 z-10 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
        style={{
          background: 'var(--surface-card)',
          border: '1px solid var(--surface-border)',
          color: 'var(--text-secondary)',
        }}
      >
        {collapsed ? (
          <ChevronRight className="w-3 h-3" />
        ) : (
          <ChevronLeft className="w-3 h-3" />
        )}
      </button>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            {!collapsed && (
              <p
                className="text-xs font-semibold uppercase tracking-widest mb-2 px-3"
                style={{ color: 'var(--text-muted)' }}
              >
                {section.label}
              </p>
            )}
            <div className="space-y-1">
              {section.items.map((item) => (
                <SidebarItem
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  label={item.label}
                  sublabel={item.sublabel}
                  collapsed={collapsed}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom actions */}
      <div
        className="px-3 py-4 space-y-1 flex-shrink-0"
        style={{ borderTop: '1px solid var(--sidebar-border)' }}
      >
        <SidebarItem
          href="/settings"
          icon={Settings}
          label="Cài đặt"
          sublabel="Tài khoản & hệ thống"
          collapsed={collapsed}
        />
        <button
          id="logout-button"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'
            e.currentTarget.style.color = '#fca5a5'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'var(--text-muted)'
          }}
        >
          <span
            className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg"
            style={{ background: 'rgba(255,255,255,0.03)' }}
          >
            <LogOut className="w-4 h-4" />
          </span>
          {!collapsed && (
            <span className="text-sm font-medium">Đăng xuất</span>
          )}
        </button>
      </div>
    </aside>
  )
}
