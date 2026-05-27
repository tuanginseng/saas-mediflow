'use client'

import React, { useState, useMemo } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  ReferenceLine,
  ComposedChart,
} from 'recharts'

interface ChartTooltipPayloadItem {
  name?: string
  value?: number | string
  color?: string
}

interface ChartTooltipProps {
  active?: boolean
  payload?: ChartTooltipPayloadItem[]
  label?: string
}
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Percent,
  ArrowUpRight,
  ArrowDownRight,
  Award,
  AlertCircle,
  Sparkles,
  Zap,
  Globe,
  MessageSquare,
  CheckCircle,
  ShoppingCart,
  Target,
  RefreshCcw,
  Database,
  ChevronDown,
  Info,
  Flame,
  Lightbulb,
  Play,
  Filter,
} from 'lucide-react'

// ─── Data Sources ──────────────────────────────────────────────────────────────
type DataSource = 'all' | 'ads_manager' | 'crm'
type TimeRange = '3m' | '6m' | '12m'

const ADS_MANAGER_DATA = [
  { month: 'T11', cpl: 260000, cac: 1380000, leads: 420, spend: 58000000, impressions: 1250000, clicks: 48000 },
  { month: 'T12', cpl: 240000, cac: 1250000, leads: 480, spend: 64000000, impressions: 1420000, clicks: 52000 },
  { month: 'T1',  cpl: 210000, cac: 1150000, leads: 510, spend: 68000000, impressions: 1680000, clicks: 61000 },
  { month: 'T2',  cpl: 225000, cac: 1180000, leads: 580, spend: 72000000, impressions: 1750000, clicks: 64000 },
  { month: 'T3',  cpl: 195000, cac: 1050000, leads: 640, spend: 78000000, impressions: 1920000, clicks: 70000 },
  { month: 'T4',  cpl: 180000, cac: 980000,  leads: 820, spend: 84000000, impressions: 2100000, clicks: 82000 },
  { month: 'T5',  cpl: 165000, cac: 870000,  leads: 980, spend: 90500000, impressions: 2380000, clicks: 96000 },
  { month: 'T6',  cpl: 158000, cac: 820000,  leads: 1100, spend: 95000000, impressions: 2550000, clicks: 105000 },
  { month: 'T7',  cpl: 172000, cac: 900000,  leads: 1050, spend: 93000000, impressions: 2450000, clicks: 99000 },
  { month: 'T8',  cpl: 145000, cac: 790000,  leads: 1280, spend: 98000000, impressions: 2700000, clicks: 112000 },
  { month: 'T9',  cpl: 138000, cac: 740000,  leads: 1400, spend: 102000000, impressions: 2900000, clicks: 122000 },
  { month: 'T10', cpl: 128000, cac: 680000,  leads: 1584, spend: 110000000, impressions: 3150000, clicks: 138000 },
]

const CRM_DATA = [
  { month: 'T11', cpl: 270000, cac: 1410000, leads: 380, spend: 56000000, retention: 62, reactivation: 18 },
  { month: 'T12', cpl: 248000, cac: 1280000, leads: 440, spend: 62000000, retention: 65, reactivation: 21 },
  { month: 'T1',  cpl: 218000, cac: 1190000, leads: 490, spend: 66000000, retention: 68, reactivation: 23 },
  { month: 'T2',  cpl: 230000, cac: 1210000, leads: 548, spend: 70000000, retention: 70, reactivation: 25 },
  { month: 'T3',  cpl: 200000, cac: 1080000, leads: 610, spend: 75000000, retention: 72, reactivation: 27 },
  { month: 'T4',  cpl: 188000, cac: 1010000, leads: 780, spend: 81000000, retention: 74, reactivation: 30 },
  { month: 'T5',  cpl: 172000, cac: 900000,  leads: 940, spend: 87000000, retention: 77, reactivation: 33 },
  { month: 'T6',  cpl: 163000, cac: 848000,  leads: 1060, spend: 92000000, retention: 79, reactivation: 36 },
  { month: 'T7',  cpl: 178000, cac: 932000,  leads: 1010, spend: 90000000, retention: 78, reactivation: 34 },
  { month: 'T8',  cpl: 150000, cac: 815000,  leads: 1230, spend: 95000000, retention: 81, reactivation: 38 },
  { month: 'T9',  cpl: 143000, cac: 765000,  leads: 1360, spend: 99000000, retention: 83, reactivation: 41 },
  { month: 'T10', cpl: 132000, cac: 702000,  leads: 1540, spend: 107000000, retention: 85, reactivation: 44 },
]

