export function SkeletonCard() {
  return (
    <div className="bg-[#141414] border border-[#1e1e1e] rounded-xl p-5 skeleton">
      <div className="h-3 w-24 bg-[#2a2a2a] rounded mb-4" />
      <div className="h-8 w-32 bg-[#2a2a2a] rounded mb-2" />
      <div className="h-3 w-20 bg-[#1e1e1e] rounded" />
    </div>
  )
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 py-3 border-b border-[#1e1e1e] skeleton">
      <div className="h-8 w-8 bg-[#2a2a2a] rounded-full" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-32 bg-[#2a2a2a] rounded" />
        <div className="h-2 w-24 bg-[#1e1e1e] rounded" />
      </div>
      <div className="h-3 w-16 bg-[#2a2a2a] rounded" />
    </div>
  )
}

export default function LoadingSkeleton({ cards = 4 }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: cards }).map((_, i) => <SkeletonCard key={i} />)}
    </div>
  )
}
