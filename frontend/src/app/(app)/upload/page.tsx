'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { reportsApi } from '@/lib/api'
import DropZone from '@/components/upload/DropZone'

type UploadState = 'idle' | 'uploading' | 'polling' | 'done' | 'error'

export default function UploadPage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [uploadState, setUploadState] = useState<UploadState>('idle')
  const [progress, setProgress] = useState(0)
  const [errorMsg, setErrorMsg] = useState('')
  const [reportId, setReportId] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [])

  async function handleUpload() {
    if (!file) return
    setUploadState('uploading')
    setProgress(0)
    setErrorMsg('')

    try {
      const result = await reportsApi.upload(file, (pct) => setProgress(pct))
      setReportId(result.report_id)
      setProgress(100)
      setUploadState('polling')
      startPolling(result.report_id)
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } }
      setErrorMsg(
        axiosErr.response?.data?.detail ?? 'Upload failed. Please try again.'
      )
      setUploadState('error')
    }
  }

  function startPolling(id: string) {
    pollRef.current = setInterval(async () => {
      try {
        const report = await reportsApi.get(id)
        if (report.status === 'done' && report.dashboard_id) {
          if (pollRef.current) clearInterval(pollRef.current)
          setUploadState('done')
          router.push(`/dashboard/${report.dashboard_id}`)
        } else if (report.status === 'error') {
          if (pollRef.current) clearInterval(pollRef.current)
          setErrorMsg('Report processing failed. Please try a different file.')
          setUploadState('error')
        }
      } catch {
        // ignore transient errors during polling
      }
    }, 2000)
  }

  function handleReset() {
    if (pollRef.current) clearInterval(pollRef.current)
    setFile(null)
    setUploadState('idle')
    setProgress(0)
    setErrorMsg('')
    setReportId(null)
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Upload QA Report</h1>
        <p className="text-gray-500 text-sm mt-1">
          Supports CSV, Excel (.xlsx), PDF, and JSON files up to 20 MB
        </p>
      </div>

      {/* Drop zone */}
      {uploadState === 'idle' && (
        <>
          <DropZone file={file} onFileChange={setFile} />
          {file && (
            <div className="mt-6">
              <button
                onClick={handleUpload}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M16 8l-4-4-4 4M12 4v12"
                  />
                </svg>
                Upload &amp; Generate Dashboard
              </button>
            </div>
          )}
        </>
      )}

      {/* Upload progress */}
      {uploadState === 'uploading' && (
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M16 8l-4-4-4 4M12 4v12"
                />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {file?.name}
              </p>
              <p className="text-xs text-gray-500">Uploading…</p>
            </div>
            <span className="text-sm font-semibold text-blue-600">{progress}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Polling / processing */}
      {uploadState === 'polling' && (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-5">
            <div className="w-7 h-7 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Analyzing report…
          </h2>
          <p className="text-sm text-gray-500">
            Dashcast is processing your file and generating your dashboard.
            This usually takes a few seconds.
          </p>
          {reportId && (
            <p className="text-xs text-gray-400 mt-4 font-mono">
              Report ID: {reportId}
            </p>
          )}
        </div>
      )}

      {/* Error state */}
      {uploadState === 'error' && (
        <div className="bg-white rounded-xl border border-red-200 p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-5">
            <svg
              className="w-7 h-7 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Something went wrong
          </h2>
          <p className="text-sm text-red-600 mb-6">{errorMsg}</p>
          <button
            onClick={handleReset}
            className="px-6 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  )
}
