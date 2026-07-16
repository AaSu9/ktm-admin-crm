import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number): string {
  if (price >= 10000000) return `Rs. ${(price / 10000000).toFixed(1)} Cr`
  if (price >= 100000) return `Rs. ${(price / 100000).toFixed(1)} Lakh`
  return `Rs. ${price.toLocaleString()}`
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    AVAILABLE: 'bg-emerald-100 text-emerald-700',
    SOLD: 'bg-red-100 text-red-700',
    PENDING: 'bg-yellow-100 text-yellow-700',
    RENTED: 'bg-blue-100 text-blue-700',
    NEW: 'bg-blue-100 text-blue-700',
    CONTACTED: 'bg-purple-100 text-purple-700',
    INTERESTED: 'bg-orange-100 text-orange-700',
    VISIT_SCHEDULED: 'bg-cyan-100 text-cyan-700',
    NEGOTIATION: 'bg-yellow-100 text-yellow-700',
    CLOSED_WON: 'bg-emerald-100 text-emerald-700',
    CLOSED_LOST: 'bg-red-100 text-red-700',
    SCHEDULED: 'bg-blue-100 text-blue-700',
    COMPLETED: 'bg-emerald-100 text-emerald-700',
    CANCELLED: 'bg-red-100 text-red-700',
    UNREAD: 'bg-blue-100 text-blue-700',
    READ: 'bg-gray-100 text-gray-700',
    REPLIED: 'bg-emerald-100 text-emerald-700',
    HIGH: 'bg-red-100 text-red-700',
    MEDIUM: 'bg-yellow-100 text-yellow-700',
    LOW: 'bg-gray-100 text-gray-700',
  }
  return colors[status] || 'bg-gray-100 text-gray-700'
}
