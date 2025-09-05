// components/profile/tabs/ProfileTab.tsx
'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { 
  Save, 
  Loader2, 
  Link2, 
  MapPin, 
  Building2, 
  Briefcase,
  Github,
  Linkedin,
  Globe,
} from 'lucide-react'
import { XIcon } from '@/components/ui/social-icons'
import { toast } from 'sonner'

interface UserProfileData {
  name: string
  bio: string
  location: string
  company: string
  position: string
  linkedinUrl: string
  xUsername: string
  githubUrl: string
  websiteUrl: string
}

export default function ProfileTab() {
  const { user } = useUser()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<UserProfileData>({
    name: '',
    bio: '',
    location: '',
    company: '',
    position: '',
    linkedinUrl: '',
    xUsername: '',
    githubUrl: '',
    websiteUrl: ''
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/user/profile')
      if (response.ok) {
        const data = await response.json()
        setProfile({
          name: data.name || user?.fullName || '',
          bio: data.bio || '',
          location: data.location || '',
          company: data.company || '',
          position: data.position || '',
          linkedinUrl: data.linkedinUrl || '',
          xUsername: data.xUsername || '',
          githubUrl: data.githubUrl || '',
          websiteUrl: data.websiteUrl || ''
        })
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      })

      if (response.ok) {
        toast.success('Perfil actualizado correctamente')
      } else {
        throw new Error('Error al actualizar el perfil')
      }
    } catch (error) {
      toast.error('Error al guardar los cambios')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field: keyof UserProfileData, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
          Información Personal
        </h2>
        
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nombre completo
            </label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="mt-1 block w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 dark:bg-gray-700 dark:text-white transition-colors duration-200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              value={user?.primaryEmailAddress?.emailAddress || ''}
              disabled
              className="mt-1 block w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm bg-gray-100 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 cursor-not-allowed"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Bio
            </label>
            <textarea
              rows={3}
              value={profile.bio}
              onChange={(e) => handleChange('bio', e.target.value)}
              placeholder="Contanos un poco sobre vos..."
              className="mt-1 block w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 dark:bg-gray-700 dark:text-white transition-colors duration-200 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <MapPin className="inline w-4 h-4 mr-1" />
              Ubicación
            </label>
            <input
              type="text"
              value={profile.location}
              onChange={(e) => handleChange('location', e.target.value)}
              placeholder="Buenos Aires, Argentina"
              className="mt-1 block w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 dark:bg-gray-700 dark:text-white transition-colors duration-200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Building2 className="inline w-4 h-4 mr-1" />
              Empresa
            </label>
            <input
              type="text"
              value={profile.company}
              onChange={(e) => handleChange('company', e.target.value)}
              placeholder="Tu empresa"
              className="mt-1 block w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 dark:bg-gray-700 dark:text-white transition-colors duration-200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Briefcase className="inline w-4 h-4 mr-1" />
              Cargo
            </label>
            <input
              type="text"
              value={profile.position}
              onChange={(e) => handleChange('position', e.target.value)}
              placeholder="Tu cargo o rol"
              className="mt-1 block w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 dark:bg-gray-700 dark:text-white transition-colors duration-200"
            />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
          Redes Sociales
        </h2>
        
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Linkedin className="inline w-4 h-4 mr-1" />
              LinkedIn
            </label>
            <input
              type="url"
              value={profile.linkedinUrl}
              onChange={(e) => handleChange('linkedinUrl', e.target.value)}
              placeholder="https://linkedin.com/in/tu-perfil"
              className="mt-1 block w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 dark:bg-gray-700 dark:text-white transition-colors duration-200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <XIcon className="inline w-4 h-4 mr-1" />
              (Twitter)
            </label>
            <div className="mt-1 relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 dark:text-gray-400">
                @
              </span>
              <input
                type="text"
                value={profile.xUsername}
                onChange={(e) => handleChange('xUsername', e.target.value.replace('@', ''))}
                placeholder="usuario"
                className="pl-8 block w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 dark:bg-gray-700 dark:text-white transition-colors duration-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Github className="inline w-4 h-4 mr-1" />
              GitHub
            </label>
            <input
              type="url"
              value={profile.githubUrl}
              onChange={(e) => handleChange('githubUrl', e.target.value)}
              placeholder="https://github.com/usuario"
              className="mt-1 block w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 dark:bg-gray-700 dark:text-white transition-colors duration-200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Globe className="inline w-4 h-4 mr-1" />
              Sitio Web
            </label>
            <input
              type="url"
              value={profile.websiteUrl}
              onChange={(e) => handleChange('websiteUrl', e.target.value)}
              placeholder="https://tu-sitio.com"
              className="mt-1 block w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 dark:bg-gray-700 dark:text-white transition-colors duration-200"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-md"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  )
}