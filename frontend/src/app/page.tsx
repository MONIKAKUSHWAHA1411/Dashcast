'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { isAuthenticated } from '@/lib/auth'

export default function LandingPage() {
  const router = useRouter()

  useEffect(() => {
    if (isAuthenticated()) {
      router.replace('/dashboard')
    }
  }, [router])

  return (
    <main className="min-h-screen bg-gray-950 flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
        <span className="text-xl font-bold text-white tracking-tight">
          Dash<span className="text-blue-400">cast</span>
        </span>
        <div className="flex gap-3">
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950 border border-blue-800 text-blue-400 text-xs font-medium mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          QA Dashboard Generator
        </div>

        {/* Heading */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white leading-tight max-w-4xl mb-6">
          Turn QA Reports into{' '}
          <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
            Instant Dashboards
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mb-10 leading-relaxed">
          Upload your test reports — CSV, Excel, PDF, or JSON — and Dashcast
          automatically generates beautiful, interactive dashboards you can
          share with a single link.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-16">
          <Link
            href="/register"
            className="px-8 py-4 text-base font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-900/30 transition-all hover:shadow-blue-900/50 hover:-translate-y-0.5"
          >
            Get Started Free
          </Link>
          <Link
            href="/login"
            className="px-8 py-4 text-base font-semibold bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-xl border border-gray-700 transition-all hover:-translate-y-0.5"
          >
            Sign In
          </Link>
        </div>

        {/* Feature Pills */}
        <div className="flex flex-wrap justify-center gap-3">
          {[
            '📁 CSV, XLSX, PDF, JSON',
            '📊 Auto-generated charts',
            '🔗 Shareable public links',
            '✏️ Drag & drop editor',
            '📤 Export PNG & PDF',
          ].map((feat) => (
            <span
              key={feat}
              className="px-4 py-2 rounded-full bg-gray-900 border border-gray-800 text-gray-400 text-sm"
            >
              {feat}
            </span>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-6 text-gray-600 text-sm border-t border-gray-900">
        &copy; {new Date().getFullYear()} Dashcast. All rights reserved.
      </footer>
    </main>
  )
}
