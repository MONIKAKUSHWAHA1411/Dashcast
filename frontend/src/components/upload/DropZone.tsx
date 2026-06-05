'use client'

import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'

const ACCEPTED_TYPES = {
  'text/csv': ['.csv'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/vnd.ms-excel': ['.xls'],
  'application/pdf': ['.pdf'],
  'application/json': ['.json'],
}

const MAX_SIZE = 20 * 1024 * 1024 // 20 MB

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function FileTypeIcon({ ext }: { ext: string }) {
  const colors: Record<string, string> = {
    csv: 'text-green-600 bg-green-50',
    xlsx: 'text-emerald-600 bg-emerald-50',
    xls: 'text-emerald-600 bg-emerald-50',
    pdf: 'text-red-600 bg-red-50',
    json: 'text-yellow-600 bg-yellow-50',
  }
  const cls = colors[ext] ?? 'text-blue-600 bg-blue-50'
  return (
    <span
      className={`inline-flex items-center justify-center w-10 h-10 rounded-lg text-xs font-bold uppercase ${cls}`}
    >
      {ext}
    </span>
  )
}

interface DropZoneProps {
  file: File | null
  onFileChange: (file: File | null) => void
}

export default function DropZone({ file, onFileChange }: DropZoneProps) {
  const onDrop = useCallback(
    (accepted: File[]) => {
      if (accepted[0]) onFileChange(accepted[0])
    },
    [onFileChange]
  )

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    fileRejections,
  } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_SIZE,
    multiple: false,
  })

  const rejectionMsg =
    fileRejections[0]?.errors[0]?.code === 'file-too-large'
      ? `File is too large. Maximum size is 20 MB.`
      : fileRejections[0]?.errors[0]?.code === 'file-invalid-type'
      ? 'Unsupported file type. Use CSV, XLSX, PDF, or JSON.'
      : fileRejections[0]?.errors[0]?.message ?? ''

  const ext = file?.name.split('.').pop()?.toLowerCase() ?? ''

  return (
    <div>
      {!file ? (
        <div
          {...getRootProps()}
          className={`relative border-2 rounded-xl p-10 text-center cursor-pointer transition-all ${
            isDragActive
              ? 'border-blue-500 bg-blue-50 shadow-inner'
              : 'border-dashed border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50/40'
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-3">
            <div
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                isDragActive ? 'bg-blue-100' : 'bg-gray-100'
              }`}
            >
              <svg
                className={`w-7 h-7 ${isDragActive ? 'text-blue-600' : 'text-gray-400'}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M16 8l-4-4-4 4M12 4v12"
                />
              </svg>
            </div>
            {isDragActive ? (
              <p className="text-blue-600 font-semibold">Drop it here!</p>
            ) : (
              <>
                <p className="text-gray-700 font-medium">
                  Drag &amp; drop your report here
                </p>
                <p className="text-gray-400 text-sm">
                  or{' '}
                  <span className="text-blue-600 font-semibold underline underline-offset-2">
                    browse files
                  </span>
                </p>
              </>
            )}
            <p className="text-xs text-gray-400 mt-1">
              Supports CSV, XLSX, PDF, JSON — max 20 MB
            </p>
          </div>
        </div>
      ) : (
        // File selected state
        <div className="border border-gray-200 rounded-xl bg-white p-5 flex items-center gap-4">
          <FileTypeIcon ext={ext} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
            <p className="text-xs text-gray-400 mt-0.5">{formatBytes(file.size)}</p>
          </div>
          <button
            type="button"
            onClick={() => onFileChange(null)}
            className="flex-shrink-0 w-7 h-7 rounded-full bg-gray-100 hover:bg-red-100 text-gray-400 hover:text-red-500 flex items-center justify-center transition-colors"
            title="Remove file"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {rejectionMsg && (
        <p className="mt-2 text-sm text-red-600 flex items-center gap-1.5">
          <svg
            className="w-4 h-4 flex-shrink-0"
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
          {rejectionMsg}
        </p>
      )}
    </div>
  )
}
