'use client'

import { ExportButton } from '@/components/dashboard/ExportButton'
import { formatPrice, formatDate } from '@/lib/utils'

export function LeadsExportButton({ leads }: { leads: any[] }) {
  return (
    <ExportButton
      data={leads}
      columns={[
        { key: 'full_name', label: 'Name' },
        { key: 'phone', label: 'Phone' },
        { key: 'email', label: 'Email' },
        { key: 'status', label: 'Status', format: (v: string) => (v || 'NEW').replace(/_/g, ' ') },
        { key: 'priority', label: 'Priority' },
        { key: 'source', label: 'Source' },
        { key: 'budget', label: 'Budget', format: (v: number) => v ? formatPrice(v) : 'N/A' },
        { key: 'property.title', label: 'Property Interest' },
        { key: 'agent.name', label: 'Assigned Agent' },
        { key: 'created_at', label: 'Created', format: (v: any) => v ? formatDate(v) : '' },
      ]}
      filename="leads-export"
    />
  )
}

export function PropertiesExportButton({ properties }: { properties: any[] }) {
  return (
    <ExportButton
      data={properties}
      columns={[
        { key: 'property_id', label: 'Property ID' },
        { key: 'title', label: 'Title' },
        { key: 'location', label: 'Location' },
        { key: 'price', label: 'Price', format: (v: number) => formatPrice(v) },
        { key: 'category', label: 'Category' },
        { key: 'property_type', label: 'Type' },
        { key: 'status', label: 'Status' },
        { key: 'bedrooms', label: 'Bedrooms' },
        { key: 'bathrooms', label: 'Bathrooms' },
        { key: 'area_sqft', label: 'Area (sqft)' },
        { key: 'agent.name', label: 'Agent' },
        { key: 'created_at', label: 'Listed', format: (v: any) => v ? formatDate(v) : '' },
      ]}
      filename="properties-export"
    />
  )
}

export function CustomersExportButton({ customers }: { customers: any[] }) {
  return (
    <ExportButton
      data={customers}
      columns={[
        { key: 'name', label: 'Name' },
        { key: 'phone', label: 'Phone' },
        { key: 'email', label: 'Email' },
        { key: 'address', label: 'Address' },
        { key: 'type', label: 'Type' },
        { key: 'leads', label: 'Leads', format: (v: any[]) => String(v?.length || 0) },
        { key: 'visits', label: 'Visits', format: (v: any[]) => String(v?.length || 0) },
        { key: 'createdAt', label: 'Joined', format: (v: any) => v ? formatDate(v) : '' },
      ]}
      filename="customers-export"
    />
  )
}

export function VisitsExportButton({ visits }: { visits: any[] }) {
  return (
    <ExportButton
      data={visits}
      columns={[
        { key: 'customer.name', label: 'Customer' },
        { key: 'customer.phone', label: 'Phone' },
        { key: 'property.title', label: 'Property' },
        { key: 'date', label: 'Date', format: (v: any) => v ? formatDate(v) : '' },
        { key: 'time', label: 'Time' },
        { key: 'status', label: 'Status' },
        { key: 'agent.name', label: 'Agent' },
        { key: 'notes', label: 'Notes' },
      ]}
      filename="visits-export"
    />
  )
}

export function DealsExportButton({ deals }: { deals: any[] }) {
  return (
    <ExportButton
      data={deals}
      columns={[
        { key: 'title', label: 'Deal Title' },
        { key: 'property.title', label: 'Property' },
        { key: 'agent.name', label: 'Agent' },
        { key: 'buyer.name', label: 'Buyer' },
        { key: 'seller.name', label: 'Seller' },
        { key: 'dealValue', label: 'Deal Value', format: (v: number) => formatPrice(v) },
        { key: 'commissionRate', label: 'Commission Rate (%)' },
        { key: 'commissionEarned', label: 'Commission Earned', format: (v: number) => formatPrice(v) },
        { key: 'status', label: 'Status' },
        { key: 'closingDate', label: 'Closing Date', format: (v: any) => v ? formatDate(v) : '' },
        { key: 'notes', label: 'Notes' },
      ]}
      filename="deals-export"
    />
  )
}
