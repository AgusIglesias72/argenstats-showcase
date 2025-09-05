// lib/hooks/useIsAdmin.ts
import { useUser } from '@clerk/nextjs'

export function useIsAdmin() {
  const { user } = useUser()
  
  return {
    isAdmin: user?.publicMetadata?.role === 'admin',
    isLoading: !user
  }
}
