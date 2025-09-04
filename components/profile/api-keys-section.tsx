// /components/profile/api-keys-section.tsx
'use client'

import { useState, useEffect } from 'react'
import { Plus, Copy, Eye, EyeOff, Trash2, CheckCircle, Key } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface ApiKey {
  id: string
  name: string
  key: string
  tier: string
  isActive: boolean
  createdAt: string
  lastUsedAt: string | null
  _count: {
    usage: number
  }
}

interface ApiKeysSectionProps {
  userId: string
  userEmail: string | null
}

export function ApiKeysSection({ userId, userEmail }: ApiKeysSectionProps) {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [showKey, setShowKey] = useState<Record<string, boolean>>({})
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [creatingKey, setCreatingKey] = useState(false)

  useEffect(() => {
    fetchApiKeys()
  }, [])

  const fetchApiKeys = async () => {
    try {
      const response = await fetch('/api/user/api-keys')
      if (response.ok) {
        const data = await response.json()
        setKeys(data)
      }
    } catch (error) {
      console.error('Error fetching API keys:', error)
    } finally {
      setLoading(false)
    }
  }

  const createApiKey = async () => {
    if (!newKeyName.trim()) return

    setCreatingKey(true)
    try {
      const response = await fetch('/api/user/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName })
      })

      if (response.ok) {
        const newKey = await response.json()
        setKeys([newKey, ...keys])
        setIsCreateDialogOpen(false)
        setNewKeyName('')
        
        // Mostrar la key completa por 30 segundos
        setShowKey({ ...showKey, [newKey.id]: true })
        setTimeout(() => {
          setShowKey(prev => ({ ...prev, [newKey.id]: false }))
        }, 30000)
      }
    } catch (error) {
      console.error('Error creating API key:', error)
    } finally {
      setCreatingKey(false)
    }
  }

  const deleteApiKey = async (keyId: string) => {
    if (!confirm('¿Estás seguro de que querés eliminar esta API key?')) return

    try {
      const response = await fetch(`/api/user/api-keys/${keyId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setKeys(keys.filter(k => k.id !== keyId))
      }
    } catch (error) {
      console.error('Error deleting API key:', error)
    }
  }

  const copyToClipboard = async (key: string) => {
    try {
      await navigator.clipboard.writeText(key)
      setCopiedKey(key)
      setTimeout(() => setCopiedKey(null), 2000)
    } catch (error) {
      console.error('Error copying to clipboard:', error)
    }
  }

  const maskApiKey = (key: string) => {
    if (key.length <= 8) return key
    return `${key.slice(0, 8)}...${key.slice(-4)}`
  }

  const getTierBadgeVariant = (tier: string) => {
    switch (tier) {
      case 'pro': return 'default'
      case 'enterprise': return 'secondary'
      default: return 'outline'
    }
  }

  const getTierLimits = (tier: string) => {
    switch (tier) {
      case 'free': return '100 requests/hora'
      case 'basic': return '1,000 requests/hora'
      case 'pro': return '10,000 requests/hora'
      case 'enterprise': return '100,000 requests/hora'
      default: return '100 requests/hora'
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 dark:bg-gray-800">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow dark:bg-gray-800">
        <div className="p-6 border-b dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-semibold">API Keys</h2>
            <Button onClick={() => setIsCreateDialogOpen(true)} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Nueva API Key
            </Button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Gestiona tus credenciales de acceso a la API pública de ArgenStats.
          </p>
        </div>

        {keys.length === 0 ? (
          <div className="p-12 text-center">
            <Key className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              No tenés API keys creadas todavía.
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              Crear tu primera API Key
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>API Key</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Uso</TableHead>
                  <TableHead>Última vez usada</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {keys.map((apiKey) => (
                  <TableRow key={apiKey.id}>
                    <TableCell className="font-medium">{apiKey.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded dark:bg-gray-700">
                          {showKey[apiKey.id] ? apiKey.key : maskApiKey(apiKey.key)}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowKey({
                            ...showKey,
                            [apiKey.id]: !showKey[apiKey.id]
                          })}
                        >
                          {showKey[apiKey.id] ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(apiKey.key)}
                        >
                          {copiedKey === apiKey.key ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge variant={getTierBadgeVariant(apiKey.tier)}>
                          {apiKey.tier}
                        </Badge>
                        <p className="text-xs text-gray-500">
                          {getTierLimits(apiKey.tier)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {apiKey._count.usage.toLocaleString()} requests
                      </span>
                    </TableCell>
                    <TableCell>
                      {apiKey.lastUsedAt ? (
                        <span className="text-sm text-gray-600">
                          {format(new Date(apiKey.lastUsedAt), 'dd MMM yyyy HH:mm', { locale: es })}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">Nunca</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteApiKey(apiKey.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            📚 <a href="/docs/api" className="text-blue-600 hover:underline dark:text-blue-400">
              Ver documentación completa de la API
            </a>
          </p>
        </div>
      </div>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear nueva API Key</DialogTitle>
            <DialogDescription>
              Dale un nombre descriptivo a tu API key para identificarla fácilmente.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Input
              placeholder="Ej: Mi aplicación web"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && createApiKey()}
            />
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
              disabled={creatingKey}
            >
              Cancelar
            </Button>
            <Button
              onClick={createApiKey}
              disabled={!newKeyName.trim() || creatingKey}
            >
              {creatingKey ? 'Creando...' : 'Crear API Key'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}