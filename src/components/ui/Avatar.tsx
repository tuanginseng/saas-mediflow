import { getInitials } from '@/lib/utils'
import { cn } from '@/lib/utils'

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl'

const SIZE_CLASSES: Record<AvatarSize, string> = {
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-11 h-11 text-base',
  xl: 'w-14 h-14 text-lg',
}

interface AvatarProps {
  name: string
  src?: string | null
  size?: AvatarSize
  className?: string
}

export default function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        className={cn(SIZE_CLASSES[size], 'rounded-xl object-cover flex-shrink-0', className)}
        style={{ border: '2px solid rgba(40,149,239,0.3)' }}
      />
    )
  }

  return (
    <div
      className={cn(
        SIZE_CLASSES[size],
        'rounded-xl flex items-center justify-center font-bold text-white flex-shrink-0',
        className
      )}
      style={{ background: 'var(--gradient-brand)' }}
      title={name}
    >
      {getInitials(name)}
    </div>
  )
}
