'use client'

import React, { useState, useEffect } from 'react';
import { 
  ChevronRight, 
  ChevronDown, 
  Copy, 
  Check, 
  ExternalLink, 
  AlertCircle, 
  Clock, 
  Shield, 
  Database, 
  Code2, 
  Zap,
  BookOpen,
  Terminal,
  Key,
  Globe,
  TrendingUp,
  DollarSign,
  Activity,
  BarChart3,
  Users,
  Briefcase,
  FileText,
  Menu,
  X,
  RefreshCw,
  Info,
  Percent,
  Rocket,
  CheckCircle,
  ArrowRight,
  Settings,
  CreditCard,
  HelpCircle,
  FileCode,
  GitBranch,
  Package,
  Server
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Header } from '@/components/layout/header';

const ApiDocumentationClient = () => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [selectedApi, setSelectedApi] = useState('getting-started');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('getting-started');

  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll('[data-section]');
      const scrollPosition = window.scrollY + 100;

      sections.forEach((section) => {
        const sectionTop = (section as HTMLElement).offsetTop;
        const sectionHeight = section.clientHeight;
        const sectionId = section.getAttribute('data-section');
        
        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight && sectionId) {
          setActiveSection(sectionId);
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const scrollToSection = (sectionId: string) => {
    setSelectedApi(sectionId);
    setSidebarOpen(false);
    const element = document.querySelector(`[data-section="${sectionId}"]`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const navigationSections = {
    'getting-started': {
      name: 'Comenzar',
      icon: <Rocket className="w-5 h-5" />,
      subsections: ['intro', 'quickstart', 'api-key', 'first-request']
    },
    'authentication': {
      name: 'Autenticación',
      icon: <Key className="w-5 h-5" />,
      subsections: ['how-it-works', 'security', 'key-management']
    },
    'apis': {
      name: 'Referencias API',
      icon: <Code2 className="w-5 h-5" />,
      subsections: ['dollar', 'inflation', 'cer', 'economic-activity', 'poverty', 'labor']
    },
    'guides': {
      name: 'Guías',
      icon: <BookOpen className="w-5 h-5" />,
      subsections: ['best-practices', 'rate-limits', 'errors', 'webhooks']
    },
    'support': {
      name: 'Soporte',
      icon: <HelpCircle className="w-5 h-5" />,
      subsections: ['faq', 'contact', 'changelog']
    }
  };

  const apis = {
    dollar: {
      name: 'Tipos de Cambio',
      path: '/api/v1/dollar',
      description: 'Obtén cotizaciones en tiempo real de todos los tipos de dólar en Argentina.',
      icon: <DollarSign className="w-5 h-5" />,
      color: 'green',
      views: [
        {
          name: 'current',
          description: 'Cotizaciones actuales de todos los tipos de dólar',
          method: 'GET',
          example: 'GET /api/v1/dollar?view=current',
          response: `{
  "success": true,
  "data": {
    "OFICIAL": { 
      "buy": 1012.50, 
      "sell": 1052.50, 
      "date": "2024-01-20T15:00:00Z" 
    },
    "BLUE": { 
      "buy": 1215.00, 
      "sell": 1235.00, 
      "date": "2024-01-20T15:00:00Z" 
    },
    "MEP": { 
      "buy": 1189.45, 
      "sell": 1201.23, 
      "date": "2024-01-20T15:00:00Z" 
    }
  },
  "metadata": {
    "timestamp": "2024-01-20T15:00:00Z",
    "source": "BCRA"
  }
}`
        },
        {
          name: 'historical',
          description: 'Serie histórica de cotizaciones',
          method: 'GET',
          example: 'GET /api/v1/dollar?view=historical&type=BLUE&from=2024-01-01&to=2024-01-31',
          parameters: [
            { name: 'type', required: true, type: 'string', description: 'Tipo de dólar (OFICIAL, BLUE, MEP, CCL, TARJETA, MAYORISTA, CRIPTO)' },
            { name: 'from', required: true, type: 'date', description: 'Fecha inicio (YYYY-MM-DD)' },
            { name: 'to', required: true, type: 'date', description: 'Fecha fin (YYYY-MM-DD)' },
            { name: 'interval', required: false, type: 'string', description: 'Intervalo de agrupación (daily, weekly, monthly)' }
          ]
        },
        {
          name: 'calculator',
          description: 'Calculadora de conversión entre monedas',
          method: 'GET',
          example: 'GET /api/v1/dollar?view=calculator&amount=100&from=USD&to=ARS&type=BLUE',
          parameters: [
            { name: 'amount', required: true, type: 'number', description: 'Monto a convertir' },
            { name: 'from', required: true, type: 'string', description: 'Moneda origen (USD, ARS)' },
            { name: 'to', required: true, type: 'string', description: 'Moneda destino (USD, ARS)' },
            { name: 'type', required: false, type: 'string', description: 'Tipo de cambio (default: BLUE)' }
          ]
        }
      ]
    },
    inflation: {
      name: 'Inflación (IPC)',
      path: '/api/v1/inflation',
      description: 'Accede a datos detallados del Índice de Precios al Consumidor y sus componentes.',
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'red',
      views: [
        {
          name: 'current',
          description: 'Últimos datos de inflación disponibles',
          method: 'GET',
          example: 'GET /api/v1/inflation?view=current'
        },
        {
          name: 'historical',
          description: 'Serie histórica del IPC',
          method: 'GET',
          example: 'GET /api/v1/inflation?view=historical&from=2023-01-01&to=2024-01-01',
          parameters: [
            { name: 'from', required: true, type: 'date', description: 'Fecha inicio' },
            { name: 'to', required: true, type: 'date', description: 'Fecha fin' },
            { name: 'component', required: false, type: 'string', description: 'Componente del IPC' },
            { name: 'region', required: false, type: 'string', description: 'Región geográfica' }
          ]
        },
        {
          name: 'components',
          description: 'Desglose por componentes del IPC',
          method: 'GET',
          example: 'GET /api/v1/inflation?view=components&date=2024-01'
        }
      ]
    },
    cer: {
      name: 'CER',
      path: '/api/v1/cer',
      description: 'Coeficiente de Estabilización de Referencia para ajustes por inflación.',
      icon: <Percent className="w-5 h-5" />,
      color: 'purple'
    },
    economicActivity: {
      name: 'EMAE',
      path: '/api/v1/economic-activity',
      description: 'Estimador Mensual de Actividad Económica por sectores.',
      icon: <Activity className="w-5 h-5" />,
      color: 'indigo'
    },
    poverty: {
      name: 'Pobreza e Indigencia',
      path: '/api/v1/poverty',
      description: 'Estadísticas de pobreza e indigencia por región y período.',
      icon: <Users className="w-5 h-5" />,
      color: 'orange'
    },
    labor: {
      name: 'Mercado Laboral',
      path: '/api/v1/labor',
      description: 'Tasas de empleo, desempleo y actividad por demografía.',
      icon: <Briefcase className="w-5 h-5" />,
      color: 'teal'
    }
  };

  const CodeBlock = ({ code, language = 'bash', id }: { code: string; language?: string; id: string }) => (
    <div className="relative group">
      <div className="absolute top-3 right-3 flex items-center gap-2">
        <Badge variant="secondary" className="text-xs">
          {language}
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => copyToClipboard(code, id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {copiedCode === id ? (
            <Check className="w-4 h-4 text-green-400" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </Button>
      </div>
      <pre className="bg-gray-900 dark:bg-gray-950 text-gray-100 p-6 rounded-lg overflow-x-auto text-sm font-mono border border-gray-800">
        <code>{code}</code>
      </pre>
    </div>
  );

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
        {/* Mobile Sidebar Toggle */}
        <Button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="fixed bottom-4 right-4 z-50 lg:hidden rounded-full shadow-lg"
          size="icon"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`
          fixed lg:sticky top-16 left-0 z-40 h-[calc(100vh-4rem)] w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 overflow-y-auto transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-8">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl">
                <Code2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  ArgenStats API
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">Version 1.0</p>
              </div>
            </div>
            
            <nav className="space-y-6">
              {Object.entries(navigationSections).map(([key, section]) => (
                <div key={key}>
                  <button
                    onClick={() => scrollToSection(key)}
                    className={`
                      w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all text-left cursor-pointer
                      ${activeSection === key 
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium' 
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }
                    `}
                  >
                    {section.icon}
                    <span>{section.name}</span>
                  </button>
                  {section.subsections && activeSection === key && (
                    <div className="ml-8 mt-2 space-y-1">
                      {section.subsections.map(sub => (
                        <a
                          key={sub}
                          href={`#${sub}`}
                          className="block py-1 px-3 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                        >
                          {sub.charAt(0).toUpperCase() + sub.slice(1).replace('-', ' ')}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>

            <div className="mt-8 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                ¿Necesitás ayuda?
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                Contactanos para soporte técnico
              </p>
              <Button size="sm" className="w-full cursor-pointer">
                <HelpCircle className="w-4 h-4 mr-2" />
                Contactar Soporte
              </Button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            
            {/* Hero Section */}
            <div className="mb-12 text-center">
              <Badge variant="secondary" className="mb-4">
                <Zap className="w-3 h-3 mr-1" />
                ArgenStats API v1.0 - Documentación Oficial
              </Badge>
              <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
                API de Datos Económicos Argentina
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                Accedé a datos económicos de Argentina en tiempo real. Simple, rápido y confiable.
              </p>

            </div>

            {/* Getting Started Section */}
            <div data-section="getting-started" className="mb-16 scroll-mt-20">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Comenzar
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Configurá tu acceso a la API en 3 simples pasos
                </p>
              </div>

              {/* Quick Start Steps */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <span className="text-lg font-bold text-blue-600 dark:text-blue-400">1</span>
                      </div>
                      <CardTitle className="text-lg">Registrate</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Creá tu cuenta gratuita en menos de 1 minuto
                    </p>
                    <Button className="w-full mt-4 cursor-pointer" variant="outline">
                      Registrarse
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <span className="text-lg font-bold text-blue-600 dark:text-blue-400">2</span>
                      </div>
                      <CardTitle className="text-lg">Obtené tu API Key</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Generá tu clave de acceso desde tu perfil
                    </p>
                    <Button className="w-full mt-4 cursor-pointer" variant="outline">
                      Ver Perfil
                      <Settings className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <span className="text-lg font-bold text-blue-600 dark:text-blue-400">3</span>
                      </div>
                      <CardTitle className="text-lg">Hacé tu primer request</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Comenzá a consumir datos al instante
                    </p>
                    <Button className="w-full mt-4 cursor-pointer" variant="outline">
                      Ver Ejemplos
                      <Code2 className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Base URL Info */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    Base URL
                  </CardTitle>
                  <CardDescription>
                    Todas las requests a la API deben usar esta URL base
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-900 dark:bg-gray-950 text-gray-100 p-4 rounded-lg font-mono">
                    https://argenstats.com.ar/api/v1
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Authentication Section */}
            <div data-section="authentication" className="mb-16 scroll-mt-20">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Autenticación
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Cómo autenticar tus requests y gestionar tus API keys
                </p>
              </div>

              {/* How to Get API Key */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Key className="w-5 h-5" />
                    Cómo obtener tu API Key
                  </CardTitle>
                  <CardDescription>
                    Seguí estos pasos para generar tu clave de acceso
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                          1. Ingresá a tu Perfil
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Iniciá sesión en tu cuenta y dirigite a la sección "API Keys" en tu perfil.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                          2. Creá una nueva API Key
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Hacé click en "Generar Nueva Key" y asignale un nombre descriptivo.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                          3. Copiá y guardá tu key
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Tu API key se mostrará una sola vez. Copiala y guardala en un lugar seguro.
                        </p>
                      </div>
                    </div>
                  </div>

                  <Alert className="mt-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Importante</AlertTitle>
                    <AlertDescription>
                      Nunca compartas tu API key públicamente ni la incluyas en repositorios de código.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              {/* Using API Key */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="text-xl">Usando tu API Key</CardTitle>
                  <CardDescription>
                    Incluí tu API key en el header de todas tus requests
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="curl" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="curl">cURL</TabsTrigger>
                      <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                      <TabsTrigger value="python">Python</TabsTrigger>
                      <TabsTrigger value="php">PHP</TabsTrigger>
                    </TabsList>
                    <TabsContent value="curl" className="mt-4">
                      <CodeBlock 
                        code={`curl -X GET \\
  'https://argenstats.com.ar/api/v1/dollar?view=current' \\
  -H 'x-api-key: YOUR_API_KEY'`}
                        language="bash"
                        id="auth-curl"
                      />
                    </TabsContent>
                    <TabsContent value="javascript" className="mt-4">
                      <CodeBlock 
                        code={`const response = await fetch('https://argenstats.com.ar/api/v1/dollar?view=current', {
  headers: {
    'x-api-key': 'YOUR_API_KEY'
  }
});

const data = await response.json();`}
                        language="javascript"
                        id="auth-js"
                      />
                    </TabsContent>
                    <TabsContent value="python" className="mt-4">
                      <CodeBlock 
                        code={`import requests

response = requests.get(
    'https://argenstats.com.ar/api/v1/dollar?view=current',
    headers={'x-api-key': 'YOUR_API_KEY'}
)

data = response.json()`}
                        language="python"
                        id="auth-python"
                      />
                    </TabsContent>
                    <TabsContent value="php" className="mt-4">
                      <CodeBlock 
                        code={`$curl = curl_init();

curl_setopt_array($curl, [
  CURLOPT_URL => 'https://argenstats.com.ar/api/v1/dollar?view=current',
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_HTTPHEADER => [
    'x-api-key: YOUR_API_KEY'
  ],
]);

$response = curl_exec($curl);
$data = json_decode($response, true);`}
                        language="php"
                        id="auth-php"
                      />
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>

            {/* API References Section */}
            <div data-section="apis" className="mb-16 scroll-mt-20">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Referencias API
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Documentación detallada de todos los endpoints disponibles
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {Object.entries(apis).map(([key, api]) => (
                  <Card key={key} className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <div className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg">
                          {React.cloneElement(api.icon, { className: "w-4 h-4 text-white" })}
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-base">{api.name}</CardTitle>
                          <Badge variant="outline" className="mt-1 text-xs">
                            {api.path}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                        {api.description}
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="w-full cursor-pointer"
                        onClick={() => scrollToSection(`api-${key}`)}
                      >
                        Ver Docs
                        <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Detailed API Documentation */}
              {Object.entries(apis).filter(([_, api]) => 'views' in api && api.views).map(([key, api]) => (
                <div key={key} id={`api-${key}`} className="mb-12">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl">
                          {React.cloneElement(api.icon, { className: "w-6 h-6 text-white" })}
                        </div>
                        <div>
                          <CardTitle className="text-2xl">{api.name}</CardTitle>
                          <CardDescription className="text-base">{api.description}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {('views' in api && api.views) ? api.views.map((view: any, index: number) => (
                          <div 
                            key={index} 
                            className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden"
                          >
                            <button
                              onClick={() => toggleSection(`${key}-${view.name}`)}
                              className="w-full px-6 py-4 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center justify-between"
                            >
                              <div className="flex items-center gap-3">
                                <Badge variant={view.method === 'POST' ? 'destructive' : 'default'}>
                                  {view.method || 'GET'}
                                </Badge>
                                <div className="text-left">
                                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                                    {view.name}
                                  </p>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {view.description}
                                  </p>
                                </div>
                              </div>
                              {expandedSections[`${key}-${view.name}`] ? (
                                <ChevronDown className="w-5 h-5 text-gray-400" />
                              ) : (
                                <ChevronRight className="w-5 h-5 text-gray-400" />
                              )}
                            </button>

                            {expandedSections[`${key}-${view.name}`] && (
                              <div className="p-6 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 space-y-6">
                                <div>
                                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                    Endpoint
                                  </h4>
                                  <CodeBlock 
                                    code={view.example}
                                    id={`${key}-${view.name}-endpoint`}
                                  />
                                </div>

                                {view.parameters && (
                                  <div>
                                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                      Parámetros
                                    </h4>
                                    <div className="space-y-3">
                                      {view.parameters.map((param: any, idx: number) => (
                                        <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                          <div className="flex gap-2 flex-shrink-0">
                                            <Badge variant={param.required ? "destructive" : "secondary"} className="text-xs">
                                              {param.required ? 'Requerido' : 'Opcional'}
                                            </Badge>
                                            <Badge variant="outline" className="text-xs">
                                              {param.type}
                                            </Badge>
                                          </div>
                                          <div className="flex-1">
                                            <p className="font-mono text-sm text-blue-600 dark:text-blue-400">
                                              {param.name}
                                            </p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                              {param.description}
                                            </p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {view.response && (
                                  <div>
                                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                      Ejemplo de Respuesta
                                    </h4>
                                    <CodeBlock 
                                      code={view.response}
                                      language="json"
                                      id={`${key}-${view.name}-response`}
                                    />
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )) : null}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>

            {/* Guides Section */}
            <div data-section="guides" className="mb-16 scroll-mt-20">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Guías y Mejores Prácticas
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Todo lo que necesitás saber para usar la API eficientemente
                </p>
              </div>

              {/* Rate Limits */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Rate Limits
                  </CardTitle>
                  <CardDescription>
                    Límites de requests según tu plan
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center mb-6">
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Contamos con diferentes planes adaptados a tus necesidades. 
                      Contactanos para conocer más detalles sobre nuestros servicios.
                    </p>
                    <Button className="cursor-pointer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Contactar para más información
                    </Button>
                  </div>

                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Headers de Límite de Velocidad</AlertTitle>
                    <AlertDescription>
                      Cada respuesta incluye headers que indican tu límite actual:
                      <ul className="mt-2 space-y-1 text-sm">
                        <li><code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">X-RateLimit-Limit</code> - Tu límite total</li>
                        <li><code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">X-RateLimit-Remaining</code> - Solicitudes restantes</li>
                        <li><code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">X-RateLimit-Reset</code> - Tiempo hasta reinicio</li>
                      </ul>
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              {/* Error Handling */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Manejo de Errores
                  </CardTitle>
                  <CardDescription>
                    Cómo manejar respuestas de error de la API
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        Formato de Error Estándar
                      </h4>
                      <CodeBlock 
                        code={`{
  "success": false,
  "error": {
    "code": "INVALID_API_KEY",
    "message": "The provided API key is invalid",
    "details": {
      "provided_key": "partial_xxx..."
    }
  }
}`}
                        language="json"
                        id="error-format"
                      />
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                        Códigos de Estado HTTP
                      </h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <Badge className="bg-green-600">200</Badge>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">OK</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Solicitud exitosa</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                          <Badge className="bg-yellow-600">400</Badge>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">Solicitud Incorrecta</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Parámetros inválidos o faltantes</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                          <Badge className="bg-red-600">401</Badge>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">No Autorizado</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">API key inválida o faltante</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                          <Badge className="bg-orange-600">429</Badge>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">Demasiadas Solicitudes</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Límite de velocidad excedido</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                          <Badge className="bg-purple-600">500</Badge>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">Error del Servidor</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Error interno del servidor</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>


            {/* Support Section */}
            <div data-section="support" className="mb-16 scroll-mt-20">
              <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0">
                <CardHeader>
                  <CardTitle className="text-3xl text-white">¿Necesitás ayuda?</CardTitle>
                  <CardDescription className="text-blue-100 text-lg">
                    Nuestro equipo está disponible para ayudarte con cualquier pregunta sobre la API
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                      <Terminal className="w-8 h-8 text-white mb-2" />
                      <h4 className="font-semibold text-white mb-1">Soporte Técnico</h4>
                      <p className="text-sm text-blue-100">
                        Ayuda con integraciones y problemas técnicos
                      </p>
                    </div>
                    <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                      <FileText className="w-8 h-8 text-white mb-2" />
                      <h4 className="font-semibold text-white mb-1">Documentación</h4>
                      <p className="text-sm text-blue-100">
                        Guías detalladas y ejemplos de código
                      </p>
                    </div>
                    <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                      <Users className="w-8 h-8 text-white mb-2" />
                      <h4 className="font-semibold text-white mb-1">Comunidad</h4>
                      <p className="text-sm text-blue-100">
                        Conectá con otros desarrolladores
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button 
                      size="lg"
                      variant="secondary"
                      className="bg-white text-blue-600 hover:bg-blue-50 cursor-pointer"
                    >
                      <HelpCircle className="w-5 h-5 mr-2" />
                      Centro de Ayuda
                    </Button>
                    <Button 
                      size="lg"
                      variant="outline"
                      className="bg-transparent border-white/30 text-white hover:bg-white/10 cursor-pointer"
                    >
                      <ExternalLink className="w-5 h-5 mr-2" />
                      Contactar por Email
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

          </div>
        </main>
      </div>
      </div>
    </>
  );
};

export default ApiDocumentationClient;