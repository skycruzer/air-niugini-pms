'use client';

/**
 * Dashboard Breadcrumb Component
 * Air Niugini branded breadcrumb navigation for all dashboard pages
 *
 * Features:
 * - WCAG 2.1 AA compliant
 * - Keyboard navigation (Tab, Enter)
 * - Screen reader support (aria-label, aria-current)
 * - Responsive design (truncates on mobile)
 * - Air Niugini red hover states
 */

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface DashboardBreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function DashboardBreadcrumb({ items, className = '' }: DashboardBreadcrumbProps) {
  return (
    <Breadcrumb className={className}>
      <BreadcrumbList>
        {/* Home link */}
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link
              href="/dashboard"
              className="flex items-center gap-1 text-[#4F46E5] hover:text-[#4338CA] transition-colors"
            >
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        {/* Render breadcrumb items */}
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <span key={index} className="flex items-center">
              <BreadcrumbSeparator>
                <ChevronRight className="h-4 w-4 text-[#000000]/30" />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                {isLast ? (
                  // Current page - not a link
                  <BreadcrumbPage className="text-[#000000] font-semibold">
                    {item.label}
                  </BreadcrumbPage>
                ) : (
                  // Parent pages - clickable links
                  <BreadcrumbLink asChild>
                    <Link
                      href={item.href || '#'}
                      className="text-[#4F46E5] hover:text-[#4338CA] transition-colors"
                    >
                      {item.label}
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </span>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

/**
 * Helper function to generate breadcrumb items from pathname
 *
 * @example
 * generateBreadcrumbs('/dashboard/pilots/edit/123')
 * // Returns: [
 * //   { label: 'Pilots', href: '/dashboard/pilots' },
 * //   { label: 'Edit', href: '/dashboard/pilots/edit' },
 * //   { label: '123' }
 * // ]
 */
export function generateBreadcrumbs(
  pathname: string,
  customLabels?: Record<string, string>
): BreadcrumbItem[] {
  // Remove '/dashboard' prefix and split by '/'
  const segments = pathname
    .replace(/^\/dashboard\/?/, '')
    .split('/')
    .filter(Boolean);

  const breadcrumbs: BreadcrumbItem[] = [];

  segments.forEach((segment, index) => {
    // Build the href for this segment
    const href = `/dashboard/${segments.slice(0, index + 1).join('/')}`;

    // Get custom label or format the segment
    const label = customLabels?.[segment] || formatSegment(segment);

    breadcrumbs.push({
      label,
      href: index === segments.length - 1 ? undefined : href, // Last item has no href
    });
  });

  return breadcrumbs;
}

/**
 * Format a URL segment into a readable label
 */
function formatSegment(segment: string): string {
  // Handle UUIDs and numeric IDs
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment)) {
    return `${segment.slice(0, 8)  }...`; // Truncate UUIDs
  }

  if (/^\d+$/.test(segment)) {
    return `ID: ${segment}`; // Numeric IDs
  }

  // Capitalize and replace hyphens/underscores with spaces
  return segment
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Predefined breadcrumb configurations for common pages
 */
export const breadcrumbConfigs = {
  pilots: {
    list: [{ label: 'Pilots' }],
    view: (pilotName: string) => [
      { label: 'Pilots', href: '/dashboard/pilots' },
      { label: pilotName },
    ],
    create: [{ label: 'Pilots', href: '/dashboard/pilots' }, { label: 'Add New Pilot' }],
    edit: (pilotName: string) => [
      { label: 'Pilots', href: '/dashboard/pilots' },
      { label: pilotName, href: '#' }, // No link - placeholder
      { label: 'Edit' },
    ],
  },
  certifications: {
    list: [{ label: 'Certifications' }],
    expiring: [
      { label: 'Certifications', href: '/dashboard/certifications' },
      { label: 'Expiring Checks' },
    ],
    calendar: [
      { label: 'Certifications', href: '/dashboard/certifications' },
      { label: 'Calendar View' },
    ],
  },
  leave: {
    list: [{ label: 'Leave Management' }],
    create: [{ label: 'Leave Management', href: '/dashboard/leave' }, { label: 'New Request' }],
    pending: [
      { label: 'Leave Management', href: '/dashboard/leave' },
      { label: 'Pending Requests' },
    ],
    calendar: [{ label: 'Leave Management', href: '/dashboard/leave' }, { label: 'Calendar View' }],
  },
  analytics: {
    list: [{ label: 'Analytics' }],
    fleet: [{ label: 'Analytics', href: '/dashboard/analytics' }, { label: 'Fleet Metrics' }],
    certifications: [
      { label: 'Analytics', href: '/dashboard/analytics' },
      { label: 'Certification Trends' },
    ],
  },
  reports: {
    list: [{ label: 'Reports' }],
    generate: [{ label: 'Reports', href: '/dashboard/reports' }, { label: 'Generate Report' }],
  },
  settings: {
    list: [{ label: 'Settings' }],
    general: [{ label: 'Settings', href: '/dashboard/settings' }, { label: 'General' }],
    users: [{ label: 'Settings', href: '/dashboard/settings' }, { label: 'User Management' }],
    system: [{ label: 'Settings', href: '/dashboard/settings' }, { label: 'System Configuration' }],
  },
};
