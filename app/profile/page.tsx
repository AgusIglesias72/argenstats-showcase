// app/profile/page.tsx
'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter, useSearchParams } from 'next/navigation'
import { 
  User, 
  KeyRound, 
  Calendar, 
  Mail, 
  Star,
  Loader2 
} from 'lucide-react'
import ProfileTab from '@/components/profile/tabs/ProfileTab'
import ApiKeysTab from '@/components/profile/tabs/ApiKeysTab'
import EventsTab from '@/components/profile/tabs/EventsTab'
import ContactTab from '@/components/profile/tabs/ContactTab'
import FavoritesTab from '@/components/profile/tabs/FavoritesTab'
import { Header } from '@/components/layout/header'

const tabs = [
  { id: 'profile', label: 'Perfil', icon: User },
  { id: 'api-keys', label: 'API Keys', icon: KeyRound },
  { id: 'events', label: 'Eventos', icon: Calendar },
  { id: 'contact', label: 'Contacto', icon: Mail },
  { id: 'favorites', label: 'Favoritos', icon: Star },
] as const

type TabId = typeof tabs[number]['id']

export default function ProfilePage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const currentTab = (searchParams.get('tab') as TabId) || 'profile'
  const [activeTab, setActiveTab] = useState<TabId>(currentTab)

  const handleTabChange = (tabId: TabId) => {
    setActiveTab(tabId)
    const newUrl = tabId === 'profile' 
      ? '/profile' 
      : `/profile?tab=${tabId}`
    router.push(newUrl)
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (!user) {
    router.push('/sign-in')
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header principal del sitio */}
      <Header />
      
      {/* Header con info del usuario */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-4">
            <img
              src={user.imageUrl}
              alt={user.fullName || 'Usuario'}
              className="w-16 h-16 rounded-full"
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {user.fullName || 'Usuario'}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Miembro desde {user.createdAt ? new Date(user.createdAt).toLocaleDateString('es-AR', {
                  year: 'numeric',
                  month: 'long'
                }) : 'fecha desconocida'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="-mb-px flex space-x-8 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`
                    group inline-flex items-center whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                    ${isActive
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    }
                  `}
                >
                  <Icon className={`
                    -ml-0.5 mr-2 h-5 w-5
                    ${isActive
                      ? 'text-blue-500 dark:text-blue-400'
                      : 'text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300'
                    }
                  `} />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'profile' && <ProfileTab />}
        {activeTab === 'api-keys' && <ApiKeysTab />}
        {activeTab === 'events' && <EventsTab />}
        {activeTab === 'contact' && <ContactTab />}
        {activeTab === 'favorites' && <FavoritesTab />}
      </div>
    </div>
  )
}