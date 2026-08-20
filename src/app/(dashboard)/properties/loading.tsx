export default function PropertiesLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="h-7 bg-gray-200 rounded-lg w-32" />
          <div className="h-4 bg-gray-100 rounded w-28 mt-1.5" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-24 bg-gray-100 rounded-xl" />
          <div className="h-10 w-32 bg-emerald-100 rounded-xl" />
        </div>
      </div>

      {/* Filters Skeleton */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <div className="flex flex-wrap gap-3">
          <div className="h-10 w-64 bg-gray-100 rounded-xl" />
          <div className="h-10 w-32 bg-gray-100 rounded-xl" />
          <div className="h-10 w-32 bg-gray-100 rounded-xl" />
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="border-b border-gray-100 px-6 py-3 flex gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-3 bg-gray-100 rounded w-20" />
          ))}
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="border-b border-gray-50 px-6 py-4 flex items-center gap-6">
            <div className="h-12 w-16 bg-gray-100 rounded-lg" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 bg-gray-200 rounded w-48" />
              <div className="h-2.5 bg-gray-100 rounded w-32" />
            </div>
            <div className="h-3 bg-gray-100 rounded w-24" />
            <div className="h-6 bg-gray-100 rounded-full w-20" />
            <div className="h-3 bg-gray-100 rounded w-16" />
            <div className="flex gap-1.5">
              <div className="h-7 w-7 bg-gray-100 rounded" />
              <div className="h-7 w-7 bg-gray-100 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
