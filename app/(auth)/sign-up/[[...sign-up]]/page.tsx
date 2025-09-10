'use client'

import { useSignUp } from '@clerk/nextjs'
import { useState, useEffect } from 'react'
import { useHydrationFix } from '@/lib/hooks/useHydrationFix'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { GoogleIcon, XIcon } from '@/components/ui/social-icons'

export default function SignUpPage() {
  const { isLoaded, signUp, setActive } = useSignUp()
  const [emailAddress, setEmailAddress] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [pendingVerification, setPendingVerification] = useState(false)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [fromSignIn, setFromSignIn] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Handle hydration mismatch caused by browser extensions
  useHydrationFix()

  // Prellenar email si viene desde sign-in o OAuth
  useEffect(() => {
    const email = searchParams.get('email')
    const fromSignInParam = searchParams.get('fromSignIn')
    const fromOAuth = searchParams.get('fromOAuth')
    
    if (email) {
      setEmailAddress(email)
    }
    
    if (fromSignInParam === 'true' || fromOAuth === 'true') {
      setFromSignIn(true)
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoaded) return

    setLoading(true)
    setError('')

    try {
      await signUp.create({
        emailAddress,
        password,
        firstName,
        lastName,
      })

      // Send email verification
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
      setPendingVerification(true)
    } catch (err: any) {
      console.error(err)
      setError(err.errors?.[0]?.message || 'Error al crear la cuenta')
    } finally {
      setLoading(false)
    }
  }

  const onPressVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoaded) return

    setLoading(true)
    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      })

      if (completeSignUp.status === 'complete') {
        await setActive({ session: completeSignUp.createdSessionId })
        router.push('/profile')
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || 'Código inválido')
    } finally {
      setLoading(false)
    }
  }

  const signUpWithGoogle = () => {
    signUp?.authenticateWithRedirect({
      strategy: 'oauth_google',
      redirectUrl: '/sso-callback',
      redirectUrlComplete: '/',
    })
  }

  const signUpWithX = () => {
    signUp?.authenticateWithRedirect({
      strategy: 'oauth_x',
      redirectUrl: '/sso-callback',
      redirectUrlComplete: '/',
    })
  }

  if (pendingVerification) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <div className="w-full max-w-md space-y-8 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
          <div className="text-center">
            <h1 className="font-righteous text-3xl text-blue-600 dark:text-blue-400">
              ArgenStats
            </h1>
            <h2 className="mt-6 text-2xl font-bold text-gray-900 dark:text-white">
              Verifica tu email
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Enviamos un código a {emailAddress}
            </p>
          </div>

          <form onSubmit={onPressVerify} className="space-y-6">
            <div>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Ingresa el código de verificación"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
              />
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Verificando...' : 'Verificar email'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2 bg-gray-50 dark:bg-gray-900">
      {/* Form Side */}
      <div className="min-h-screen flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <div className="text-center">
            <Link href="/">
              <h1 className="font-righteous text-4xl text-blue-600 dark:text-blue-400 mb-2">
                ArgenStats
              </h1>
            </Link>
            <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
              {fromSignIn ? 'Crea tu cuenta para continuar' : 'Crea tu cuenta gratis'}
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {fromSignIn 
                ? 'Parece que no tienes una cuenta aún. ¡Regístrate gratis!'
                : 'Sin tarjeta de crédito, para siempre'
              }
            </p>
            
            {fromSignIn && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  💡 <strong>Tip:</strong> Tu email ya está prellenado. Solo completa los demás campos.
                </p>
              </div>
            )}
          </div>

          {/* Social Login */}
          <div className="space-y-3">
            <button
              onClick={signUpWithGoogle}
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <GoogleIcon className="w-5 h-5 mr-3" />
              Registrarse con Google
            </button>

            <button
              onClick={signUpWithX}
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <XIcon className="w-5 h-5 mr-3" />
              Registrarse con X
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-900 text-gray-500">o</span>
            </div>
          </div>

          {/* Email Form */}
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Nombre
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Apellido
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-white"
                  placeholder="tu@email.com"
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Contraseña
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-white"
                  placeholder="Mínimo 8 caracteres"
                />
              </div>
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            {fromSignIn ? '¿Recordaste tu contraseña?' : '¿Ya tienes cuenta?'}{' '}
            <Link href="/sign-in" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400">
              {fromSignIn ? 'Intenta de nuevo' : 'Inicia sesión'}
            </Link>
          </p>
        </div>
      </div>

    {/* Illustration Side - Desktop Only */}
    <div className="hidden lg:flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-700 relative overflow-hidden">
                <div className="absolute inset-0">
                    <div className="absolute top-0 -right-20 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
                    <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
                </div>

                <div className="relative z-10 text-white text-center px-12">
                    <h2 className="text-4xl font-bold mb-6">
                        Análisis económico
                        <br />
                        en tiempo real
                    </h2>
                    <p className="text-xl text-blue-100 mb-8">
                        Datos oficiales del INDEC actualizados constantemente
                    </p>

                    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 space-y-4">
                        <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            <span className="text-sm">Más de 50 indicadores económicos</span>
                        </div>
                        <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            <span className="text-sm">API RESTful completa</span>
                        </div>
                        <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            <span className="text-sm">Visualizaciones interactivas</span>
                        </div>
                    </div>
                </div>
            </div>
    </div>
  )
}