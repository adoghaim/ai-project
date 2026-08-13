import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

interface Customer {
  id: string
  name: string
  email: string | null
  phone: string | null
  age: number | null
  source_of_lead: string | null
  preferred_contact_method: string | null
  occupation: string | null
  created_at: string
}

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [filters, setFilters] = useState({ name: '', email: '', source_of_lead: '', occupation: '' })
  const limit = 15

  const fetchCustomers = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('customers')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(page * limit, (page + 1) * limit - 1)

    if (filters.name) query = query.ilike('name', `%${filters.name}%`)
    if (filters.email) query = query.ilike('email', `%${filters.email}%`)
    if (filters.source_of_lead) query = query.ilike('source_of_lead', `%${filters.source_of_lead}%`)
    if (filters.occupation) query = query.ilike('occupation', `%${filters.occupation}%`)

    const { data, count } = await query
    setCustomers(data ?? [])
    setTotal(count ?? 0)
    setLoading(false)
  }, [page, filters])

  useEffect(() => { fetchCustomers() }, [fetchCustomers])

  const handleFilterChange = (field: string, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }))
    setPage(0)
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Customers</h1>
        <p className="text-sm text-neutral-500 mt-1">{total} total customers</p>
      </div>

      <div className="card">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <input className="input" placeholder="Search by name..." value={filters.name} onChange={(e) => handleFilterChange('name', e.target.value)} />
          <input className="input" placeholder="Search by email..." value={filters.email} onChange={(e) => handleFilterChange('email', e.target.value)} />
          <input className="input" placeholder="Source of lead..." value={filters.source_of_lead} onChange={(e) => handleFilterChange('source_of_lead', e.target.value)} />
          <input className="input" placeholder="Occupation..." value={filters.occupation} onChange={(e) => handleFilterChange('occupation', e.target.value)} />
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200">
                <th className="text-left py-3 px-4 font-medium text-neutral-500">Name</th>
                <th className="text-left py-3 px-4 font-medium text-neutral-500">Email</th>
                <th className="text-left py-3 px-4 font-medium text-neutral-500">Phone</th>
                <th className="text-left py-3 px-4 font-medium text-neutral-500">Age</th>
                <th className="text-left py-3 px-4 font-medium text-neutral-500">Source</th>
                <th className="text-left py-3 px-4 font-medium text-neutral-500">Contact Pref</th>
                <th className="text-left py-3 px-4 font-medium text-neutral-500">Occupation</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-neutral-100">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="py-3 px-4"><div className="h-4 bg-neutral-200 rounded animate-pulse w-20" /></td>
                    ))}
                  </tr>
                ))
              ) : customers.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-neutral-400">No customers found</td></tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors">
                    <td className="py-3 px-4 font-medium text-neutral-900">{c.name}</td>
                    <td className="py-3 px-4 text-neutral-600">{c.email ?? '—'}</td>
                    <td className="py-3 px-4 text-neutral-600">{c.phone ?? '—'}</td>
                    <td className="py-3 px-4 text-neutral-600">{c.age ?? '—'}</td>
                    <td className="py-3 px-4 text-neutral-600">{c.source_of_lead ?? '—'}</td>
                    <td className="py-3 px-4 text-neutral-600">{c.preferred_contact_method ?? '—'}</td>
                    <td className="py-3 px-4 text-neutral-600">{c.occupation ?? '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-200">
            <p className="text-sm text-neutral-500">Page {page + 1} of {totalPages}</p>
            <div className="flex gap-2">
              <button className="btn-secondary text-sm" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</button>
              <button className="btn-secondary text-sm" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
