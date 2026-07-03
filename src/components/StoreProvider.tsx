'use client'

import { useEffect, useRef } from 'react'
import { useTimelineStore } from '@/store/useTimelineStore'

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const loadFromDb = useTimelineStore(s => s.loadFromDb)
  const isLoaded = useTimelineStore(s => s.isLoaded)
  const called = useRef(false)

  useEffect(() => {
    if (called.current) return
    called.current = true
    loadFromDb()
  }, [loadFromDb])

  if (!isLoaded) {
    return (
      <div className="flex h-dvh items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#E8843A] border-t-transparent" />
          <p className="text-sm text-muted-foreground">Đang tải dữ liệu...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
