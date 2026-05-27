'use client'

import React, { useCallback, useMemo, useState, useRef, useEffect } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  type NodeProps,
  Position,
  Handle,
  BackgroundVariant,
  ReactFlowProvider,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import type { CoreContent } from '@/types/trend-content'
import { SendHorizonal, Pencil, Plus, Trash2, Check, X, ChevronDown, ChevronUp } from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────────

export type EditableCoreContent = {
  topic: string
  warningSigns: string[]
  causes: string[]
  diagnosticMethods: string[]
  standardTreatments: string[]
  keywords: string[]
  contentAngles: string[]
}

// ── Custom Node Components ────────────────────────────────────────────────────

function RootNode({ data }: NodeProps) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #2895ef 0%, #7c3aed 100%)',
      borderRadius: 14,
      padding: '12px 24px',
      color: 'white',
      fontWeight: 700,
      fontSize: 15,
      textAlign: 'center',
      boxShadow: '0 0 30px rgba(40,149,239,0.5), 0 8px 24px rgba(0,0,0,0.4)',
      whiteSpace: 'nowrap',
      maxWidth: 240,
      lineHeight: 1.3,
    }}>
      <Handle type="source" id="left"  position={Position.Left}  style={{ opacity: 0 }} />
      <Handle type="source" id="right" position={Position.Right} style={{ opacity: 0 }} />
      {data.label as string}
    </div>
  )
}

function CategoryNode({ data }: NodeProps) {
  return (
    <div style={{
      background: data.bg as string,
      border: `1.5px solid ${data.color as string}60`,
      borderRadius: 12,
      padding: '9px 16px',
      color: 'white',
      fontWeight: 600,
      fontSize: 12.5,
      display: 'flex',
      alignItems: 'center',
      gap: 7,
      whiteSpace: 'nowrap',
      boxShadow: `0 4px 16px ${data.color as string}20`,
    }}>
      <Handle type="target" id="from-right" position={Position.Right} style={{ opacity: 0 }} />
      <Handle type="target" id="from-left"  position={Position.Left}  style={{ opacity: 0 }} />
      <Handle type="source" id="to-left"    position={Position.Left}  style={{ opacity: 0 }} />
      <Handle type="source" id="to-right"   position={Position.Right} style={{ opacity: 0 }} />
      <span style={{ fontSize: 15 }}>{data.emoji as string}</span>
      {data.label as string}
    </div>
  )
}

function LeafNode({ data }: NodeProps) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: `1px solid ${data.color as string}35`,
      borderRadius: 9,
      padding: '7px 13px',
      color: '#cbd5e1',
      fontSize: 11.5,
      maxWidth: 210,
      lineHeight: 1.45,
      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
    }}>
      <Handle type="target" id="from-left"  position={Position.Left}  style={{ opacity: 0 }} />
      <Handle type="target" id="from-right" position={Position.Right} style={{ opacity: 0 }} />
      {data.label as string}
    </div>
  )
}

const nodeTypes = { rootNode: RootNode, categoryNode: CategoryNode, leafNode: LeafNode }

// ── Layout Builder ────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: 'warning',    label: 'Dấu hiệu cảnh báo',    emoji: '⚠️', color: '#ef4444', bg: 'rgba(239,68,68,0.15)',   side: 'left',  key: 'warningSigns'       },
  { id: 'causes',     label: 'Nguyên nhân',             emoji: '🔬', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)',  side: 'left',  key: 'causes'             },
  { id: 'diagnostic', label: 'Phương pháp chẩn đoán',  emoji: '🩺', color: '#3b82f6', bg: 'rgba(59,130,246,0.15)',  side: 'right', key: 'diagnosticMethods'  },
  { id: 'treatment',  label: 'Điều trị chuẩn',          emoji: '💊', color: '#10b981', bg: 'rgba(16,185,129,0.15)', side: 'right', key: 'standardTreatments' },
] as const

