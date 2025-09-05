// components/auth/AdminGuard.tsx
'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useIsAdmin } from '@/lib/hooks/useIsAdmin'
import { Loader2 } from 'lucide-react'

interface AdminGuardProps {
  children: React.ReactNode
  fallback?: string
}

export function AdminGuard({ children, fallback = '/' }: AdminGuardProps) {
  const { isAdmin, isLoading } = useIsAdmin()
  const router = useRouter()
  
  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.push(fallback)
    }
  }, [isAdmin, isLoading, router, fallback])
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }
  
  if (!isAdmin) {
    return null
  }
  
  return <>{children}</>
}