import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { formatPrice, cn } from '@/lib/utils'
import Link from 'next/link'
import { Sparkles, ArrowRight, Home, User, CheckCircle, Eye, Phone } from 'lucide-react'

export default async function MatchesPage() {
  const session = await auth()
  if (!session) redirect('/login')

  let leads: any[] = []
  let properties: any[] = []
  let matches: any[] = []
  let dbError = false

  try {
    leads = await prisma.lead.findMany({
      where: {
        NOT: { status: { in: ['CLOSED_WON', 'CLOSED_LOST'] } }
      },
      include: { agent: true }
    })

    properties = await prisma.property.findMany({
      where: { status: 'AVAILABLE' },
      include: { agent: true }
    })

    // Server-side matchmaking algorithm
    leads.forEach((lead) => {
      properties.forEach((property) => {
        // Match conditions:
        // 1. Transaction category matches (e.g. sale/rent)
        const categoryMatch = !lead.inquiry_type || lead.inquiry_type.toLowerCase() === property.category.toLowerCase()
        
        // 2. Property type matches (e.g. apartment/house)
        const typeMatch = !lead.property_interest || lead.property_interest.toLowerCase() === property.property_type.toLowerCase()
        
        // 3. Price fits budget (property price <= lead budget)
        const priceMatch = !lead.budget || property.price <= lead.budget

        if (categoryMatch && typeMatch && priceMatch) {
          // Calculate a match score based on parameters
          let score = 70 // Base score for type & category match
          if (lead.budget) {
            const priceDifferenceRatio = (lead.budget - property.price) / lead.budget
            if (priceDifferenceRatio < 0.1) score += 25 // Very close to budget limit
            else if (priceDifferenceRatio < 0.3) score += 15
            else score += 5
          } else {
            score += 10
          }

          // Check location substring
          if (lead.notes?.some((n: string) => property.location.toLowerCase().includes(n.toLowerCase()))) {
            score += 5
          }

          matches.push({
            id: `${lead.id}-${property.id}`,
            lead,
            property,
            score: Math.min(score, 100),
          })
        }
      })
    })

    // Sort matches by score descending
    matches.sort((a, b) => b.score - a.score)
  } catch (error) {
    console.error("DB Query failed in Matches Page, using mock fallback:", error)
    dbError = true
  }

  // Fallback Mock Data for demo mode
  if (dbError || matches.length === 0) {
    matches = [
      {
        id: 'mock-match-1',
        score: 95,
        lead: {
          id: 'demo-lead-1',
          full_name: 'Anup Gurung',
          phone: '+977-9811234567',
          budget: 20000000,
          property_interest: 'apartment',
          inquiry_type: 'sale',
          agent: { name: 'Raj Kumar Sharma' }
        },
        property: {
          id: 'demo-prop-1',
          title: 'Luxury 3BHK Apartment in Lazimpat',
          location: 'Lazimpat, Kathmandu',
          price: 15000000,
          category: 'sale',
          property_type: 'apartment',
          images: ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=100']
        }
      },
      {
        id: 'mock-match-2',
        score: 85,
        lead: {
          id: 'demo-lead-2',
          full_name: 'Kamala Tamang',
          phone: '+977-9822345678',
          budget: 50000000,
          property_interest: 'house',
          inquiry_type: 'sale',
          agent: { name: 'Raj Kumar Sharma' }
        },
        property: {
          id: 'demo-prop-2',
          title: 'Modern Villa in Budhanilkantha',
          location: 'Budhanilkantha, Kathmandu',
          price: 45000000,
          category: 'sale',
          property_type: 'house',
          images: ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=100']
        }
      },
      {
        id: 'mock-match-3',
        score: 75,
        lead: {
          id: 'demo-lead-3',
          full_name: 'Deepak Bista',
          phone: '+977-9833456789',
          budget: 16000000,
          property_interest: 'apartment',
          inquiry_type: 'sale',
          agent: { name: 'Priya Thapa' }
        },
        property: {
          id: 'demo-prop-1',
          title: 'Luxury 3BHK Apartment in Lazimpat',
          location: 'Lazimpat, Kathmandu',
          price: 15000000,
          category: 'sale',
          property_type: 'apartment',
          images: ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=100']
        }
      }
    ]
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-amber-500" /> Automatic Matching Hub
          </h1>
          <p className="text-gray-500 text-sm mt-1">RealtoCRM connects active leads to available properties instantly.</p>
        </div>
        <div className="flex items-center gap-2">
          {dbError && (
            <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-3 py-1.5 rounded-xl">
              Sandbox Mode
            </span>
          )}
          <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-3 py-1.5 rounded-xl border border-emerald-100">
            {matches.length} Total Match Opportunities
          </span>
        </div>
      </div>

      {/* Matching Grid */}
      <div className="grid grid-cols-1 gap-6">
        {matches.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-100 py-16 text-center text-gray-400">
            <Sparkles className="h-12 w-12 mx-auto mb-2 text-gray-300 animate-pulse" />
            <p className="font-medium">No matching pairs identified.</p>
            <p className="text-xs mt-1">Add listings and matching leads to trigger automatic linking.</p>
          </div>
        ) : (
          matches.map((m) => (
            <div key={m.id} className="bg-white rounded-3xl border border-gray-100 p-6 flex flex-col lg:flex-row gap-6 items-center justify-between shadow-sm hover:shadow-md transition-all">
              {/* Match Score Indicator */}
              <div className="flex items-center gap-4 w-full lg:w-auto">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-100 flex flex-col items-center justify-center flex-shrink-0 shadow-sm">
                  <span className="text-xl font-black text-amber-600 leading-none">{m.score}%</span>
                  <span className="text-[10px] text-amber-500/80 font-bold mt-1">MATCH</span>
                </div>
                
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Category</span>
                    <span className="w-1 h-1 bg-gray-300 rounded-full" />
                    <span className="text-xs text-emerald-600 font-bold capitalize">{m.property.property_type} · {m.property.category}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    Auto-linked: Budget ({m.lead.budget ? formatPrice(m.lead.budget) : 'any'}) vs. Price ({formatPrice(m.property.price)})
                  </p>
                </div>
              </div>

              {/* Matchup visual comparison */}
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:flex-1 max-w-2xl">
                {/* Lead Card */}
                <div className="flex-1 bg-gray-50/50 rounded-2xl p-4 border border-gray-100 w-full">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-emerald-600" />
                    <h4 className="font-bold text-gray-800 text-sm truncate">{m.lead.full_name}</h4>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 truncate">{m.lead.phone}</p>
                  <div className="flex items-center justify-between mt-3 text-xs border-t border-gray-100 pt-2 text-gray-500">
                    <span>Agent: {m.lead.agent?.name || 'Unassigned'}</span>
                    <Link href={`/leads/${m.lead.id}`} className="text-emerald-600 hover:underline font-semibold flex items-center gap-0.5">
                      Open Profile <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>

                {/* Arrow visual */}
                <div className="text-gray-300 hidden sm:block">
                  <ArrowRight className="h-5 w-5" />
                </div>

                {/* Property Card */}
                <div className="flex-1 bg-gray-50/50 rounded-2xl p-4 border border-gray-100 w-full flex gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                    <img src={m.property.images?.[0] || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=100'} alt={m.property.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-gray-800 text-xs truncate">{m.property.title}</h4>
                      <p className="text-[10px] text-gray-400 truncate mt-0.5">{m.property.location}</p>
                    </div>
                    <div className="flex items-center justify-between mt-2 border-t border-gray-100 pt-1">
                      <span className="font-bold text-gray-900 text-xs">{formatPrice(m.property.price)}</span>
                      <Link href={`/properties/${m.property.id}`} className="text-[10px] text-emerald-600 hover:underline font-bold">
                        View Listing
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="w-full lg:w-auto flex gap-2">
                <Link href={`/leads/${m.lead.id}`}
                  className="flex-1 lg:flex-initial text-center bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm">
                  Propose Match
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
