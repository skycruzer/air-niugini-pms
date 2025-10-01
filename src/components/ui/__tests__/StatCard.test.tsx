/**
 * StatCard Component Tests
 * Tests for dashboard statistics cards with Air Niugini branding
 */

import { render, screen } from '@testing-library/react'
import { Users, AlertTriangle, CheckCircle } from 'lucide-react'
import { StatCard, StatCardGrid, CompactStatCard } from '../StatCard'

// Mock FadeIn animation component
jest.mock('@/components/ui/animated', () => ({
  FadeIn: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

describe('StatCard Component', () => {
  describe('Basic Rendering', () => {
    it('renders title and value correctly', () => {
      render(<StatCard title="Total Pilots" value="27" />)
      expect(screen.getByText('Total Pilots')).toBeInTheDocument()
      expect(screen.getByText('27')).toBeInTheDocument()
    })

    it('renders numeric value', () => {
      render(<StatCard title="Active Certifications" value={568} />)
      expect(screen.getByText('568')).toBeInTheDocument()
    })

    it('renders subtitle when provided', () => {
      render(<StatCard title="Total Pilots" value="27" subtitle="Active fleet members" />)
      expect(screen.getByText('Active fleet members')).toBeInTheDocument()
    })

    it('does not render subtitle when not provided', () => {
      const { container } = render(<StatCard title="Total Pilots" value="27" />)
      expect(container.querySelector('.text-xs.text-gray-500')).not.toBeInTheDocument()
    })

    it('renders with icon when provided', () => {
      const { container } = render(<StatCard title="Total Pilots" value="27" icon={Users} />)
      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('does not render icon when not provided', () => {
      const { container } = render(<StatCard title="Total Pilots" value="27" />)
      const iconContainer = container.querySelector('.p-3.rounded-xl')
      expect(iconContainer).not.toBeInTheDocument()
    })
  })

  describe('Trend Indicators', () => {
    it('renders positive trend correctly', () => {
      render(
        <StatCard
          title="Compliance Rate"
          value="95.2%"
          trend={{ value: 5, label: 'from last month', direction: 'up' }}
        />
      )
      expect(screen.getByText('+5%')).toBeInTheDocument()
      expect(screen.getByText('from last month')).toBeInTheDocument()
    })

    it('renders negative trend correctly', () => {
      render(
        <StatCard
          title="Expired Certs"
          value="3"
          trend={{ value: -2, label: 'from last month', direction: 'down' }}
        />
      )
      expect(screen.getByText('-2%')).toBeInTheDocument()
    })

    it('renders neutral trend correctly', () => {
      render(
        <StatCard
          title="Pending Requests"
          value="5"
          trend={{ value: 0, label: 'from last week', direction: 'neutral' }}
        />
      )
      expect(screen.getByText('0%')).toBeInTheDocument()
    })

    it('does not render trend section when not provided', () => {
      const { container } = render(<StatCard title="Total Pilots" value="27" />)
      const trendSection = container.querySelector('.pt-4.border-t')
      expect(trendSection).not.toBeInTheDocument()
    })

    it('applies correct color class for upward trend', () => {
      const { container } = render(
        <StatCard
          title="Test"
          value="100"
          trend={{ value: 10, label: 'test', direction: 'up' }}
        />
      )
      const trendValue = screen.getByText('+10%')
      expect(trendValue).toHaveClass('text-green-600')
    })

    it('applies correct color class for downward trend', () => {
      const { container } = render(
        <StatCard
          title="Test"
          value="100"
          trend={{ value: -10, label: 'test', direction: 'down' }}
        />
      )
      const trendValue = screen.getByText('-10%')
      expect(trendValue).toHaveClass('text-red-600')
    })
  })

  describe('Variant Styles', () => {
    it('applies default variant styles', () => {
      const { container } = render(<StatCard title="Test" value="100" variant="default" />)
      const card = container.querySelector('[class*="bg-white"]')
      expect(card).toBeInTheDocument()
    })

    it('applies primary variant with Air Niugini red', () => {
      const { container } = render(
        <StatCard title="Test" value="100" variant="primary" icon={Users} />
      )
      const iconContainer = container.querySelector('.p-3.rounded-xl')
      expect(iconContainer).toHaveClass('bg-[#E4002B]/10')
    })

    it('applies secondary variant with Air Niugini gold', () => {
      const { container } = render(
        <StatCard title="Test" value="100" variant="secondary" icon={Users} />
      )
      const iconContainer = container.querySelector('.p-3.rounded-xl')
      expect(iconContainer).toHaveClass('bg-[#FFC72C]/10')
    })

    it('applies success variant styles', () => {
      const { container } = render(
        <StatCard title="Test" value="100" variant="success" icon={CheckCircle} />
      )
      const iconContainer = container.querySelector('.p-3.rounded-xl')
      expect(iconContainer).toHaveClass('bg-green-100')
    })

    it('applies warning variant styles', () => {
      const { container } = render(
        <StatCard title="Test" value="100" variant="warning" icon={AlertTriangle} />
      )
      const iconContainer = container.querySelector('.p-3.rounded-xl')
      expect(iconContainer).toHaveClass('bg-amber-100')
    })

    it('applies error variant styles', () => {
      const { container } = render(
        <StatCard title="Test" value="100" variant="error" icon={AlertTriangle} />
      )
      const iconContainer = container.querySelector('.p-3.rounded-xl')
      expect(iconContainer).toHaveClass('bg-red-100')
    })
  })

  describe('Animation', () => {
    it('renders with animation by default', () => {
      const { container } = render(<StatCard title="Test" value="100" />)
      expect(container.firstChild).toBeTruthy()
    })

    it('renders without animation when animated=false', () => {
      const { container } = render(<StatCard title="Test" value="100" animated={false} />)
      expect(container.firstChild).toBeTruthy()
    })
  })

  describe('Hover Effects', () => {
    it('has hover transition classes', () => {
      const { container } = render(<StatCard title="Test" value="100" />)
      const card = container.querySelector('.hover\\:shadow-lg')
      expect(card).toBeInTheDocument()
    })

    it('has hover transform classes', () => {
      const { container } = render(<StatCard title="Test" value="100" />)
      const card = container.querySelector('.hover\\:-translate-y-1')
      expect(card).toBeInTheDocument()
    })

    it('icon has hover scale effect', () => {
      const { container } = render(<StatCard title="Test" value="100" icon={Users} />)
      const iconContainer = container.querySelector('.hover\\:scale-110')
      expect(iconContainer).toBeInTheDocument()
    })
  })

  describe('Custom ClassName', () => {
    it('applies custom className to card', () => {
      const { container } = render(
        <StatCard title="Test" value="100" className="custom-test-class" />
      )
      const card = container.querySelector('.custom-test-class')
      expect(card).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper semantic structure', () => {
      const { container } = render(<StatCard title="Total Pilots" value="27" />)
      const card = container.firstChild
      expect(card).toBeInTheDocument()
    })

    it('displays large, readable values', () => {
      const { container } = render(<StatCard title="Total Pilots" value="27" />)
      const value = screen.getByText('27')
      expect(value).toHaveClass('text-3xl', 'font-bold')
    })

    it('has appropriate text contrast', () => {
      render(<StatCard title="Total Pilots" value="27" />)
      const title = screen.getByText('Total Pilots')
      const value = screen.getByText('27')
      expect(title).toHaveClass('text-gray-600')
      expect(value).toHaveClass('text-gray-900')
    })
  })
})

describe('StatCardGrid Component', () => {
  const mockStats = [
    { title: 'Total Pilots', value: '27' },
    { title: 'Active Certs', value: '568' },
    { title: 'Expiring Soon', value: '12' },
    { title: 'Compliance', value: '95.2%' },
  ]

  it('renders all stat cards', () => {
    render(<StatCardGrid stats={mockStats} />)
    mockStats.forEach((stat) => {
      expect(screen.getByText(stat.title)).toBeInTheDocument()
      expect(screen.getByText(stat.value)).toBeInTheDocument()
    })
  })

  it('applies 2-column grid classes', () => {
    const { container } = render(<StatCardGrid stats={mockStats} columns={2} />)
    const grid = container.querySelector('.md\\:grid-cols-2')
    expect(grid).toBeInTheDocument()
  })

  it('applies 3-column grid classes', () => {
    const { container } = render(<StatCardGrid stats={mockStats} columns={3} />)
    const grid = container.querySelector('.lg\\:grid-cols-3')
    expect(grid).toBeInTheDocument()
  })

  it('applies 4-column grid classes by default', () => {
    const { container } = render(<StatCardGrid stats={mockStats} />)
    const grid = container.querySelector('.lg\\:grid-cols-4')
    expect(grid).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(
      <StatCardGrid stats={mockStats} className="custom-grid-class" />
    )
    const grid = container.querySelector('.custom-grid-class')
    expect(grid).toBeInTheDocument()
  })

  it('has gap between cards', () => {
    const { container } = render(<StatCardGrid stats={mockStats} />)
    const grid = container.querySelector('.gap-6')
    expect(grid).toBeInTheDocument()
  })
})

describe('CompactStatCard Component', () => {
  it('renders title and value in compact format', () => {
    render(<CompactStatCard title="Pilots" value="27" />)
    expect(screen.getByText('Pilots')).toBeInTheDocument()
    expect(screen.getByText('27')).toBeInTheDocument()
  })

  it('renders with icon', () => {
    const { container } = render(<CompactStatCard title="Pilots" value="27" icon={Users} />)
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  it('applies compact size classes', () => {
    render(<CompactStatCard title="Pilots" value="27" />)
    const title = screen.getByText('Pilots')
    const value = screen.getByText('27')
    expect(title).toHaveClass('text-xs')
    expect(value).toHaveClass('text-xl')
  })

  it('has hover shadow effect', () => {
    const { container } = render(<CompactStatCard title="Pilots" value="27" />)
    const card = container.querySelector('.hover\\:shadow-md')
    expect(card).toBeInTheDocument()
  })

  it('applies variant styles', () => {
    const { container } = render(
      <CompactStatCard title="Pilots" value="27" variant="primary" icon={Users} />
    )
    const iconContainer = container.querySelector('.p-2.rounded-lg')
    expect(iconContainer).toHaveClass('bg-[#E4002B]/10')
  })

  it('applies custom className', () => {
    const { container } = render(
      <CompactStatCard title="Pilots" value="27" className="compact-custom" />
    )
    const card = container.querySelector('.compact-custom')
    expect(card).toBeInTheDocument()
  })
})

describe('Air Niugini Branding', () => {
  it('uses Air Niugini primary red color', () => {
    const { container } = render(
      <StatCard title="Test" value="100" variant="primary" icon={Users} />
    )
    const iconContainer = container.querySelector('.text-\\[\\#E4002B\\]')
    expect(iconContainer).toBeInTheDocument()
  })

  it('uses Air Niugini secondary gold color', () => {
    const { container } = render(
      <StatCard title="Test" value="100" variant="secondary" icon={Users} />
    )
    const iconContainer = container.querySelector('.text-\\[\\#FFC72C\\]')
    expect(iconContainer).toBeInTheDocument()
  })

  it('maintains consistent border styling', () => {
    const { container } = render(<StatCard title="Test" value="100" />)
    const card = container.querySelector('.border')
    expect(card).toBeInTheDocument()
  })

  it('uses smooth transitions for professional appearance', () => {
    const { container } = render(<StatCard title="Test" value="100" />)
    const card = container.querySelector('.transition-all')
    expect(card).toBeInTheDocument()
  })
})
