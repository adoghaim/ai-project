import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface SalesRep {
  id: string
  name: string
  email: string | null
  phone: string | null
}

export default function SalesReps() {
  const [reps, setReps] = useState<SalesRep[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('sales_reps').select('*').order('name')
      setReps(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Sales Reps</h1>
        <p className="text-sm text-neutral-500 mt-1">{reps.length} team members</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <div key={i} className="card animate-pulse h-32" />)
        ) : (
          reps.map((rep) => (
            <div key={rep.id} className="card hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-primary-700 font-semibold text-lg">{rep.name.charAt(0)}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900">{rep.name}</h3>
                  <p className="text-sm text-neutral-500">{rep.email ?? 'No email'}</p>
                  <p className="text-sm text-neutral-400">{rep.phone ?? 'No phone'}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
