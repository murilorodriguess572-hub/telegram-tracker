import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Overview from './pages/Overview'
import ClientPage from './pages/ClientPage'
import ExpertPage from './pages/ExpertPage'
import BotPage from './pages/BotPage'
import Settings from './pages/Settings'
import Account from './pages/Account'

function PrivateRoute({ children, superOnly }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#FFD700] border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  if (superOnly && user.role !== 'superadmin') return <Navigate to="/" replace />
  if (!superOnly && user.role === 'admin' && user.clientId && window.location.pathname === '/') {
    return <Navigate to={`/client/${user.clientId}`} replace />
  }
  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={
        <PrivateRoute>
          <Overview />
        </PrivateRoute>
      } />
      <Route path="/clients" element={<PrivateRoute superOnly><Overview /></PrivateRoute>} />
      <Route path="/client/:id" element={<PrivateRoute><ClientPage /></PrivateRoute>} />
      <Route path="/expert/:id" element={<PrivateRoute><ExpertPage /></PrivateRoute>} />
      <Route path="/bot/:id" element={<PrivateRoute><BotPage /></PrivateRoute>} />
      <Route path="/settings" element={<PrivateRoute superOnly><Settings /></PrivateRoute>} />
      <Route path="/account" element={<PrivateRoute><Account /></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
