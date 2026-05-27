'use client'

import React, { useState, useEffect } from 'react'
import { Activity, Link2, CheckCircle, AlertCircle, Zap, Terminal, Plus, Copy, Send, RefreshCw, Users, ShieldAlert, Award } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const INTEGRATIONS = [
  { name: 'Facebook Pixel', status: 'connected', events: 1284, id: 'int-fb-pixel' },
  { name: 'Google Analytics 4', status: 'connected', events: 9420, id: 'int-ga4' },
  { name: 'TikTok Pixel', status: 'connected', events: 642, id: 'int-tiktok' },
  { name: 'Google Tag Manager', status: 'connected', events: null, id: 'int-gtm' },
  { name: 'Zalo OA Webhook', status: 'warning', events: 87, id: 'int-zalo' },
  { name: 'MediFlow Tracking SDK', status: 'connected', events: 2198, id: 'int-mediflow' },
]

const STATUS_MAP: Record<string, { icon: typeof CheckCircle; bg: string; text: string; label: string }> = {
  connected:    { icon: CheckCircle,  bg: 'rgba(16,185,129,0.12)', text: '#34d399', label: 'Đã kết nối' },
  warning:      { icon: AlertCircle, bg: 'rgba(245,158,11,0.12)',  text: '#fbbf24', label: 'Cảnh báo' },
  disconnected: { icon: AlertCircle, bg: 'rgba(239,68,68,0.12)',   text: '#f87171', label: 'Chưa kết nối' },
}

