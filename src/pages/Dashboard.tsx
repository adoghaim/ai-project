import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import dayjs from 'dayjs'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface Appointment {
  id: string
  scheduled_at: string
  status: string
  is_new: boolean
  customers: { name: string }[] | null
  vehicles: { model: string; make: string }[] | null
  sales_reps: { name: string }[] | null
}

interface DeskLogEntry {
  id: string
  sale_status: string
  trade_in: string | null
  financing: string | null
  time_in: string | null
  time_out: string | null
  referral_source: string | null
  comments: string | null
  customers: { name: string }[] | null
  vehicles: { model: string; make: string }[] | null
  sales_reps: { name: string }[] | null
}

export default function Dashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [deskLogs, setDeskLogs] = useState<DeskLogEntry[]>([])
  const [metrics, setMetrics] = useState({ totalSold: 0, totalVehicles: 0, totalCustomers: 0, avgDaysInv: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const today = dayjs().startOf('day').toISOString()
      const tomorrow = dayjs().endOf('day').toISOString()

      const [apptRes, logRes, vehicleRes, customerRes] = await Promise.all([
        supabase
          .from('appointments')
          .select('id, scheduled_at, status, is_new, customers(name), vehicles(model, make), sales_reps(name)')
          .gte('scheduled_at', today)
          .lte('scheduled_at', tomorrow)
          .order('scheduled_at', { ascending: true }),
        supabase
          .from('desk_logs')
          .select('id, sale_status, trade_in, financing, time_in, time_out, referral_source, comments, customers(name), vehicles(model, make), sales_reps(name)')
          .order('created_at', { ascending: false })
          .limit(20),
        supabase.from('vehicles').select('id, status, added_at'),
        supabase.from('customers').select('id', { count: 'exact', head: true }),
      ])

      if (apptRes.data) setAppointments(apptRes.data as unknown as Appointment[])
      if (logRes.data) setDeskLogs(logRes.data as unknown as DeskLogEntry[])

      const sold = vehicleRes.data?.filter((v) => v.status === 'Sold').length ?? 0
      const total = vehicleRes.data?.length ?? 0
      const available = vehicleRes.data?.filter((v) => v.status === 'Available') ?? []
      const avgDays = available.length > 0
        ? Math.round(available.reduce((acc, v) => acc + dayjs().diff(dayjs(v.added_at), 'day'), 0) / available.length)
        : 0

      setMetrics({
        totalSold: sold,
        totalVehicles: total,
        totalCustomers: customerRes.count ?? 0,
        avgDaysInv: avgDays,
      })
      setLoading(false)
    }
    fetchData()
  }, [])

  const salesData = buildSalesChart(deskLogs)

  if (loading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Dashboard</h1>
        <p className="text-sm text-neutral-500 mt-1">Welcome to Pegasus CRM</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard label="Vehicles Sold" value={metrics.totalSold} subtitle={`of ${metrics.totalVehicles} total`} color="text-success-600" />
        <MetricCard label="Total Customers" value={metrics.totalCustomers} subtitle="in database" color="text-primary-600" />
        <MetricCard label="Today's Appointments" value={appointments.length} subtitle="scheduled" color="text-warning-600" />
        <MetricCard label="Avg Days in Inventory" value={metrics.avgDaysInv} subtitle="available vehicles" color="text-neutral-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 card">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Sales Activity</h2>
          {salesData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={salesData}>
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="completed" name="Completed" fill="#16a34a" radius={[4, 4, 0, 0]} />
                <Bar dataKey="inProgress" name="In Progress" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="lost" name="Lost" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-neutral-400 text-sm">No desk log activity yet.</p>
          )}
        </div>

        <div className="lg:col-span-2 card">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Today's Appointments</h2>
          {appointments.length === 0 ? (
            <p className="text-neutral-400 text-sm">No appointments scheduled today.</p>
          ) : (
            <div className="space-y-3 max-h-[260px] overflow-y-auto">
              {appointments.map((a) => (
                <div key={a.id} className="flex items-center justify-between p-3 rounded-lg bg-neutral-50 border border-neutral-100">
                  <div>
                    <p className="text-sm font-medium text-neutral-900">{a.customers?.[0]?.name ?? 'Unknown'}</p>
                    <p className="text-xs text-neutral-500">{a.vehicles?.[0] ? `${a.vehicles[0].make} ${a.vehicles[0].model}` : 'No vehicle'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-neutral-700">{dayjs(a.scheduled_at).format('h:mm A')}</p>
                    <StatusBadge status={a.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">Recent Desk Log</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200">
                <th className="text-left py-3 px-4 font-medium text-neutral-500">Customer</th>
                <th className="text-left py-3 px-4 font-medium text-neutral-500">Vehicle</th>
                <th className="text-left py-3 px-4 font-medium text-neutral-500">Status</th>
                <th className="text-left py-3 px-4 font-medium text-neutral-500">Trade-In</th>
                <th className="text-left py-3 px-4 font-medium text-neutral-500">Financing</th>
                <th className="text-left py-3 px-4 font-medium text-neutral-500">Sales Rep</th>
                <th className="text-left py-3 px-4 font-medium text-neutral-500">Time In</th>
              </tr>
            </thead>
            <tbody>
              {deskLogs.map((log) => (
                <tr key={log.id} className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors">
                  <td className="py-3 px-4 font-medium text-neutral-900">{log.customers?.[0]?.name ?? '—'}</td>
                  <td className="py-3 px-4 text-neutral-600">{log.vehicles?.[0] ? `${log.vehicles[0].make} ${log.vehicles[0].model}` : '—'}</td>
                  <td className="py-3 px-4"><StatusBadge status={log.sale_status} /></td>
                  <td className="py-3 px-4 text-neutral-600">{log.trade_in ?? '—'}</td>
                  <td className="py-3 px-4 text-neutral-600">{log.financing ?? '—'}</td>
                  <td className="py-3 px-4 text-neutral-600">{log.sales_reps?.[0]?.name ?? '—'}</td>
                  <td className="py-3 px-4 text-neutral-600">{log.time_in ? dayjs(log.time_in).format('MMM D, h:mm A') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function MetricCard({ label, value, subtitle, color }: { label: string; value: number; subtitle: string; color: string }) {
  return (
    <div className="card">
      <p className="text-sm font-medium text-neutral-500">{label}</p>
      <p className={`text-3xl font-bold mt-2 ${color}`}>{value}</p>
      <p className="text-xs text-neutral-400 mt-1">{subtitle}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    'Completed': 'badge-success',
    'Showed': 'badge-success',
    'In Progress': 'badge-warning',
    'Scheduled': 'badge-warning',
    'Lost': 'badge-error',
    'No Show': 'badge-error',
    'Cancelled': 'badge-neutral',
  }
  return <span className={styles[status] ?? 'badge-neutral'}>{status}</span>
}

function buildSalesChart(logs: DeskLogEntry[]) {
  const grouped: Record<string, { completed: number; inProgress: number; lost: number }> = {}
  logs.forEach((log) => {
    const day = dayjs(log.time_in ?? undefined).format('MMM D')
    if (!grouped[day]) grouped[day] = { completed: 0, inProgress: 0, lost: 0 }
    if (log.sale_status === 'Completed') grouped[day].completed++
    else if (log.sale_status === 'In Progress') grouped[day].inProgress++
    else if (log.sale_status === 'Lost') grouped[day].lost++
  })
  return Object.entries(grouped).map(([label, data]) => ({ label, ...data }))
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-8 w-48 bg-neutral-200 rounded" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => <div key={i} className="card h-28" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 card h-72" />
        <div className="lg:col-span-2 card h-72" />
      </div>
    </div>
  )
}
