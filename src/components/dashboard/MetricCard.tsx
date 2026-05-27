'use client'

import { DollarSign, TrendingUp, Users, Percent } from 'lucide-react'
import { cn } from '@/lib/utils'

const ICON_MAP = {
  dollar: DollarSign,
  trending: TrendingUp,
  users: Users,
  percent: Percent,
}

interface MetricCardProps {
  id: string
  title: string
  value: string | number
  subtitle?: string
  change?: number          // percentage change (positive = up, negative = down)
  icon: keyof typeof ICON_MAP
  gradient: string
  glowClass?: string
  loading?: boolean
  suffix?: string
  prefix?: string
  className?: string
}

export default function MetricCard({
  id,
  title,
  value,
  subtitle,
  change,
  icon,
  gradient,
  glowClass,
  loading = false,
  suffix,
  prefix,
  className,
}: MetricCardProps) {
  const Icon = ICON_MAP[icon] || DollarSign
  const isPositive = change !== undefined && change >= 0

  return (
    <div
      id={id}
      className={cn('card-surface-hover p-5 relative overflow-hidden animate-fade-in-up', className)}
    >
      {/* Background glow blob */}
      <div
        className="absolute -right-6 -top-6 w-28 h-28 rounded-full opacity-10"
        style={{ background: gradient, filter: 'blur(20px)' }}
      />

      {/* Top row */}
      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
            {title}
          </p>
          {loading ? (
            <div className="h-8 w-32 rounded-lg animate-shimmer mt-1" />
          ) : (
            <div className="flex items-baseline gap-1">
              {prefix && (
                <span className="text-base font-medium" style={{ color: 'var(--text-secondary)' }}>
                  {prefix}
                </span>
              )}
              <span className="text-2xl font-bold text-white tracking-tight">
                {typeof value === 'number' ? value.toLocaleString('vi-VN') : value}
              </span>
              {suffix && (
                <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  {suffix}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Icon */}
        <div
          className={cn('w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0', glowClass)}
          style={{ background: gradient }}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>

      {/* Bottom row */}
      {(change !== undefined || subtitle) && (
        <div className="flex items-center justify-between mt-4 relative z-10">
          {subtitle && (
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {subtitle}
            </p>
          )}
          {change !== undefined && (
            <div
              className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{
                background: isPositive ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                color: isPositive ? '#34d399' : '#f87171',
              }}
            >
              <span>{isPositive ? '↑' : '↓'}</span>
              <span>{Math.abs(change)}%</span>
            </div>
          )}
        </div>
      )}

      {/* Divider */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{ background: `linear-gradient(90deg, ${gradient.match(/rgba?\([^)]+\)|#[0-9a-f]+/gi)?.[0] ?? 'transparent'} 0%, transparent 60%)` }}
      />
    </div>
  )
}
