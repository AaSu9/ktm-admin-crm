'use client'

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { exportToCSV, type CSVColumn } from '@/lib/csvExport'
import { toast } from 'sonner'

interface ExportButtonProps<T> {
  data: T[]
  columns: CSVColumn<T>[]
  filename: string
  label?: string
}

export function ExportButton<T extends Record<string, unknown>>({
  data, columns, filename, label = 'Export CSV'
}: ExportButtonProps<T>) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    if (isExporting) return
    setIsExporting(true)
    try {
      exportToCSV(data, columns, filename)
      toast.success('CSV exported successfully')
    } catch (err) {
      console.error('Export error:', err)
      toast.error('Failed to export CSV')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className="inline-flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-60 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-xs"
    >
      {isExporting ? <Loader2 className="h-4 w-4 animate-spin text-emerald-600" /> : <Download className="h-4 w-4" />}
      {label}
    </button>
  )
}
