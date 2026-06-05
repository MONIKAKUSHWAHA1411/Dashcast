'use client'

import { useState } from 'react'
import type { Widget, KpiConfig } from '@/types/dashboard'

interface KpiCardProps {
  widget: Widget
  isEditing: boolean
  onRename: (id: string, newLabel: string) => void
  onDelete: (id: string) => void
}

const COLOR_MAP: Record<
  KpiConfig['color'],
  { card: string; label: string; value: string; dot: string }
> = {
  blue: {
    card: 'bg-blue-50 border-blue-200',
    label: 'text-blue-600',
    value: 'text-blue-900',
    dot: 'bg-blue-400',
  },
  green: {
    card: 'bg-green-50 border-green-200',
    label: 'text-green-600',
    value: 'text-green-900',
    dot: 'bg-green-400',
  },
  red: {
    card: 'bg-red-50 border-red-200',
    label: 'text-red-600',
    value: 'text-red-900',
    dot: 'bg-red-400',
  },
  teal: {
    card: 'bg-teal-50 border-teal-200',
    label: 'text-teal-600',
    value: 'text-teal-900',
    dot: 'bg-teal-400',
  },
  purple: {
    card: 'bg-purple-50 border-purple-200',
    label: 'text-purple-600',
    value: 'text-purple-900',
    dot: 'bg-purple-400',
  },
}

export default function KpiCard({ widget, isEditing, onRename, onDelete }: KpiCardProps) {
  const config = widget.config as KpiConfig
  const colors = COLOR_MAP[config.color] ?? COLOR_MAP.blue
  const [renaming, setRenaming] = useState(false)
  const [draftLabel, setDraftLabel] = useState(config.label)

  function commitRename() {
    setRenaming(false)
    if (draftLabel.trim() && draftLabel !== config.label) {
      onRename(widget.id, draftLabel.trim())
    } else {
      setDraftLabel(config.label)
    }
  }

  return (
    <div
      className={`relative rounded-xl border p-5 widget-card transition-shadow ${colors.card} ${
        isEditing ? 'ring-2 ring-offset-1 ring-blue-200' : 'shadow-sm hover:shadow-md'
      }`}
    >
      {/* Edit controls */}
      {isEditing && (
        <div className="absolute top-2 right-2 flex items-center gap-1">
          <button
            onClick={() => {
              setDraftLabel(config.label)
              setRenaming(true)
            }}
            className="w-6 h-6 rounded bg-white/80 hover:bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-blue-600 transition-colors"
            title="Rename"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(widget.id)}
            className="w-6 h-6 rounded bg-white/80 hover:bg-red-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:text-red-600 transition-colors"
            title="Delete"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      )}

      {/* Dot */}
      <span className={`inline-block w-2 h-2 rounded-full mb-3 ${colors.dot}`} />

      {/* Label */}
      {renaming ? (
        <input
          autoFocus
          value={draftLabel}
          onChange={(e) => setDraftLabel(e.target.value)}
          onBlur={commitRename}
          onKeyDown={(e) => e.key === 'Enter' && commitRename()}
          className={`block w-full text-xs font-semibold uppercase tracking-wider bg-transparent border-b border-current outline-none mb-1 ${colors.label}`}
        />
      ) : (
        <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${colors.label}`}>
          {config.label}
        </p>
      )}

      {/* Value */}
      <p className={`text-3xl font-extrabold ${colors.value}`}>
        {config.value}
      </p>
    </div>
  )
}
