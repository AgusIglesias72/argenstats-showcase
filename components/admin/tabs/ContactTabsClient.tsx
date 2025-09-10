'use client'

import { useState } from 'react'
import Image from 'next/image'
import { 
  Mail, 
  MessageSquare, 
  Clock, 
  CheckCircle,
  Search,
  Filter,
  Reply,
  Archive,
  Trash2,
  User,
  UserCheck,
  AlertCircle,
  BellRing,
  Download,
  Eye,
  EyeOff,
  TrendingUp,
  Users,
  Bug,
  Lightbulb,
  HelpCircle
} from 'lucide-react'

interface Contact {
  id: string
  name: string
  email: string
  subject: string
  message: string
  contactType: string
  status: string
  priority: string
  createdAt: string
  repliedAt: string | null
  resolvedAt: string | null
  isSpam: boolean
  spamScore: number | null
  adminNotes: string | null
  assignedTo: string | null
  isRegisteredUser: boolean
  userId: string | null
  userProfile: {
    name: string | null
    imageUrl: string | null
    role: string
    company: string | null
    position: string | null
  } | null
}

interface NewsletterSubscriber {
  id: string
  email: string
  isActive: boolean
  subscribedAt: string
  unsubscribedAt: string | null
  source: string | null
  metadata: any
  isRegisteredUser: boolean
  contactCount: number
  daysSinceSubscribed: number
}

interface Stats {
  contacts: {
    total: number
    pending: number
    inProgress: number
    replied: number
    resolved: number
    spam: number
    fromRegisteredUsers: number
  }
  newsletter: {
    total: number
    active: number
    inactive: number
    registeredUsers: number
    thisMonth: number
  }
  contactTypes: {
    general: number
    api: number
    bug: number
    feature: number
  }
  priorities: {
    urgent: number
    high: number
    normal: number
    low: number
  }
}

interface ContactsTabClientProps {
  initialContacts: Contact[]
  initialSubscribers: NewsletterSubscriber[]
  initialStats: Stats
}

