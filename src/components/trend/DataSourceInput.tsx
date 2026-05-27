'use client'

import React, { useState } from 'react'
import { Sparkles, Trash2, Link as LinkIcon, Plus, BookOpen, AlertCircle, FileText, CheckCircle, Loader2, Globe, TrendingUp } from 'lucide-react'
import { DataSource, DataSourceType } from '@/types/trend-content'

interface DataSourceInputProps {
  sources: DataSource[]
  onAddSource: (source: Omit<DataSource, 'id' | 'status'>) => void
  onRemoveSource: (id: string) => void
  onFetchSource: (id: string) => Promise<void>
  onAnalyze: () => void
  isAnalyzing: boolean
}

const TABS: { type: DataSourceType; label: string; icon: any; placeholder: string; helperText: string }[] = [
  {
    type: 'google_trends',
    label: 'Google Trends',
    icon: TrendingUp,
    placeholder: 'Nhập từ khóa tìm kiếm (Ví dụ: Nâng mũi S-line, Trị mụn chuẩn y khoa)...',
    helperText: 'Hệ thống sẽ lấy xu hướng tìm kiếm và các từ khóa liên quan.'
  },
  {
    type: 'vnexpress',
    label: 'VNExpress Health',
    icon: Globe,
    placeholder: 'https://vnexpress.net/suc-khoe/...',
    helperText: 'Dán link bài viết sức khỏe trên VNExpress để trích xuất nội dung.'
  },
  {
    type: 'tiktok',
    label: 'TikTok Creative Center',
    icon: LinkIcon,
    placeholder: 'https://creativecenter.tiktok.com/... hoặc link video TikTok',
    helperText: 'Dán link để phân tích các video/hashtag đang thịnh hành.'
  },
  {
    type: 'manual',
    label: 'Nhập thủ công',
    icon: FileText,
    placeholder: 'Nhập thông tin, ghi chú hoặc nội dung y tế thô cần phân tích...',
    helperText: 'Phù hợp khi bạn có sẵn tài liệu y khoa hoặc ghi chú lâm sàng.'
  }
]

