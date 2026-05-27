'use client'

import React, { useState, useEffect } from 'react'
import { Users, Phone, Heart, Star, Plus, Search, FileText, CheckCircle, Clock, Zap, MessageSquare, AlertCircle, RefreshCw, Send, Calendar, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// Treated patients roster
const INITIAL_PATIENTS = [
  { id: 'pat-1', name: 'Nguyễn Thị Lan', phone: '0901234567', service: 'Nâng mũi S-line', doctor: 'Dr. Nguyễn Minh', status: 'treated', buyMedicine: 'none', reexamDate: '2026-05-30', rating: 5, zaloSent: false },
  { id: 'pat-2', name: 'Trần Minh Tuấn', phone: '0912345678', service: 'Mắt 2 mí Hàn Quốc', doctor: 'Dr. Trần Hoa', status: 'treated', buyMedicine: 'purchased', reexamDate: '2026-06-05', rating: 4, zaloSent: true },
  { id: 'pat-3', name: 'Lê Thu Hương', phone: '0923456789', service: 'Nâng ngực nội soi', doctor: 'Dr. Lê Tuấn', status: 'follow_up', buyMedicine: 'none', reexamDate: '2026-05-29', rating: null, zaloSent: false },
  { id: 'pat-4', name: 'Phạm Quốc Bảo', phone: '0934567890', service: 'Căng da mặt', doctor: 'Dr. Phạm Lan', status: 'follow_up', buyMedicine: 'purchased', reexamDate: '2026-06-12', rating: 5, zaloSent: true }
]

const STATUS_MAP: Record<string, { label: string; bg: string; text: string }> = {
  new:        { label: 'Mới',          bg: 'rgba(40,149,239,0.12)',  text: '#60a5fa' },
  contacted:  { label: 'Đã liên hệ',  bg: 'rgba(245,158,11,0.12)',  text: '#fbbf24' },
  booked:     { label: 'Đã đặt lịch', bg: 'rgba(139,92,246,0.12)',  text: '#a78bfa' },
  treated:    { label: 'Đã điều trị', bg: 'rgba(16,185,129,0.12)',  text: '#34d399' },
  follow_up:  { label: 'Theo dõi',    bg: 'rgba(249,115,22,0.12)',  text: '#fb923c' },
  lost:       { label: 'Mất lead',    bg: 'rgba(100,116,139,0.12)', text: '#94a3b8' },
}

export default function PatientCrmPage() {
  const supabase = createClient()

  // CRM patients state
  const [patients, setPatients] = useState(INITIAL_PATIENTS)
  const [selectedPatient, setSelectedPatient] = useState<any>(INITIAL_PATIENTS[0])
  const [searchQuery, setSearchQuery] = useState('')

  // Webhook Simulator State
  const [diagnosis, setDiagnosis] = useState('Viêm xoang mãn tính / Cấu trúc mũi vẹo nhẹ')
  const [prescription, setPrescription] = useState('Amoxicillin 500mg, Paracetamol 500mg, Nasal Spray')
  const [webhookLog, setWebhookLog] = useState<any[]>([])
  const [simulatingWebhook, setSimulatingWebhook] = useState(false)

  // Cron Scheduler Logs/Notifications state
  const [cronStream, setCronStream] = useState<any[]>([
    { id: 1, type: 'info', msg: 'pg_cron Scheduler: Đang theo dõi trạng thái uống thuốc và lịch tái khám...', timestamp: new Date(Date.now() - 60000).toISOString() }
  ])

  // Trigger simulated HIS Post-Exam Webhook Ingest
  const triggerHisWebhook = () => {
    if (!selectedPatient) return
    setSimulatingWebhook(true)

    // Simulate webhook arrival and e-prescription delay
    setTimeout(() => {
      const logId = Math.random().toString(36).substring(2, 9)
      
      const newLog = {
        id: logId,
        patientName: selectedPatient.name,
        diagnosis,
        prescription,
        timestamp: new Date().toISOString(),
        zaloStatus: 'Đang đếm ngược 30 phút...',
        isComplete: false
      }

      setWebhookLog(prev => [newLog, ...prev])
      setSimulatingWebhook(false)

      // Automatically simulate the 30-minute e-prescription Zalo delivery after 3s (representing 30 minutes)
      setTimeout(() => {
        setWebhookLog(prev => prev.map(log => 
          log.id === logId 
            ? { ...log, zaloStatus: '✓ Đã tự động gửi Zalo OA thành công (Kèm PDF Đơn thuốc & Kết quả)', isComplete: true }
            : log
        ))

        setPatients(prev => prev.map(p => 
          p.id === selectedPatient.id ? { ...p, zaloSent: true } : p
        ))

        setCronStream(prev => [
          {
            id: Math.random(),
            type: 'zalo',
            msg: `Zalo OA: Đã gửi tài liệu điện tử y khoa (Đơn thuốc & PDF kết quả khám) cho BN ${selectedPatient.name}.`,
            timestamp: new Date().toISOString()
          },
          ...prev
        ])
      }, 3000)

    }, 1200)
  }

  // Trigger simulated cron job conditions
  const triggerCronCondition = (condition: 'no_purchase' | 'purchased' | 'reexam') => {
    if (!selectedPatient) return

    const logId = Math.random()
    let msg = ''
    let type = 'sms'

    if (condition === 'no_purchase') {
      msg = `SMS Reminder (Ngày thứ 3 không mua thuốc): "Chào ${selectedPatient.name}, MediFlow nhận thấy bạn chưa đặt mua thuốc theo đơn của ${selectedPatient.doctor}. Nhấn vào đây để đặt thuốc online giao tận nhà: https://mediflow.clinic/pharmacy-order"`
      setPatients(prev => prev.map(p => 
        p.id === selectedPatient.id ? { ...p, buyMedicine: 'none' } : p
      ))
    } else if (condition === 'purchased') {
      type = 'adherence'
      msg = `Zalo Hướng dẫn Uống thuốc (Kích hoạt sau khi mua thuốc): "Chào ${selectedPatient.name}, cảm ơn bạn đã mua thuốc. Hướng dẫn Adherence: Uống Amoxicillin ngày 2 lần sau ăn sáng/tối. Uống đủ 5 ngày."`
      setPatients(prev => prev.map(p => 
        p.id === selectedPatient.id ? { ...p, buyMedicine: 'purchased' } : p
      ))
    } else if (condition === 'reexam') {
      type = 'reexam'
      msg = `SMS Nhắc lịch Tái khám (Trước 3 ngày): "Nhắc hẹn: Bệnh nhân ${selectedPatient.name} có lịch tái khám với ${selectedPatient.doctor} vào ngày ${selectedPatient.reexamDate}. Bấm vào đây để xác nhận giờ hẹn khám ưu tiên."`
    }

    setCronStream(prev => [
      { id: logId, type, msg, timestamp: new Date().toISOString() },
      ...prev
    ])
  }

  // Filter patients
  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.phone.includes(searchQuery)
  )

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-tr from-[#10b981] to-[#059669]">
            <Users className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Patient CRM & After-care</h1>
            <p className="text-sm text-gray-400">Đồng bộ bệnh án HIS sau khám, Hướng dẫn Adherence uống thuốc & Nhắc lịch tái khám tự động</p>
          </div>
        </div>
      </div>

      {/* Roster & CRM Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Users, label: 'Tổng bệnh nhân hậu mãi', value: '1.284', color: '#2895ef' },
          { icon: Phone, label: 'Đơn thuốc điện tử đã gửi', value: `${patients.filter(p => p.zaloSent).length} Đơn`, color: '#f59e0b' },
          { icon: Heart, label: 'Độ tuân thủ điều trị (Adherence)', value: '94.2%', color: '#10b981' },
          { icon: Star, label: 'Đánh giá TB phòng khám', value: '4.8', color: '#8b5cf6' },
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

      {/* Split CRM panel layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Treated Patient CRM list (35%) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="card-surface p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <h3 className="text-sm font-semibold text-white">Hồ sơ Bệnh nhân hậu phẫu</h3>
              <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-black">
                HIS Linked
              </span>
            </div>

            {/* Search */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-400">
              <Search className="w-3.5 h-3.5" />
              <input
                placeholder="Tìm bệnh nhân..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent outline-none text-xs text-white placeholder-gray-500 w-full"
              />
            </div>

            {/* List */}
            <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
              {filteredPatients.map((p) => {
                const isSelected = selectedPatient?.id === p.id
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPatient(p)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 flex flex-col gap-2 ${
                      isSelected
                        ? 'bg-white/5 border-[#10b981]/50 shadow-md shadow-emerald-500/5'
                        : 'bg-white/[0.01] border-white/5 hover:border-white/10 hover:bg-white/[0.02]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 w-full">
                      <div>
                        <p className="text-xs font-bold text-white">{p.name}</p>
                        <p className="text-[10px] text-gray-500 font-mono mt-0.5">{p.phone}</p>
                      </div>
                      <span className="text-[9px] bg-[#10b981]/10 text-[#34d399] px-2 py-0.5 rounded-full font-semibold capitalize">
                        {p.service}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[9px] text-gray-400 border-t border-white/5 pt-2 w-full">
                      <span>Tái khám: {new Date(p.reexamDate).toLocaleDateString('vi-VN')}</span>
                      <span className={`font-bold px-1.5 py-0.5 rounded ${
                        p.buyMedicine === 'purchased' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                      }`}>
                        {p.buyMedicine === 'purchased' ? 'Đã mua thuốc' : 'Chưa mua thuốc'}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right Side: Webhook simulator, Cron logic & chat stream (65%) */}
        <div className="lg:col-span-8 space-y-6">
          {selectedPatient ? (
            <div className="space-y-6">
              
              {/* Section 1: HIS Post-Exam API Webhook Simulator */}
              <div className="card-surface p-6 space-y-4 animate-fade-in">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Zap className="w-4.5 h-4.5 text-[#10b981]" />
                    Giả lập Webhook Hồ sơ Bệnh án Sau khám (HIS Ingestion)
                  </h3>
                  <span className="text-[10px] text-gray-500 font-mono">Bệnh nhân: {selectedPatient.name}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 mb-1">Kết luận Lâm sàng / Chẩn đoán</label>
                    <input
                      type="text"
                      value={diagnosis}
                      onChange={(e) => setDiagnosis(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#10b981]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 mb-1">Đơn thuốc chỉ định (e-Prescription)</label>
                    <input
                      type="text"
                      value={prescription}
                      onChange={(e) => setPrescription(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#10b981]"
                    />
                  </div>
                </div>

                <button
                  onClick={triggerHisWebhook}
                  disabled={simulatingWebhook}
                  className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-gradient-to-r from-[#10b981] to-[#059669] hover:brightness-110 active:scale-97 text-xs font-bold text-white disabled:opacity-40 transition-all shadow-md shadow-emerald-500/10"
                >
                  {simulatingWebhook ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Đang tiếp nhận bản ghi hồ sơ khám...
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      Gửi Webhook hồ sơ khám (Kích hoạt Tự động gửi PDF & Đơn thuốc Zalo sau 30 phút)
                    </>
                  )}
                </button>

                {/* Webhook execution log */}
                {webhookLog.length > 0 && (
                  <div className="bg-gray-950 p-4 border border-white/5 rounded-2xl space-y-2">
                    <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest border-b border-white/5 pb-1">Đường ống Webhook HIS</p>
                    {webhookLog.map((log) => (
                      <div key={log.id} className="text-[10px] font-mono leading-relaxed space-y-1">
                        <div className="flex justify-between text-gray-500">
                          <span>[Ingested]: {new Date(log.timestamp).toLocaleTimeString()}</span>
                          <span className="text-amber-400 font-bold">{log.zaloStatus}</span>
                        </div>
                        <p className="text-gray-300">Chẩn đoán: {log.diagnosis}</p>
                        <p className="text-gray-400">Đơn thuốc: {log.prescription}</p>
                        {!log.isComplete && (
                          <span className="text-[9px] bg-amber-500/10 text-amber-400 px-1 py-0.5 rounded inline-block animate-pulse mt-1">
                            ⌛ Trình giả lập: Đang đếm ngược 3 giây đại diện cho 30 phút gửi Zalo...
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Section 2: Conditional Logic Chron Jobs Simulator */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Cron triggers controller panel */}
                <div className="card-surface p-5 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5 border-b border-white/5 pb-2">
                    <Calendar className="w-4 h-4 text-[#fbbf24]" />
                    Bộ giả lập pg_cron & Quy luật Hậu mãi
                  </h4>

                  <div className="space-y-3 pt-1">
                    {/* Condition 1: 3 days no medicine purchase */}
                    <div className="space-y-1">
                      <p className="text-[10px] text-gray-500 font-bold">1. Quyết định: 3 ngày chưa mua thuốc online</p>
                      <button
                        onClick={() => triggerCronCondition('no_purchase')}
                        className="w-full flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-[10px] font-semibold text-white transition-all"
                      >
                        <span>IF no_purchase_after_3_days</span>
                        <span className="text-amber-400 hover:underline">Gửi SMS nhắc mua &gt;</span>
                      </button>
                    </div>

                    {/* Condition 2: Medicine purchased adherence guide */}
                    <div className="space-y-1">
                      <p className="text-[10px] text-gray-500 font-bold">2. Quyết định: Bệnh nhân đã mua thuốc thành công</p>
                      <button
                        onClick={() => triggerCronCondition('purchased')}
                        className="w-full flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-[10px] font-semibold text-white transition-all"
                      >
                        <span>IF medicine_purchased</span>
                        <span className="text-emerald-400 hover:underline">Gửi Hướng dẫn Adherence &gt;</span>
                      </button>
                    </div>

                    {/* Condition 3: Re-booking 3 days before */}
                    <div className="space-y-1">
                      <p className="text-[10px] text-gray-500 font-bold">3. Quyết định: Trước ngày hẹn tái khám 3 ngày</p>
                      <button
                        onClick={() => triggerCronCondition('reexam')}
                        className="w-full flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-[10px] font-semibold text-white transition-all"
                      >
                        <span>IF 3_days_before_reexam</span>
                        <span className="text-blue-400 hover:underline">SMS/Zalo Hẹn tái khám &gt;</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Live Cron Scheduler output stream */}
                <div className="card-surface p-5 space-y-3 flex flex-col h-56">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 border-b border-white/5 pb-2">
                    Dòng lệnh Tự động hóa (Cron Job Stream)
                  </h4>
                  <div className="flex-1 bg-gray-950 border border-white/5 rounded-xl p-3 font-mono text-[9px] text-gray-500 overflow-y-auto space-y-2">
                    {cronStream.map((log, idx) => (
                      <div key={idx} className="border-l border-white/10 pl-2 py-0.5">
                        <div className="flex justify-between text-gray-600">
                          <span>[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                          <span className="text-[#fbbf24]">pg_cron</span>
                        </div>
                        <p className="text-gray-300 leading-normal mt-0.5">{log.msg}</p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          ) : (
            <div className="card-surface p-12 text-center flex flex-col items-center justify-center">
              <Users className="w-12 h-12 text-gray-600 mb-4 animate-pulse" />
              <h4 className="text-sm font-semibold text-white mb-1.5">Chưa chọn bệnh nhân hậu phẫu</h4>
              <p className="text-xs text-gray-400 max-w-sm leading-relaxed">
                Vui lòng chọn hồ sơ bệnh nhân từ cột bên trái để mở bảng mô phỏng luồng webhook khám bệnh, hướng dẫn tuân thủ đơn thuốc và nhắc lịch tái khám.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  )
}
