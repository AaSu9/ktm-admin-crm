'use client'
import { Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend)

const statusColors: Record<string, string> = {
  NEW: '#3b82f6',
  CONTACTED: '#8b5cf6',
  INTERESTED: '#f97316',
  VISIT_SCHEDULED: '#06b6d4',
  NEGOTIATION: '#eab308',
  CLOSED_WON: '#10b981',
  CLOSED_LOST: '#ef4444',
}

export function LeadStatusChart({ data }: { data: { status: string; _count: { status: number } }[] }) {
  const labels = data.map((d) => d.status.replace('_', ' '))
  const values = data.map((d) => d._count.status)
  const colors = data.map((d) => statusColors[d.status] || '#6b7280')

  const chartData = {
    labels,
    datasets: [{ data: values, backgroundColor: colors, borderWidth: 0, hoverOffset: 6 }],
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <h3 className="font-semibold text-gray-800 mb-4">Lead Pipeline</h3>
      {data.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-gray-400 text-sm">No lead data yet</div>
      ) : (
        <div className="flex items-center gap-6">
          <div className="w-40 h-40 flex-shrink-0">
            <Doughnut data={chartData} options={{ plugins: { legend: { display: false } }, maintainAspectRatio: true, cutout: '65%' }} />
          </div>
          <div className="space-y-2 flex-1">
            {data.map((d) => (
              <div key={d.status} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: statusColors[d.status] }} />
                  <span className="text-gray-600">{d.status.replace(/_/g, ' ')}</span>
                </div>
                <span className="font-semibold text-gray-800">{d._count.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
