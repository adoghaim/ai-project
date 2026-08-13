import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface Vehicle {
  id: string
  make: string
  model: string
  year: number
  color: string | null
  vin: string | null
  price: number | null
  status: string
  is_new: boolean
  mileage: number | null
  added_at: string
}

export default function Vehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      let query = supabase.from('vehicles').select('*').order('added_at', { ascending: false })
      if (statusFilter) query = query.eq('status', statusFilter)
      const { data } = await query
      setVehicles(data ?? [])
      setLoading(false)
    }
    load()
  }, [statusFilter])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Vehicle Inventory</h1>
        <p className="text-sm text-neutral-500 mt-1">{vehicles.length} vehicles</p>
      </div>

      <div className="flex gap-3">
        {['', 'Available', 'Sold', 'Hold'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === s
                ? 'bg-primary-600 text-white'
                : 'bg-white text-neutral-600 border border-neutral-300 hover:bg-neutral-50'
            }`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <div key={i} className="card animate-pulse h-48" />)
        ) : vehicles.length === 0 ? (
          <p className="text-neutral-400 col-span-full text-center py-12">No vehicles found</p>
        ) : (
          vehicles.map((v) => (
            <div key={v.id} className="card hover:shadow-md transition-shadow duration-200">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-neutral-900">{v.year} {v.make} {v.model}</h3>
                  <p className="text-sm text-neutral-500">{v.color ?? 'N/A'} {v.is_new ? '(New)' : '(Used)'}</p>
                </div>
                <span className={v.status === 'Available' ? 'badge-success' : v.status === 'Sold' ? 'badge-error' : 'badge-warning'}>{v.status}</span>
              </div>
              <div className="space-y-2 text-sm">
                {v.price && <p className="text-xl font-bold text-neutral-900">${v.price.toLocaleString()}</p>}
                <div className="flex justify-between text-neutral-500">
                  <span>{v.mileage?.toLocaleString() ?? '—'} mi</span>
                  {v.vin && <span className="font-mono text-xs">{v.vin.slice(-6)}</span>}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
