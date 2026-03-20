import Sidebar from './Sidebar'
import TopBar from './TopBar'

const SIDEBAR_W = 220

export default function PageWrapper({ children, onRefresh, loading }) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0a0a]">
      <Sidebar />
      <div
        className="flex flex-col flex-1 min-w-0"
        style={{ marginLeft: SIDEBAR_W }}
      >
        <TopBar onRefresh={onRefresh} loading={loading} />
        <main className="flex-1 overflow-y-auto" style={{ padding: '28px 32px' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
