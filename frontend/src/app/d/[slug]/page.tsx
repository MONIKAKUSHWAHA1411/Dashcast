'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { dashboardsApi } from '@/lib/api'
import type { DashboardOut, Widget } from '@/types/dashboard'
import DashboardGrid from '@/components/dashboard/DashboardGrid'

export default function PublicDashboardPage() {
  const { slug } = useParams<{ slug: string }>()
  const [dashboard, setDashboard] = useState<DashboardOut | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [widgets, setWidgets] = useState<Widget[]>([])

  useEffect(() => {
    if (!slug) return
    dashboardsApi
      .getPublic(slug)
      .then((d) => {
        setDashboard(d)
        setWidgets([...d.config.widgets].sort((a, b) => a.position - b.position))
      })
      .catch((err: { response?: { status?: number } }) => {
        if (err.response?.status === 404) {
          setNotFound(true)
        } else {
          setNotFound(true)
        }
      })
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (notFound || !dashboard) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-6">
          <svg
            className="w-8 h-8 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Dashboard not found
        </h1>
        <p className="text-gray-500 text-sm mb-8 text-center max-w-xs">
          This dashboard doesn&apos;t exist or has been unpublished by its owner.
        </p>
        <Link
          href="/"
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          Go to Dashcast
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Public header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-lg font-extrabold text-gray-900 tracking-tight">
            Dash<span className="text-blue-600">cast</span>
          </Link>
          <span className="text-gray-300">|</span>
          <h1 className="text-gray-700 font-medium text-sm truncate max-w-xs">
            {dashboard.title}
          </h1>
        </div>
        <Link
          href="/register"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          Create your own
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </header>

      {/* Dashboard */}
      <div className="p-6">
        <DashboardGrid
          widgets={widgets}
          isEditing={false}
          onReorder={() => {}}
          onRename={() => {}}
          onDelete={() => {}}
        />
      </div>

      {/* Footer */}
      <footer className="text-center py-6 text-gray-400 text-xs border-t border-gray-200 mt-4">
        Powered by{' '}
        <Link href="/" className="font-semibold text-blue-600 hover:underline">
          Dashcast
        </Link>
      </footer>
    </div>
  )
}
