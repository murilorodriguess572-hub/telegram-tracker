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
  return children
}

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, border: '2px solid #FFD700', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" replace />} />
      <Route path="/" element={
        <PrivateRoute>
          {user?.role === 'admin'
            ? <Navigate to={`/client/${user.clientId}`} replace />
            : <Overview />
          }
        </PrivateRoute>
      } />
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