const MERGED_DATA = ADS_MANAGER_DATA.map((d, i) => ({
  month: d.month,
  cpl: Math.round((d.cpl + CRM_DATA[i].cpl) / 2),
  cac: Math.round((d.cac + CRM_DATA[i].cac) / 2),
  leads: Math.round((d.leads + CRM_DATA[i].leads) / 2),
  spend: Math.round((d.spend + CRM_DATA[i].spend) / 2),
}))

const CONVERSION_DATA = [
  { month: 'T11', clickRate: 22, purchaseRate: 10, appointmentRate: 35 },
  { month: 'T12', clickRate: 24, purchaseRate: 12, appointmentRate: 38 },
  { month: 'T1',  clickRate: 28, purchaseRate: 15, appointmentRate: 42 },
  { month: 'T2',  clickRate: 32, purchaseRate: 18, appointmentRate: 45 },
  { month: 'T3',  clickRate: 35, purchaseRate: 22, appointmentRate: 49 },
  { month: 'T4',  clickRate: 42, purchaseRate: 28, appointmentRate: 54 },
  { month: 'T5',  clickRate: 49, purchaseRate: 34, appointmentRate: 61 },
  { month: 'T6',  clickRate: 54, purchaseRate: 38, appointmentRate: 65 },
  { month: 'T7',  clickRate: 51, purchaseRate: 36, appointmentRate: 63 },
  { month: 'T8',  clickRate: 58, purchaseRate: 42, appointmentRate: 70 },
  { month: 'T9',  clickRate: 63, purchaseRate: 47, appointmentRate: 74 },
  { month: 'T10', clickRate: 68, purchaseRate: 52, appointmentRate: 79 },
]

const CHANNEL_ROI = [
  { channel: 'Facebook Ads', spend: 38.2, revenue: 240, leads: 206, patients: 38, roi: 628, color: '#1877f2' },
  { channel: 'TikTok Ads',   spend: 29.8, revenue: 145, leads: 148, patients: 22, roi: 487, color: '#ff0050' },
  { channel: 'Google Ads',   spend: 12.5, revenue: 87,  leads: 54,  patients: 11, roi: 696, color: '#34a853' },
  { channel: 'Zalo OA',      spend: 10.0, revenue: 76,  leads: 87,  patients: 14, roi: 760, color: '#0068ff' },
]

