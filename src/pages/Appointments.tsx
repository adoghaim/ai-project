import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import dayjs from 'dayjs'

interface Appointment {
  id: string
  scheduled_at: string
  status: string
  is_new: boolean
  notes: string | null
  customers: { name: string }[] | null
  vehicles: { make: string; model: string }[] | null
  sales_reps: { name: string }[] | null
}

export default function Appointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('appointments')
        .select('id, scheduled_at, status, is_new, notes, customers(name), vehicles(make, model), sales_reps(name)')
        .order('scheduled_at', { ascending: false })
        .limit(50)
      setAppointments((data as unknown as Appointment[]) ?? [])
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Appointments</h1>
        <p className="text-sm text-neutral-500 mt-1">{appointments.length} recent appointments</p>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200">
                <th className="text-left py-3 px-4 font-medium text-neutral-500">Date / Time</th>
                <th className="text-left py-3 px-4 font-medium text-neutral-500">Customer</th>
                <th className="text-left py-3 px-4 font-medium text-neutral-500">Vehicle Interest</th>
                <th className="text-left py-3 px-4 font-medium text-neutral-500">Type</th>
                <th className="text-left py-3 px-4 font-medium text-neutral-500">Status</th>
                <th className="text-left py-3 px-4 font-medium text-neutral-500">Sales Rep</th>
                <th className="text-left py-3 px-4 font-medium text-neutral-500">Notes</th>
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
              ) : appointments.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-neutral-400">No appointments found</td></tr>
              ) : (
                appointments.map((a) => (
                  <tr key={a.id} className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors">
                    <td className="py-3 px-4 text-neutral-900 font-medium">{dayjs(a.scheduled_at).format('MMM D, YYYY h:mm A')}</td>
                    <td className="py-3 px-4 text-neutral-600">{a.customers?.[0]?.name ?? '—'}</td>
                    <td className="py-3 px-4 text-neutral-600">{a.vehicles?.[0] ? `${a.vehicles[0].make} ${a.vehicles[0].model}` : '—'}</td>
                    <td className="py-3 px-4"><span className={a.is_new ? 'badge-success' : 'badge-neutral'}>{a.is_new ? 'New' : 'Used'}</span></td>
                    <td className="py-3 px-4"><StatusBadge status={a.status} /></td>
                    <td className="py-3 px-4 text-neutral-600">{a.sales_reps?.[0]?.name ?? '—'}</td>
                    <td className="py-3 px-4 text-neutral-500 max-w-[200px] truncate">{a.notes ?? '—'}</td>
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

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Scheduled: 'badge-warning',
    Showed: 'badge-success',
    'No Show': 'badge-error',
    Cancelled: 'badge-neutral',
  }
  return <span className={styles[status] ?? 'badge-neutral'}>{status}</span>
}
