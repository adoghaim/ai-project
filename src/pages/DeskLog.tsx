import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import dayjs from 'dayjs'

interface DeskLogEntry {
  id: string
  sale_status: string
  trade_in: string | null
  financing: string | null
  time_in: string | null
  time_out: string | null
  referral_source: string | null
  phone_cell: string | null
  comments: string | null
  customers: { name: string }[] | null
  vehicles: { make: string; model: string }[] | null
  sales_reps: { name: string }[] | null
}

export default function DeskLog() {
  const [logs, setLogs] = useState<DeskLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      let query = supabase
        .from('desk_logs')
        .select('id, sale_status, trade_in, financing, time_in, time_out, referral_source, phone_cell, comments, customers(name), vehicles(make, model), sales_reps(name)')
        .order('created_at', { ascending: false })
        .limit(50)
      if (statusFilter) query = query.eq('sale_status', statusFilter)
      const { data } = await query
      setLogs((data as unknown as DeskLogEntry[]) ?? [])
      setLoading(false)
    }
    load()
  }, [statusFilter])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Desk Log</h1>
        <p className="text-sm text-neutral-500 mt-1">Track customer visits and deal progress</p>
      </div>

      <div className="flex gap-3">
        {['', 'In Progress', 'Completed', 'Lost'].map((s) => (
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

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200">
                <th className="text-left py-3 px-4 font-medium text-neutral-500">Customer</th>
                <th className="text-left py-3 px-4 font-medium text-neutral-500">Vehicle</th>
                <th className="text-left py-3 px-4 font-medium text-neutral-500">Status</th>
                <th className="text-left py-3 px-4 font-medium text-neutral-500">Trade-In</th>
                <th className="text-left py-3 px-4 font-medium text-neutral-500">Financing</th>
                <th className="text-left py-3 px-4 font-medium text-neutral-500">Time In</th>
                <th className="text-left py-3 px-4 font-medium text-neutral-500">Time Out</th>
                <th className="text-left py-3 px-4 font-medium text-neutral-500">Referral</th>
                <th className="text-left py-3 px-4 font-medium text-neutral-500">Sales Rep</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-neutral-100">
                    {Array.from({ length: 9 }).map((_, j) => (
                      <td key={j} className="py-3 px-4"><div className="h-4 bg-neutral-200 rounded animate-pulse w-16" /></td>
                    ))}
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr><td colSpan={9} className="py-12 text-center text-neutral-400">No desk log entries found</td></tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors">
                    <td className="py-3 px-4 font-medium text-neutral-900">{log.customers?.[0]?.name ?? '—'}</td>
                    <td className="py-3 px-4 text-neutral-600">{log.vehicles?.[0] ? `${log.vehicles[0].make} ${log.vehicles[0].model}` : '—'}</td>
                    <td className="py-3 px-4"><DeskStatusBadge status={log.sale_status} /></td>
                    <td className="py-3 px-4 text-neutral-600">{log.trade_in ?? '—'}</td>
                    <td className="py-3 px-4 text-neutral-600">{log.financing ?? '—'}</td>
                    <td className="py-3 px-4 text-neutral-600">{log.time_in ? dayjs(log.time_in).format('MMM D, h:mm A') : '—'}</td>
                    <td className="py-3 px-4 text-neutral-600">{log.time_out ? dayjs(log.time_out).format('MMM D, h:mm A') : '—'}</td>
                    <td className="py-3 px-4 text-neutral-600">{log.referral_source ?? '—'}</td>
                    <td className="py-3 px-4 text-neutral-600">{log.sales_reps?.[0]?.name ?? '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function DeskStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    'In Progress': 'badge-warning',
    Completed: 'badge-success',
    Lost: 'badge-error',
  }
  return <span className={styles[status] ?? 'badge-neutral'}>{status}</span>
}
