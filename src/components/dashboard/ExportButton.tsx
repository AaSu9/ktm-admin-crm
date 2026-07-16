'use client'

import { Download } from 'lucide-react'
import { exportToCSV, type CSVColumn } from '@/lib/csvExport'

interface ExportButtonProps<T> {
  data: T[]
  columns: CSVColumn<T>[]
  filename: string
  label?: string
}

export function ExportButton<T extends Record<string, any>>({
  data, columns, filename, label = 'Export CSV'
}: ExportButtonProps<T>) {
  return (
    <button
      onClick={() => exportToCSV(data, columns, filename)}
      className="inline-flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm"
    >
      <Download className="h-4 w-4" /> {label}
    </button>
  )
}
