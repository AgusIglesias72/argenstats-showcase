// /lib/utils/crypto.ts
import { customAlphabet } from 'nanoid'

// Generador de API keys seguras
const generateApiKey = customAlphabet(
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  32
)

export function createSecureApiKey(): string {
  const prefix = 'as_' // ArgenStats
  const env = process.env.NODE_ENV === 'production' ? 'prod' : 'test'
  const key = generateApiKey()
  
  return `${prefix}${env}_${key}`
}