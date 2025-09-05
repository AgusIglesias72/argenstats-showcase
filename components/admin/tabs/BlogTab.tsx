'use client'

import { useState } from 'react'
import { 
  FileText, 
  Plus, 
  Edit, 
  Eye,
  Trash2,
  Calendar,
  User,
  Search,
  Filter,
  Globe,
  Lock
} from 'lucide-react'

// Datos de ejemplo - en el futuro vendrán de la API
const mockPosts = [
  {
    id: '1',
    title: 'Cómo usar la API de Inflación de ArgenStats',
    excerpt: 'Guía completa para integrar datos de inflación en tus aplicaciones...',
    author: 'Admin',
    status: 'published',
    publishedAt: '2024-01-15T10:00:00Z',
    views: 1250,
    category: 'Tutoriales'
  },
  {
    id: '2',
    title: 'Nuevas funcionalidades en la API v1.2',
    excerpt: 'Descubre las últimas mejoras y endpoints disponibles...',
    author: 'Admin',
    status: 'published',
    publishedAt: '2024-01-10T14:30:00Z',
    views: 890,
    category: 'Actualizaciones'
  },
  {
    id: '3',
    title: 'Análisis de la inflación en Argentina 2023',
    excerpt: 'Un análisis detallado de los datos de inflación del año pasado...',
    author: 'Admin',
    status: 'draft',
    publishedAt: null,
    views: 0,
    category: 'Análisis'
  }
]

const blogStats = {
  total: 15,
  published: 12,
  drafts: 3,
  totalViews: 15600
}

export default function BlogTab() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')

  const filteredPosts = mockPosts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || post.status === filterStatus
    const matchesCategory = filterCategory === 'all' || post.category === filterCategory
    return matchesSearch && matchesStatus && matchesCategory
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
      case 'archived':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  return (
    <div className="space-y-6">
      {/* Coming Soon Banner */}
      <div className="bg-gradient-to-r from-green-500 to-blue-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Gestión de Blog</h2>
            <p className="text-green-100">
              Próximamente podrás crear y gestionar entradas de blog desde aquí.
            </p>
          </div>
          <FileText className="w-16 h-16 text-green-200" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Posts</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{blogStats.total}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Publicados</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{blogStats.published}</p>
            </div>
            <Globe className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Borradores</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{blogStats.drafts}</p>
            </div>
            <Lock className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Vistas</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{blogStats.totalViews.toLocaleString()}</p>
            </div>
            <Eye className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Filters and Create Button */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="all">Todos los estados</option>
              <option value="published">Publicados</option>
              <option value="draft">Borradores</option>
              <option value="archived">Archivados</option>
            </select>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="all">Todas las categorías</option>
              <option value="Tutoriales">Tutoriales</option>
              <option value="Actualizaciones">Actualizaciones</option>
              <option value="Análisis">Análisis</option>
            </select>
            <button 
              disabled
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 opacity-50 cursor-not-allowed"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Post (Próximamente)
            </button>
          </div>
        </div>
      </div>

      {/* Posts List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Posts del Blog</h3>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {filteredPosts.map((post) => (
            <div key={post.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                      {post.title}
                    </h4>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(post.status)}`}>
                      {post.status === 'published' ? 'Publicado' : post.status === 'draft' ? 'Borrador' : 'Archivado'}
                    </span>
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                      {post.category}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {post.author}
                    </div>
                    {post.publishedAt && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(post.publishedAt).toLocaleDateString('es-AR')}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {post.views.toLocaleString()} vistas
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-xs font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                    <Eye className="w-3 h-3 mr-1" />
                    Ver
                  </button>
                  <button 
                    disabled
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-xs font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 opacity-50 cursor-not-allowed"
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Editar
                  </button>
                  <button 
                    disabled
                    className="inline-flex items-center px-3 py-1.5 border border-red-300 dark:border-red-600 rounded-md text-xs font-medium text-red-700 dark:text-red-200 bg-white dark:bg-gray-700 opacity-50 cursor-not-allowed"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Future Features Preview */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Funcionalidades Futuras
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Editor WYSIWYG</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Editor visual completo con soporte para markdown, imágenes y código.
            </p>
          </div>
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">SEO Optimizado</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Herramientas integradas para optimización SEO y meta tags.
            </p>
          </div>
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Programación de Posts</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Programa la publicación de posts para fechas específicas.
            </p>
          </div>
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Analytics de Contenido</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Métricas detalladas sobre rendimiento y engagement de cada post.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
