'use client'
import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js'

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend)

const typeColors: Record<string, string> = {
  apartment: '#10b981',
  house: '#3b82f6',
  land: '#f97316',
  commercial: '#8b5cf6',
}

export function PropertyTypeChart({ data }: { data: { property_type: string; _count: { property_type: number } }[] }) {
  const chartData = {
    labels: data.map((d) => d.property_type.charAt(0).toUpperCase() + d.property_type.slice(1)),
    datasets: [{
      label: 'Properties',
      data: data.map((d) => d._count.property_type),
      backgroundColor: data.map((d) => typeColors[d.property_type] || '#6b7280'),
      borderRadius: 8,
    }],
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <h3 className="font-semibold text-gray-800 mb-4">Properties by Type</h3>
      {data.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-gray-400 text-sm">No property data yet</div>
      ) : (
        <div className="h-48">
          <Bar data={chartData} options={{
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: '#f3f4f6' } }, x: { grid: { display: false } } },
          }} />
        </div>
      )}
    </div>
  )
}