function buildGraph(data: EditableCoreContent): { nodes: Node[], edges: Edge[] } {
  const nodes: Node[] = []
  const edges: Edge[] = []

  const LEAF_H    = 60
  const GROUP_GAP = 24
  const CAT_X_L   = 270
  const CAT_X_R   = 800
  const LEAF_X_L  = 20
  const LEAF_X_R  = 1040
  const ROOT_X    = 510

  let leftY  = 20
  let rightY = 20
  const catPositions: Record<string, { x: number; y: number }> = {}

  for (const cat of CATEGORIES) {
    const items: string[] = (data as unknown as Record<string, string[]>)[cat.key] ?? []
    const isLeft = cat.side === 'left'
    const curY   = isLeft ? leftY : rightY
    const leafX  = isLeft ? LEAF_X_L : LEAF_X_R
    const catX   = isLeft ? CAT_X_L  : CAT_X_R
    const startY = isLeft ? leftY : rightY

    for (let i = 0; i < items.length; i++) {
      const leafId = `${cat.id}-leaf-${i}`
      const y      = isLeft ? leftY : rightY

      nodes.push({
        id: leafId,
        type: 'leafNode',
        position: { x: leafX, y },
        data: { label: items[i], color: cat.color },
      })

      edges.push({
        id: `e-${cat.id}-${leafId}`,
        source: cat.id,
        target: leafId,
        sourceHandle: isLeft ? 'to-left'   : 'to-right',
        targetHandle: isLeft ? 'from-right' : 'from-left',
        type: 'smoothstep',
        style: { stroke: cat.color, strokeWidth: 1.5, opacity: 0.45 },
      })

      if (isLeft) leftY  += LEAF_H
      else        rightY += LEAF_H
    }

    const endY    = isLeft ? leftY - LEAF_H : rightY - LEAF_H
    const centerY = items.length > 0 ? (startY + endY) / 2 - 18 : curY

    catPositions[cat.id] = { x: catX, y: centerY }

    if (isLeft) leftY  += GROUP_GAP
    else        rightY += GROUP_GAP
  }

  const totalHeight = Math.max(leftY, rightY)
  const rootY       = totalHeight / 2 - 22

  nodes.push({
    id: 'root',
    type: 'rootNode',
    position: { x: ROOT_X, y: rootY },
    data: { label: data.topic },
  })

  for (const cat of CATEGORIES) {
    const pos    = catPositions[cat.id]
    const isLeft = cat.side === 'left'

    nodes.push({
      id: cat.id,
      type: 'categoryNode',
      position: pos,
      data: { label: cat.label, emoji: cat.emoji, color: cat.color, bg: cat.bg },
    })

    edges.push({
      id: `e-root-${cat.id}`,
      source: 'root',
      target: cat.id,
      sourceHandle: isLeft ? 'left'       : 'right',
      targetHandle: isLeft ? 'from-right' : 'from-left',
      type: 'smoothstep',
      animated: true,
      style: { stroke: cat.color, strokeWidth: 2, opacity: 0.65 },
    })
  }

  return { nodes, edges }
}

// ── Editable Category Panel ───────────────────────────────────────────────────

interface CategoryEditorProps {
  catKey: typeof CATEGORIES[number]['key']
  label:  string
  emoji:  string
  color:  string
  items:  string[]
  onChange: (key: typeof CATEGORIES[number]['key'], newItems: string[]) => void
}

