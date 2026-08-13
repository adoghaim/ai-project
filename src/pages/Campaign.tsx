import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

interface Customer {
  id: string
  name: string
  email: string | null
  phone: string | null
  source_of_lead: string | null
}

export default function Campaign() {
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])
  const [totalCustomers, setTotalCustomers] = useState(0)
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [results, setResults] = useState<{ sent: number; failed: number } | null>(null)
  const [filters, setFilters] = useState({ name: '', email: '', source_of_lead: '' })
  const [message, setMessage] = useState(
    'Hey {{name}},\n\nThis is Alex from Pegasus Auto.\n\nAre you interested in buying at the moment?\n\nThanks,\nAlex'
  )
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    supabase.from('customers').select('id', { count: 'exact', head: true }).then(({ count }) => {
      setTotalCustomers(count ?? 0)
    })
  }, [])

  const searchCustomers = useCallback(async () => {
    const hasFilter = Object.values(filters).some((v) => v.trim())
    if (!hasFilter) {
      setFilteredCustomers([])
      return
    }
    setLoading(true)
    let query = supabase.from('customers').select('id, name, email, phone, source_of_lead')
    if (filters.name) query = query.ilike('name', `%${filters.name}%`)
    if (filters.email) query = query.ilike('email', `%${filters.email}%`)
    if (filters.source_of_lead) query = query.ilike('source_of_lead', `%${filters.source_of_lead}%`)
    const { data } = await query.limit(100)
    setFilteredCustomers(data ?? [])
    setSelectedIds(new Set((data ?? []).map((c) => c.id)))
    setLoading(false)
  }, [filters])

  useEffect(() => {
    const timeout = setTimeout(searchCustomers, 600)
    return () => clearTimeout(timeout)
  }, [searchCustomers])

  const handleFilterChange = (field: string, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }))
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAll = () => setSelectedIds(new Set(filteredCustomers.map((c) => c.id)))
  const deselectAll = () => setSelectedIds(new Set())

  const handleLaunch = async () => {
    if (selectedIds.size === 0 || !message.trim()) return
    setSending(true)
    setResults(null)

    const selected = filteredCustomers.filter((c) => selectedIds.has(c.id))
    const blasts = selected.map((c) => ({
      customer_id: c.id,
      message: message.replace('{{name}}', c.name),
      status: 'Sent' as const,
      sent_at: new Date().toISOString(),
    }))

    const { data, error } = await supabase.from('blasts').insert(blasts).select()
    if (error) {
      setResults({ sent: 0, failed: selected.length })
    } else {
      setResults({ sent: data?.length ?? 0, failed: 0 })
    }
    setSending(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Blast Campaign</h1>
        <p className="text-sm text-neutral-500 mt-1">Send targeted messages to filtered customers</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Filter Customers</h2>
            <p className="text-sm text-neutral-500 mb-4">
              {filteredCustomers.length} of {totalCustomers} customers match your filters
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <input className="input" placeholder="Filter by name..." value={filters.name} onChange={(e) => handleFilterChange('name', e.target.value)} />
              <input className="input" placeholder="Filter by email..." value={filters.email} onChange={(e) => handleFilterChange('email', e.target.value)} />
              <input className="input" placeholder="Source of lead..." value={filters.source_of_lead} onChange={(e) => handleFilterChange('source_of_lead', e.target.value)} />
            </div>
          </div>

          {filteredCustomers.length > 0 && (
            <div className="card p-0 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-neutral-50 border-b border-neutral-200">
                <p className="text-sm font-medium text-neutral-700">{selectedIds.size} selected</p>
                <div className="flex gap-2">
                  <button className="text-sm text-primary-600 hover:text-primary-700 font-medium" onClick={selectAll}>Select All</button>
                  <button className="text-sm text-neutral-500 hover:text-neutral-700 font-medium" onClick={deselectAll}>Deselect All</button>
                </div>
              </div>
              <div className="max-h-[360px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200">
                      <th className="w-10 py-2 px-4"></th>
                      <th className="text-left py-2 px-4 font-medium text-neutral-500">Name</th>
                      <th className="text-left py-2 px-4 font-medium text-neutral-500">Email</th>
                      <th className="text-left py-2 px-4 font-medium text-neutral-500">Phone</th>
                      <th className="text-left py-2 px-4 font-medium text-neutral-500">Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCustomers.map((c) => (
                      <tr key={c.id} className="border-b border-neutral-100 hover:bg-neutral-50 cursor-pointer" onClick={() => toggleSelect(c.id)}>
                        <td className="py-2 px-4">
                          <input type="checkbox" checked={selectedIds.has(c.id)} readOnly className="rounded border-neutral-300 text-primary-600" />
                        </td>
                        <td className="py-2 px-4 font-medium text-neutral-900">{c.name}</td>
                        <td className="py-2 px-4 text-neutral-600">{c.email ?? '—'}</td>
                        <td className="py-2 px-4 text-neutral-600">{c.phone ?? '—'}</td>
                        <td className="py-2 px-4 text-neutral-600">{c.source_of_lead ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {loading && <p className="text-sm text-neutral-500">Searching...</p>}
        </div>

        <div className="space-y-6">
          <div className="card">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Compose Message</h2>
            <p className="text-xs text-neutral-400 mb-2">Use {'{{name}}'} to personalize</p>
            <textarea
              className="input min-h-[200px] resize-y"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <button
              className="btn-primary w-full mt-4"
              disabled={selectedIds.size === 0 || !message.trim() || sending}
              onClick={handleLaunch}
            >
              {sending ? 'Sending...' : `Launch to ${selectedIds.size} Customer${selectedIds.size !== 1 ? 's' : ''}`}
            </button>
          </div>

          {results && (
            <div className="card">
              <h3 className="font-semibold text-neutral-900 mb-2">Results</h3>
              <div className="flex gap-4">
                <div className="flex-1 text-center p-3 rounded-lg bg-success-50">
                  <p className="text-2xl font-bold text-success-700">{results.sent}</p>
                  <p className="text-xs text-success-600">Sent</p>
                </div>
                <div className="flex-1 text-center p-3 rounded-lg bg-error-50">
                  <p className="text-2xl font-bold text-error-600">{results.failed}</p>
                  <p className="text-xs text-error-500">Failed</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
