'use client'

import React, { useState, useEffect } from 'react'
import { ShieldCheck, CheckCircle, XCircle, Clock, FileSearch, AlertTriangle, FileText, Upload, Check, AlertCircle, ArrowRight, UserCheck, ShieldAlert } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// Banned advertising words dictionary in healthcare
const BANNED_WORDS = [
  'cam kết dứt điểm 100%',
  'cam kết dứt điểm',
  'chữa tận gốc',
  'chữa dứt điểm',
  'trị tận gốc',
  'tốt nhất',
  'cam kết khỏi',
  'chắc chắn khỏi',
  'hoàn tiền 100%',
  'không khỏi hoàn tiền',
  'số 1 việt nam',
  'số 1',
  'thần dược'
]

export default function MedicalReviewPage() {
  const supabase = createClient()

  // Simulator role state
  const [activeRole, setActiveRole] = useState<'doctor' | 'marketer' | 'telesale' | 'admin'>('doctor')
  
  // Database states
  const [contentQueue, setContentQueue] = useState<any[]>([])
  const [loadingQueue, setLoadingQueue] = useState(true)
  const [selectedItem, setSelectedItem] = useState<any | null>(null)
  
  // Feedback and actions states
  const [doctorFeedback, setDoctorFeedback] = useState('')
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // License upload states
  const [licenseCode, setLicenseCode] = useState('')
  const [licenseFile, setLicenseFile] = useState<string | null>(null)
  const [uploadingLicense, setUploadingLicense] = useState(false)
  
  // Fetch actual contents pending review from Supabase
  const fetchQueue = async () => {
    setLoadingQueue(true)
    try {
      const { data, error } = await supabase
        .from('content')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      if (data) {
        setContentQueue(data)
        
        // Auto-select first item if none is selected
        if (data.length > 0 && !selectedItem) {
          setSelectedItem(data[0])
        }
      }
    } catch (err: any) {
      console.warn('Error loading queue from Supabase, loading fallback mock queue:', err.message)
      // Mock fallback if DB is empty or fails
      const mockQueue = [
        {
          id: 'mock-1',
          title: 'Quy trình Nâng ngực nội soi chuẩn Y khoa',
          body: 'Phương pháp nâng ngực nội soi cam kết dứt điểm 100% cảm giác đau nhức chỉ sau 2 ngày. Đây là công nghệ tốt nhất hiện nay, giúp chữa tận gốc tình trạng ngực sa trễ bẩm sinh. Bác sĩ chuyên khoa khuyên dùng.',
          content_type: 'article',
          stage: 'stage_0',
          status: 'pending_review',
          keywords: ['nâng ngực nội soi', 'thẩm mỹ ngực'],
          platform: ['website'],
          created_at: new Date(Date.now() - 3600000 * 2).toISOString()
        },
        {
          id: 'mock-2',
          title: 'Cảnh báo: Cách tự điều trị mụn tại nhà nguy hiểm',
          body: 'Việc tự nặn mụn có thể gây nhiễm trùng da nghiêm trọng. Chúng tôi khuyên bệnh nhân nên đến cơ sở da liễu để được bác sĩ khám và điều trị chuẩn y khoa, tránh các biến chứng sẹo rỗ lâu dài.',
          content_type: 'post',
          stage: 'stage_0',
          status: 'pending_review',
          keywords: ['điều trị mụn', 'chăm sóc da'],
          platform: ['facebook'],
          created_at: new Date(Date.now() - 3600000 * 6).toISOString()
        }
      ]
      setContentQueue(mockQueue)
      setSelectedItem(mockQueue[0])
    } finally {
      setLoadingQueue(false)
    }
  }

  useEffect(() => {
    fetchQueue()
  }, [])

  // Highlight banned words in the text body
  const renderHighlightedBody = (text: string) => {
    if (!text) return 'Không có nội dung chi tiết.'
    
    // Sort banned words by length descending to prevent partial match conflicts
    const sortedBanned = [...BANNED_WORDS].sort((a, b) => b.length - a.length)
    
    let tempText = text
    const matches: string[] = []

    // Build regex to match any of the banned words (case insensitive)
    const escapedWords = sortedBanned.map(word => word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'))
    const regex = new RegExp(`(${escapedWords.join('|')})`, 'gi')
    
    const parts = text.split(regex)

    return (
      <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">
        {parts.map((part, index) => {
          const isBanned = BANNED_WORDS.some(word => word.toLowerCase() === part.toLowerCase())
          if (isBanned) {
            return (
              <span
                key={index}
                className="bg-rose-500/20 text-rose-400 border border-rose-500/30 px-1 py-0.5 rounded font-bold inline-block cursor-help relative group"
                title="Vi phạm Luật Quảng cáo Y tế Việt Nam"
              >
                {part}
                <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-gray-950 text-rose-300 text-[10px] py-1 px-2.5 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 mb-1.5 border border-rose-500/40">
                  ⚠️ Từ bị cấm quảng cáo y khoa
                </span>
              </span>
            )
          }
          return <React.Fragment key={index}>{part}</React.Fragment>
        })}
      </p>
    )
  }

  // Count banned words in current body
  const getBannedWordsCount = (text: string) => {
    if (!text) return 0
    let count = 0
    const lowerText = text.toLowerCase()
    BANNED_WORDS.forEach(word => {
      let pos = lowerText.indexOf(word)
      while (pos !== -1) {
        count++
        pos = lowerText.indexOf(word, pos + 1)
      }
    })
    return count
  }

  // Handle status changes (Doctor workflow)
  const handleUpdateStatus = async (newStatus: 'approved' | 'rejected' | 'pending_review') => {
    if (!selectedItem) return
    
    // Check if role is Doctor or Admin
    if (activeRole !== 'doctor' && activeRole !== 'admin') {
      setStatusMessage({
        type: 'error',
        text: 'Lỗi bảo mật: Chỉ tài khoản có vai trò Bác sĩ (Doctor) mới có quyền duyệt hoặc từ chối thẩm định!'
      })
      return
    }

    setUpdatingStatus(true)
    setStatusMessage(null)

    try {
      // 1. Update the content status in database
      const { error } = await supabase
        .from('content')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedItem.id)

      if (error) throw error

      // 2. If successfully reviewed, create a record in content_reviews
      const { data: userData } = await supabase.auth.getUser()
      if (userData?.user) {
        await supabase.from('content_reviews').insert({
          content_id: selectedItem.id,
          reviewer_id: userData.user.id,
          status: newStatus,
          medical_approved: newStatus === 'approved',
          feedback: doctorFeedback
        })
      }

      setStatusMessage({
        type: 'success',
        text: `Đã cập nhật trạng thái nội dung thành công: ${
          newStatus === 'approved' ? 'Đã duyệt Y khoa (Doctor_Approved)' : newStatus === 'rejected' ? 'Từ chối (Doctor_Rejected)' : 'Chờ duyệt'
        }`
      })

      // Update local state
      setSelectedItem(prev => ({ ...prev, status: newStatus }))
      setContentQueue(prev => prev.map(item => item.id === selectedItem.id ? { ...item, status: newStatus } : item))
      setDoctorFeedback('')
      
      // Refresh list
      await fetchQueue()
    } catch (err: any) {
      console.warn('Supabase DB Update failed, falling back to local simulated state:', err.message)
      
      // Local Sandbox Fallback
      setSelectedItem(prev => ({ ...prev, status: newStatus }))
      setContentQueue(prev => prev.map(item => item.id === selectedItem.id ? { ...item, status: newStatus } : item))
      setDoctorFeedback('')
      
      setStatusMessage({
        type: 'success',
        text: `[HỘP CÁT LOCAL] Đã duyệt thành công: ${
          newStatus === 'approved' ? 'Đã duyệt Y khoa (Doctor_Approved)' : newStatus === 'rejected' ? 'Từ chối (Doctor_Rejected)' : 'Chờ duyệt'
        }`
      })
    } finally {
      setUpdatingStatus(false)
    }
  }

  // Handle Marketer attaching Medical Advertising License
  const handleAttachLicense = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedItem || !licenseCode.trim()) return

    // Verify role is Marketer or Admin
    if (activeRole !== 'marketer' && activeRole !== 'admin') {
      setStatusMessage({
        type: 'error',
        text: 'Lỗi bảo mật: Chỉ Marketer hoặc Admin mới có quyền tải lên Giấy phép Quảng cáo Y tế!'
      })
      return
    }

    setUploadingLicense(true)
    setStatusMessage(null)

    // Formatted license attachment info
    const attachmentText = `Giấy phép Quảng cáo số: ${licenseCode} (Đã đính kèm: ${licenseFile || 'giay-phep-qc.pdf'})`
    const updatedMediaUrls = [...(selectedItem.media_urls || []), attachmentText]

    try {
      const { error } = await supabase
        .from('content')
        .update({ 
          media_urls: updatedMediaUrls,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedItem.id)

      if (error) throw error

      setStatusMessage({
        type: 'success',
        text: 'Đã đính kèm Giấy phép Quảng cáo Y tế vào nội dung thành công!'
      })

      setSelectedItem(prev => ({ ...prev, media_urls: updatedMediaUrls }))
      setContentQueue(prev => prev.map(item => item.id === selectedItem.id ? { ...item, media_urls: updatedMediaUrls } : item))
      setLicenseCode('')
      setLicenseFile(null)
    } catch (err: any) {
      console.warn('DB update failed, using local simulation:', err.message)
      
      // Local Sandbox
      setSelectedItem(prev => ({ ...prev, media_urls: updatedMediaUrls }))
      setContentQueue(prev => prev.map(item => item.id === selectedItem.id ? { ...item, media_urls: updatedMediaUrls } : item))
      setLicenseCode('')
      setLicenseFile(null)

      setStatusMessage({
        type: 'success',
        text: '[HỘP CÁT LOCAL] Đã đính kèm Giấy phép Quảng cáo Y tế thành công!'
      })
    } finally {
      setUploadingLicense(false)
    }
  }

  // Mock license file upload
  const simulateFileUpload = () => {
    setUploadingLicense(true)
    setTimeout(() => {
      setLicenseFile(`GPQC_${Math.floor(Math.random() * 10000)}_Signed.pdf`)
      setUploadingLicense(false)
    }, 1000)
  }

  const bannedCount = selectedItem ? getBannedWordsCount(selectedItem.body) : 0

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header & Role Simulator */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-tr from-[#10b981] to-[#059669]">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Medical & Legal Review</h1>
            <p className="text-sm text-gray-400">
              Kiểm duyệt nội dung y khoa, rà quét pháp lý & đính kèm giấy phép quảng cáo y tế
            </p>
          </div>
        </div>

        {/* Premium Developer-Friendly Role Simulator */}
        <div className="flex items-center gap-2.5 bg-white/5 border border-white/10 p-2 rounded-xl">
          <span className="text-xs text-gray-400 font-bold flex items-center gap-1 flex-shrink-0">
            <UserCheck className="w-3.5 h-3.5 text-[#10b981]" /> Giả lập Vai trò:
          </span>
          <div className="flex gap-1">
            {[
              { role: 'doctor', label: 'Bác sĩ (Doctor)' },
              { role: 'marketer', label: 'Marketer' },
              { role: 'admin', label: 'Admin' }
            ].map((btn) => (
              <button
                key={btn.role}
                onClick={() => {
                  setActiveRole(btn.role as any)
                  setStatusMessage(null)
                }}
                className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-all duration-200 ${
                  activeRole === btn.role
                    ? 'bg-gradient-to-tr from-[#10b981] to-[#059669] text-white shadow-md'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Queue List (35%) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="card-surface p-5">
            <h3 className="text-sm font-semibold text-white mb-3.5 flex items-center justify-between">
              <span>Hàng đợi kiểm duyệt ({contentQueue.length})</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400">Giai đoạn 1</span>
            </h3>
            
            {loadingQueue ? (
              <div className="text-center py-8">
                <Clock className="w-6 h-6 animate-spin text-gray-500 mx-auto mb-2" />
                <p className="text-xs text-gray-400">Đang tải hàng đợi...</p>
              </div>
            ) : contentQueue.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-white/5 rounded-xl">
                <FileText className="w-7 h-7 text-gray-600 mx-auto mb-2" />
                <p className="text-xs text-gray-400 font-medium">Chưa có nội dung cần duyệt</p>
                <p className="text-[10px] text-gray-500 mt-1">Nội dung tạo từ Giai đoạn 0 sẽ hiển thị ở đây</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                {contentQueue.map((item) => {
                  const isSelected = selectedItem?.id === item.id
                  const wordsCount = getBannedWordsCount(item.body)
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setSelectedItem(item)
                        setStatusMessage(null)
                        setDoctorFeedback('')
                        setLicenseCode('')
                        setLicenseFile(null)
                      }}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 flex flex-col gap-2 ${
                        isSelected
                          ? 'bg-white/5 border-[#10b981]/50 shadow-lg shadow-emerald-500/5'
                          : 'bg-white/[0.01] border-white/5 hover:border-white/10 hover:bg-white/[0.02]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 min-w-0 w-full">
                        <p className="text-xs font-semibold text-white truncate flex-1">{item.title}</p>
                        {wordsCount > 0 && (
                          <span className="text-[9px] font-bold bg-rose-500/10 border border-rose-500/30 text-rose-400 px-1.5 py-0.5 rounded flex items-center gap-0.5 flex-shrink-0">
                            <AlertTriangle className="w-2.5 h-2.5" /> Quét: {wordsCount}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between text-[10px] text-gray-400 w-full">
                        <span className="capitalize">{item.content_type || 'Báo cáo'}</span>
                        <div className="flex items-center gap-2">
                          <span className={`font-bold px-2 py-0.5 rounded-full ${
                            item.status === 'approved'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : item.status === 'rejected'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {item.status === 'approved' ? 'Doctor_Approved' : item.status === 'rejected' ? 'Doctor_Rejected' : 'Pending'}
                          </span>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Detailed Workspace (65%) */}
        <div className="lg:col-span-8 space-y-6">
          {selectedItem ? (
            <div className="space-y-6">
              
              {/* Legal Guardrails Scan Block */}
              <div className="card-surface p-6 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <FileSearch className="w-5 h-5 text-[#10b981]" />
                    <h3 className="text-sm font-semibold text-white">Nội dung Thẩm định & Rà quét Pháp lý</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {bannedCount > 0 ? (
                      <span className="text-xs font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        Phát hiện {bannedCount} từ bị cấm quảng cáo y tế!
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5" />
                        An toàn Pháp lý y tế
                      </span>
                    )}
                  </div>
                </div>

                {/* Banner Warnings */}
                {bannedCount > 0 && (
                  <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-2.5">
                    <AlertCircle className="w-4.5 h-4.5 text-rose-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[11px] font-bold text-rose-300">Vi phạm quy tắc quảng cáo y tế:</p>
                      <p className="text-[10px] text-rose-300/80 mt-0.5 leading-relaxed">
                        Nội dung có chứa từ ngữ cam kết kết quả, nói quá hoặc từ ngữ bị cấm bởi luật y tế Việt Nam. Vui lòng yêu cầu Marketer sửa đổi hoặc chuyển đổi trạng thái thành **Doctor_Rejected** để viết lại.
                      </p>
                    </div>
                  </div>
                )}

                {/* Document details box */}
                <div className="bg-gray-950/60 rounded-xl p-5 border border-white/5 space-y-4">
                  <div className="border-b border-white/5 pb-2 flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white">{selectedItem.title}</h4>
                    <span className="text-[10px] text-gray-500">Giai đoạn 0</span>
                  </div>
                  
                  {/* Highlighted text body */}
                  <div className="min-h-[120px]">
                    {renderHighlightedBody(selectedItem.body)}
                  </div>
                </div>

                {/* Attached licenses list if any */}
                {selectedItem.media_urls && selectedItem.media_urls.some((url: string) => url.includes('Giấy phép')) && (
                  <div className="pt-2">
                    <h5 className="text-xs font-bold text-gray-400 mb-2">Giấy phép Quảng cáo y tế đã gắn:</h5>
                    <div className="flex flex-wrap gap-2">
                      {selectedItem.media_urls
                        .filter((url: string) => url.includes('Giấy phép'))
                        .map((license: string, idx: number) => (
                          <div key={idx} className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs py-1.5 px-3 rounded-lg font-medium">
                            <FileText className="w-3.5 h-3.5" />
                            {license}
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Status Message */}
              {statusMessage && (
                <div className={`p-4 rounded-xl flex items-start gap-3 border ${
                  statusMessage.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                }`}>
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <p className="text-xs font-semibold">{statusMessage.text}</p>
                </div>
              )}

              {/* Workflow Actions Section (Divided by simulator roles) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Panel 1: Doctor Approvals (Disabled if role is not doctor/admin) */}
                <div className={`card-surface p-5 space-y-4 relative ${
                  activeRole !== 'doctor' && activeRole !== 'admin' ? 'opacity-50 pointer-events-none select-none' : ''
                }`}>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#10b981]" />
                    Quyết định Y khoa (Doctor Workflow)
                  </h4>
                  
                  {activeRole !== 'doctor' && activeRole !== 'admin' && (
                    <div className="absolute inset-0 bg-gray-950/40 backdrop-blur-[1px] rounded-2xl flex items-center justify-center z-10 p-4">
                      <div className="bg-gray-900 border border-white/10 p-3 rounded-xl shadow-lg flex items-center gap-2 max-w-xs text-center flex-col">
                        <ShieldAlert className="w-5 h-5 text-rose-400" />
                        <p className="text-[10px] text-gray-300 font-semibold leading-relaxed">
                          Chỉ Doctor/Admin mới có quyền thao tác trên bảng duyệt Y khoa này.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <label className="block text-[11px] text-gray-400">Ý kiến chuyên môn / Ghi chú lâm sàng</label>
                    <textarea
                      placeholder="Nhập lý do phê duyệt hoặc lý do từ chối (ví dụ: cần chỉnh sửa các từ bị cấm, bổ sung cảnh báo y văn)..."
                      value={doctorFeedback}
                      onChange={(e) => setDoctorFeedback(e.target.value)}
                      rows={3}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#10b981] transition-all resize-none"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateStatus('approved')}
                      disabled={updatingStatus}
                      className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 active:scale-95 transition-all shadow-md shadow-emerald-500/10"
                    >
                      <CheckCircle className="w-4 h-4" /> Doctor_Approved
                    </button>
                    <button
                      onClick={() => handleUpdateStatus('rejected')}
                      disabled={updatingStatus}
                      className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 active:scale-95 transition-all shadow-md shadow-rose-500/10"
                    >
                      <XCircle className="w-4 h-4" /> Doctor_Rejected
                    </button>
                  </div>
                </div>

                {/* Panel 2: Marketer - Attach Advertising License (Disabled if role is not marketer/admin) */}
                <div className={`card-surface p-5 space-y-4 relative ${
                  activeRole !== 'marketer' && activeRole !== 'admin' ? 'opacity-50 pointer-events-none select-none' : ''
                }`}>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-[#2895ef]" />
                    Đính kèm Giấy phép Quảng cáo y tế
                  </h4>

                  {activeRole !== 'marketer' && activeRole !== 'admin' && (
                    <div className="absolute inset-0 bg-gray-950/40 backdrop-blur-[1px] rounded-2xl flex items-center justify-center z-10 p-4">
                      <div className="bg-gray-900 border border-white/10 p-3 rounded-xl shadow-lg flex items-center gap-2 max-w-xs text-center flex-col">
                        <ShieldAlert className="w-5 h-5 text-[#2895ef]" />
                        <p className="text-[10px] text-gray-300 font-semibold leading-relaxed">
                          Chỉ Marketer/Admin mới có quyền đính kèm Giấy phép Quảng cáo cho bài viết.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Disable file attachment if not approved yet as guardrail */}
                  {selectedItem.status !== 'approved' && (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2">
                      <AlertTriangle className="w-4.5 h-4.5 text-amber-400 flex-shrink-0 mt-0.5" />
                      <p className="text-[10px] text-amber-300/80 leading-relaxed">
                        Khuyến nghị: Chỉ đính kèm giấy phép quảng cáo sau khi nội dung đã được Bác sĩ phê duyệt (**Doctor_Approved**).
                      </p>
                    </div>
                  )}

                  <form onSubmit={handleAttachLicense} className="space-y-3">
                    <div>
                      <label className="block text-[11px] text-gray-400 mb-1">Mã / Số Giấy phép Quảng cáo</label>
                      <input
                        type="text"
                        placeholder="Số: 1234/2026/XNQC-YTHN..."
                        value={licenseCode}
                        onChange={(e) => setLicenseCode(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#2895ef] transition-all font-semibold"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[11px] text-gray-400">Tài liệu ký số đính kèm (PDF/Ảnh)</label>
                      {licenseFile ? (
                        <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
                          <span className="truncate max-w-[200px] flex items-center gap-1.5 font-semibold">
                            <FileText className="w-3.5 h-3.5" />
                            {licenseFile}
                          </span>
                          <button
                            type="button"
                            onClick={() => setLicenseFile(null)}
                            className="text-[10px] text-rose-400 hover:underline"
                          >
                            Xóa file
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={simulateFileUpload}
                          disabled={uploadingLicense}
                          className="w-full flex flex-col items-center justify-center p-3 rounded-xl border border-dashed border-white/10 hover:border-white/20 bg-white/[0.005] hover:bg-white/[0.01] transition-all gap-1.5"
                        >
                          <Upload className="w-4 h-4 text-gray-500" />
                          <span className="text-[10px] text-gray-400 font-bold">
                            {uploadingLicense ? 'Đang giả lập tải lên...' : 'Chọn file Giấy phép (.pdf / .png / .jpg)'}
                          </span>
                        </button>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={!licenseCode.trim() || uploadingLicense}
                      className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all shadow-md shadow-blue-500/10"
                    >
                      <Check className="w-3.5 h-3.5" /> Đính kèm Giấy phép Quảng cáo
                    </button>
                  </form>
                </div>
              </div>

            </div>
          ) : (
            <div className="card-surface p-12 text-center flex flex-col items-center justify-center">
              <Clock className="w-12 h-12 text-gray-600 mb-4 animate-pulse" />
              <h4 className="text-sm font-semibold text-white mb-1.5">Hàng đợi kiểm duyệt trống hoặc chưa chọn bài</h4>
              <p className="text-xs text-gray-400 max-w-sm leading-relaxed">
                Vui lòng chọn bài viết từ cột bên trái để bắt đầu thẩm định Y khoa, quét từ cấm quảng cáo và đính kèm giấy phép.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
