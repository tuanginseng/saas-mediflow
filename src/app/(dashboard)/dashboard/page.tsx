'use client'

import {
  Megaphone,
  CalendarCheck,
  FileText,
  ArrowRight,
} from 'lucide-react'
import MetricCard from '@/components/dashboard/MetricCard'
import Link from 'next/link'

const METRICS: {
  id: string
  title: string
  value: string | number
  suffix?: string
  subtitle: string
  change: number
  icon: 'dollar' | 'trending' | 'users' | 'percent'
  gradient: string
  glowClass: string
}[] = [
  {
    id: 'metric-cpl',
    title: 'CPL (Cost Per Lead)',
    value: '185.000',
    suffix: 'đ',
    subtitle: 'Tháng này',
    change: -12.4,
    icon: 'dollar',
    gradient: 'linear-gradient(135deg, #2895ef 0%, #1060ac 100%)',
    glowClass: 'glow-brand',
  },
  {
    id: 'metric-cac',
    title: 'CAC (Customer Acquisition)',
    value: '2.450.000',
    suffix: 'đ',
    subtitle: 'Trung bình / bệnh nhân mới',
    change: -5.8,
    icon: 'trending',
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
    glowClass: 'glow-purple',
  },
  {
    id: 'metric-total-leads',
    title: 'Total Leads',
    value: 1_284,
    subtitle: 'Tổng tháng này',
    change: 23.5,
    icon: 'users',
    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    glowClass: 'glow-success',
  },
  {
    id: 'metric-conversion',
    title: 'Conversion Rate',
    value: '18.7',
    suffix: '%',
    subtitle: 'Leads → Bệnh nhân',
    change: 3.2,
    icon: 'percent',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    glowClass: 'glow-amber',
  },
]

const QUICK_LINKS = [
  {
    href: '/trend-content',
    icon: FileText,
    title: 'Tạo nội dung mới',
    description: 'Xu hướng & Content — Giai đoạn 0',
    color: '#2895ef',
  },
  {
    href: '/campaign-booking',
    icon: Megaphone,
    title: 'Tạo chiến dịch',
    description: 'Campaign & Booking — Giai đoạn 4',
    color: '#8b5cf6',
  },
  {
    href: '/patient-crm',
    icon: CalendarCheck,
    title: 'Đặt lịch khám',
    description: 'CRM & After-care — Giai đoạn 5',
    color: '#10b981',
  },
]

const STAGE_PIPELINE = [
  { stage: '0', name: 'Trend Research', status: 'active', count: 12 },
  { stage: '1', name: 'Medical Review', status: 'pending', count: 5 },
  { stage: '2', name: 'Content Creation', status: 'active', count: 8 },
  { stage: '3', name: 'Tracking Setup', status: 'done', count: 3 },
  { stage: '4', name: 'Campaign Live', status: 'active', count: 4 },
  { stage: '5', name: 'CRM & After-care', status: 'active', count: 241 },
  { stage: '6', name: 'Analytics', status: 'done', count: 0 },
]

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  active: { bg: 'rgba(16,185,129,0.1)', text: '#34d399', dot: '#10b981' },
  pending: { bg: 'rgba(245,158,11,0.1)', text: '#fbbf24', dot: '#f59e0b' },
  done: { bg: 'rgba(100,116,139,0.1)', text: '#94a3b8', dot: '#64748b' },
}

export default function DashboardPage() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto">

      {/* Welcome banner */}
      <div
        className="relative overflow-hidden rounded-2xl p-6"
        style={{
          background: 'linear-gradient(135deg, rgba(40,149,239,0.15) 0%, rgba(124,58,237,0.15) 100%)',
          border: '1px solid rgba(40,149,239,0.2)',
        }}
      >
        <div
          className="absolute -right-8 -top-8 w-40 h-40 rounded-full opacity-20"
          style={{
            background: 'radial-gradient(circle, rgba(40,149,239,0.8) 0%, transparent 70%)',
            filter: 'blur(20px)',
          }}
        />
        <div className="relative z-10">
          <h2 className="text-xl font-bold text-white mb-1">
            Chào mừng trở lại! 👋
          </h2>
          <p style={{ color: 'var(--text-secondary)' }} className="text-sm">
            Đây là tổng quan hiệu suất marketing & vận hành phòng khám tháng này.
          </p>
        </div>
      </div>

      {/* Metric Cards */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>
          Chỉ số hiệu suất chính (KPIs)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {METRICS.map((metric, i) => (
            <div key={metric.id} className={`delay-${(i + 1) * 100}`}>
              <MetricCard {...metric} />
            </div>
          ))}
        </div>
      </div>

      {/* Stage Pipeline + Quick Links */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Pipeline overview */}
        <div className="lg:col-span-2 card-surface p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-white">Tiến độ quy trình</h3>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>7 giai đoạn</span>
          </div>
          <div className="space-y-2">
            {STAGE_PIPELINE.map((s) => {
              const colors = STATUS_COLORS[s.status]
              return (
                <div
                  key={s.stage}
                  className="flex items-center gap-3 p-3 rounded-xl transition-all duration-200"
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.04)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.02)'
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.04)'
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}
                  >
                    {s.stage}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{s.name}</p>
                  </div>
                  {s.count > 0 && (
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{ background: 'rgba(40,149,239,0.12)', color: 'var(--brand-400)' }}
                    >
                      {s.count}
                    </span>
                  )}
                  <div
                    className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0"
                    style={{ background: colors.bg, color: colors.text }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: colors.dot }}
                    />
                    {s.status === 'active' ? 'Đang chạy' : s.status === 'pending' ? 'Chờ duyệt' : 'Hoàn thành'}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Quick links */}
        <div className="card-surface p-5">
          <h3 className="text-base font-semibold text-white mb-4">Thao tác nhanh</h3>
          <div className="space-y-3">
            {QUICK_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-3 p-3 rounded-xl group transition-all duration-200"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                  e.currentTarget.style.borderColor = `${link.color}40`
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
                }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${link.color}20` }}
                >
                  <link.icon className="w-4 h-4" style={{ color: link.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white leading-tight">{link.title}</p>
                  <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
                    {link.description}
                  </p>
                </div>
                <ArrowRight
                  className="w-4 h-4 flex-shrink-0 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all duration-200"
                  style={{ color: 'var(--text-muted)' }}
                />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
