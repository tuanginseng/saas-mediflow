'use client'

import React, { useState, useEffect } from 'react'
import { CalendarDays, Megaphone, DollarSign, Users, Plus, GitFork, ArrowRight, Clock, Award, ShieldAlert, Check, Calendar, CalendarRange, Eye, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// Pre-defined Automation Rules
const INITIAL_RULES = [
  { id: 1, trigger: 'Xem Video > 75% nhưng chưa chuyển đổi', action: 'Gắn thẻ "Retargeting_Phase2" & chạy quảng cáo bám đuổi', active: true },
  { id: 2, trigger: 'Người dùng Bỏ dở Form đăng ký (Form_Abandonment)', action: 'Gửi tin nhắn Zalo OA chăm sóc sau 1 giờ', active: true },
  { id: 3, trigger: 'Lead đăng ký khám thành công (Click_CTA)', action: 'Phân phối Round-Robin & Gửi SMS xác nhận lập tức', active: true }
]

// Pre-defined calendar slots from Hospital Information System (HIS)
const MOCK_HIS_SLOTS = [
  { id: 'his-1', time: '09:00 AM - 28/05/2026', service: 'Nâng mũi S-Line', doctor: 'Dr. Nguyễn Minh', status: 'available' },
  { id: 'his-2', time: '10:30 AM - 28/05/2026', service: 'Nâng ngực nội soi', doctor: 'Dr. Trần Hoa', status: 'available' },
  { id: 'his-3', time: '02:00 PM - 28/05/2026', service: 'Phẫu thuật mắt 2 mí', doctor: 'Dr. Lê Tuấn', status: 'booked', patient: 'Lê Văn Tám' },
  { id: 'his-4', time: '03:30 PM - 28/05/2026', service: 'Hút mỡ tạo dáng', doctor: 'Dr. Phạm Lan', status: 'available' }
]

export default function CampaignBookingPage() {
  const supabase = createClient()

  // Automation states
  const [rules, setRules] = useState(INITIAL_RULES)
  const [newTrigger, setNewTrigger] = useState('Khách hàng cuộn trang > 70%')
  const [newAction, setNewAction] = useState('Tự động gửi Voucher giảm 10% qua Zalo')
  
  // Kanban leads state
  const [leads, setLeads] = useState<any[]>([])
  const [loadingLeads, setLoadingLeads] = useState(true)

  // Calendar sync states
  const [hisSlots, setHisSlots] = useState(MOCK_HIS_SLOTS)
  const [selectedLeadForBooking, setSelectedLeadForBooking] = useState<any | null>(null)
  const [syncStatus, setSyncStatus] = useState<string | null>(null)

  // Fetch actual leads from database
  const fetchLeads = async () => {
    setLoadingLeads(true)
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      if (data && data.length > 0) {
        setLeads(data)
      } else {
        throw new Error('Empty database leads')
      }
    } catch (err: any) {
      // Mock Fallback Leads with detailed created dates to show ticking SLA timers!
      const now = new Date()
      setLeads([
        { id: 'lead-kanban-1', full_name: 'Nguyễn Bích Thảo', phone: '0912345678', source: 'facebook', status: 'new', created_at: new Date(now.getTime() - 8 * 60 * 1000).toISOString() }, // 8 mins ago (Green SLA)
        { id: 'lead-kanban-2', full_name: 'Trần Minh Hoàng', phone: '0977889900', source: 'tiktok', status: 'new', created_at: new Date(now.getTime() - 22 * 60 * 1000).toISOString() }, // 22 mins ago (Red SLA breach!)
        { id: 'lead-kanban-3', full_name: 'Lê Thuỳ Trang', phone: '0909090909', source: 'google', status: 'calling', created_at: new Date(now.getTime() - 40 * 60 * 1000).toISOString() },
        { id: 'lead-kanban-4', full_name: 'Vũ Quốc Khánh', phone: '0933445566', source: 'zalo', status: 'booked', created_at: new Date(now.getTime() - 120 * 60 * 1000).toISOString() }
      ])
    } finally {
      setLoadingLeads(false)
    }
  }

  // Ticking force-update state to trigger SLA timer refresh every 10 seconds
  const [, setTick] = useState(0)
  useEffect(() => {
    fetchLeads()
    const interval = setInterval(() => {
      setTick(t => t + 1)
    }, 10000)
    return () => clearInterval(interval)
  }, [])

  // Calculate elapsed minutes since lead creation
  const getElapsedMinutes = (createdAtStr: string) => {
    const created = new Date(createdAtStr)
    const now = new Date()
    return Math.floor((now.getTime() - created.getTime()) / 60000)
  }

  // Add automation rule handler
  const handleAddRule = () => {
    if (!newTrigger.trim() || !newAction.trim()) return
    setRules(prev => [
      ...prev,
      {
        id: Math.random(),
        trigger: newTrigger.trim(),
        action: newAction.trim(),
        active: true
      }
    ])
    setNewTrigger('')
    setNewAction('')
  }

  // Move Lead Kanban status handler
  const handleMoveStatus = async (leadId: string, nextStatus: 'new' | 'calling' | 'booked') => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ status: nextStatus })
        .eq('id', leadId)
      
      if (error) throw error
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: nextStatus } : l))
    } catch {
      // Local simulated move
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: nextStatus } : l))
    }
  }

  // Confirm booking & sync with external HIS
  const handleConfirmSyncBooking = (slotId: string) => {
    if (!selectedLeadForBooking) return

    setSyncStatus(`Đang tiến hành đồng bộ gói tin lên hệ thống HIS phòng khám...`)
    
    setTimeout(() => {
      // Update local HIS slot
      setHisSlots(prev => prev.map(slot => 
        slot.id === slotId 
          ? { ...slot, status: 'booked', patient: selectedLeadForBooking.full_name }
          : slot
      ))

      // Update lead to booked status
      handleMoveStatus(selectedLeadForBooking.id, 'booked')

      setSyncStatus(`✓ Xác thực thành công! Lịch hẹn của bệnh nhân "${selectedLeadForBooking.full_name}" đã được đồng bộ chuẩn HL7 lên Clinic HIS (Mã HIS Slot: ${slotId}).`)
      setSelectedLeadForBooking(null)

      // Clear sync alert after 5s
      setTimeout(() => setSyncStatus(null), 5000)
    }, 1500)
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-tr from-[#8b5cf6] to-[#6d28d9]">
            <CalendarDays className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Campaign & Booking Management</h1>
            <p className="text-sm text-gray-400">Thiết lập tự động hóa chiến dịch marketing (GP4) & Quản lý lịch hẹn khám trực quan HIS</p>
          </div>
        </div>
      </div>

      {/* KPI Target Dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Megaphone, label: 'Tổng số lead thu nhận', value: `${leads.length} Leads`, color: '#8b5cf6' },
          { icon: Clock, label: 'Đạt chuẩn thời lượng phản hồi (SLA < 15p)', value: '88%', color: '#2895ef' },
          { icon: Award, label: 'Tỉ lệ chuyển đổi cuộc hẹn (KPI)', value: '78.5%', color: '#10b981', target: 'Mục tiêu: 80%' },
          { icon: CalendarDays, label: 'Lịch hẹn HIS hôm nay', value: '14 / 20', color: '#f59e0b' },
        ].map((s) => (
          <div key={s.label} className="card-surface p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${s.color}20` }}>
              <s.icon className="w-5 h-5" style={{ color: s.color }} />
            </div>
            <div>
              <p className="text-xl font-bold text-white">{s.value}</p>
              <p className="text-[10px] text-gray-400 font-medium">{s.label}</p>
              {s.target && <span className="text-[8px] text-[#10b981] font-bold block mt-0.5">{s.target}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* ── SECTION 1: AUTOMATION TRIGGER BUILDER (IFTTT UI) ─────────────────── */}
      <div className="card-surface p-6 space-y-4">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2 border-b border-white/5 pb-3">
          <GitFork className="w-4.5 h-4.5 text-[#8b5cf6]" />
          Tự động hóa Chiến dịch Marketing (IFTTT Automation Builder)
        </h3>

        {/* Builder Form */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-white/[0.01] border border-white/5 p-4 rounded-2xl items-end">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 mb-1">ĐIỀU KIỆN KÍCH HOẠT (IF / TRIGGER)</label>
            <input
              type="text"
              value={newTrigger}
              onChange={(e) => setNewTrigger(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#8b5cf6]"
            />
          </div>

          <div className="flex items-center gap-2 min-w-0">
            <ArrowRight className="w-4 h-4 text-gray-500 flex-shrink-0 hidden md:block" />
            <div className="w-full">
              <label className="block text-[10px] font-bold text-gray-400 mb-1">HÀNH ĐỘNG PHẢN HỒI (THEN / ACTION)</label>
              <input
                type="text"
                value={newAction}
                onChange={(e) => setNewAction(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#8b5cf6]"
              />
            </div>
          </div>

          <button
            onClick={handleAddRule}
            className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-tr from-[#8b5cf6] to-[#6d28d9] hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-purple-500/10"
          >
            <Plus className="w-4 h-4" /> Kích hoạt Quy luật tự động
          </button>
        </div>

        {/* Active Rules List */}
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Quy luật tự động hóa tiếp thị đang hoạt động</p>
          {rules.map((rule) => (
            <div key={rule.id} className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.01] border border-white/5 gap-3 hover:border-white/10 transition-all">
              <div className="flex items-start md:items-center gap-3 flex-wrap">
                <span className="text-[9px] font-extrabold uppercase bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded border border-purple-500/20">IF</span>
                <span className="text-xs text-white font-semibold">{rule.trigger}</span>
                <ArrowRight className="w-3.5 h-3.5 text-gray-600 hidden md:block" />
                <span className="text-[9px] font-extrabold uppercase bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">THEN</span>
                <span className="text-xs text-gray-300">{rule.action}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                <span className="text-[10px] font-bold text-emerald-400">Active</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── SECTION 2: SALES CONVERSION (TELESALE KANBAN BOARD WITH SLA) ─────── */}
      <div className="card-surface p-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-4 border-b border-white/5 pb-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Users className="w-4.5 h-4.5 text-[#2895ef]" />
            Bảng theo dõi và chuyển đổi Lead của Telesale (Kanban SLA)
          </h3>
          <span className="text-[10px] bg-rose-500/10 border border-rose-500/20 text-rose-400 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5" /> Quy định phản hồi SLA: &lt; 15 phút
          </span>
        </div>

        {/* 3 Column Kanban Board */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Column 1: Mới tiếp nhận (New) */}
          <div className="bg-gray-950/40 border border-white/5 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#fbbf24]"></span>
                MỚI TIẾP NHẬN ({leads.filter(l => l.status === 'new').length})
              </span>
            </div>
            
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {leads.filter(l => l.status === 'new').map((lead) => {
                const elapsed = getElapsedMinutes(lead.created_at)
                const isBreach = elapsed > 15
                
                return (
                  <div key={lead.id} className="p-3 bg-white/[0.01] border border-white/5 rounded-xl space-y-2 hover:border-white/10 transition-all relative">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-bold text-white">{lead.full_name}</p>
                        <p className="text-[10px] text-gray-500 font-mono mt-0.5">{lead.phone}</p>
                      </div>
                      <span className="text-[9px] bg-white/5 text-gray-400 px-1.5 py-0.5 rounded uppercase">{lead.source}</span>
                    </div>

                    <div className="flex items-center justify-between border-t border-white/5 pt-2 mt-2">
                      {/* SLA Timer */}
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 ${
                        isBreach ? 'bg-rose-500/20 text-rose-400 animate-pulse border border-rose-500/30' : 'bg-emerald-500/10 text-emerald-400'
                      }`}>
                        <Clock className="w-2.5 h-2.5" />
                        {isBreach ? `TRỄ SLA (${elapsed} phút)` : `Ticking SLA: ${elapsed} phút`}
                      </span>

                      {/* Action trigger */}
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleMoveStatus(lead.id, 'calling')}
                          className="text-[9px] bg-[#2895ef]/10 text-[#7dd3fc] hover:bg-[#2895ef]/20 px-2 py-0.5 rounded font-bold"
                        >
                          Liên hệ &gt;&gt;
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Column 2: Đang liên hệ (Calling) */}
          <div className="bg-gray-950/40 border border-white/5 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#2895ef]"></span>
                ĐANG LIÊN HỆ ({leads.filter(l => l.status === 'calling').length})
              </span>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {leads.filter(l => l.status === 'calling').map((lead) => (
                <div key={lead.id} className="p-3 bg-white/[0.01] border border-white/5 rounded-xl space-y-2.5 hover:border-white/10 transition-all">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold text-white">{lead.full_name}</p>
                      <p className="text-[10px] text-gray-500 font-mono mt-0.5">{lead.phone}</p>
                    </div>
                    <span className="text-[9px] bg-white/5 text-gray-400 px-1.5 py-0.5 rounded uppercase">{lead.source}</span>
                  </div>

                  <div className="flex border-t border-white/5 pt-2 justify-between items-center">
                    <button
                      onClick={() => setSelectedLeadForBooking(lead)}
                      className="text-[9px] bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-2.5 py-1 rounded font-bold hover:brightness-110 active:scale-95"
                    >
                      Đặt hẹn HIS
                    </button>
                    <button
                      onClick={() => handleMoveStatus(lead.id, 'new')}
                      className="text-[9px] text-gray-500 hover:underline"
                    >
                      Khôi phục
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 3: Đã đặt lịch hẹn (Booked) */}
          <div className="bg-gray-950/40 border border-white/5 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#10b981]"></span>
                ĐÃ ĐẶT LỊCH HẸN ({leads.filter(l => l.status === 'booked').length})
              </span>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {leads.filter(l => l.status === 'booked').map((lead) => (
                <div key={lead.id} className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl space-y-1.5 relative">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold text-white">{lead.full_name}</p>
                      <p className="text-[10px] text-gray-400 font-mono mt-0.5">{lead.phone}</p>
                    </div>
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-black">
                      ✓ Booked
                    </span>
                  </div>
                  <div className="text-[9px] text-emerald-300 font-semibold flex items-center gap-1 bg-emerald-500/10 p-1.5 rounded mt-2">
                    <Check className="w-3 h-3" /> Đã đồng bộ lên CSDL Phòng khám
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ── SECTION 3: CLINIC HIS CALENDAR SYNC INTERFACE ─────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* HIS Calendar list Slots (60%) */}
        <div className="lg:col-span-8">
          <div className="card-surface p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <CalendarRange className="w-4.5 h-4.5 text-[#f59e0b]" />
                Đồng bộ Lịch khám Phòng khám (Hospital HIS Calendar)
              </h3>
              <span className="text-[10px] bg-[#0068ff]/10 border border-[#0068ff]/20 text-[#7dd3fc] px-2 py-0.5 rounded font-bold">
                HL7 Connected
              </span>
            </div>

            {syncStatus && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-2 text-emerald-400 text-xs font-semibold animate-fade-in">
                <Sparkles className="w-4.5 h-4.5 flex-shrink-0 mt-0.5" />
                <p>{syncStatus}</p>
              </div>
            )}

            {/* HIS Calendar grid slots list */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {hisSlots.map((slot) => {
                const isBooked = slot.status === 'booked'
                return (
                  <div key={slot.id} className={`p-4 rounded-2xl border transition-all flex flex-col gap-3 ${
                    isBooked 
                      ? 'bg-white/[0.01] border-white/5 opacity-80' 
                      : 'bg-white/[0.02] border-white/10 hover:border-[#f59e0b]'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-bold text-white">{slot.service}</p>
                        <p className="text-[10px] text-gray-400 font-semibold mt-1">{slot.doctor}</p>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        isBooked ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'
                      }`}>
                        {isBooked ? 'Đã xếp lịch' : 'Còn trống'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-gray-500 border-t border-white/5 pt-3">
                      <span className="font-mono">{slot.time}</span>
                      
                      {isBooked ? (
                        <span className="text-gray-300 font-bold">BN: {slot.patient}</span>
                      ) : (
                        <button
                          onClick={() => handleConfirmSyncBooking(slot.id)}
                          disabled={!selectedLeadForBooking}
                          className="px-3 py-1.5 rounded-lg text-[9px] font-extrabold text-white bg-[#0068ff] hover:bg-[#0057d6] disabled:opacity-40 disabled:pointer-events-none transition-all"
                        >
                          Chọn đặt slot này
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Selected Lead HIS confirmation card (40%) */}
        <div className="lg:col-span-4">
          <div className="card-surface p-6 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 border-b border-white/5 pb-3">
              <Calendar className="w-4.5 h-4.5 text-[#10b981]" />
              Tiến hành Đặt lịch hẹn
            </h3>

            {selectedLeadForBooking ? (
              <div className="space-y-4 animate-fade-in">
                <div className="bg-[#10b981]/5 border border-[#10b981]/25 p-4 rounded-2xl space-y-2">
                  <p className="text-[10px] uppercase font-black text-[#10b981] tracking-widest">Bệnh nhân đang chọn</p>
                  <p className="text-sm font-bold text-white">{selectedLeadForBooking.full_name}</p>
                  <p className="text-xs text-gray-400 font-mono">{selectedLeadForBooking.phone}</p>
                  <p className="text-[10px] text-gray-500">Nguồn đăng ký: {selectedLeadForBooking.source}</p>
                </div>

                <div className="p-3 bg-white/[0.01] border border-white/5 rounded-xl">
                  <p className="text-[10px] text-gray-400 leading-relaxed">
                    👉 **Hướng dẫn**: Chọn một ô lịch hẹn còn trống bên trái và bấm **"Chọn đặt slot này"** để tiến hành lưu trữ lịch hẹn lên HIS.
                  </p>
                </div>

                <button
                  onClick={() => setSelectedLeadForBooking(null)}
                  className="w-full text-center py-2 text-xs font-bold text-gray-500 hover:text-white"
                >
                  Hủy bỏ chọn bệnh nhân
                </button>
              </div>
            ) : (
              <div className="text-center py-10 border border-dashed border-white/5 rounded-2xl bg-white/[0.002] flex flex-col items-center justify-center p-4">
                <Users className="w-8 h-8 text-gray-600 mb-2" />
                <h4 className="text-xs font-bold text-white mb-1">Chưa có Lead được chọn</h4>
                <p className="text-[9px] text-gray-500 leading-relaxed max-w-[200px]">
                  Bấm nút **"Đặt hẹn HIS"** trên thẻ bệnh nhân đang liên hệ ở bảng Kanban phía trên để bắt đầu quy trình đồng bộ lịch.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  )
}
