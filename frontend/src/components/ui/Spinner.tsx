'use client'

type SpinnerSize = 'sm' | 'md' | 'lg'

interface SpinnerProps {
  size?: SpinnerSize
  className?: string
}

const SIZE_MAP: Record<SpinnerSize, string> = {
  sm: 'w-4 h-4 border-2',
  md: 'w-7 h-7 border-[3px]',
  lg: 'w-10 h-10 border-4',
}

export default function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={`${SIZE_MAP[size]} border-blue-600 border-t-transparent rounded-full animate-spin ${className}`}
    />
  )
}
