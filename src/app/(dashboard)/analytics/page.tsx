'use client'
import { Line, Doughnut, Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Tooltip, Legend, Filler,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, Filler)

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function AnalyticsPage() {
  const leadGrowthData = {
    labels: months,
    datasets: [{
      label: 'Leads',
      data: [12, 19, 15, 27, 34, 28, 42, 38, 50, 47, 55, 62],
      fill: true,
      backgroundColor: 'rgba(16,185,129,0.1)',
      borderColor: '#10b981',
      tension: 0.4,
      pointRadius: 4,
      pointBackgroundColor: '#10b981',
    }],
  }

  const conversionData = {
    labels: ['New', 'Contacted', 'Interested', 'Visit', 'Negotiation', 'Won'],
    datasets: [{
      label: 'Leads',
      data: [62, 45, 35, 22, 15, 8],
      backgroundColor: ['#3b82f6', '#8b5cf6', '#f97316', '#06b6d4', '#eab308', '#10b981'],
      borderRadius: 8,
    }],
  }

  const revenueData = {
    labels: months,
    datasets: [{
      label: 'Revenue (Lakh NPR)',
      data: [120, 185, 95, 250, 310, 280, 420, 380, 500, 470, 550, 620],
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59,130,246,0.1)',
      fill: true,
      tension: 0.4,
    }],
  }

  const propertyPopData = {
    labels: ['Apartment', 'House', 'Land', 'Commercial'],
    datasets: [{
      data: [45, 28, 18, 9],
      backgroundColor: ['#10b981', '#3b82f6', '#f97316', '#8b5cf6'],
      borderWidth: 0,
    }],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, grid: { color: '#f3f4f6' } }, x: { grid: { display: false } } },
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-500 text-sm">Business insights and performance metrics</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: 'NPR 42L', change: '+18%', color: 'text-emerald-600' },
          { label: 'Avg. Deal Size', value: 'NPR 8L', change: '+5%', color: 'text-blue-600' },
          { label: 'Conversion Rate', value: '12.9%', change: '+2.1%', color: 'text-purple-600' },
          { label: 'Avg. Lead Time', value: '18 days', change: '-3d', color: 'text-orange-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{s.value}</p>
            <p className={`text-xs font-medium mt-0.5 ${s.color}`}>{s.change} this month</p>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4">Lead Growth (Monthly)</h3>
          <div className="h-56"><Line data={leadGrowthData} options={chartOptions} /></div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4">Revenue Trend</h3>
          <div className="h-56"><Line data={revenueData} options={chartOptions} /></div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4">Conversion Funnel</h3>
          <div className="h-56"><Bar data={conversionData} options={chartOptions} /></div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4">Property Popularity</h3>
          <div className="flex items-center gap-6">
            <div className="h-48 w-48 flex-shrink-0">
              <Doughnut data={propertyPopData} options={{ ...chartOptions, scales: undefined, cutout: '60%' }} />
            </div>
            <div className="space-y-3">
              {['Apartment', 'House', 'Land', 'Commercial'].map((t, i) => (
                <div key={t} className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ background: ['#10b981', '#3b82f6', '#f97316', '#8b5cf6'][i] }} />
                  <span className="text-gray-600">{t}</span>
                  <span className="font-bold text-gray-800 ml-auto">{[45, 28, 18, 9][i]}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
