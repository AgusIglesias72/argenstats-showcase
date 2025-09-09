import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://argenstats.com'
  const currentDate = new Date().toISOString()

  // Páginas principales que existen
  const mainPages = [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/indicadores`,
      lastModified: currentDate,
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/documentacion`,
      lastModified: currentDate,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contacto`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/profile`,
      lastModified: currentDate,
      changeFrequency: 'weekly' as const,
      priority: 0.4,
    },
  ]

  // Indicadores económicos que realmente existen
  const indicators = [
    { path: 'inflacion', freq: 'daily' as const, priority: 0.9 },
    { path: 'riesgo-pais', freq: 'daily' as const, priority: 0.8 },
    { path: 'empleo', freq: 'monthly' as const, priority: 0.8 },
    { path: 'construccion', freq: 'monthly' as const, priority: 0.7 },
  ]

  const indicatorPages = indicators.map(indicator => ({
    url: `${baseUrl}/indicadores/${indicator.path}`,
    lastModified: currentDate,
    changeFrequency: indicator.freq,
    priority: indicator.priority,
  }))

  // Herramientas y conversores que existen
  const tools = [
    { path: 'conversor-dolar-peso-argentino', freq: 'hourly' as const, priority: 0.9 },
    { path: 'dolar', freq: 'hourly' as const, priority: 0.9 },
    { path: 'calculadora-inflacion', freq: 'hourly' as const, priority: 0.8 },
  ]

  const toolPages = tools.map(tool => ({
    url: `${baseUrl}/${tool.path}`,
    lastModified: currentDate,
    changeFrequency: tool.freq,
    priority: tool.priority,
  }))

  // Combinar todas las páginas
  return [...mainPages, ...indicatorPages, ...toolPages]
}