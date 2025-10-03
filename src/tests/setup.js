import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    hostname: 'localhost',
    href: 'http://localhost:5173',
    origin: 'http://localhost:5173'
  },
  writable: true
})

// Mock fetch globally
global.fetch = vi.fn()

// Mock alert
global.alert = vi.fn()

// Mock console methods for cleaner test output
global.console = {
  ...console,
  // Suppress console.log during tests unless explicitly enabled
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock ResizeObserver
global.ResizeObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Setup test utilities
beforeEach(() => {
  // Clear all mocks before each test
  vi.clearAllMocks()
  
  // Reset fetch mock
  global.fetch.mockClear()
  
  // Reset alert mock
  global.alert.mockClear()
})

afterEach(() => {
  // Clean up after each test
})
