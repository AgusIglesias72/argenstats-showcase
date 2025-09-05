// components/profile/tabs/ApiKeysTab.tsx
'use client'

import { useUser } from '@clerk/nextjs'
import { ApiKeysSection } from '@/components/profile/api-keys-section'

export default function ApiKeysTab() {
  const { user } = useUser()
  
  if (!user) return null
  
  return (
    <div className="space-y-6">
      <ApiKeysSection 
        userId={user.id} 
        userEmail={user.primaryEmailAddress?.emailAddress || null} 
      />
      
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
          Límites de uso por plan
        </h3>
        <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
          <p>• <strong>Free:</strong> 100 requests/hora</p>
          <p>• <strong>Basic:</strong> 1,000 requests/hora</p>
          <p>• <strong>Pro:</strong> 10,000 requests/hora</p>
          <p>• <strong>Enterprise:</strong> 100,000 requests/hora</p>
        </div>
      </div>
    </div>
  )
}