import Sidebar from './Sidebar'
import TopBar from './TopBar'

export default function PageWrapper({ children, onRefresh, loading }) {
  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <Sidebar />
      <div className="flex-1 ml-60 flex flex-col min-h-screen">
        <TopBar onRefresh={onRefresh} loading={loading} />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
