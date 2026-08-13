import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Customers from './pages/Customers'
import Vehicles from './pages/Vehicles'
import Appointments from './pages/Appointments'
import DeskLog from './pages/DeskLog'
import Campaign from './pages/Campaign'
import SalesReps from './pages/SalesReps'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/vehicles" element={<Vehicles />} />
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/desk-log" element={<DeskLog />} />
        <Route path="/campaign" element={<Campaign />} />
        <Route path="/sales-reps" element={<SalesReps />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
