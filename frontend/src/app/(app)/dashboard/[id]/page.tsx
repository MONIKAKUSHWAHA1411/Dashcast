'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { dashboardsApi } from '@/lib/api'
import type { DashboardOut, Widget, DashboardConfig } from '@/types/dashboard'
import DashboardGrid from '@/components/dashboard/DashboardGrid'
import PublishModal from '@/components/dashboard/PublishModal'
import ExportButton from '@/components/dashboard/ExportButton'

export default function DashboardPage() {
  const { id } = useParams<{ id: string }>()
  const [dashboard, setDashboard] = useState<DashboardOut | null>(null)
  const [widgets, setWidgets] = useState<Widget[]>([])
  const [title, setTitle] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [publishModalOpen, setPublishModalOpen] = useState(false)
  const [currentSlug, setCurrentSlug] = useState<string | null>(null)
  const [isPublished, setIsPublished] = useState(false)
  const [editingTitle, setEditingTitle] = useState(false)
  const titleInputRef = useRef<HTMLInputElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!id) return
    dashboardsApi
      .get(id)
      .then((d) => {
        setDashboard(d)
        setTitle(d.title)
        setWidgets([...d.config.widgets].sort((a, b) => a.position - b.position))
        setCurrentSlug(d.slug)
        setIsPublished(d.is_published)
      })
      .catch(() => setError('Failed to load dashboard.'))
      .finally(() => setLoading(false))
  }, [id])

  const handleReorder = useCallback((newWidgets: Widget[]) => {
    setWidgets(newWidgets)
    setIsDirty(true)
  }, [])

  const handleRename = useCallback((widgetId: string, newTitle: string) => {
    setWidgets((prev) =>
      prev.map((w) => {
        if (w.id !== widgetId) return w
        if (w.type === 'kpi') {
          return { ...w, config: { ...w.config, label: newTitle } }
        }
        return { ...w, config: { ...w.config, title: newTitle } }
      })
    )
    setIsDirty(true)
  }, [])

  const handleDelete = useCallback((widgetId: string) => {
    setWidgets((prev) => prev.filter((w) => w.id !== widgetId))
    setIsDirty(true)
  }, [])

  async function handleSave() {
    if (!dashboard || !isDirty) return
    setIsSaving(true)
    try {
      const updatedConfig: DashboardConfig = {
        ...dashboard.config,
        title,
        widgets: widgets.map((w, i) => ({ ...w, position: i })),
      }
      const updated = await dashboardsApi.update(id, {
        title,
        config: updatedConfig,
      })
      setDashboard(updated)
      setIsDirty(false)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2500)
    } catch {
      setError('Failed to save. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  function handleTitleBlur() {
    setEditingTitle(false)
    if (title !== dashboard?.title) setIsDirty(true)
  }

  function handleTitleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      setEditingTitle(false)
      if (title !== dashboard?.title) setIsDirty(true)
    }
  }

  function handleToggleEdit() {
    if (isEditing && isDirty) {
      // Prompt user or just switch — we keep changes
    }
    setIsEditing((v) => !v)
  }

  function handlePublished(slug: string) {
    setCurrentSlug(slug)
    setIsPublished(true)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !dashboard) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error || 'Dashboard not found.'}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toolbar */}
      <div
        className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-4 no-print"
        data-no-print
      >
        {/* Title */}
        <div className="flex-1 min-w-0">
          {isEditing && editingTitle ? (
            <input
              ref={titleInputRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={handleTitleKeyDown}
              className="text-lg font-bold text-gray-900 border-b-2 border-blue-500 outline-none bg-transparent w-full max-w-sm"
              autoFocus
            />
          ) : (
            <h1
              className={`text-lg font-bold text-gray-900 truncate ${
                isEditing ? 'cursor-pointer hover:text-blue-600' : ''
              }`}
              onClick={() => isEditing && setEditingTitle(true)}
              title={isEditing ? 'Click to rename' : undefined}
            >
              {title}
              {isEditing && (
                <span className="ml-2 text-xs font-normal text-gray-400">
                  (click to rename)
                </span>
              )}
            </h1>
          )}
        </div>

        {/* Success banner */}
        {saveSuccess && (
          <span className="text-xs text-green-600 font-medium bg-green-50 px-3 py-1 rounded-full border border-green-200">
            Saved!
          </span>
        )}

        {/* Export */}
        <ExportButton targetRef={gridRef} dashboardTitle={title} />

        {/* Publish */}
        <button
          onClick={() => setPublishModalOpen(true)}
          className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            isPublished
              ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
              : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
          }`}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
            />
          </svg>
          {isPublished ? 'Published' : 'Publish'}
        </button>

        {/* Edit / Done */}
        <button
          onClick={handleToggleEdit}
          className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            isEditing
              ? 'bg-gray-900 text-white hover:bg-gray-800'
              : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
          }`}
        >
          {isEditing ? (
            <>
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Done
            </>
          ) : (
            <>
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Edit
            </>
          )}
        </button>

        {/* Save */}
        {isEditing && (
          <button
            onClick={handleSave}
            disabled={!isDirty || isSaving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving…
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        )}
      </div>

      {/* Dashboard grid */}
      <div className="p-6" ref={gridRef}>
        <DashboardGrid
          widgets={widgets}
          isEditing={isEditing}
          onReorder={handleReorder}
          onRename={handleRename}
          onDelete={handleDelete}
        />
      </div>

      {/* Publish Modal */}
      <PublishModal
        isOpen={publishModalOpen}
        onClose={() => setPublishModalOpen(false)}
        dashboardId={id}
        currentSlug={currentSlug}
        isPublished={isPublished}
        onPublished={handlePublished}
      />
    </div>
  )
}
