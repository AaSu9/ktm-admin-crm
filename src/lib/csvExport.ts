/**
 * Client-side CSV export utility.
 * Usage: exportToCSV(data, columns, 'filename')
 *
 * Example:
 *   exportToCSV(leads, [
 *     { key: 'full_name', label: 'Name' },
 *     { key: 'phone', label: 'Phone' },
 *   ], 'leads-export')
 */

export interface CSVColumn<T = any> {
  key: string
  label: string
  format?: (value: any, row: T) => string
}

export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  columns: CSVColumn<T>[],
  filename: string
) {
  if (data.length === 0) {
    alert('No data to export.')
    return
  }

  const header = columns.map((col) => `"${col.label}"`).join(',')

  const rows = data.map((row) =>
    columns
      .map((col) => {
        const keys = col.key.split('.')
        let value: any = row
        for (const k of keys) {
          value = value?.[k]
        }

        if (col.format) {
          value = col.format(value, row)
        }

        if (value === null || value === undefined) return '""'
        if (value instanceof Date) return `"${value.toLocaleDateString('en-IN')}"`
        if (typeof value === 'object') return `"${JSON.stringify(value).replace(/"/g, '""')}"`

        return `"${String(value).replace(/"/g, '""')}"`
      })
      .join(',')
  )

  const csvContent = [header, ...rows].join('\n')
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
