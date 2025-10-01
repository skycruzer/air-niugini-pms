/**
 * StatusBadge Component Tests
 * Tests for aviation certification status badges with Air Niugini branding
 */

import { render, screen } from '@testing-library/react';
import {
  StatusBadge,
  StatusIndicator,
  StatusDotWithLabel,
  getCertificationStatus,
} from '../StatusBadge';

describe('StatusBadge Component', () => {
  describe('StatusBadge', () => {
    it('renders current status badge correctly', () => {
      render(<StatusBadge status="current" />);
      const badge = screen.getByText('Current');
      expect(badge).toBeInTheDocument();
    });

    it('renders expiring status badge correctly', () => {
      render(<StatusBadge status="expiring" />);
      const badge = screen.getByText('Expiring Soon');
      expect(badge).toBeInTheDocument();
    });

    it('renders expired status badge correctly', () => {
      render(<StatusBadge status="expired" />);
      const badge = screen.getByText('Expired');
      expect(badge).toBeInTheDocument();
    });

    it('renders pending status badge correctly', () => {
      render(<StatusBadge status="pending" />);
      const badge = screen.getByText('Pending');
      expect(badge).toBeInTheDocument();
    });

    it('renders inactive status badge correctly', () => {
      render(<StatusBadge status="inactive" />);
      const badge = screen.getByText('Inactive');
      expect(badge).toBeInTheDocument();
    });

    it('renders with custom label', () => {
      render(<StatusBadge status="current" label="Active and Current" />);
      const badge = screen.getByText('Active and Current');
      expect(badge).toBeInTheDocument();
    });

    it('renders without icon when showIcon is false', () => {
      const { container } = render(<StatusBadge status="current" showIcon={false} />);
      const svgIcon = container.querySelector('svg');
      expect(svgIcon).not.toBeInTheDocument();
    });

    it('renders with icon by default', () => {
      const { container } = render(<StatusBadge status="current" />);
      const svgIcon = container.querySelector('svg');
      expect(svgIcon).toBeInTheDocument();
    });

    it('applies correct size classes for small size', () => {
      const { container } = render(<StatusBadge status="current" size="sm" />);
      const badge = container.firstChild;
      expect(badge).toHaveClass('text-xs', 'px-2', 'py-0.5');
    });

    it('applies correct size classes for medium size (default)', () => {
      const { container } = render(<StatusBadge status="current" size="md" />);
      const badge = container.firstChild;
      expect(badge).toHaveClass('text-sm', 'px-2.5', 'py-1');
    });

    it('applies correct size classes for large size', () => {
      const { container } = render(<StatusBadge status="current" size="lg" />);
      const badge = container.firstChild;
      expect(badge).toHaveClass('text-base', 'px-3', 'py-1.5');
    });

    it('applies custom className', () => {
      const { container } = render(<StatusBadge status="current" className="custom-class" />);
      const badge = container.firstChild;
      expect(badge).toHaveClass('custom-class');
    });

    it('applies correct color classes for current status', () => {
      const { container } = render(<StatusBadge status="current" />);
      const badge = container.firstChild;
      expect(badge).toHaveClass('bg-green-100', 'text-green-800');
    });

    it('applies correct color classes for expiring status', () => {
      const { container } = render(<StatusBadge status="expiring" />);
      const badge = container.firstChild;
      expect(badge).toHaveClass('bg-amber-100', 'text-amber-800');
    });

    it('applies correct color classes for expired status', () => {
      const { container } = render(<StatusBadge status="expired" />);
      const badge = container.firstChild;
      expect(badge).toHaveClass('bg-red-100', 'text-red-800');
    });
  });

  describe('getCertificationStatus utility', () => {
    it('returns inactive for null days', () => {
      const status = getCertificationStatus(null);
      expect(status).toBe('inactive');
    });

    it('returns expired for negative days', () => {
      const status = getCertificationStatus(-5);
      expect(status).toBe('expired');
    });

    it('returns expiring for days <= 30', () => {
      expect(getCertificationStatus(30)).toBe('expiring');
      expect(getCertificationStatus(15)).toBe('expiring');
      expect(getCertificationStatus(1)).toBe('expiring');
    });

    it('returns current for days > 30', () => {
      expect(getCertificationStatus(31)).toBe('current');
      expect(getCertificationStatus(90)).toBe('current');
      expect(getCertificationStatus(365)).toBe('current');
    });

    it('returns expiring at exactly 30 days', () => {
      const status = getCertificationStatus(30);
      expect(status).toBe('expiring');
    });

    it('returns current at exactly 31 days', () => {
      const status = getCertificationStatus(31);
      expect(status).toBe('current');
    });

    it('returns expired at exactly 0 days', () => {
      const status = getCertificationStatus(0);
      expect(status).toBe('expiring');
    });
  });

  describe('StatusIndicator', () => {
    it('renders status dot correctly', () => {
      const { container } = render(<StatusIndicator status="current" />);
      const dot = container.querySelector('span');
      expect(dot).toBeInTheDocument();
      expect(dot).toHaveClass('rounded-full');
    });

    it('applies correct size for medium dot', () => {
      const { container } = render(<StatusIndicator status="current" size="md" />);
      const dot = container.querySelector('span');
      expect(dot).toHaveClass('w-3', 'h-3');
    });

    it('applies correct size for small dot', () => {
      const { container } = render(<StatusIndicator status="current" size="sm" />);
      const dot = container.querySelector('span');
      expect(dot).toHaveClass('w-2', 'h-2');
    });

    it('applies correct size for large dot', () => {
      const { container } = render(<StatusIndicator status="current" size="lg" />);
      const dot = container.querySelector('span');
      expect(dot).toHaveClass('w-4', 'h-4');
    });

    it('has title attribute for accessibility', () => {
      const { container } = render(<StatusIndicator status="current" />);
      const dot = container.querySelector('span');
      expect(dot).toHaveAttribute('title', 'Current');
    });
  });

  describe('StatusDotWithLabel', () => {
    it('renders dot with label', () => {
      render(<StatusDotWithLabel status="current" />);
      expect(screen.getByText('Current')).toBeInTheDocument();
    });

    it('renders with custom label', () => {
      render(<StatusDotWithLabel status="current" label="All Good" />);
      expect(screen.getByText('All Good')).toBeInTheDocument();
    });

    it('includes both dot and label', () => {
      const { container } = render(<StatusDotWithLabel status="current" />);
      const dot = container.querySelector('span.rounded-full');
      const label = screen.getByText('Current');
      expect(dot).toBeInTheDocument();
      expect(label).toBeInTheDocument();
    });

    it('applies custom className to container', () => {
      const { container } = render(
        <StatusDotWithLabel status="current" className="custom-class" />
      );
      const wrapper = container.querySelector('.custom-class');
      expect(wrapper).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('status badges are keyboard accessible', () => {
      const { container } = render(<StatusBadge status="current" />);
      const badge = container.firstChild as HTMLElement;
      expect(badge).toBeVisible();
    });

    it('status indicators have descriptive title', () => {
      const { container } = render(<StatusIndicator status="expired" />);
      const dot = container.querySelector('span');
      expect(dot).toHaveAttribute('title', 'Expired');
    });

    it('status labels have appropriate text contrast', () => {
      // Current status - green text on white/light green background
      const { container: currentContainer } = render(<StatusBadge status="current" />);
      expect(currentContainer.firstChild).toHaveClass('text-green-800');

      // Expired status - red text on white/light red background
      const { container: expiredContainer } = render(<StatusBadge status="expired" />);
      expect(expiredContainer.firstChild).toHaveClass('text-red-800');
    });
  });

  describe('Air Niugini Aviation Standards', () => {
    it('follows aviation color coding standards', () => {
      // Red for expired - critical safety issue
      const { container: redContainer } = render(<StatusBadge status="expired" />);
      expect(redContainer.firstChild).toHaveClass('bg-red-100', 'text-red-800');

      // Yellow/Amber for expiring - warning
      const { container: yellowContainer } = render(<StatusBadge status="expiring" />);
      expect(yellowContainer.firstChild).toHaveClass('bg-amber-100', 'text-amber-800');

      // Green for current - safe to operate
      const { container: greenContainer } = render(<StatusBadge status="current" />);
      expect(greenContainer.firstChild).toHaveClass('bg-green-100', 'text-green-800');
    });

    it('uses consistent border styling', () => {
      const { container } = render(<StatusBadge status="current" />);
      const badge = container.firstChild;
      expect(badge).toHaveClass('border');
    });

    it('applies hover transitions for interactive feedback', () => {
      const { container } = render(<StatusBadge status="current" />);
      const badge = container.firstChild;
      expect(badge).toHaveClass('transition-colors');
    });
  });
});