export default function ContactsTabClient({ 
  initialContacts, 
  initialSubscribers, 
  initialStats 
}: ContactsTabClientProps) {
  const [activeTab, setActiveTab] = useState<'contacts' | 'newsletter'>('contacts')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [showOnlyRegistered, setShowOnlyRegistered] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Filtrar contactos
  const filteredContacts = initialContacts.filter(contact => {
    const matchesSearch = 
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.message.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || contact.status === filterStatus
    const matchesPriority = filterPriority === 'all' || contact.priority === filterPriority
    const matchesType = filterType === 'all' || contact.contactType === filterType
    const matchesRegistered = !showOnlyRegistered || contact.isRegisteredUser
    return matchesSearch && matchesStatus && matchesPriority && matchesType && matchesRegistered
  })

  // Filtrar suscriptores
  const filteredSubscribers = initialSubscribers.filter(subscriber => {
    const matchesSearch = subscriber.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRegistered = !showOnlyRegistered || subscriber.isRegisteredUser
    const matchesStatus = 
      filterStatus === 'all' || 
      (filterStatus === 'active' && subscriber.isActive) ||
      (filterStatus === 'inactive' && !subscriber.isActive)
    return matchesSearch && matchesRegistered && matchesStatus
  })

  // Paginación
  const paginatedContacts = filteredContacts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )
  const paginatedSubscribers = filteredSubscribers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
      case 'normal':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
      case 'low':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
      case 'replied':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      case 'resolved':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'api':
        return <TrendingUp className="w-4 h-4" />
      case 'bug':
        return <Bug className="w-4 h-4" />
      case 'feature':
        return <Lightbulb className="w-4 h-4" />
      default:
        return <HelpCircle className="w-4 h-4" />
    }
  }

  const downloadCSV = () => {
    if (activeTab === 'contacts') {
      const headers = ['Nombre', 'Email', 'Asunto', 'Tipo', 'Estado', 'Prioridad', 'Usuario Registrado', 'Fecha']
      const csvContent = [
        headers.join(','),
        ...filteredContacts.map(c => [
          `"${c.name}"`,
          c.email,
          `"${c.subject}"`,
          c.contactType,
          c.status,
          c.priority,
          c.isRegisteredUser ? 'Sí' : 'No',
          new Date(c.createdAt).toLocaleDateString()
        ].join(','))
      ].join('\n')
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `contactos_${new Date().toISOString().split('T')[0]}.csv`
      link.click()
    } else {
      const headers = ['Email', 'Estado', 'Usuario Registrado', 'Fecha Suscripción', 'Días Activo', 'Contactos']
      const csvContent = [
        headers.join(','),
        ...filteredSubscribers.map(s => [
          s.email,
          s.isActive ? 'Activo' : 'Inactivo',
          s.isRegisteredUser ? 'Sí' : 'No',
          new Date(s.subscribedAt).toLocaleDateString(),
          s.daysSinceSubscribed,
          s.contactCount
        ].join(','))
      ].join('\n')
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `newsletter_${new Date().toISOString().split('T')[0]}.csv`
      link.click()
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Contactos</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{initialStats.contacts.total}</p>
              <p className="text-xs text-gray-500 mt-1">
                {initialStats.contacts.fromRegisteredUsers} de usuarios registrados
              </p>
            </div>
            <Mail className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pendientes</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{initialStats.contacts.pending}</p>
              <p className="text-xs text-gray-500 mt-1">
                {initialStats.contacts.inProgress} en progreso
              </p>
            </div>
            <Clock className="w-8 h-8 text-orange-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Newsletter</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{initialStats.newsletter.active}</p>
              <p className="text-xs text-gray-500 mt-1">
                {initialStats.newsletter.total} totales ({initialStats.newsletter.thisMonth} este mes)
              </p>
            </div>
            <BellRing className="w-8 h-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Resueltos</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{initialStats.contacts.resolved}</p>
              <p className="text-xs text-gray-500 mt-1">
                {initialStats.contacts.replied} respondidos
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex">
            <button
              onClick={() => {
                setActiveTab('contacts')
                setCurrentPage(1)
              }}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'contacts'
                  ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              <MessageSquare className="inline w-4 h-4 mr-2" />
              Contactos ({initialStats.contacts.total})
            </button>
            <button
              onClick={() => {
                setActiveTab('newsletter')
                setCurrentPage(1)
              }}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'newsletter'
                  ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              <BellRing className="inline w-4 h-4 mr-2" />
              Newsletter ({initialStats.newsletter.total})
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder={activeTab === 'contacts' ? 'Buscar contactos...' : 'Buscar suscriptores...'}
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              {activeTab === 'contacts' && (
                <>
                  <select
                    value={filterStatus}
                    onChange={(e) => {
                      setFilterStatus(e.target.value)
                      setCurrentPage(1)
                    }}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  >
                    <option value="all">Todos</option>
                    <option value="pending">Pendientes</option>
                    <option value="in_progress">En Progreso</option>
                    <option value="replied">Respondidos</option>
                    <option value="resolved">Resueltos</option>
                  </select>
                  
                  <select
                    value={filterPriority}
                    onChange={(e) => {
                      setFilterPriority(e.target.value)
                      setCurrentPage(1)
                    }}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  >
                    <option value="all">Prioridad</option>
                    <option value="urgent">Urgente</option>
                    <option value="high">Alta</option>
                    <option value="normal">Normal</option>
                    <option value="low">Baja</option>
                  </select>

                  <select
                    value={filterType}
                    onChange={(e) => {
                      setFilterType(e.target.value)
                      setCurrentPage(1)
                    }}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  >
                    <option value="all">Tipo</option>
                    <option value="general">General</option>
                    <option value="api">API</option>
                    <option value="bug">Bug</option>
                    <option value="feature">Feature</option>
                  </select>
                </>
              )}

              {activeTab === 'newsletter' && (
                <select
                  value={filterStatus}
                  onChange={(e) => {
                    setFilterStatus(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                >
                  <option value="all">Todos</option>
                  <option value="active">Activos</option>
                  <option value="inactive">Inactivos</option>
                </select>
              )}

              <button
                onClick={() => setShowOnlyRegistered(!showOnlyRegistered)}
                className={`px-4 py-2 border rounded-lg flex items-center gap-2 ${
                  showOnlyRegistered 
                    ? 'bg-blue-600 text-white border-blue-600' 
                    : 'border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                Registrados
              </button>

              <button
                onClick={downloadCSV}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                CSV
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {activeTab === 'contacts' ? (
            paginatedContacts.map((contact) => (
              <div key={contact.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        {contact.userProfile?.imageUrl ? (
                          <Image 
                            src={contact.userProfile.imageUrl} 
                            alt={contact.name}
                            width={32}
                            height={32}
                            className="w-8 h-8 rounded-full"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                            <User className="w-4 h-4 text-gray-500" />
                          </div>
                        )}
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                          {contact.name}
                        </h4>
                      </div>
                      
                      {contact.isRegisteredUser && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded-full">
                          <UserCheck className="w-3 h-3" />
                          Registrado
                        </span>
                      )}
                      
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(contact.priority)}`}>
                        {contact.priority}
                      </span>
                      
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(contact.status)}`}>
                        {contact.status}
                      </span>

                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 rounded-full">
                        {getTypeIcon(contact.contactType)}
                        {contact.contactType}
                      </span>

                      {contact.isSpam && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 rounded-full">
                          <AlertCircle className="w-3 h-3" />
                          Spam
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      {contact.email}
                      {contact.userProfile && (
                        <span className="ml-2 text-xs">
                          • {contact.userProfile.company || 'Sin empresa'} 
                          {contact.userProfile.position && ` - ${contact.userProfile.position}`}
                        </span>
                      )}
                    </p>
                    
                    <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                      {contact.subject}
                    </p>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {contact.message}
                    </p>
                    
                    <div className="flex items-center gap-4 mt-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(contact.createdAt).toLocaleString('es-AR')}
                      </p>
                      {contact.repliedAt && (
                        <p className="text-xs text-green-600 dark:text-green-400">
                          Respondido: {new Date(contact.repliedAt).toLocaleDateString('es-AR')}
                        </p>
                      )}
                    </div>

                    {contact.adminNotes && (
                      <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-xs text-yellow-800 dark:text-yellow-300">
                        <strong>Notas:</strong> {contact.adminNotes}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <button className="p-2 text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-600 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400">
                      <Reply className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-600 hover:text-orange-600 dark:text-gray-400 dark:hover:text-orange-400">
                      <Archive className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            paginatedSubscribers.map((subscriber) => (
              <div key={subscriber.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Mail className="w-5 h-5 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {subscriber.email}
                        </span>
                      </div>
                      
                      {subscriber.isRegisteredUser && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded-full">
                          <UserCheck className="w-3 h-3" />
                          Usuario
                        </span>
                      )}
                      
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${
                        subscriber.isActive 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {subscriber.isActive ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        {subscriber.isActive ? 'Activo' : 'Inactivo'}
                      </span>

                      {subscriber.contactCount > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-full">
                          <MessageSquare className="w-3 h-3" />
                          {subscriber.contactCount} contactos
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-6 mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>
                        Suscrito: {new Date(subscriber.subscribedAt).toLocaleDateString('es-AR')}
                      </span>
                      <span>
                        {subscriber.daysSinceSubscribed} días activo
                      </span>
                      {subscriber.source && (
                        <span>
                          Origen: {subscriber.source}
                        </span>
                      )}
                      {subscriber.unsubscribedAt && (
                        <span className="text-red-600 dark:text-red-400">
                          Desuscrito: {new Date(subscriber.unsubscribedAt).toLocaleDateString('es-AR')}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {subscriber.isActive ? (
                      <button className="px-3 py-1 text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-400 border border-red-300 dark:border-red-600 rounded">
                        Desuscribir
                      </button>
                    ) : (
                      <button className="px-3 py-1 text-xs font-medium text-green-600 hover:text-green-700 dark:text-green-400 border border-green-300 dark:border-green-600 rounded">
                        Reactivar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Paginación */}
        {((activeTab === 'contacts' && filteredContacts.length > itemsPerPage) || 
          (activeTab === 'newsletter' && filteredSubscribers.length > itemsPerPage)) && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {
                Math.min(
                  currentPage * itemsPerPage, 
                  activeTab === 'contacts' ? filteredContacts.length : filteredSubscribers.length
                )
              } de {activeTab === 'contacts' ? filteredContacts.length : filteredSubscribers.length}
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage * itemsPerPage >= (
                  activeTab === 'contacts' ? filteredContacts.length : filteredSubscribers.length
                )}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}