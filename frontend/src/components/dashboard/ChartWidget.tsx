'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'
import type { Widget, ChartConfig } from '@/types/dashboard'

// echarts-for-react requires browser APIs — use dynamic import to skip SSR
const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false })

interface ChartWidgetProps {
  widget: Widget
  isEditing: boolean
  onRename: (id: string, newTitle: string) => void
  onDelete: (id: string) => void
}

export default function ChartWidget({
  widget,
  isEditing,
  onRename,
  onDelete,
}: ChartWidgetProps) {
  const config = widget.config as ChartConfig
  const [renaming, setRenaming] = useState(false)
  const [draftTitle, setDraftTitle] = useState(config.title)

  function commitRename() {
    setRenaming(false)
    if (draftTitle.trim() && draftTitle !== config.title) {
      onRename(widget.id, draftTitle.trim())
    } else {
      setDraftTitle(config.title)
    }
  }

  return (
    <div
      className={`bg-white rounded-xl border widget-card transition-shadow ${
        isEditing
          ? 'ring-2 ring-offset-1 ring-blue-200 border-gray-200'
          : 'border-gray-200 shadow-sm hover:shadow-md'
      }`}
    >
      {/* Card header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <div className="flex-1 min-w-0">
          {renaming ? (
            <input
              autoFocus
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => e.key === 'Enter' && commitRename()}
              className="text-sm font-semibold text-gray-800 border-b border-blue-500 outline-none bg-transparent w-full"
            />
          ) : (
            <h3 className="text-sm font-semibold text-gray-800 truncate">
              {config.title}
            </h3>
          )}
          <span className="text-xs text-gray-400 capitalize mt-0.5 block">
            {config.chartType} chart
          </span>
        </div>

        {/* Edit controls */}
        {isEditing && (
          <div className="flex items-center gap-1 ml-3 flex-shrink-0">
            <button
              onClick={() => {
                setDraftTitle(config.title)
                setRenaming(true)
              }}
              className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-blue-50 flex items-center justify-center text-gray-500 hover:text-blue-600 transition-colors"
              title="Rename"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={() => onDelete(widget.id)}
              className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-red-50 flex items-center justify-center text-gray-500 hover:text-red-600 transition-colors"
              title="Delete"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="px-2 pb-4">
        <ReactECharts
          option={config.echartsOption}
          style={{ height: '300px' }}
          notMerge
          lazyUpdate
        />
      </div>
    </div>
  )
}
