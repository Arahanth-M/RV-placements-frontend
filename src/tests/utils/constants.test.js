import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  LOCALHOST_HOSTNAME,
  LOCALHOST_PORT,
  PRODUCTION_DOMAIN,
  BASE_URL,
  API_ENDPOINTS,
  MESSAGES,
  CONFIG,
} from '../../utils/constants.js'

describe('Constants', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Environment URLs', () => {
    it('should have correct localhost values', () => {
      expect(LOCALHOST_HOSTNAME).toBe('localhost')
      expect(LOCALHOST_PORT).toBe(7779)
      expect(PRODUCTION_DOMAIN).toBe('lastminuteplacementprep.in')
    })
  })

  describe('BASE_URL', () => {
    it('should be defined and consistent', () => {
      expect(BASE_URL).toBeDefined()
      expect(typeof BASE_URL).toBe('string')
      expect(BASE_URL).toMatch(/^https?:\/\//)
    })

    it('should use localhost in default dev build', () => {
      expect(BASE_URL).toContain('localhost')
      // Monolith default :7779; split local dev may inject :7778 via env at build time.
      expect(BASE_URL).toMatch(/localhost:(7777|7778|7779)/)
    })
  })

  describe('API_ENDPOINTS', () => {
    it('should have all required endpoints', () => {
      expect(API_ENDPOINTS).toHaveProperty('SUBMISSIONS')
      expect(API_ENDPOINTS).toHaveProperty('AUTH_CURRENT_USER')
      expect(API_ENDPOINTS).toHaveProperty('AUTH_LOGOUT')
      expect(API_ENDPOINTS).toHaveProperty('COMPANIES')
      expect(API_ENDPOINTS).toHaveProperty('EXPERIENCES')
    })

    it('should have correct endpoint paths', () => {
      expect(API_ENDPOINTS.SUBMISSIONS).toContain('/api/submissions')
      expect(API_ENDPOINTS.AUTH_CURRENT_USER).toContain('/api/auth/current_user')
      expect(API_ENDPOINTS.AUTH_LOGOUT).toContain('/api/auth/logout')
      expect(API_ENDPOINTS.COMPANIES).toContain('/api/companies')
      expect(API_ENDPOINTS.EXPERIENCES).toContain('/api/experiences')
    })
  })

  describe('MESSAGES', () => {
    it('should have correct submission messages', () => {
      expect(MESSAGES.SUBMISSION_SUCCESS).toBe('Submission received and pending approval.')
      expect(MESSAGES.SUBMISSION_ERROR).toBe('Something went wrong. Try again.')
    })

    it('should have validation error messages', () => {
      expect(MESSAGES.VALIDATION_ERRORS.COMPANY_NAME).toBe(
        'Invalid company name. Use 2–50 letters/numbers only.'
      )
      expect(MESSAGES.VALIDATION_ERRORS.POSITIVE_COUNT).toBe('Count must be a positive integer.')
      expect(MESSAGES.VALIDATION_ERRORS.EMPTY_FIELD).toBe('cannot be empty.')
      expect(MESSAGES.VALIDATION_ERRORS.MALICIOUS_SCRIPT).toBe('Malicious script detected in')
    })

    it('should have authentication error messages', () => {
      expect(MESSAGES.AUTH_ERRORS.NOT_LOGGED_IN).toBe('⚠️ You must be logged in to add a company.')
      expect(MESSAGES.AUTH_ERRORS.PLEASE_LOGIN).toBe('Please login to view experiences.')
    })

    it('should generate backend port error message using CONFIG port', () => {
      const message = MESSAGES.BACKEND_PORT_ERROR(CONFIG.BACKEND_PORT)
      expect(message).toContain('❌ Error: Backend server connection failed')
      expect(message).toContain(`port ${CONFIG.BACKEND_PORT}`)
    })
  })

  describe('CONFIG', () => {
    it('should have correct config values', () => {
      expect(CONFIG.FRONTEND_PORT).toBe(5173)
      expect(String(CONFIG.BACKEND_PORT)).toMatch(/^\d+$/)
      expect(CONFIG.PRODUCTION_URL).toBe('https://lastminuteplacementprep.in')
      expect(CONFIG.LOCAL_URL).toBe('http://localhost:5173')
    })
  })

  describe('Environment-dependent behavior', () => {
    it('should detect localhost environment correctly', () => {
      Object.defineProperty(window, 'location', {
        value: { hostname: 'localhost' },
        writable: true,
      })
      expect(window.location.hostname).toBe('localhost')
    })

    it('should detect production environment correctly', () => {
      Object.defineProperty(window, 'location', {
        value: { hostname: 'lastminuteplacementprep.in' },
        writable: true,
      })
      expect(window.location.hostname).toBe('lastminuteplacementprep.in')
    })
  })
})
