import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import CompanyCard from '../../components/CompanyCard.jsx'

// Mock useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// Wrapper component for testing
const TestWrapper = ({ children }) => (
  <BrowserRouter>{children}</BrowserRouter>
)

describe('CompanyCard Component', () => {
  const mockCompany = {
    _id: '507f1f77bcf86cd799439011',
    name: 'Google Inc.',
    type: 'FTE',
    business_model: 'B2C',
    eligibility: 'CS/IT students',
    date_of_visit: '2024-01-15',
    count: 50
  }

  beforeEach(() => {
    mockNavigate.mockClear()
  })

  it('renders company information correctly', () => {
    render(
      <TestWrapper>
        <CompanyCard company={mockCompany} />
      </TestWrapper>
    )

    expect(screen.getByText('Google Inc.')).toBeInTheDocument()
    expect(screen.getByText('FTE')).toBeInTheDocument()
    expect(screen.getByText('2024-01-15')).toBeInTheDocument()
    expect(screen.getByText('B2C')).toBeInTheDocument()
    expect(screen.getByText('CS/IT students')).toBeInTheDocument()
    expect(screen.getByText('50')).toBeInTheDocument()
  })

  it('renders company initials correctly', () => {
    render(
      <TestWrapper>
        <CompanyCard company={mockCompany} />
      </TestWrapper>
    )

    // Should display "GI" for "Google Inc."
    expect(screen.getByText('GI')).toBeInTheDocument()
  })

  it('handles single word company names', () => {
    const singleWordCompany = {
      ...mockCompany,
      name: 'Google'
    }

    render(
      <TestWrapper>
        <CompanyCard company={singleWordCompany} />
      </TestWrapper>
    )

    // Should display first 2 characters "GO"
    expect(screen.getByText('GO')).toBeInTheDocument()
  })

  it('handles empty company names gracefully', () => {
    const emptyNameCompany = {
      ...mockCompany,
      name: ''
    }

    render(
      <TestWrapper>
        <CompanyCard company={emptyNameCompany} />
      </TestWrapper>
    )

    // Should display fallback initials "XX"
    expect(screen.getByText('XX')).toBeInTheDocument()
  })

  it('navigates to company detail when clicked', () => {
    render(
      <TestWrapper>
        <CompanyCard company={mockCompany} />
      </TestWrapper>
    )

    const card = screen.getByTestId('company-card')
    fireEvent.click(card)

    expect(mockNavigate).toHaveBeenCalledWith(`/companies/${mockCompany._id}`)
  })

  it('displays count as "Not available" when count is undefined', () => {
    const companyWithoutCount = {
      ...mockCompany,
      count: undefined
    }

    render(
      <TestWrapper>
        <CompanyCard company={companyWithoutCount} />
      </TestWrapper>
    )

    expect(screen.getByText('Not available')).toBeInTheDocument()
  })

  it('displays count as "Not available" when count is null', () => {
    const companyWithNullCount = {
      ...mockCompany,
      count: null
    }

    render(
      <TestWrapper>
        <CompanyCard company={companyWithNullCount} />
      </TestWrapper>
    )

    expect(screen.getByText('Not available')).toBeInTheDocument()
  })

  it('handles companies with multiple words in name', () => {
    const multiWordCompany = {
      ...mockCompany,
      name: 'Goldman Sachs Group'
    }

    render(
      <TestWrapper>
        <CompanyCard company={multiWordCompany} />
      </TestWrapper>
    )

    // Should display first and last word initials "GG"
    expect(screen.getByText('GG')).toBeInTheDocument()
  })

  it('applies correct CSS classes for styling', () => {
    render(
      <TestWrapper>
        <CompanyCard company={mockCompany} />
      </TestWrapper>
    )

    const card = screen.getByTestId('company-card')
    
    expect(card).toHaveClass('bg-white')
    expect(card).toHaveClass('border')
    expect(card).toHaveClass('rounded-2xl')
    expect(card).toHaveClass('shadow-md')
    expect(card).toHaveClass('p-6')
    expect(card).toHaveClass('cursor-pointer')
  })

  it('has hover effects', () => {
    render(
      <TestWrapper>
        <CompanyCard company={mockCompany} />
      </TestWrapper>
    )

    const card = screen.getByTestId('company-card')
    
    expect(card).toHaveClass('hover:shadow-2xl')
    expect(card).toHaveClass('hover:scale-[1.02]')
    expect(card).toHaveClass('hover:border-indigo-400')
    expect(card).toHaveClass('transition-all')
    expect(card).toHaveClass('duration-300')
  })

  it('renders all company details sections', () => {
    render(
      <TestWrapper>
        <CompanyCard company={mockCompany} />
      </TestWrapper>
    )

    expect(screen.getByText(/Date of interview:/)).toBeInTheDocument()
    expect(screen.getByText(/Business Model:/)).toBeInTheDocument()
    expect(screen.getByText(/Eligibility:/)).toBeInTheDocument()
    expect(screen.getByText(/Count:/)).toBeInTheDocument()
  })

  it('displays initials in a styled container', () => {
    render(
      <TestWrapper>
        <CompanyCard company={mockCompany} />
      </TestWrapper>
    )

    const initialsContainer = screen.getByTestId('company-initials')
    
    expect(initialsContainer).toHaveClass('w-12')
    expect(initialsContainer).toHaveClass('h-12')
    expect(initialsContainer).toHaveClass('rounded-lg')
    expect(initialsContainer).toHaveClass('shadow-sm')
    expect(initialsContainer).toHaveClass('border')
    expect(initialsContainer).toHaveClass('mr-3')
    expect(initialsContainer).toHaveClass('bg-gradient-to-br')
    expect(initialsContainer).toHaveClass('from-indigo-500')
    expect(initialsContainer).toHaveClass('to-purple-600')
    expect(initialsContainer).toHaveClass('text-white')
    expect(initialsContainer).toHaveClass('font-bold')
    expect(initialsContainer).toHaveClass('text-lg')
    expect(initialsContainer).toHaveClass('flex')
    expect(initialsContainer).toHaveClass('items-center')
    expect(initialsContainer).toHaveClass('justify-center')
  })
})