export default function TrackingPage() {
  const supabase = createClient()

  // UTM Builder States
  const [baseUrl, setBaseUrl] = useState('https://mediflow.clinic/landing-nang-mui')
  const [utmSource, setUtmSource] = useState('facebook')
  const [utmMedium, setUtmMedium] = useState('cpc')
  const [utmCampaign, setUtmCampaign] = useState('rhinoplasty_2026')
  const [utmContent, setUtmContent] = useState('ad_angle_doctor')
  const [isCopied, setIsCopied] = useState(false)

  // Live Telemetry Event Stream States
  const [eventStream, setEventStream] = useState<any[]>([
    { id: 1, event: 'SDK_Initialized', url: 'https://mediflow.clinic/landing-nang-mui', timestamp: new Date(Date.now() - 50000).toISOString(), status: 'Hệ thống tracking hoạt động ổn định.' }
  ])

  // Mock Lead form states (for CTA event)
  const [mockName, setMockName] = useState('Phạm Hoàng Nam')
  const [mockPhone, setMockPhone] = useState('0987654321')
  const [mockEmail, setMockEmail] = useState('nam.pham@gmail.com')

  // Telesales active roster (for Round-Robin visualizer)
  const [telesales, setTelesales] = useState<any[]>([])
  const [loadingTelesales, setLoadingTelesales] = useState(true)
  const [lastAssignedTelesaleId, setLastAssignedTelesaleId] = useState<string | null>(null)

  // Generate UTM URL
  const generatedUrl = (() => {
    try {
      const urlObj = new URL(baseUrl.trim() || 'https://mediflow.clinic')
      urlObj.searchParams.set('utm_source', utmSource.trim())
      urlObj.searchParams.set('utm_medium', utmMedium.trim())
      urlObj.searchParams.set('utm_campaign', utmCampaign.trim())
      if (utmContent.trim()) {
        urlObj.searchParams.set('utm_content', utmContent.trim())
      }
      return urlObj.toString()
    } catch {
      return 'Đường dẫn (Base URL) không hợp lệ.'
    }
  })()

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(generatedUrl)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  // Fetch active telesales from DB (or use high-quality mock if none)
  const fetchTelesales = async () => {
    setLoadingTelesales(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, is_active')
        .eq('role', 'telesale')
      
      if (error) throw error
      if (data && data.length > 0) {
        setTelesales(data.map(t => ({ ...t, leadsCount: 0 })))
      } else {
        throw new Error('No telesales in database')
      }
    } catch (err: any) {
      // Premium Mock Telesales
      setTelesales([
        { id: 'ts-1', full_name: 'Nguyễn Thị Minh Anh', is_active: true, leadsCount: 4 },
        { id: 'ts-2', full_name: 'Lê Hoàng Quốc Bảo', is_active: true, leadsCount: 3 },
        { id: 'ts-3', full_name: 'Trần Thanh Vân', is_active: true, leadsCount: 5 }
      ])
    } finally {
      setLoadingTelesales(false)
    }
  }

  useEffect(() => {
    fetchTelesales()
  }, [])

  // Trigger simulated Webhook Event
  const sendSimulatedEvent = async (event: 'Form_Abandonment' | 'Scroll_Depth_70%' | 'Click_CTA') => {
    const payload: any = {
      event,
      url: generatedUrl,
      utmData: {
        utm_source: utmSource,
        utm_medium: utmMedium,
        utm_campaign: utmCampaign,
        utm_content: utmContent
      }
    }

    if (event === 'Click_CTA') {
      payload.leadData = {
        name: mockName,
        phone: mockPhone,
        email: mockEmail
      }
    }

    try {
      const res = await fetch('/api/tracking/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) throw new Error('Webhook failed')
      const result = await res.json()

      // Add to event stream logs
      const newEventLog = {
        id: Math.random().toString(36).substring(2, 9),
        event: result.receivedEvent,
        url: baseUrl,
        timestamp: result.timestamp,
        status: result.roundRobin,
        assignedTelesaleId: result.assignedTelesaleId
      }

      setEventStream(prev => [newEventLog, ...prev])

      // If assigned to a telesale, animate/update leadsCount in UI
      if (result.assignedTelesaleId) {
        setLastAssignedTelesaleId(result.assignedTelesaleId)
        setTelesales(prev => prev.map(t => 
          t.id === result.assignedTelesaleId ? { ...t, leadsCount: t.leadsCount + 1 } : t
        ))
      }
    } catch (err: any) {
      // Local fallback simulator if API is offline
      const mockAssignedId = telesales.length > 0 ? telesales[Math.floor(Math.random() * telesales.length)].id : null
      const selectedAgentName = telesales.find(t => t.id === mockAssignedId)?.full_name || 'Hệ thống Xoay vòng'
      
      const localEventLog = {
        id: Math.random().toString(36).substring(2, 9),
        event,
        url: baseUrl,
        timestamp: new Date().toISOString(),
        status: event === 'Click_CTA' 
          ? `[GIẢ LẬP LOCAL] Phân phối Round-Robin thành công cho Telesale: ${selectedAgentName}`
          : `[GIẢ LẬP LOCAL] Đã ghi nhận chỉ số chuyển đổi thành công.`,
        assignedTelesaleId: mockAssignedId
      }

      setEventStream(prev => [localEventLog, ...prev])
      if (mockAssignedId && event === 'Click_CTA') {
        setLastAssignedTelesaleId(mockAssignedId)
        setTelesales(prev => prev.map(t => 
          t.id === mockAssignedId ? { ...t, leadsCount: t.leadsCount + 1 } : t
        ))
      }
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-tr from-[#f59e0b] to-[#d97706]">
            <Activity className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Tracking & Integration</h1>
            <p className="text-sm text-gray-400">Thiết lập UTM Builder, luồng Webhook dữ liệu y khoa & Thuật toán phân phối Lead xoay vòng</p>
          </div>
        </div>
      </div>

      {/* Grid: 3 connected stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: Link2, label: 'Kênh kết nối tích cực', value: '5 / 6', color: '#10b981' },
          { icon: Zap, label: 'Sự kiện Webhook hôm nay', value: '14.280 events', color: '#2895ef' },
          { icon: Users, label: 'Đội ngũ Telesale tiếp nhận', value: `${telesales.length} Nhân sự`, color: '#f59e0b' },
        ].map((s) => (
          <div key={s.label} className="card-surface p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${s.color}20` }}>
              <s.icon className="w-5 h-5" style={{ color: s.color }} />
            </div>
            <div>
              <p className="text-xl font-bold text-white">{s.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Split Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: UTM Builder & Event Simulator (50%) */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Section 1: UTM Campaign Builder */}
          <div className="card-surface p-6 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 border-b border-white/5 pb-3">
              <Link2 className="w-4.5 h-4.5 text-[#f59e0b]" />
              Bộ tạo liên kết UTM Quy chuẩn (UTM Builder)
            </h3>
            
            <div className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 mb-1">Base URL (Trang đích landing page)</label>
                <input
                  type="url"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#f59e0b]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 mb-1">Nguồn chiến dịch (utm_source)</label>
                  <input
                    type="text"
                    value={utmSource}
                    onChange={(e) => setUtmSource(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#f59e0b]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 mb-1">Phương thức tiếp thị (utm_medium)</label>
                  <input
                    type="text"
                    value={utmMedium}
                    onChange={(e) => setUtmMedium(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#f59e0b]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 mb-1">Tên chiến dịch (utm_campaign)</label>
                  <input
                    type="text"
                    value={utmCampaign}
                    onChange={(e) => setUtmCampaign(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#f59e0b]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 mb-1">Nội dung quảng cáo (utm_content)</label>
                  <input
                    type="text"
                    value={utmContent}
                    onChange={(e) => setUtmContent(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#f59e0b]"
                  />
                </div>
              </div>

              {/* Generated URL output box */}
              <div className="bg-gray-950 rounded-xl p-3.5 border border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">Đường dẫn đích quy chuẩn</span>
                  <button
                    onClick={handleCopyUrl}
                    className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-white transition-colors"
                  >
                    {isCopied ? <CheckCircle className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {isCopied ? 'Đã sao chép' : 'Sao chép'}
                  </button>
                </div>
                <p className="text-[11px] font-mono text-gray-300 break-all select-all leading-normal">{generatedUrl}</p>
              </div>
            </div>
          </div>

          {/* Section 2: Webhook Event Ingestion Simulator */}
          <div className="card-surface p-6 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 border-b border-white/5 pb-3">
              <Zap className="w-4.5 h-4.5 text-[#2895ef]" />
              Giả lập Sự kiện Landing Page (Webhook Simulator)
            </h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => sendSimulatedEvent('Form_Abandonment')}
                  className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-gray-300 hover:bg-white/10 active:scale-95 transition-all"
                >
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                  Gửi Form_Abandonment
                </button>
                <button
                  onClick={() => sendSimulatedEvent('Scroll_Depth_70%')}
                  className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-gray-300 hover:bg-white/10 active:scale-95 transition-all"
                >
                  <Activity className="w-3.5 h-3.5 text-blue-400" />
                  Gửi Scroll_Depth_70%
                </button>
              </div>

              {/* Form submit simulator for CTA (Lead capture) */}
              <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Giả lập Nhập thông tin đặt hẹn khám
                  </span>
                  <span className="text-[9px] text-gray-500">CTA Click</span>
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[9px] text-gray-500 mb-0.5">Tên bệnh nhân</label>
                    <input
                      type="text"
                      value={mockName}
                      onChange={(e) => setMockName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg p-1.5 text-[10px] text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-gray-500 mb-0.5">Số điện thoại</label>
                    <input
                      type="text"
                      value={mockPhone}
                      onChange={(e) => setMockPhone(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg p-1.5 text-[10px] text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-gray-500 mb-0.5">Email</label>
                    <input
                      type="email"
                      value={mockEmail}
                      onChange={(e) => setMockEmail(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg p-1.5 text-[10px] text-white outline-none"
                    />
                  </div>
                </div>

                <button
                  onClick={() => sendSimulatedEvent('Click_CTA')}
                  className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-xs font-bold text-white shadow-lg active:scale-97 transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  Gửi sự kiện Click_CTA (Nhận Lead & Phân phối Xoay vòng)
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Right Side: Round-Robin Telesales & Live Webhook Logs Stream (50%) */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Section 1: Telesale Round-Robin Agent Visualizer */}
          <div className="card-surface p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Users className="w-4.5 h-4.5 text-[#f59e0b]" />
                Đội ngũ Telesale & Thuật toán Xoay vòng (Round-Robin)
              </h3>
              <button
                onClick={fetchTelesales}
                className="p-1 rounded text-gray-500 hover:text-white"
                title="Làm mới đội ngũ"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {loadingTelesales ? (
                <div className="text-center py-6 text-xs text-gray-500">Đang đồng bộ đội ngũ Telesale...</div>
              ) : (
                telesales.map((ts, idx) => {
                  const isLastAssigned = lastAssignedTelesaleId === ts.id
                  return (
                    <div
                      key={ts.id}
                      className={`flex items-center justify-between p-3.5 rounded-xl border transition-all duration-300 ${
                        isLastAssigned
                          ? 'bg-gradient-to-r from-emerald-500/10 to-transparent border-emerald-500/40 shadow-md shadow-emerald-500/5 translate-x-1'
                          : 'bg-white/[0.01] border-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Index pointer */}
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          isLastAssigned ? 'bg-emerald-500 text-white animate-pulse' : 'bg-white/5 text-gray-500'
                        }`}>
                          {idx + 1}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white flex items-center gap-1.5">
                            {ts.full_name}
                            {isLastAssigned && (
                              <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-black flex items-center gap-0.5 animate-bounce">
                                <Award className="w-2.5 h-2.5" /> Vừa tiếp nhận
                              </span>
                            )}
                          </p>
                          <p className="text-[9px] text-gray-500 mt-0.5">ID: {ts.id.substring(0, 10)}...</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-gray-300 bg-white/5 border border-white/10 px-2 py-0.5 rounded">
                          {ts.leadsCount} leads
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Section 2: Real-time Live Webhook Event Stream (Terminal UI) */}
          <div className="card-surface p-6 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 border-b border-white/5 pb-3">
              <Terminal className="w-4.5 h-4.5 text-emerald-400" />
              Dòng dữ liệu Sự kiện Sự kiện thời gian thực (Live Telemetry Stream)
            </h3>

            <div className="w-full h-56 bg-gray-950 border border-white/5 rounded-2xl p-4 font-mono text-[10px] text-gray-400 overflow-y-auto space-y-3.5">
              {eventStream.map((log) => (
                <div key={log.id} className="border-l-2 border-emerald-500/40 pl-3 py-0.5 space-y-1 animate-fade-in">
                  <div className="flex items-center justify-between text-gray-500">
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      ◉ {log.event}
                    </span>
                    <span>{new Date(log.timestamp).toLocaleTimeString('vi-VN')}</span>
                  </div>
                  <p className="text-gray-300 font-semibold truncate">URL: {log.url}</p>
                  <p className="text-gray-500 text-[9px] leading-relaxed bg-white/[0.02] p-1.5 rounded border border-white/5">
                    Trạng thái phân phối: <strong className="text-amber-400 font-bold">{log.status}</strong>
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Connected Integrations Status Card */}
      <div className="card-surface p-5">
        <h3 className="font-semibold text-white mb-4">Danh sách Tích hợp hệ thống</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {INTEGRATIONS.map((intg) => {
            const s = STATUS_MAP[intg.status]
            return (
              <div key={intg.id} className="flex items-center gap-3 p-4 rounded-xl border border-white/5 bg-white/[0.01]">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 animate-pulse" style={{ background: s.bg }}>
                  <s.icon className="w-4 h-4" style={{ color: s.text }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{intg.name}</p>
                  {intg.events != null && (
                    <p className="text-xs text-gray-500 mt-0.5">{intg.events.toLocaleString('vi-VN')} events</p>
                  )}
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: s.bg, color: s.text }}>{s.label}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
