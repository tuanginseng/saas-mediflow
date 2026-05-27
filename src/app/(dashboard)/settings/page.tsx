import type { Metadata } from 'next'
import { Settings, User, Shield, Bell, Palette } from 'lucide-react'

export const metadata: Metadata = { title: 'Cài đặt' }

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <Settings className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Cài đặt</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Quản lý tài khoản & cấu hình hệ thống</p>
        </div>
      </div>

      {[
        { icon: User, title: 'Thông tin cá nhân', description: 'Cập nhật tên, email, số điện thoại và ảnh đại diện' },
        { icon: Shield, title: 'Bảo mật & Mật khẩu', description: 'Đổi mật khẩu, bật xác thực 2 bước' },
        { icon: Bell, title: 'Thông báo', description: 'Tuỳ chỉnh kênh và tần suất thông báo' },
        { icon: Palette, title: 'Giao diện', description: 'Chủ đề, ngôn ngữ và hiển thị' },
      ].map((item) => (
        <div key={item.title} className="card-surface-hover p-5 flex items-center gap-4 cursor-pointer">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <item.icon className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">{item.title}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{item.description}</p>
          </div>
          <span style={{ color: 'var(--text-muted)' }}>›</span>
        </div>
      ))}
    </div>
  )
}
