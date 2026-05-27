import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'muted'

const VARIANT_STYLES: Record<BadgeVariant, { bg: string; text: string }> = {
  default: { bg: 'rgba(40,149,239,0.12)',  text: '#60a5fa' },
  success: { bg: 'rgba(16,185,129,0.12)',  text: '#34d399' },
  warning: { bg: 'rgba(245,158,11,0.12)',  text: '#fbbf24' },
  danger:  { bg: 'rgba(239,68,68,0.12)',   text: '#f87171' },
  info:    { bg: 'rgba(59,130,246,0.12)',  text: '#93c5fd' },
  purple:  { bg: 'rgba(139,92,246,0.12)', text: '#a78bfa' },
  muted:   { bg: 'rgba(100,116,139,0.12)', text: '#94a3b8' },
}

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
  dot?: boolean
}

export default function Badge({ children, variant = 'default', className, dot = false }: BadgeProps) {
  const styles = VARIANT_STYLES[variant]
  return (
    <span
      className={cn('inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full', className)}
      style={{ background: styles.bg, color: styles.text }}
    >
      {dot && (
        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: styles.text }} />
      )}
      {children}
    </span>
  )
}
