import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Đăng nhập',
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'var(--surface-bg)' }}
    >
      {/* Background ambient blobs */}
      <div
        className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-20 animate-spin-slow"
        style={{
          background: 'radial-gradient(circle, rgba(40,149,239,0.4) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />
      <div
        className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-15"
        style={{
          background: 'radial-gradient(circle, rgba(124,58,237,0.5) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />
      <div className="relative z-10 w-full max-w-md px-4">
        {children}
      </div>
    </div>
  )
}
