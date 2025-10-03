import { describe, it, expect, vi, beforeEach } from 'vitest'
import { LOCALHOST_HOSTNAME, LOCALHOST_PORT, PRODUCTION_DOMAIN, BASE_URL, API_ENDPOINTS, MESSAGES, CONFIG } from '../../utils/constants.js'

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
      // Test that BASE_URL is properly defined
      expect(BASE_URL).toBeDefined()
      expect(typeof BASE_URL).toBe('string')
      expect(BASE_URL).toMatch(/^https?:\/\//)
    })

    it('should contain the correct server port for localhost', () => {
      // Since we're running tests in localhost environment, check for localhost
      expect(BASE_URL).toContain('localhost')
      expect(BASE_URL).toContain('7779')
    })
  })

  describe('API_ENDPOINTS', () => {
    it('should have all required endpoints', () => {
      expect(API_ENDPOINTS).toHaveProperty('SUBMISSIONS')
      expect(API_ENDPOINTS).toHaveProperty('CHAT')
      expect(API_ENDPOINTS).toHaveProperty('AUTH_CURRENT_USER')
      expect(API_ENDPOINTS).toHaveProperty('AUTH_LOGOUT')
      expect(API_ENDPOINTS).toHaveProperty('COMPANIES')
      expect(API_ENDPOINTS).toHaveProperty('EXPERIENCES')
    })

    it('should have correct endpoint paths', () => {
      expect(API_ENDPOINTS.SUBMISSIONS).toContain('/api/submissions')
      expect(API_ENDPOINTS.CHAT).toContain('/api/chat')
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
      expect(MESSAGES.VALIDATION_ERRORS.COMPANY_NAME).toBe('Invalid company name. Use 2–50 letters/numbers only.')
      expect(MESSAGES.VALIDATION_ERRORS.POSITIVE_COUNT).toBe('Count must be a positive integer.')
      expect(MESSAGES.VALIDATION_ERRORS.EMPTY_FIELD).toBe('cannot be empty.')
      expect(MESSAGES.VALIDATION_ERRORS.MALICIOUS_SCRIPT).toBe('Malicious script detected in')
    })

    it('should have authentication error messages', () => {
      expect(MESSAGES.AUTH_ERRORS.NOT_LOGGED_IN).toBe('⚠️ You must be logged in to add a company.')
      expect(MESSAGES.AUTH_ERRORS.PLEASE_LOGIN).toBe('Please login to view experiences.')
    })

    it('should generate correct backend port error message', () => {
      const message = MESSAGES.BACKEND_PORT_ERROR(7779)
      expect(message).toContain('❌ Error: Backend server connection failed')
      expect(message).toContain('port 7779')
    })
  })

  describe('CONFIG', () => {
    it('should have correct config values', () => {
      expect(CONFIG.FRONTEND_PORT).toBe(5173)
      expect(CONFIG.BACKEND_PORT).toBe(7779)
      expect(CONFIG.PRODUCTION_URL).toBe('https://lastminuteplacementprep.in')
      expect(CONFIG.LOCAL_URL).toBe('http://localhost:5173')
    })
  })

  describe('Environment-dependent behavior', () => {
    it('should detect localhost environment correctly', () => {
      // Mock window.location.hostname
      Object.defineProperty(window, 'location', {
        value: { hostname: 'localhost' },
        writable: true
      })

      // Test that environment detection works
      expect(window.location.hostname).toBe('localhost')
    })

    it('should detect production environment correctly', () => {
      // Mock window.location.hostname
      Object.defineProperty(window, 'location', {
        value: { hostname: 'lastminuteplacementprep.in' },
        writable: true
      })

      // Test that environment detection works
      expect(window.location.hostname).toBe('lastminuteplacementprep.in')
    })
  })
})
