// jest.setup.js
require('@testing-library/jest-dom')

// Polyfill para TextEncoder/TextDecoder
const { TextEncoder, TextDecoder } = require('util')
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Polyfill para Headers
if (typeof globalThis.Headers === 'undefined') {
  globalThis.Headers = class Headers {
    constructor(init) {
      this._headers = new Map()
      if (init) {
        if (init instanceof Headers) {
          init.forEach((value, key) => this._headers.set(key, value))
        } else if (Array.isArray(init)) {
          init.forEach(([key, value]) => this._headers.set(key, value))
        } else if (typeof init === 'object') {
          Object.entries(init).forEach(([key, value]) => this._headers.set(key, value))
        }
      }
    }
    
    get(name) {
      return this._headers.get(name) || null
    }
    
    set(name, value) {
      this._headers.set(name, value)
    }
    
    has(name) {
      return this._headers.has(name)
    }
    
    forEach(callback) {
      this._headers.forEach(callback)
    }
  }
}

// Polyfill para URL en Node.js
if (typeof globalThis.URL === 'undefined') {
  globalThis.URL = require('url').URL
}

// Mock de NextRequest
global.NextRequest = class NextRequest {
  constructor(url, init = {}) {
    this.url = url instanceof URL ? url.toString() : url
    this.method = init.method || 'GET'
    this.headers = init.headers instanceof Headers ? init.headers : new Headers(init.headers || {})
    
    // Parse URL
    const parsedUrl = new URL(this.url)
    this.nextUrl = parsedUrl
  }
}

// Mock de NextResponse
global.NextResponse = class NextResponse {
  constructor(body, init = {}) {
    this.body = body
    this.status = init.status || 200
    this.statusText = init.statusText || 'OK'
    this.headers = new Headers(init.headers || {})
    this._jsonBody = null
  }
  
  static json(data, init = {}) {
    const response = new NextResponse(JSON.stringify(data), init)
    response._jsonBody = data
    response.headers.set('content-type', 'application/json')
    return response
  }
  
  async json() {
    if (this._jsonBody !== null) {
      return this._jsonBody
    }
    return JSON.parse(this.body)
  }
}

// Mock console.log para tests más limpios
global.console = {
  ...console,
  log: jest.fn(),
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}

// Mock de variables de entorno
process.env = {
  ...process.env,
  DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
  ADMIN_API_KEY: 'test-admin-key-12345',
  REDIS_URL: 'redis://localhost:6379',
  CLERK_SECRET_KEY: 'test-clerk-secret',
  NODE_ENV: 'test'
}