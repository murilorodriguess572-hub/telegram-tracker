import { useEffect, useRef, useState } from 'react'

export default function CountUp({ end, duration = 800, prefix = '', suffix = '' }) {
  const [count, setCount] = useState(0)
  const startTime = useRef(null)
  const raf = useRef(null)
  const endNum = Number(end) || 0

  useEffect(() => {
    if (endNum === 0) { setCount(0); return }
    startTime.current = null

    const step = (ts) => {
      if (!startTime.current) startTime.current = ts
      const progress = Math.min((ts - startTime.current) / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(ease * endNum))
      if (progress < 1) raf.current = requestAnimationFrame(step)
      else setCount(endNum)
    }

    raf.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf.current)
  }, [endNum, duration])

  return <span className="count-up">{prefix}{count.toLocaleString('pt-BR')}{suffix}</span>
}
