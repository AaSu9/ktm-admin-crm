export default function GlobalDashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse p-2">
      <div>
        <div className="h-7 bg-gray-200 rounded-lg w-40" />
        <div className="h-4 bg-gray-100 rounded w-64 mt-2" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 bg-gray-100 rounded-xl" />
              <div className="h-3 w-12 bg-gray-100 rounded" />
            </div>
            <div className="h-6 bg-gray-200 rounded w-20" />
            <div className="h-3 bg-gray-100 rounded w-28" />
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
        <div className="h-5 bg-gray-200 rounded w-48" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 bg-gray-50 rounded-xl" />
        ))}
      </div>
    </div>
  )
}