function CategoryEditor({ catKey, label, emoji, color, items, onChange }: CategoryEditorProps) {
  const [collapsed,    setCollapsed]    = useState(false)
  const [editingIdx,   setEditingIdx]   = useState<number | null>(null)
  const [editingValue, setEditingValue] = useState('')
  const [addingValue,  setAddingValue]  = useState('')
  const [isAdding,     setIsAdding]     = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const addRef   = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editingIdx !== null) inputRef.current?.focus()
  }, [editingIdx])

  useEffect(() => {
    if (isAdding) addRef.current?.focus()
  }, [isAdding])

  const startEdit = (idx: number) => {
    setEditingIdx(idx)
    setEditingValue(items[idx])
  }

  const commitEdit = () => {
    if (editingIdx === null) return
    if (!editingValue.trim()) { cancelEdit(); return }
    const next = [...items]
    next[editingIdx] = editingValue.trim()
    onChange(catKey, next)
    setEditingIdx(null)
    setEditingValue('')
  }

  const cancelEdit = () => { setEditingIdx(null); setEditingValue('') }

  const deleteItem = (idx: number) => {
    onChange(catKey, items.filter((_, i) => i !== idx))
  }

  const commitAdd = () => {
    if (!addingValue.trim()) { setIsAdding(false); setAddingValue(''); return }
    onChange(catKey, [...items, addingValue.trim()])
    setAddingValue('')
    setIsAdding(false)
  }

  return (
    <div
      className="category-editor"
      style={{ borderColor: `${color}30`, background: `${color}08` }}
    >
      {/* Header */}
      <button
        className="category-editor-header"
        onClick={() => setCollapsed(c => !c)}
        style={{ color }}
      >
        <span className="category-editor-title">
          <span>{emoji}</span>
          {label}
          <span className="category-count">{items.length}</span>
        </span>
        {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
      </button>

      {!collapsed && (
        <div className="category-editor-body">
          {items.map((item, idx) => (
            <div key={idx} className="category-item">
              {editingIdx === idx ? (
                // ── Edit mode ──────────────────────────────────────────
                <div className="category-item-edit">
                  <input
                    ref={inputRef}
                    value={editingValue}
                    onChange={e => setEditingValue(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') commitEdit()
                      if (e.key === 'Escape') cancelEdit()
                    }}
                    className="category-item-input"
                    style={{ borderColor: `${color}60` }}
                  />
                  <button onClick={commitEdit}  className="ci-btn ci-btn-ok"     title="Lưu"><Check size={13} /></button>
                  <button onClick={cancelEdit}  className="ci-btn ci-btn-cancel" title="Hủy"><X    size={13} /></button>
                </div>
              ) : (
                // ── View mode ──────────────────────────────────────────
                <div className="category-item-view">
                  <span className="category-item-bullet" style={{ background: color }} />
                  <span className="category-item-text">{item}</span>
                  <div className="category-item-actions">
                    <button onClick={() => startEdit(idx)}  className="ci-btn ci-btn-edit"   title="Sửa"><Pencil size={12} /></button>
                    <button onClick={() => deleteItem(idx)} className="ci-btn ci-btn-delete" title="Xóa"><Trash2 size={12} /></button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Add new item */}
          {isAdding ? (
            <div className="category-item-edit mt-1">
              <input
                ref={addRef}
                value={addingValue}
                placeholder="Nhập nội dung mới..."
                onChange={e => setAddingValue(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') commitAdd()
                  if (e.key === 'Escape') { setIsAdding(false); setAddingValue('') }
                }}
                className="category-item-input"
                style={{ borderColor: `${color}60` }}
              />
              <button onClick={commitAdd}                              className="ci-btn ci-btn-ok"     title="Thêm"><Check size={13} /></button>
              <button onClick={() => { setIsAdding(false); setAddingValue('') }} className="ci-btn ci-btn-cancel" title="Hủy"><X    size={13} /></button>
            </div>
          ) : (
            <button
              onClick={() => setIsAdding(true)}
              className="add-item-btn"
              style={{ color, borderColor: `${color}30` }}
            >
              <Plus size={12} /> Thêm mục
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── Keyword Editor ────────────────────────────────────────────────────────────

interface KeywordEditorProps {
  keywords: string[]
  onChange: (kws: string[]) => void
}

function KeywordEditor({ keywords, onChange }: KeywordEditorProps) {
  const [input, setInput] = useState('')

  const add = () => {
    const v = input.trim()
    if (!v || keywords.includes(v)) { setInput(''); return }
    onChange([...keywords, v])
    setInput('')
  }

  return (
    <div className="keyword-editor">
      <div className="keyword-chips">
        {keywords.map((kw, i) => (
          <span key={i} className="keyword-chip">
            #{kw}
            <button onClick={() => onChange(keywords.filter((_, j) => j !== i))} className="keyword-chip-remove">
              <X size={10} />
            </button>
          </span>
        ))}
      </div>
      <div className="keyword-add-row">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') add() }}
          placeholder="Thêm từ khóa..."
          className="keyword-input"
        />
        <button onClick={add} className="keyword-add-btn"><Plus size={12} /> Thêm</button>
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

interface CoreContentMindmapProps {
  data:              CoreContent
  onSubmitToReview?: () => void
  submitting?:       boolean
}

function MindmapInner({ data, onSubmitToReview, submitting }: CoreContentMindmapProps) {
  // Editable local copy
  const [edited, setEdited] = useState<EditableCoreContent>({ ...data })
  const [topicEdit, setTopicEdit] = useState(false)
  const [topicVal,  setTopicVal]  = useState(data.topic)
  const [panelOpen, setPanelOpen] = useState(true)

  // Keep in sync if parent re-generates
  useEffect(() => {
    setEdited({ ...data })
    setTopicVal(data.topic)
  }, [data])

  const { nodes, edges } = useMemo(() => buildGraph(edited), [edited])

  const onInit = useCallback((instance: { fitView: () => void }) => {
    setTimeout(() => instance.fitView(), 100)
  }, [])

  const updateCategory = (key: typeof CATEGORIES[number]['key'], newItems: string[]) => {
    setEdited(prev => ({ ...prev, [key]: newItems }))
  }

  const commitTopic = () => {
    if (topicVal.trim()) setEdited(prev => ({ ...prev, topic: topicVal.trim() }))
    setTopicEdit(false)
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* ── Mindmap Canvas ────────────────────────────────────────────── */}
      <div style={{ flex: '0 0 auto', height: panelOpen ? '380px' : '100%', minHeight: 280, transition: 'height 0.3s ease', position: 'relative' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onInit={onInit}
          fitView
          fitViewOptions={{ padding: 0.18 }}
          minZoom={0.3}
          maxZoom={1.8}
          proOptions={{ hideAttribution: true }}
          style={{ background: '#080c18', borderRadius: 12, height: '100%' }}
        >
          <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="rgba(255,255,255,0.06)" />
          <Controls
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 12,
            }}
          />
          <MiniMap
            nodeColor={(n) => {
              if (n.type === 'rootNode')     return '#2895ef'
              if (n.type === 'categoryNode') return (n.data as { color?: string }).color ?? '#888'
              return '#334155'
            }}
            maskColor="rgba(8,12,24,0.7)"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12,
            }}
          />
        </ReactFlow>

        {/* Submit button overlay */}
        {onSubmitToReview && (
          <button
            id="mindmap-submit-btn"
            onClick={onSubmitToReview}
            disabled={submitting}
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 18px',
              background: submitting ? 'rgba(16,185,129,0.3)' : 'linear-gradient(135deg,#10b981,#059669)',
              border: 'none',
              borderRadius: 10,
              color: 'white',
              fontWeight: 700,
              fontSize: 13,
              cursor: submitting ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 14px rgba(16,185,129,0.35)',
              transition: 'all 0.2s',
              zIndex: 10,
            }}
          >
            <SendHorizonal size={14} />
            {submitting ? 'Đang gửi...' : 'Gửi lên Medical Review'}
          </button>
        )}

        {/* Toggle edit panel button */}
        <button
          id="mindmap-edit-toggle"
          onClick={() => setPanelOpen(p => !p)}
          style={{
            position: 'absolute',
            bottom: 12,
            right: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 14px',
            background: panelOpen ? 'rgba(40,149,239,0.2)' : 'rgba(255,255,255,0.08)',
            border: panelOpen ? '1px solid rgba(40,149,239,0.4)' : '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8,
            color: panelOpen ? '#60a5fa' : '#94a3b8',
            fontWeight: 600,
            fontSize: 11,
            cursor: 'pointer',
            zIndex: 10,
            transition: 'all 0.2s',
          }}
        >
          <Pencil size={12} />
          {panelOpen ? 'Ẩn bảng chỉnh sửa' : 'Chỉnh sửa nội dung'}
        </button>
      </div>

      {/* ── Edit Panel ────────────────────────────────────────────────── */}
      {panelOpen && (
        <div className="mindmap-edit-panel">
          {/* Panel header */}
          <div className="mep-header">
            <div className="mep-header-left">
              <Pencil size={14} className="text-[#2895ef]" />
              <span>Chỉnh sửa nội dung trước khi gửi duyệt</span>
            </div>
            <span className="mep-hint">Click một mục để sửa · Enter để lưu · Esc để hủy</span>
          </div>

          {/* Topic editor */}
          <div className="mep-topic-row">
            <span className="mep-topic-label">Chủ đề chính:</span>
            {topicEdit ? (
              <div className="mep-topic-edit">
                <input
                  value={topicVal}
                  onChange={e => setTopicVal(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') commitTopic(); if (e.key === 'Escape') { setTopicEdit(false); setTopicVal(edited.topic) } }}
                  className="mep-topic-input"
                  autoFocus
                />
                <button onClick={commitTopic}                                                className="ci-btn ci-btn-ok"     title="Lưu"><Check size={13} /></button>
                <button onClick={() => { setTopicEdit(false); setTopicVal(edited.topic) }} className="ci-btn ci-btn-cancel" title="Hủy"><X    size={13} /></button>
              </div>
            ) : (
              <button className="mep-topic-display" onClick={() => setTopicEdit(true)}>
                {edited.topic}
                <Pencil size={11} className="opacity-50" />
              </button>
            )}
          </div>

          {/* Category editors grid */}
          <div className="mep-categories-grid">
            {CATEGORIES.map(cat => (
              <CategoryEditor
                key={cat.id}
                catKey={cat.key}
                label={cat.label}
                emoji={cat.emoji}
                color={cat.color}
                items={(edited as unknown as Record<string, string[]>)[cat.key] ?? []}
                onChange={updateCategory}
              />
            ))}
          </div>

          {/* Keywords editor */}
          <div className="mep-keywords-section">
            <span className="mep-section-label">Từ khóa SEO:</span>
            <KeywordEditor keywords={edited.keywords ?? []} onChange={kws => setEdited(prev => ({ ...prev, keywords: kws }))} />
          </div>

          {/* Submit row */}
          <div className="mep-submit-row">
            <div className="mep-change-summary">
              <span>Tổng:</span>
              <span className="mep-badge" style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)' }}>⚠️ {edited.warningSigns.length} dấu hiệu</span>
              <span className="mep-badge" style={{ color: '#f59e0b', background: 'rgba(245,158,11,0.1)' }}>🔬 {edited.causes.length} nguyên nhân</span>
              <span className="mep-badge" style={{ color: '#3b82f6', background: 'rgba(59,130,246,0.1)' }}>🩺 {edited.diagnosticMethods.length} chẩn đoán</span>
              <span className="mep-badge" style={{ color: '#10b981', background: 'rgba(16,185,129,0.1)' }}>💊 {edited.standardTreatments.length} điều trị</span>
            </div>
            {onSubmitToReview && (
              <button
                id="mep-submit-btn"
                onClick={onSubmitToReview}
                disabled={submitting}
                className="mep-submit-btn"
              >
                <SendHorizonal size={14} />
                {submitting ? 'Đang gửi lên...' : 'Xác nhận & Gửi lên Medical Review'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function CoreContentMindmap(props: CoreContentMindmapProps) {
  return (
    <ReactFlowProvider>
      <MindmapInner {...props} />
    </ReactFlowProvider>
  )
}
