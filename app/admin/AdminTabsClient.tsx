'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { 
  Users, 
  MessageSquare, 
  Activity, 
  Calendar,
  FileText
} from 'lucide-react'
import ApiUsageTab from '@/components/admin/tabs/ApiUsageTab'
import ContactsTab from '@/components/admin/tabs/ContactsTab'
import EventsTab from '@/components/admin/tabs/EventsTab'
import BlogTab from '@/components/admin/tabs/BlogTab'

const tabs = [
  { id: 'users', label: 'Usuarios', icon: Users },
  { id: 'api-usage', label: 'Uso de APIs', icon: Activity },
  { id: 'contacts', label: 'Contactos', icon: MessageSquare },
  { id: 'events', label: 'Eventos', icon: Calendar },
  { id: 'blog', label: 'Blog', icon: FileText },
] as const

type TabId = typeof tabs[number]['id']

interface AdminTabsClientProps {
  initialTab?: TabId
  usersTabContent: React.ReactNode
  apiUsageTabContent: React.ReactNode
}

export default function AdminTabsClient({ initialTab = 'users', usersTabContent, apiUsageTabContent }: AdminTabsClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const currentTab = (searchParams.get('tab') as TabId) || initialTab
  const [activeTab, setActiveTab] = useState<TabId>(currentTab)

  const handleTabChange = (tabId: TabId) => {
    setActiveTab(tabId)
    const newUrl = tabId === 'users' 
      ? '/admin' 
      : `/admin?tab=${tabId}`
    router.push(newUrl)
  }

  return (
    <>
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
        {activeTab === 'users' && usersTabContent}
        {activeTab === 'api-usage' && apiUsageTabContent}
        {activeTab === 'contacts' && <ContactsTab />}
        {activeTab === 'events' && <EventsTab />}
        {activeTab === 'blog' && <BlogTab />}
      </div>
    </>
  )
}