const INSIGHTS = [
  {
    id: 'insight-1',
    type: 'high_performer',
    icon: Flame,
    badge: 'Video dài hiệu suất cao',
    badgeColor: '#a78bfa',
    badgeBg: 'rgba(139,92,246,0.15)',
    borderColor: 'rgba(139,92,246,0.25)',
    bgColor: 'rgba(139,92,246,0.05)',
    title: 'Video dài thúc đẩy 30% lượt đến phòng khám',
    description: 'Video định dạng "Hook → Body → CTA" thời lượng 45-90s tạo ra tỉ lệ chuyển đổi cao hơn 30% so với bài đăng tĩnh và Stories. Đặc biệt hiệu quả với chiến dịch nâng mũi và điều trị da liễu.',
    metric: '+30% clinic visits',
    metricColor: '#a78bfa',
    action: null,
    confidence: 94,
  },
  {
    id: 'insight-2',
    type: 'scale',
    icon: Zap,
    badge: 'Đề xuất tăng ngân sách',
    badgeColor: '#fbbf24',
    badgeBg: 'rgba(251,191,36,0.12)',
    borderColor: 'rgba(251,191,36,0.25)',
    bgColor: 'rgba(251,191,36,0.04)',
    title: 'Tăng ngân sách 25% cho Campaign "Nâng mũi T5"',
    description: 'CPL chiến dịch này đạt 165.000 đ — thấp hơn 17% so với mục tiêu 200.000 đ. Với mức ROI 6.2x, tăng 25% ngân sách dự kiến mang lại thêm ~50 lead/tháng không giảm hiệu suất.',
    metric: 'Scale budget ↑25%',
    metricColor: '#fbbf24',
    action: 'Áp dụng ngay',
    confidence: 89,
  },
  {
    id: 'insight-3',
    type: 'adherence',
    icon: CheckCircle,
    badge: 'Tuân thủ điều trị tăng',
    badgeColor: '#34d399',
    badgeBg: 'rgba(52,211,153,0.12)',
    borderColor: 'rgba(52,211,153,0.25)',
    bgColor: 'rgba(52,211,153,0.04)',
    title: 'Tỉ lệ mua thuốc online tăng 40% sau automation',
    description: 'Sau khi triển khai kịch bản gửi hướng dẫn điều trị tự động qua Zalo OA (48h sau khám), tỉ lệ mua đơn thuốc online tăng 40% và giảm 25% cuộc gọi hỗ trợ.',
    metric: '+40% medicine purchases',
    metricColor: '#34d399',
    action: null,
    confidence: 97,
  },
  {
    id: 'insight-4',
    type: 'optimize',
    icon: Target,
    badge: 'Cần tối ưu',
    badgeColor: '#f87171',
    badgeBg: 'rgba(239,68,68,0.12)',
    borderColor: 'rgba(239,68,68,0.25)',
    bgColor: 'rgba(239,68,68,0.04)',
    title: 'TikTok Ads đang underperform — ROI 487% vs target 600%',
    description: 'CAC chiến dịch TikTok cao hơn 18% so với Facebook Ads. Đề xuất: chuyển 20% ngân sách TikTok sang Google Ads để tận dụng intent cao từ search query "phòng khám thẩm mỹ uy tín".',
    metric: 'Reallocate 20% budget',
    metricColor: '#f87171',
    action: 'Xem chi tiết',
    confidence: 82,
  },
]

// ─── Custom Tooltip Components ─────────────────────────────────────────────────
function CplCacTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="analytics-tooltip">
      <p className="analytics-tooltip-title">📊 {label}</p>
      <p className="analytics-tooltip-source">Ads Manager & CRM Data</p>
      {payload.map((entry, i) => (
        <div key={`${entry.name}-${i}`} className="analytics-tooltip-row">
          <span style={{ color: entry.color }}>
            {entry.name === 'cpl' ? 'CPL (Cost per Lead)' : 'CAC (Acquisition Cost)'}:
          </span>
          <strong style={{ color: entry.color }}>
            {typeof entry.value === 'number' ? entry.value.toLocaleString('vi-VN') : entry.value} đ
          </strong>
        </div>
      ))}
    </div>
  )
}

function ConversionTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="analytics-tooltip">
      <p className="analytics-tooltip-title">📈 {label}</p>
      {payload.map((entry, i) => (
        <div key={`${entry.name}-${i}`} className="analytics-tooltip-row">
          <span style={{ color: entry.color }}>
            {entry.name === 'clickRate' ? 'Tỉ lệ click Zalo OA' :
             entry.name === 'purchaseRate' ? 'Mua thuốc online' : 'Đặt lịch khám'}:
          </span>
          <strong style={{ color: entry.color }}>{entry.value}%</strong>
        </div>
      ))}
    </div>
  )
}

function LeadsTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="analytics-tooltip">
      <p className="analytics-tooltip-title">{label}</p>
      <div className="analytics-tooltip-row">
        <span style={{ color: '#8b5cf6' }}>Leads:</span>
        <strong style={{ color: '#8b5cf6' }}>
          {typeof payload[0].value === 'number' ? payload[0].value.toLocaleString('vi-VN') : payload[0].value}
        </strong>
      </div>
    </div>
  )
}

// ─── Sub-components ────────────────────────────────────────────────────────────
function KpiCard({ label, value, change, icon: Icon, color }: {
  label: string; value: string; change: number; icon: React.ElementType; color: string
}) {
  const isUp = change >= 0
  return (
    <div className="kpi-card group">
      <div className="kpi-card-top">
        <div className="kpi-icon" style={{ background: `${color}18`, color }}>
          <Icon size={18} />
        </div>
        <span className={`kpi-badge ${isUp ? 'kpi-badge-up' : 'kpi-badge-down'}`}>
          {isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {Math.abs(change)}%
        </span>
      </div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-label">{label}</div>
    </div>
  )
}

function DataSourceSelector({ value, onChange }: { value: DataSource; onChange: (v: DataSource) => void }) {
  const options: { value: DataSource; label: string; icon: React.ElementType; color: string }[] = [
    { value: 'all',          label: 'All Sources',    icon: Database,      color: '#8b5cf6' },
    { value: 'ads_manager',  label: 'Ads Manager',    icon: Globe,         color: '#2895ef' },
    { value: 'crm',          label: 'CRM',            icon: Users,         color: '#10b981' },
  ]
  return (
    <div className="source-selector">
      {options.map((opt) => (
        <button
          key={opt.value}
          id={`source-${opt.value}`}
          onClick={() => onChange(opt.value)}
          className={`source-btn ${value === opt.value ? 'source-btn-active' : ''}`}
          style={value === opt.value ? { borderColor: `${opt.color}60`, color: opt.color, background: `${opt.color}12` } : {}}
        >
          <opt.icon size={12} />
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function TimeRangeSelector({ value, onChange }: { value: TimeRange; onChange: (v: TimeRange) => void }) {
  return (
    <div className="source-selector">
      {(['3m', '6m', '12m'] as TimeRange[]).map((t) => (
        <button
          key={t}
          id={`timerange-${t}`}
          onClick={() => onChange(t)}
          className={`source-btn ${value === t ? 'source-btn-active' : ''}`}
          style={value === t ? { borderColor: 'rgba(40,149,239,0.4)', color: '#2895ef', background: 'rgba(40,149,239,0.1)' } : {}}
        >
          {t === '3m' ? '3 tháng' : t === '6m' ? '6 tháng' : '12 tháng'}
        </button>
      ))}
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const [dataSource, setDataSource] = useState<DataSource>('all')
  const [timeRange, setTimeRange] = useState<TimeRange>('6m')
  const [activeInsight, setActiveInsight] = useState<string | null>(null)

  const rawData = useMemo(() => {
    if (dataSource === 'ads_manager') return ADS_MANAGER_DATA
    if (dataSource === 'crm') return CRM_DATA
    return MERGED_DATA
  }, [dataSource])

  const chartData = useMemo(() => {
    const count = timeRange === '3m' ? 3 : timeRange === '6m' ? 6 : 12
    return rawData.slice(-count)
  }, [rawData, timeRange])

  const conversionData = useMemo(() => {
    const count = timeRange === '3m' ? 3 : timeRange === '6m' ? 6 : 12
    return CONVERSION_DATA.slice(-count)
  }, [timeRange])

  const latestMonth = chartData[chartData.length - 1]
  const prevMonth   = chartData[chartData.length - 2]
  const cplChange   = prevMonth ? Math.round(((latestMonth.cpl - prevMonth.cpl) / prevMonth.cpl) * 100) : 0
  const cacChange   = prevMonth ? Math.round(((latestMonth.cac - prevMonth.cac) / prevMonth.cac) * 100) : 0
  const leadsChange = prevMonth ? Math.round(((latestMonth.leads - prevMonth.leads) / prevMonth.leads) * 100) : 0

  const latestConv  = conversionData[conversionData.length - 1]

  return (
    <div className="analytics-page">
      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div className="analytics-header">
        <div className="analytics-header-left">
          <div className="analytics-header-icon">
            <BarChart3 size={18} className="text-white" />
          </div>
          <div>
            <h1 className="analytics-title">Analytics &amp; ROI Dashboard</h1>
            <p className="analytics-subtitle">
              Phân tích CPL / CAC · Chuyển đổi Zalo OA · Đề xuất tối ưu chiến dịch
            </p>
          </div>
        </div>
        <div className="analytics-header-right">
          <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
          <button id="analytics-refresh" className="icon-btn">
            <RefreshCcw size={14} />
          </button>
        </div>
      </div>

      {/* ── KPI Cards ───────────────────────────────────────────────── */}
      <div className="kpi-grid">
        <KpiCard label="Tổng Lead (tháng này)" value={latestMonth.leads.toLocaleString('vi-VN')} change={leadsChange} icon={Users} color="#2895ef" />
        <KpiCard label="CPL (Cost per Lead)"   value={`${(latestMonth.cpl / 1000).toFixed(0)}K đ`}  change={cplChange}   icon={DollarSign} color="#fbbf24" />
        <KpiCard label="CAC (Acquisition)"     value={`${(latestMonth.cac / 1000000).toFixed(2)}M đ`} change={cacChange} icon={Target}     color="#f87171" />
        <KpiCard label="Purchase Rate (Zalo)"  value={`${latestConv.purchaseRate}%`} change={5}   icon={ShoppingCart} color="#10b981" />
        <KpiCard label="Click Rate Zalo OA"    value={`${latestConv.clickRate}%`}    change={8}   icon={MessageSquare} color="#8b5cf6" />
        <KpiCard label="Avg. ROI tháng này"    value="642%" change={12.8}            icon={Percent} color="#06b6d4" />
      </div>

      {/* ── CPL & CAC Chart ─────────────────────────────────────────── */}
      <div className="chart-grid">
        <div className="chart-card chart-card-wide">
          <div className="chart-card-header">
            <div className="chart-card-title-group">
              <TrendingUp size={16} className="text-[#2895ef]" />
              <h2 className="chart-card-title">CPL &amp; CAC theo thời gian</h2>
              <div className="data-source-pill">
                <Database size={10} />
                {dataSource === 'all' ? 'Ads Manager + CRM' : dataSource === 'ads_manager' ? 'Ads Manager' : 'CRM'}
              </div>
            </div>
            <DataSourceSelector value={dataSource} onChange={setDataSource} />
          </div>

          <div className="chart-legend">
            <span className="legend-item"><span className="legend-dot" style={{ background: '#2895ef' }} />CPL — Cost per Lead</span>
            <span className="legend-item"><span className="legend-dot" style={{ background: '#fbbf24' }} />CAC — Customer Acquisition Cost</span>
            <span className="legend-item legend-ref"><span className="legend-dash" />CPL Target: 200K</span>
          </div>

          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradCpl" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#2895ef" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#2895ef" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradCac" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#fbbf24" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#fbbf24" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fill: '#475569', fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
              <YAxis
                tickFormatter={(v: number) => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : `${(v/1000).toFixed(0)}K`}
                tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} width={52}
              />
              <Tooltip content={<CplCacTooltip />} />
              <ReferenceLine y={200000} stroke="#2895ef" strokeDasharray="6 3" strokeOpacity={0.4} label={{ value: 'Target CPL', fill: '#2895ef', fontSize: 9, position: 'right' }} />
              <Area type="monotone" dataKey="cpl" name="cpl" stroke="#2895ef" strokeWidth={2.5} fill="url(#gradCpl)" dot={{ r: 3, fill: '#2895ef', strokeWidth: 0 }} activeDot={{ r: 6, fill: '#2895ef', stroke: '#fff', strokeWidth: 2 }} />
              <Area type="monotone" dataKey="cac" name="cac" stroke="#fbbf24" strokeWidth={2.5} fill="url(#gradCac)" dot={{ r: 3, fill: '#fbbf24', strokeWidth: 0 }} activeDot={{ r: 6, fill: '#fbbf24', stroke: '#fff', strokeWidth: 2 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Channel ROI sidebar */}
        <div className="chart-card">
          <div className="chart-card-header">
            <div className="chart-card-title-group">
              <Award size={16} className="text-[#fbbf24]" />
              <h2 className="chart-card-title">ROI theo kênh</h2>
            </div>
          </div>
          <div className="channel-roi-list">
            {CHANNEL_ROI.map((ch) => {
              const maxRoi = Math.max(...CHANNEL_ROI.map(c => c.roi))
              const pct    = (ch.roi / maxRoi) * 100
              return (
                <div key={ch.channel} className="channel-roi-item">
                  <div className="channel-roi-header">
                    <span className="channel-roi-name">
                      <span className="channel-dot" style={{ background: ch.color }} />
                      {ch.channel}
                    </span>
                    <span className="channel-roi-val">
                      ROI <strong style={{ color: '#34d399' }}>{ch.roi}%</strong>
                    </span>
                  </div>
                  <div className="channel-roi-bar-bg">
                    <div className="channel-roi-bar-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${ch.color}cc, ${ch.color})` }} />
                  </div>
                  <div className="channel-roi-meta">
                    <span>Chi: {ch.spend.toFixed(1)}M đ</span>
                    <span>Leads: {ch.leads}</span>
                    <span>Thu: {ch.revenue}M đ</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Conversion Metrics ──────────────────────────────────────── */}
      <div className="chart-grid">
        <div className="chart-card chart-card-wide">
          <div className="chart-card-header">
            <div className="chart-card-title-group">
              <ShoppingCart size={16} className="text-[#10b981]" />
              <h2 className="chart-card-title">Conversion Metrics — Mua thuốc online vs Zalo OA Clicks</h2>
            </div>
            <div className="chart-legend">
              <span className="legend-item"><span className="legend-dot" style={{ background: '#60a5fa' }} />Click Rate Zalo OA</span>
              <span className="legend-item"><span className="legend-dot" style={{ background: '#34d399' }} />Medicine Purchase Rate</span>
              <span className="legend-item"><span className="legend-dot" style={{ background: '#c084fc' }} />Appointment Rate</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={conversionData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: '#475569', fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v: number) => `${v}%`} tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} width={38} />
              <Tooltip content={<ConversionTooltip />} />
              <Bar dataKey="clickRate"       name="clickRate"       fill="#3b82f6" radius={[4,4,0,0]} maxBarSize={24} fillOpacity={0.85} />
              <Bar dataKey="purchaseRate"    name="purchaseRate"    fill="#10b981" radius={[4,4,0,0]} maxBarSize={24} fillOpacity={0.85} />
              <Bar dataKey="appointmentRate" name="appointmentRate" fill="#8b5cf6" radius={[4,4,0,0]} maxBarSize={24} fillOpacity={0.85} />
            </BarChart>
          </ResponsiveContainer>

          {/* Conversion summary strip */}
          <div className="conversion-summary">
            <div className="conv-stat">
              <MessageSquare size={14} className="text-blue-400" />
              <div>
                <p className="conv-stat-val text-blue-400">{latestConv.clickRate}%</p>
                <p className="conv-stat-label">Click Rate Zalo</p>
              </div>
            </div>
            <div className="conv-divider" />
            <div className="conv-stat">
              <ShoppingCart size={14} className="text-emerald-400" />
              <div>
                <p className="conv-stat-val text-emerald-400">{latestConv.purchaseRate}%</p>
                <p className="conv-stat-label">Mua thuốc online</p>
              </div>
            </div>
            <div className="conv-divider" />
            <div className="conv-stat">
              <CheckCircle size={14} className="text-purple-400" />
              <div>
                <p className="conv-stat-val text-purple-400">{latestConv.appointmentRate}%</p>
                <p className="conv-stat-label">Đặt lịch khám</p>
              </div>
            </div>
            <div className="conv-divider" />
            <div className="conv-stat">
              <TrendingUp size={14} className="text-[#2895ef]" />
              <div>
                <p className="conv-stat-val" style={{ color: '#2895ef' }}>
                  {Math.round((latestConv.purchaseRate / latestConv.clickRate) * 100)}%
                </p>
                <p className="conv-stat-label">Click → Purchase</p>
              </div>
            </div>
          </div>
        </div>

        {/* Leads over time mini chart */}
        <div className="chart-card">
          <div className="chart-card-header">
            <div className="chart-card-title-group">
              <Users size={16} className="text-[#2895ef]" />
              <h2 className="chart-card-title">Lead Volume</h2>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradLeads" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#475569', fontSize: 9 }} axisLine={false} tickLine={false} width={36} />
              <Tooltip content={<LeadsTooltip />} />
              <Area type="monotone" dataKey="leads" stroke="#8b5cf6" strokeWidth={2} fill="url(#gradLeads)" dot={false} activeDot={{ r: 5, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
          <div className="mini-stat-row">
            <div className="mini-stat">
              <p className="mini-stat-val">{chartData.reduce((s, d) => s + d.leads, 0).toLocaleString('vi-VN')}</p>
              <p className="mini-stat-label">Tổng Leads</p>
            </div>
            <div className="mini-stat">
              <p className="mini-stat-val">{Math.round(chartData.reduce((s, d) => s + d.leads, 0) / chartData.length).toLocaleString('vi-VN')}</p>
              <p className="mini-stat-label">TB / tháng</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Automated Insights ──────────────────────────────────────── */}
      <div className="insights-section">
        <div className="insights-header">
          <div className="chart-card-title-group">
            <div className="insights-icon-wrap">
              <Sparkles size={16} className="text-white" />
            </div>
            <div>
              <h2 className="chart-card-title text-base">Automated Insights &amp; Action Recommendations</h2>
              <p className="insights-subtitle">AI-generated từ dữ liệu Ads Manager &amp; CRM · Cập nhật 27/05/2026</p>
            </div>
          </div>
          <div className="insights-filter-row">
            <Filter size={12} className="text-gray-500" />
            <span className="text-xs text-gray-500">{INSIGHTS.length} insights</span>
          </div>
        </div>

        <div className="insights-grid">
          {INSIGHTS.map((ins) => {
            const isActive = activeInsight === ins.id
            return (
              <div
                key={ins.id}
                id={ins.id}
                className="insight-card"
                style={{
                  borderColor: isActive ? ins.borderColor : 'rgba(255,255,255,0.07)',
                  background: isActive ? ins.bgColor : 'var(--surface-card)',
                }}
                onClick={() => setActiveInsight(isActive ? null : ins.id)}
              >
                <div className="insight-card-top">
                  <div className="insight-icon-wrap" style={{ background: ins.badgeBg, color: ins.badgeColor }}>
                    <ins.icon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="insight-badge-row">
                      <span className="insight-badge" style={{ background: ins.badgeBg, color: ins.badgeColor }}>
                        {ins.badge}
                      </span>
                      <span className="confidence-badge">
                        <span className="confidence-dot" style={{ background: ins.badgeColor }} />
                        {ins.confidence}% confidence
                      </span>
                    </div>
                    <p className="insight-title">{ins.title}</p>
                  </div>
                </div>

                <p className="insight-desc">{ins.description}</p>

                <div className="insight-footer">
                  <span className="insight-metric" style={{ color: ins.metricColor, background: `${ins.metricColor}12` }}>
                    {ins.metric}
                  </span>
                  {ins.action && (
                    <button
                      id={`action-${ins.id}`}
                      className="insight-action-btn"
                      style={{ borderColor: `${ins.badgeColor}40`, color: ins.badgeColor }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Play size={10} />
                      {ins.action}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