export default function DataSourceInput({
  sources,
  onAddSource,
  onRemoveSource,
  onFetchSource,
  onAnalyze,
  isAnalyzing
}: DataSourceInputProps) {
  const [activeTab, setActiveTab] = useState<DataSourceType>('google_trends')
  const [inputValue, setInputValue] = useState('')
  const [inputLabel, setInputLabel] = useState('')

  const activeTabConfig = TABS.find(t => t.type === activeTab)!

  const handleAdd = () => {
    if (!inputValue.trim()) return

    let label = inputLabel.trim()
    if (!label) {
      if (activeTab === 'google_trends') {
        label = `Xu hướng: "${inputValue}"`
      } else if (activeTab === 'vnexpress') {
        label = `Báo VNExpress: ${inputValue.substring(0, 30)}...`
      } else if (activeTab === 'tiktok') {
        label = `TikTok Link: ${inputValue.substring(0, 30)}...`
      } else {
        label = `Tài liệu: ${inputValue.substring(0, 30)}...`
      }
    }

    onAddSource({
      type: activeTab,
      label,
      value: inputValue.trim()
    })

    setInputValue('')
    setInputLabel('')
  }

  const getSourceIcon = (type: DataSourceType) => {
    const config = TABS.find(t => t.type === type)
    const Icon = config ? config.icon : FileText
    return <Icon className="w-4 h-4 text-white" />
  }

  return (
    <div className="space-y-6">
      {/* Input panel */}
      <div className="card-surface p-6 space-y-4">
        <h3 className="text-md font-semibold text-white flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-[#2895ef]" />
          Thiết lập nguồn dữ liệu
        </h3>

        {/* Tab buttons */}
        <div className="flex flex-wrap gap-1 p-1 rounded-xl bg-white/5 border border-white/10">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.type
            return (
              <button
                key={tab.type}
                onClick={() => {
                  setActiveTab(tab.type)
                  setInputValue('')
                  setInputLabel('')
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-white/10 text-white shadow-sm'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Form controls */}
        <div className="space-y-3 pt-2">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              Tên / Nhãn nguồn (Tùy chọn)
            </label>
            <input
              type="text"
              placeholder="Ví dụ: Bài báo VNExpress về bệnh xoang..."
              value={inputLabel}
              onChange={(e) => setInputLabel(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#2895ef] focus:ring-1 focus:ring-[#2895ef]/20 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              {activeTab === 'manual' ? 'Nội dung chi tiết' : 'Từ khóa hoặc Đường dẫn (URL)'}
            </label>
            {activeTab === 'manual' ? (
              <textarea
                placeholder={activeTabConfig.placeholder}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                rows={4}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#2895ef] focus:ring-1 focus:ring-[#2895ef]/20 transition-all resize-none"
              />
            ) : (
              <input
                type="text"
                placeholder={activeTabConfig.placeholder}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#2895ef] focus:ring-1 focus:ring-[#2895ef]/20 transition-all"
              />
            )}
            <p className="text-[11px] text-gray-500 mt-1.5">{activeTabConfig.helperText}</p>
          </div>

          <button
            onClick={handleAdd}
            disabled={!inputValue.trim()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-white/10 border border-white/15 hover:bg-white/15 active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all"
          >
            <Plus className="w-4 h-4" />
            Thêm vào nguồn phân tích
          </button>
        </div>
      </div>

      {/* Sources List */}
      <div className="card-surface p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Nguồn đã chọn ({sources.length})</h3>
          {sources.length > 0 && (
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
              Sẵn sàng
            </span>
          )}
        </div>

        {sources.length === 0 ? (
          <div className="text-center py-8 rounded-xl border border-dashed border-white/10 bg-white/[0.01]">
            <AlertCircle className="w-8 h-8 text-gray-500 mx-auto mb-2" />
            <p className="text-xs text-gray-400 font-medium">Chưa có nguồn dữ liệu nào được thêm</p>
            <p className="text-[10px] text-gray-500 mt-1">Hãy nhập thông tin ở trên để tiến hành phân tích</p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
            {sources.map((src) => (
              <div
                key={src.id}
                className="flex items-start justify-between gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 flex-shrink-0 mt-0.5">
                    {getSourceIcon(src.type)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{src.label}</p>
                    <p className="text-[10px] text-gray-400 truncate mt-0.5">{src.value}</p>
                    
                    {/* Status & fetch control */}
                    <div className="flex items-center gap-2 mt-1.5">
                      {src.status === 'idle' && (
                        <button
                          onClick={() => onFetchSource(src.id)}
                          className="text-[10px] text-[#2895ef] hover:underline flex items-center gap-1 font-medium"
                        >
                          Tải nội dung
                        </button>
                      )}
                      {src.status === 'loading' && (
                        <span className="text-[10px] text-gray-400 flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin" /> Đang tải...
                        </span>
                      )}
                      {src.status === 'fetched' && (
                        <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium">
                          <CheckCircle className="w-3 h-3" /> Đã lấy nội dung ({src.fetchedContent?.length || 0} ký tự)
                        </span>
                      )}
                      {src.status === 'error' && (
                        <button
                          onClick={() => onFetchSource(src.id)}
                          className="text-[10px] text-rose-400 hover:underline flex items-center gap-1 font-medium"
                        >
                          Lỗi tải - Thử lại
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onRemoveSource(src.id)}
                  className="p-1 rounded text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Big AI Action Button */}
        <button
          onClick={onAnalyze}
          disabled={sources.length === 0 || isAnalyzing}
          className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#2895ef] to-[#8b5cf6] hover:from-[#359eff] hover:to-[#996eff] shadow-lg shadow-purple-500/10 disabled:opacity-40 disabled:pointer-events-none transition-all active:scale-98"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Đang phân tích y khoa chuyên sâu...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Phân tích y khoa bằng Gemini AI
            </>
          )}
        </button>
      </div>
    </div>
  )
}
