'use client'

import { useSignIn } from '@clerk/nextjs'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { GoogleIcon, XIcon } from '@/components/ui/social-icons'

export default function SignInPage() {
    const { isLoaded, signIn, setActive } = useSignIn()
    const [emailAddress, setEmailAddress] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!isLoaded) return

        setLoading(true)
        setError('')

        try {
            const result = await signIn.create({
                identifier: emailAddress,
                password,
            })

            if (result.status === 'complete') {
                await setActive({ session: result.createdSessionId })
                router.push('/')
            }
        } catch (err: any) {
            console.error(err)
            setError('Email o contraseña incorrectos')
        } finally {
            setLoading(false)
        }
    }

    const signInWithGoogle = () => {
        signIn?.authenticateWithRedirect({
            strategy: 'oauth_google',
            redirectUrl: '/sso-callback',
            redirectUrlComplete: '/',
        })
    }

    const signInWithX = () => {
        signIn?.authenticateWithRedirect({
            strategy: 'oauth_x',
            redirectUrl: '/sso-callback',
            redirectUrlComplete: '/',
        })
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
                            Bienvenido de nuevo
                        </h2>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            Ingresa tus datos para continuar
                        </p>
                    </div>

                    {/* Social Login */}
                    <div className="space-y-3">
                        <button
                            onClick={signInWithGoogle}
                            className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                        >
                            <GoogleIcon className="w-5 h-5 mr-3" />
                            Continuar con Google
                        </button>

                        <button
                            onClick={signInWithX}
                            className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                        >
                            <XIcon className="w-5 h-5 mr-3" />
                            Continuar con X
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
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Email
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={emailAddress}
                                    onChange={(e) => setEmailAddress(e.target.value)}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                                    placeholder="tu@email.com"
                                />
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Contraseña
                                </label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="text-red-600 text-sm text-center">{error}</div>
                        )}

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
                            </button>
                        </div>

                        <div className="flex items-center justify-between">
                            <Link href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400">
                                ¿Olvidaste tu contraseña?
                            </Link>
                        </div>
                    </form>

                    <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                        ¿No tienes cuenta?{' '}
                        <Link href="/sign-up" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400">
                            Regístrate gratis
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