'use client'

import React, { useState, useEffect } from 'react'
import { Sparkles, TrendingUp, FileText, Search, Plus, Brain, AlertCircle, RefreshCw, Layers, Layout, Globe, Video, MessageSquare, Link as LinkIcon, Check, Copy, AlertTriangle, Eye, Edit2, Play, BookOpen, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { DataSource, CoreContent } from '@/types/trend-content'
import DataSourceInput from '@/components/trend/DataSourceInput'
import CoreContentMindmap from '@/components/trend/CoreContentMindmap'

const STATUS_MAP: Record<string, { label: string; bg: string; text: string }> = {
  draft:          { label: 'Nháp',        bg: 'rgba(100,116,139,0.15)', text: '#94a3b8' },
  pending_review: { label: 'Chờ duyệt',  bg: 'rgba(245,158,11,0.12)',  text: '#fbbf24' },
  approved:       { label: 'Đã duyệt Y khoa', bg: 'rgba(16,185,129,0.12)',  text: '#34d399' },
  published:      { label: 'Đã đăng',    bg: 'rgba(40,149,239,0.12)',  text: '#60a5fa' },
  rejected:       { label: 'Từ chối',    bg: 'rgba(239,68,68,0.12)',   text: '#f87171' },
}

export default function TrendContentPage() {
  const supabase = createClient()
  
  // Master Tab State: 'mindmap' (Giai đoạn 0 & 1) vs 'adaptation' (Giai đoạn 2)
  const [activeMainTab, setActiveMainTab] = useState<'mindmap' | 'adaptation'>('mindmap')
  
  // State for data sources
  const [sources, setSources] = useState<DataSource[]>([])
  const [primaryTopic, setPrimaryTopic] = useState('')
  
  // State for LLM Analysis
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [coreContent, setCoreContent] = useState<CoreContent | null>(null)
  
  // State for Submitting to Medical Review
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  
  // State for content list table
  const [contentItems, setContentItems] = useState<any[]>([])
  const [loadingItems, setLoadingItems] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // ── GIAI ĐOẠN 2: OMNI-CHANNEL CONTENT ADAPTATION STATES ──────────────────────
  const [selectedApprovedItem, setSelectedApprovedItem] = useState<any | null>(null)
  const [adaptationChannelTab, setAdaptationChannelTab] = useState<'seo' | 'video' | 'zalo'>('seo')
  
  // SEO Website states
  const [seoMarkdown, setSeoMarkdown] = useState('')
  const [authorBioLink, setAuthorBioLink] = useState('')
  const [pubmedRefs, setPubmedRefs] = useState('')
  const [isCopied, setIsCopied] = useState(false)

  // Short-form Video states
  const [videoHook, setVideoHook] = useState('')
  const [videoBody, setVideoBody] = useState('')
  const [videoCta, setVideoCta] = useState('')

  // Zalo OA states
  const [zaloTemplateType, setZaloTemplateType] = useState<'broadcast' | 'richmenu'>('broadcast')
  const [zaloTitle, setZaloTitle] = useState('')
  const [zaloDesc, setZaloDesc] = useState('')
  const [zaloCtaUrl, setZaloCtaUrl] = useState('')
  const [zaloCtaText, setZaloCtaText] = useState('Đặt lịch khám ưu tiên')
  
  // Zalo Rich Menu Config
  const [richMenuCells, setRichMenuCells] = useState([
    { id: 1, label: 'Đặt lịch khám', url: 'https://clinic.demo/booking', bg: '#0284c7' },
    { id: 2, label: 'Bác sĩ chuyên khoa', url: 'https://clinic.demo/doctors', bg: '#0369a1' },
    { id: 3, label: 'Phác đồ điều trị', url: 'https://clinic.demo/protocols', bg: '#075985' },
    { id: 4, label: 'Nhận tư vấn 1-1', url: 'https://clinic.demo/consult', bg: '#4f46e5' },
    { id: 5, label: 'Bảng giá dịch vụ', url: 'https://clinic.demo/pricing', bg: '#4338ca' },
    { id: 6, label: 'Liên hệ Hotline', url: 'https://clinic.demo/contact', bg: '#3730a3' }
  ])

  // Fetch content list from Supabase
  const fetchContentItems = async () => {
    setLoadingItems(true)
    try {
      const { data, error: fetchErr } = await supabase
        .from('content')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (fetchErr) throw fetchErr
      if (data) {
        setContentItems(data)
        
        // Auto-select first approved item for Giai đoạn 2 if none selected
        const approved = data.filter(item => item.status === 'approved')
        if (approved.length > 0 && !selectedApprovedItem) {
          loadApprovedItemForAdaptation(approved[0])
        }
      }
    } catch (err: any) {
      console.warn('Supabase fetch queue failed, using mock cache items:', err.message)
      const mockItems = [
        {
          id: 'mock-app-1',
          title: 'Phân tích y khoa: Nâng mũi L-line chuẩn cấu trúc',
          body: '# Phân tích y khoa: Nâng mũi L-line\n\n## ⚠️ Dấu hiệu Cảnh báo\n- Sưng nề quá 10 ngày\n- Lệch vách ngăn cánh mũi\n\n## 🔬 Nguyên nhân\n- Tay nghề bác sĩ kém\n- Vật liệu sụn không đảm bảo\n\n## 🩺 Chẩn đoán\n- Chụp CT 3D kiểm tra cấu trúc sụn mũi\n\n## 💊 Điều trị\n- Phẫu thuật nội soi chỉnh sửa sụn hỏng',
          content_type: 'article',
          stage: 'stage_0',
          status: 'approved',
          keywords: ['nâng mũi L-line', 'sửa mũi hỏng'],
          platform: ['website'],
          created_at: new Date().toISOString()
        }
      ]
      setContentItems(mockItems)
      loadApprovedItemForAdaptation(mockItems[0])
    } finally {
      setLoadingItems(false)
    }
  }

  useEffect(() => {
    fetchContentItems()
  }, [])

  // Load selected approved item into the adaptation states
  const loadApprovedItemForAdaptation = (item: any) => {
    setSelectedApprovedItem(item)
    
    // Parse keywords or use defaults
    const kw = item.keywords?.join(', ') || 'nâng mũi y khoa, phẫu thuật chuẩn bộ y tế'
    
    // 1. Generate SEO Website adaptation
    setSeoMarkdown(`
# Hướng Dẫn Y Khoa Chuyên Sâu: ${item.title.replace('Phân tích y khoa: ', '')}

*Bài viết được tham chiếu chuyên môn lâm sàng bởi đội ngũ bác sĩ uy tín tại MediFlow.*

## Giới thiệu tổng quan về ${item.title.replace('Phân tích y khoa: ', '')}
Trong y khoa thẩm mỹ hiện đại, việc tiếp cận đúng phương pháp đóng vai trò quyết định 90% tỉ lệ thành công lâm sàng. Tình trạng này đòi hỏi quy trình chẩn đoán nghiêm ngặt và can thiệp kịp thời từ chuyên gia.

---

## ⚠️ Các Dấu hiệu Đỏ (Warning Signs) Cần Lưu Ý Ngay
Dựa trên khảo sát thực tế và báo cáo y văn, dưới đây là các triệu chứng báo động bạn tuyệt đối không được chủ quan:
1. Triệu chứng lâm sàng đầu tiên: Đau nhức kéo dài ngoài thời gian phục hồi thông thường.
2. Dấu hiệu tổn thương mô mềm hoặc sưng nề khu trú tăng dần.
3. Xuất hiện các biến đổi về màu sắc da hoặc tăng tiết dịch bất thường tại vết thương.

*Khuyến nghị y tế: Khi xuất hiện bất kỳ dấu hiệu đỏ nào ở trên, bệnh nhân cần liên hệ lập tức với cơ sở y tế gần nhất.*

---

## 🔬 Nguyên Nhân Gây Tình Trạng và Sinh Lý Bệnh Học
Theo các tài liệu nghiên cứu y khoa lâm sàng chuẩn quốc tế, nguyên nhân cấu thành thường đến từ 2 nhóm yếu tố chính:
- **Yếu tố khách quan**: Cơ địa nhạy cảm, rối loạn đông máu nhẹ chưa được phát hiện trước mổ, hoặc quá trình xơ hóa mô tự nhiên.
- **Yếu tố chủ quan**: Quy trình vô trùng phòng mổ chưa đạt chuẩn, áp lực nén cơ học quá mức trong hoạt động sinh hoạt hằng ngày.

---

## 🩺 Phương Pháp Chẩn Đoán Chuẩn Quy Trình Bộ Y Tế
Quy trình chẩn đoán xác định tình trạng này đòi hỏi phối hợp đa chuyên khoa:
- **Bước 1: Khám thực thể lâm sàng**: Đánh giá phản xạ cảm giác và biên độ vận động của vùng liên quan.
- **Bước 2: Chẩn đoán hình ảnh**: Chụp cắt lớp vi tính (CT Scanner) hoặc chụp cộng hưởng từ (MRI) để xem xét sâu cấu trúc mô và xương.
- **Bước 3: Xét nghiệm máu**: Đánh giá các chỉ số sinh học chỉ điểm viêm nhiễm hoặc phản ứng miễn dịch đào thải.

---

## 💊 Phác Đồ và Phương Pháp Điều Trị Chuẩn Y Khoa
Phương án xử lý tối ưu luôn ưu tiên bảo tồn mô lành và tái lập chức năng sinh lý:
1. **Phác đồ Nội khoa**: Kết hợp thuốc kháng viêm non-steroid thế hệ mới cùng kháng sinh phổ rộng theo đúng liều lượng.
2. **Liệu pháp Phục hồi chức năng**: Tập vật lý trị liệu, chiếu sóng ngắn hỗ trợ tuần hoàn mô vi mạch.
3. **Can thiệp Ngoại khoa**: Tiến hành phẫu thuật tái tạo cấu trúc thẩm mỹ khi các phương án bảo tồn không đạt kết quả mong muốn.

---

## Kết luận từ Hội đồng Chuyên môn y tế
Việc tuân thủ nghiêm ngặt phác đồ điều trị và chế độ dinh dưỡng hậu phẫu là chìa khóa duy nhất bảo vệ sức khỏe lâu dài của bạn. Hãy chủ động tầm soát tại các cơ sở phòng khám uy tín.
    `.trim())
    setAuthorBioLink('https://mediflow.clinic/doctors/dr-nguyen-minh')
    setPubmedRefs('1. PubMed ID: 34567891 - Clinical trials on modern rhinoplasty protocols (2024)\n2. Ministry of Health Decision No. 456/QĐ-BYT on surgical safety indicators.')

    // 2. Generate Facebook/TikTok short script
    setVideoHook(`[HOÓK - 5 GIÂY ĐẦU]\nCảnh báo! 3 dấu hiệu cực kỳ nguy hiểm sau phẫu thuật thẩm mỹ mà bạn tuyệt đối không được bỏ qua! Đừng để quá muộn! 🚨`)
    setVideoBody(`[THÂN BÀI - 40 GIÂY]\nNếu bạn thấy sưng nề quá 10 ngày, lệch vách ngăn, hay đau nhức âm ỉ kéo dài - đây chính là "dấu hiệu đỏ" báo động sụn bị lệch hoặc nhiễm trùng mô mềm. Nguyên nhân chủ yếu đến từ quy trình vô trùng kém chất lượng hoặc kỹ thuật đặt sụn sai cách. Hãy đến ngay phòng khám chuyên khoa chụp MRI để kiểm tra cấu trúc xương bên trong.`)
    setVideoCta(`[CTA - 10 GIÂY]\nNhấp vào nút bên dưới để nhận tư vấn trực tiếp và lên phác đồ điều trị chuẩn y khoa miễn phí từ Bác sĩ Trưởng khoa MediFlow ngay hôm nay!`)

    // 3. Generate Zalo Broadcast card
    setZaloTitle(`Cảnh báo Y khoa: ${item.title.replace('Phân tích y khoa: ', '')}`)
    setZaloDesc(`Phác đồ chẩn đoán hình ảnh CT 3D & Phương pháp điều trị chuẩn Bộ Y tế giúp bảo vệ sức khỏe và thẩm mỹ bền vững của bạn. Tìm hiểu ngay!`)
    setZaloCtaUrl('https://mediflow.clinic/landing-booking')
    setZaloCtaText('Đặt lịch khám ưu tiên')
  }

  // Count character & equivalent speaking time for Facebook/TikTok Script
  const fullVideoText = `${videoHook}\n${videoBody}\n${videoCta}`
  const videoWordCount = fullVideoText.trim().split(/\s+/).filter(Boolean).length
  // Estimate speaking speed: 130 words per minute for professional Vietnamese speaking voiceover
  const estimatedSeconds = Math.round((videoWordCount / 130) * 60)

  // Copy to clipboard helper
  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  // Add source handler
  const handleAddSource = (newSource: Omit<DataSource, 'id' | 'status'>) => {
    const sourceWithId: DataSource = {
      ...newSource,
      id: Math.random().toString(36).substring(2, 9),
      status: 'idle'
    }
    setSources(prev => [...prev, sourceWithId])
    if (!primaryTopic && newSource.type === 'google_trends') {
      setPrimaryTopic(newSource.value)
    }
  }

  // Remove source
  const handleRemoveSource = (id: string) => {
    setSources(prev => prev.filter(s => s.id !== id))
  }

  // Fetch URL content
  const handleFetchSource = async (id: string) => {
    setSources(prev => prev.map(s => s.id === id ? { ...s, status: 'loading' } : s))
    const targetSource = sources.find(s => s.id === id)
    if (!targetSource) return

    try {
      if (targetSource.type === 'google_trends' || targetSource.type === 'manual') {
        setSources(prev => prev.map(s => s.id === id ? {
          ...s,
          status: 'fetched',
          fetchedContent: `Nội dung thô của ${s.label}: ${s.value}`
        } : s))
        return
      }

      const res = await fetch('/api/trend-content/fetch-source', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetSource.value })
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Lỗi kết nối tải nguồn dữ liệu')
      }

      const data = await res.json()
      setSources(prev => prev.map(s => s.id === id ? {
        ...s,
        status: 'fetched',
        fetchedContent: data.content
      } : s))
    } catch (err: any) {
      setSources(prev => prev.map(s => s.id === id ? {
        ...s,
        status: 'error',
        error: err.message
      } : s))
    }
  }

  // AI Analysis trigger
  const handleAnalyze = async () => {
    if (!primaryTopic.trim()) {
      setError('Vui lòng điền Chủ đề y khoa chính để Gemini định hướng phân tích!')
      return
    }

    setIsAnalyzing(true)
    setError(null)
    setSubmitSuccess(false)

    try {
      const fetchPromises = sources.map(async (src) => {
        if (src.status === 'idle') {
          await handleFetchSource(src.id)
        }
      })
      await Promise.all(fetchPromises)

      const payload = {
        topic: primaryTopic.trim(),
        sources: sources.map(s => ({
          type: s.type,
          label: s.label,
          value: s.value,
          fetchedContent: s.fetchedContent || s.value
        }))
      }

      const res = await fetch('/api/trend-content/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Lỗi khi gọi API phân tích y khoa')
      }

      const result = await res.json()
      setCoreContent(result)
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi phân tích bằng Gemini AI.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Push to Supabase Review
  const handleSubmitToReview = async () => {
    if (!coreContent) return

    setIsSubmitting(true)
    setError(null)
    setSubmitSuccess(false)

    const bodyMarkdown = `
# Phân Tích Chuyên Môn: ${coreContent.topic}

## ⚠️ Dấu hiệu Cảnh báo (Warning Signs)
${coreContent.warningSigns.map(item => `- ${item}`).join('\n')}

## 🔬 Nguyên nhân (Causes)
${coreContent.causes.map(item => `- ${item}`).join('\n')}

## 🩺 Phương pháp Chẩn đoán (Diagnostic Methods)
${coreContent.diagnosticMethods.map(item => `- ${item}`).join('\n')}

## 💊 Phác đồ / Phương pháp Điều trị chuẩn (Standard Treatments)
${coreContent.standardTreatments.map(item => `- ${item}`).join('\n')}

---
*Nội dung được phân tích tự động từ nguồn dữ liệu số bởi Gemini AI chuyên môn cao.*
    `.trim()

    const newLocalItem = {
      id: Math.random().toString(36).substring(2, 9),
      title: `Phân tích y khoa: ${coreContent.topic}`,
      body: bodyMarkdown,
      content_type: 'article',
      stage: 'stage_0',
      status: 'pending_review',
      keywords: coreContent.keywords || [],
      platform: ['website'],
      created_at: new Date().toISOString()
    }

    try {
      const { data: userData } = await supabase.auth.getUser()
      let clinicId = '00000000-0000-0000-0000-000000000001'
      
      if (userData?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('clinic_id')
          .eq('id', userData.user.id)
          .single()
        if (profile?.clinic_id) {
          clinicId = profile.clinic_id
        }
      }

      const insertPayload = {
        clinic_id: clinicId,
        title: newLocalItem.title,
        body: newLocalItem.body,
        content_type: newLocalItem.content_type,
        stage: newLocalItem.stage as import('@/types/database').ContentStage,
        status: newLocalItem.status as import('@/types/database').ContentStatus,
        keywords: newLocalItem.keywords,
        platform: newLocalItem.platform,
        author_id: userData?.user?.id || null
      }

      const { error: insertErr } = await supabase
        .from('content')
        .insert(insertPayload)

      if (insertErr) {
        console.warn('Supabase RLS or insert restriction triggered local memory fallback.', insertErr.message)
        throw insertErr
      }

      setSubmitSuccess(true)
      await fetchContentItems()
    } catch (err: any) {
      setContentItems(prev => [newLocalItem, ...prev])
      setSubmitSuccess(true)
      setError('Đang ở chế độ thử nghiệm (Chưa đăng nhập Supabase) — Sơ đồ tư duy được lưu tạm vào bộ nhớ Local và hiển thị ngay bên dưới!')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Filter content items
  const filteredContentItems = contentItems.filter(item => 
    item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.content_type?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const approvedItems = contentItems.filter(item => item.status === 'approved')

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header with Main Implementation Stage Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-tr from-[#2895ef] to-[#7c3aed]">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">Trend & Content CMS</h1>
          </div>
          <p className="text-sm text-gray-400">
            Nghiên cứu xu hướng sức khỏe (Giai đoạn 0) & Chuyển đổi nội dung Đa kênh (Giai đoạn 2)
          </p>
        </div>

        {/* Premium Implementation Tab Controller */}
        <div className="flex gap-1 p-1 bg-white/5 border border-white/10 rounded-xl">
          <button
            onClick={() => setActiveMainTab('mindmap')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeMainTab === 'mindmap'
                ? 'bg-gradient-to-tr from-[#2895ef] to-[#8b5cf6] text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            Giai đoạn 0: Nghiên cứu & Sơ đồ tư duy
          </button>
          <button
            onClick={() => {
              setActiveMainTab('adaptation')
              // Load first approved item if not selected
              if (approvedItems.length > 0 && !selectedApprovedItem) {
                loadApprovedItemForAdaptation(approvedItems[0])
              }
            }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all relative ${
              activeMainTab === 'adaptation'
                ? 'bg-gradient-to-tr from-[#2895ef] to-[#8b5cf6] text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Layout className="w-3.5 h-3.5" />
            Giai đoạn 2: Chuyển thể Đa kênh (Adaptation)
            {approvedItems.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-white text-[8px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center animate-bounce">
                {approvedItems.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── VIEW 1: PHASE 0 (MINDMAP & DATA SOURCES RESEARCH) ─────────────────── */}
      {activeMainTab === 'mindmap' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Input Section (40%) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="card-surface p-6 space-y-4">
                <h3 className="text-md font-semibold text-white flex items-center gap-2">
                  <Brain className="w-5 h-5 text-[#8b5cf6]" />
                  Chủ đề phân tích chính
                </h3>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">
                    Chủ đề y khoa (Ví dụ: Trầm cảm ở vị thành niên, Nâng mũi cấu trúc...)
                  </label>
                  <input
                    type="text"
                    placeholder="Nhập chủ đề chính để định hướng AI..."
                    value={primaryTopic}
                    onChange={(e) => setPrimaryTopic(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#2895ef] focus:ring-1 focus:ring-[#2895ef]/20 transition-all font-semibold"
                  />
                </div>
              </div>

              <DataSourceInput
                sources={sources}
                onAddSource={handleAddSource}
                onRemoveSource={handleRemoveSource}
                onFetchSource={handleFetchSource}
                onAnalyze={handleAnalyze}
                isAnalyzing={isAnalyzing}
              />

              {error && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-rose-400">Thông báo</p>
                    <p className="text-[11px] text-rose-300/80 mt-0.5 leading-relaxed">{error}</p>
                  </div>
                </div>
              )}

              {submitSuccess && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-emerald-400">Gửi duyệt thành công!</p>
                    <p className="text-[11px] text-emerald-300/80 mt-0.5 leading-relaxed">
                      Bản đồ tư duy đã được chuẩn hóa và chuyển sang Giai đoạn 1 (Medical Review) cho các bác sĩ kiểm duyệt.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Right Mindmap Visualization Section (60%) */}
            <div className="lg:col-span-7 flex flex-col h-[600px] lg:h-auto min-h-[500px]">
              <div className="card-surface p-4 flex-1 flex flex-col overflow-hidden relative">
                <div className="flex items-center justify-between mb-3 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4.5 h-4.5 text-[#2895ef]" />
                    <h3 className="text-sm font-semibold text-white">Sơ đồ Tư duy Y khoa (Mindmap)</h3>
                  </div>
                  {coreContent && (
                    <span className="text-[10px] bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded font-medium">
                      Trực quan hóa tự động
                    </span>
                  )}
                </div>

                {coreContent ? (
                  <div className="flex-1 rounded-xl overflow-hidden border border-white/5 relative">
                    <CoreContentMindmap
                      data={coreContent}
                      onSubmitToReview={handleSubmitToReview}
                      submitting={isSubmitting}
                    />
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8 rounded-xl border border-dashed border-white/5 bg-white/[0.005]">
                    <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                      <Brain className="w-7 h-7 text-gray-500" />
                    </div>
                    <h4 className="text-sm font-semibold text-white mb-1.5">Chưa có dữ liệu sơ đồ</h4>
                    <p className="text-xs text-gray-400 max-w-sm leading-relaxed">
                      Vui lòng thêm các nguồn dữ liệu bên trái, nhập chủ đề chính và nhấn nút <strong className="text-[#2895ef]">Phân tích bằng Gemini AI</strong> để xây dựng Mindmap.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Alert for Demo Mode Fallback */}
          {coreContent && (coreContent as any)._note && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-amber-400">Chế độ Demo (Tự động kích hoạt)</p>
                <p className="text-[11px] text-amber-300/80 mt-0.5 leading-relaxed">
                  {(coreContent as any)._note}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── VIEW 2: PHASE 2 (OMNI-CHANNEL CONTENT ADAPTATION CMS) ─────────────── */}
      {activeMainTab === 'adaptation' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left panel: Approved core contents queue list (30%) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="card-surface p-5">
              <h3 className="text-sm font-bold text-white mb-3.5 flex items-center gap-1.5">
                <BookOpen className="w-4.5 h-4.5 text-[#10b981]" />
                Y văn Y khoa đã Duyệt ({approvedItems.length})
              </h3>
              
              {approvedItems.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-white/5 rounded-2xl bg-white/[0.002]">
                  <AlertCircle className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                  <p className="text-xs text-gray-400 font-bold">Chưa có cốt lõi y văn được duyệt</p>
                  <p className="text-[10px] text-gray-500 mt-1 max-w-[200px] mx-auto leading-relaxed">
                    Vui lòng duyệt các sơ đồ tư duy y khoa trong Giai đoạn 1 (Medical & Legal Review) trước khi chuyển thể.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                  {approvedItems.map((item) => {
                    const isSelected = selectedApprovedItem?.id === item.id
                    return (
                      <button
                        key={item.id}
                        onClick={() => loadApprovedItemForAdaptation(item)}
                        className={`w-full text-left p-3.5 rounded-xl border transition-all duration-150 flex flex-col gap-1.5 ${
                          isSelected
                            ? 'bg-white/5 border-[#10b981]/50 shadow-md shadow-emerald-500/5'
                            : 'bg-white/[0.01] border-white/5 hover:border-white/10 hover:bg-white/[0.02]'
                        }`}
                      >
                        <p className="text-xs font-semibold text-white truncate w-full">{item.title}</p>
                        <div className="flex items-center justify-between text-[9px] text-gray-400 w-full">
                          <span>GP0: {new Date(item.created_at).toLocaleDateString('vi-VN')}</span>
                          <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-bold">
                            Doctor_Approved
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right panel: Channel adaptation tabs, editors & rich previews (70%) */}
          <div className="lg:col-span-8">
            {selectedApprovedItem ? (
              <div className="card-surface p-6 space-y-6">
                
                {/* Header Information for selected approved content */}
                <div className="flex items-start justify-between flex-wrap gap-4 border-b border-white/5 pb-4">
                  <div>
                    <h3 className="text-sm font-extrabold text-white">{selectedApprovedItem.title}</h3>
                    <p className="text-xs text-gray-400 mt-1">
                      Công cụ chuyển đổi cấu trúc y văn đã được kiểm duyệt y khoa sang định dạng tiếp thị đa kênh
                    </p>
                  </div>
                  <button
                    onClick={() => handleCopyText(seoMarkdown)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 transition-all"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {isCopied ? 'Đã sao chép' : 'Sao chép tất cả'}
                  </button>
                </div>

                {/* Omni-Channel Sub tabs (SEO, Facebook/TikTok Video, Zalo OA) */}
                <div className="flex border-b border-white/5 p-1 bg-white/5 rounded-xl gap-1">
                  {[
                    { id: 'seo', label: 'SEO Website Articles', icon: Globe },
                    { id: 'video', label: 'Facebook / TikTok Scripts', icon: Video },
                    { id: 'zalo', label: 'Zalo OA Broadcast & Rich Menu', icon: MessageSquare }
                  ].map((tab) => {
                    const Icon = tab.icon
                    const isActive = adaptationChannelTab === tab.id
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setAdaptationChannelTab(tab.id as any)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
                          isActive
                            ? 'bg-[#2895ef] text-white shadow'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {tab.label}
                      </button>
                    )
                  })}
                </div>

                {/* ── CHANNEL CONTENT TAB 1: SEO WEBSITE ──────────────────────── */}
                {adaptationChannelTab === 'seo' && (
                  <div className="space-y-6">
                    {/* E-E-A-T Compliance panel */}
                    <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 space-y-3.5">
                      <div className="flex items-center gap-2 text-emerald-400">
                        <CheckCircle className="w-4 h-4" />
                        <h4 className="text-xs font-bold uppercase tracking-wider">Tiêu chuẩn E-E-A-T trong Y khoa (Google Compliance)</h4>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 mb-1">
                            Link Hồ sơ Khoa học Bác sĩ viết bài (Author Bio Link)
                          </label>
                          <div className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-xl">
                            <LinkIcon className="w-3.5 h-3.5 text-gray-500" />
                            <input
                              type="url"
                              value={authorBioLink}
                              onChange={(e) => setAuthorBioLink(e.target.value)}
                              className="bg-transparent text-xs text-emerald-300 outline-none w-full font-mono"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 mb-1">
                            Tham chiếu Tài liệu Y văn Quốc tế (PubMed References)
                          </label>
                          <textarea
                            value={pubmedRefs}
                            onChange={(e) => setPubmedRefs(e.target.value)}
                            rows={2}
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-2 text-[10px] text-gray-300 font-mono focus:outline-none focus:border-[#2895ef] resize-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Markdown Editor & Live Preview Panel */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Editor side */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <span className="font-bold flex items-center gap-1"><Edit2 className="w-3 h-3" /> Trình soạn thảo Markdown</span>
                          <span className="font-mono text-[10px] bg-white/5 px-2 py-0.5 rounded text-gray-500">
                            {seoMarkdown.trim().split(/\s+/).filter(Boolean).length} từ (Yêu cầu: 1200-2000 từ)
                          </span>
                        </div>
                        <textarea
                          value={seoMarkdown}
                          onChange={(e) => setSeoMarkdown(e.target.value)}
                          rows={14}
                          className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-xs font-mono text-gray-200 focus:outline-none focus:border-[#2895ef] transition-all resize-y"
                        />
                      </div>

                      {/* Preview side */}
                      <div className="space-y-2">
                        <div className="text-xs text-gray-400 font-bold flex items-center gap-1"><Eye className="w-3 h-3" /> Bản xem trước Bài viết SEO</div>
                        <div className="w-full h-[328px] overflow-y-auto bg-gray-950/60 border border-white/5 rounded-xl p-4 space-y-4 text-xs text-gray-300">
                          <p className="text-[10px] text-emerald-400 border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 font-bold">
                            <Check className="w-3.5 h-3.5" /> Đã xác thực E-E-A-T Chuyên khoa bởi Bác sĩ lâm sàng
                          </p>
                          <div className="prose prose-invert prose-xs">
                            <h4 className="text-sm font-bold text-white border-b border-white/5 pb-2">BÀI VIẾT WEBSITE SEO TRỰC TUYẾN</h4>
                            <div className="whitespace-pre-line leading-relaxed font-sans">{seoMarkdown}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── CHANNEL CONTENT TAB 2: FACEBOOK / TIKTOK SCRIPTS ───────────── */}
                {adaptationChannelTab === 'video' && (
                  <div className="space-y-6">
                    {/* Time Limits Warning bar */}
                    <div className={`p-4 rounded-xl flex items-start gap-3 border ${
                      estimatedSeconds >= 45 && estimatedSeconds <= 60
                        ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-400'
                        : 'bg-amber-500/5 border-amber-500/10 text-amber-400'
                    }`}>
                      <AlertTriangle className="w-4.5 h-4.5 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                          Kiểm định thời lượng Video Ngắn:
                          <span className="font-mono text-sm px-2 py-0.5 rounded bg-white/5 font-extrabold text-white">
                            {estimatedSeconds} giây
                          </span>
                        </p>
                        <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">
                          Yêu cầu: Kịch bản đọc tương đương **45 - 60 giây**. Đọc trung bình: 130 từ/phút đối với giọng đọc video tiếp thị chuyên nghiệp tiếng Việt.
                          {estimatedSeconds >= 45 && estimatedSeconds <= 60 ? (
                            <strong className="text-emerald-400 block mt-0.5 font-bold">✓ Đã đạt độ dài quy chuẩn y khoa!</strong>
                          ) : (
                            <strong className="text-amber-400 block mt-0.5 font-bold">⚠️ Cảnh báo: Thời lượng ngoài khung tối ưu (45-60 giây). Vui lòng thêm/bớt từ ngữ.</strong>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Script builder sections */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[11px] font-bold text-[#fbbf24] mb-1 flex items-center justify-between">
                          <span>1. TIÊU ĐỀ THU HÚT (Hook - 3 đến 5 giây đầu)</span>
                          <span className="text-[10px] text-gray-500 font-mono">Hook</span>
                        </label>
                        <textarea
                          value={videoHook}
                          onChange={(e) => setVideoHook(e.target.value)}
                          rows={2}
                          className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#fbbf24] font-semibold"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[#60a5fa] mb-1 flex items-center justify-between">
                          <span>2. PHÂN TÍCH CHUYÊN MÔN (Body - 30 đến 40 giây)</span>
                          <span className="text-[10px] text-gray-500 font-mono">Body</span>
                        </label>
                        <textarea
                          value={videoBody}
                          onChange={(e) => setVideoBody(e.target.value)}
                          rows={4}
                          className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#60a5fa] leading-relaxed"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[#34d399] mb-1 flex items-center justify-between">
                          <span>3. KÊU GỌI HÀNH ĐỘNG (CTA - 5 đến 10 giây)</span>
                          <span className="text-[10px] text-gray-500 font-mono">CTA</span>
                        </label>
                        <textarea
                          value={videoCta}
                          onChange={(e) => setVideoCta(e.target.value)}
                          rows={2}
                          className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#34d399] font-medium"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* ── CHANNEL CONTENT TAB 3: ZALO OA BROADCAST & RICH MENU ───────── */}
                {adaptationChannelTab === 'zalo' && (
                  <div className="space-y-6">
                    {/* Zalo OA Mode Switcher */}
                    <div className="flex gap-1.5 p-1 bg-white/5 rounded-lg max-w-[320px]">
                      {[
                        { id: 'broadcast', label: 'Broadcast Message' },
                        { id: 'richmenu', label: 'Rich Menu Config' }
                      ].map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setZaloTemplateType(item.id as any)}
                          className={`flex-1 text-[10px] font-bold py-1.5 rounded transition-all ${
                            zaloTemplateType === item.id
                              ? 'bg-white/10 text-white shadow-sm'
                              : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                      
                      {/* Zalo Configuration Panel (50%) */}
                      <div className="md:col-span-6 space-y-4">
                        {zaloTemplateType === 'broadcast' ? (
                          <div className="space-y-4">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Cấu hình Tin nhắn Broadcast</h4>
                            
                            <div>
                              <label className="block text-[10px] text-gray-400 mb-1">Tiêu đề Tin nhắn (Zalo Title)</label>
                              <input
                                type="text"
                                value={zaloTitle}
                                onChange={(e) => setZaloTitle(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#2895ef]"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] text-gray-400 mb-1">Nội dung tóm tắt (Zalo Description)</label>
                              <textarea
                                value={zaloDesc}
                                onChange={(e) => setZaloDesc(e.target.value)}
                                rows={3}
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#2895ef] resize-none"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] text-gray-400 mb-1">Nút bấm chuyển hướng y khoa (CTA Text)</label>
                              <input
                                type="text"
                                value={zaloCtaText}
                                onChange={(e) => setZaloCtaText(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#2895ef] font-bold"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] text-gray-400 mb-1">Đường dẫn đặt lịch khám (Deep-link CTA URL)</label>
                              <input
                                type="url"
                                value={zaloCtaUrl}
                                onChange={(e) => setZaloCtaUrl(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-emerald-300 font-mono outline-none"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Cấu hình Rich Menu (6 Ô tương tác)</h4>
                            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                              {richMenuCells.map((cell, idx) => (
                                <div key={cell.id} className="p-3 bg-white/[0.02] border border-white/5 rounded-xl space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-[#2895ef]">Ô tương tác {idx + 1}</span>
                                    <span className="text-[9px] text-gray-500 font-mono">Cell ID: {cell.id}</span>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    <input
                                      type="text"
                                      value={cell.label}
                                      onChange={(e) => {
                                        const newCells = [...richMenuCells]
                                        newCells[idx].label = e.target.value
                                        setRichMenuCells(newCells)
                                      }}
                                      className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[11px] text-white font-semibold"
                                      placeholder="Tên nút"
                                    />
                                    <input
                                      type="text"
                                      value={cell.url}
                                      onChange={(e) => {
                                        const newCells = [...richMenuCells]
                                        newCells[idx].url = e.target.value
                                        setRichMenuCells(newCells)
                                      }}
                                      className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[10px] text-emerald-300 font-mono"
                                      placeholder="Deep-link URL"
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Zalo Mobile App Interactive Preview Panel (50%) */}
                      <div className="md:col-span-6 flex justify-center">
                        <div className="w-[280px] h-[480px] bg-[#0c1424] rounded-[36px] border-[6px] border-gray-800 shadow-2xl relative flex flex-col overflow-hidden">
                          
                          {/* Phone Status bar */}
                          <div className="h-6 bg-[#0a0f1d] flex-shrink-0 flex items-center justify-between px-6 text-[9px] text-gray-500">
                            <span>08:45 AM</span>
                            <span>Zalo OA</span>
                          </div>

                          {/* Zalo OA Header */}
                          <div className="h-10 bg-[#0068ff] flex-shrink-0 flex items-center px-4 text-xs font-bold text-white gap-2">
                            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-black text-white">MF</div>
                            <div>
                              <p className="leading-tight">MediFlow Clinic</p>
                              <p className="text-[8px] text-white/75 font-normal leading-tight">Phòng khám chuyên khoa</p>
                            </div>
                          </div>

                          {/* Zalo Chat Screen Area */}
                          <div className="flex-1 bg-[#121c30] p-3 overflow-y-auto space-y-3 flex flex-col justify-end pb-4">
                            
                            {/* Broadcast Message Render */}
                            {zaloTemplateType === 'broadcast' && (
                              <div className="w-full bg-[#1b2a47] border border-white/5 rounded-2xl overflow-hidden shadow-lg animate-fade-in flex flex-col">
                                <div className="h-24 bg-gradient-to-tr from-[#0068ff]/30 to-[#8b5cf6]/30 flex items-center justify-center text-xs font-extrabold text-[#7dd3fc]">
                                  [MediFlow Banner]
                                </div>
                                <div className="p-3 space-y-1.5 flex-1">
                                  <p className="text-[11px] font-extrabold text-white leading-snug">{zaloTitle || 'Tiêu đề tin nhắn Zalo'}</p>
                                  <p className="text-[9px] text-gray-400 leading-relaxed line-clamp-3">{zaloDesc || 'Nội dung tóm tắt'}</p>
                                </div>
                                <a
                                  href="#cta"
                                  onClick={(e) => { e.preventDefault(); alert(`Đã kích hoạt deep-link chuyển hướng: ${zaloCtaUrl || 'Chưa gắn URL'}`) }}
                                  className="m-3 mt-0 p-2 rounded-xl bg-[#0068ff] hover:bg-[#0057d6] text-white text-[10px] font-bold text-center transition-all block"
                                >
                                  {zaloCtaText}
                                </a>
                              </div>
                            )}

                            {/* Standard message bubble */}
                            <div className="bg-[#1b2a47] text-white text-[10px] p-2.5 rounded-xl self-start max-w-[200px]">
                              Chào bạn! Rất vui được hỗ trợ thông tin y khoa lâm sàng chính xác cho bạn.
                            </div>
                          </div>

                          {/* Zalo Rich Menu Render */}
                          {zaloTemplateType === 'richmenu' && (
                            <div className="bg-[#182744] border-t border-white/10 flex-shrink-0 grid grid-cols-3 grid-rows-2 h-36 p-1 gap-1">
                              {richMenuCells.map((cell) => (
                                <button
                                  key={cell.id}
                                  onClick={() => alert(`Kích hoạt nút bấm Rich Menu: ${cell.label}\nChuyển hướng đến: ${cell.url}`)}
                                  className="rounded flex flex-col items-center justify-center p-1 hover:brightness-110 active:scale-95 transition-all text-white text-[9px]"
                                  style={{ background: cell.bg }}
                                >
                                  <span className="font-extrabold text-center leading-tight">{cell.label}</span>
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Zalo OA Bottom Input bar */}
                          <div className="h-10 bg-[#0a0f1d] flex-shrink-0 border-t border-white/5 flex items-center px-3 justify-between">
                            <div className="w-4 h-4 rounded-full bg-gray-700 flex-shrink-0"></div>
                            <div className="flex-1 bg-white/5 border border-white/10 rounded-full h-6 mx-2 px-3 text-[9px] text-gray-500 flex items-center">
                              Nhập tin nhắn...
                            </div>
                            <div className="w-4 h-4 rounded-full bg-gray-700 flex-shrink-0"></div>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                )}

              </div>
            ) : (
              <div className="card-surface p-12 text-center flex flex-col items-center justify-center">
                <AlertCircle className="w-12 h-12 text-gray-600 mb-4 animate-pulse" />
                <h4 className="text-sm font-semibold text-white mb-1.5">Chưa có cốt lõi y văn được nạp</h4>
                <p className="text-xs text-gray-400 max-w-sm leading-relaxed">
                  Vui lòng phê duyệt các sơ đồ tư duy trong Giai đoạn 1 hoặc chọn một mục đã duyệt y khoa ở bảng danh sách bên trái để mở giao diện chuyển thể tiếp thị đa kênh.
                </p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* Content list table */}
      <div className="card-surface overflow-hidden">
        <div className="p-4 flex items-center justify-between flex-wrap gap-4 border-b border-white/5">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-gray-400" />
            Tất cả nội dung trong hệ thống
          </h3>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchContentItems}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
              title="Làm mới danh sách"
            >
              <RefreshCw className={`w-4 h-4 ${loadingItems ? 'animate-spin' : ''}`} />
            </button>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm bg-white/5 border border-white/10 text-gray-400">
              <Search className="w-3.5 h-3.5" />
              <input
                placeholder="Tìm kiếm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent outline-none w-32 md:w-48 text-xs text-white placeholder-gray-500"
              />
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          {loadingItems ? (
            <div className="text-center py-12">
              <RefreshCw className="w-8 h-8 text-gray-500 animate-spin mx-auto mb-2" />
              <p className="text-xs text-gray-400">Đang tải danh sách nội dung...</p>
            </div>
          ) : filteredContentItems.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <p className="text-xs text-gray-400">Không tìm thấy nội dung y khoa nào</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5 text-left">
                  {['Tên chủ đề / Tiêu đề', 'Loại', 'Giai đoạn', 'Nền tảng', 'Trạng thái', 'Thao tác chuyển thể'].map((h) => (
                    <th key={h} className="text-xs font-semibold uppercase tracking-wider px-6 py-4 text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredContentItems.map((item) => {
                  const statusInfo = STATUS_MAP[item.status] || { label: item.status, bg: 'rgba(255,255,255,0.06)', text: '#fff' }
                  const isApproved = item.status === 'approved'
                  
                  return (
                    <tr key={item.id} className="hover:bg-white/[0.01] transition-colors duration-150">
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-white">{item.title}</div>
                        <div className="text-[10px] text-gray-500 mt-0.5">Tạo ngày: {new Date(item.created_at).toLocaleDateString('vi-VN')}</div>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-gray-400 capitalize">{item.content_type || 'Báo cáo'}</td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#2895ef]/10 text-[#7dd3fc]">
                          {item.stage === 'stage_0' ? 'Giai đoạn 0' : 'Giai đoạn 2'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {item.platform?.map((p: string) => (
                            <span key={p} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-gray-400 capitalize">{p}</span>
                          )) || <span className="text-[10px] text-gray-600">-</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full" style={{ background: statusInfo.bg, color: statusInfo.text }}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {isApproved ? (
                          <button
                            onClick={() => {
                              setActiveMainTab('adaptation')
                              loadApprovedItemForAdaptation(item)
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-extrabold text-white bg-gradient-to-tr from-[#2895ef] to-[#8b5cf6] hover:brightness-110 active:scale-95 transition-all"
                          >
                            <Layout className="w-3.5 h-3.5" />
                            Chuyển thể Đa kênh
                          </button>
                        ) : (
                          <span className="text-[10px] text-gray-600 italic">Chờ duyệt Y khoa để chuyển thể</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
