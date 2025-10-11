/**
 * @fileoverview ExpiryTracker Component - Document expiry monitoring dashboard widget
 * Air Niugini themed expiry tracker with visual status indicators
 *
 * Features:
 * - Color-coded expiry status (critical/warning/expired)
 * - Countdown timers
 * - Quick access to expiring documents
 * - Integration with notification system
 *
 * @author Air Niugini Development Team
 * @version 1.0.0
 * @since 2025-10-01
 */

'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, Clock, FileWarning, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { differenceInDays, format } from 'date-fns';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface ExpiringDocument {
  id: string;
  pilot_id: string;
  pilot_name: string;
  employee_id: string;
  document_type: string;
  document_name: string;
  document_number?: string;
  expiry_date: string;
  issue_date?: string;
  issuing_authority?: string;
  verification_status: string;
}

interface ExpiryTrackerProps {
  documents?: {
    critical: ExpiringDocument[]; // Expiring in <= 7 days
    warning: ExpiringDocument[]; // Expiring in 8-30 days
    expired: ExpiringDocument[]; // Already expired
  };
  isLoading?: boolean;
  onViewDetails?: (document: ExpiringDocument) => void;
  onRefresh?: () => void;
  className?: string;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function getExpiryStatus(expiryDate: string): {
  status: 'critical' | 'warning' | 'expired';
  daysRemaining: number;
  color: string;
  bgColor: string;
  label: string;
} {
  const days = differenceInDays(new Date(expiryDate), new Date());

  if (days < 0) {
    return {
      status: 'expired',
      daysRemaining: Math.abs(days),
      color: 'text-red-700',
      bgColor: 'bg-red-100',
      label: 'Expired',
    };
  } else if (days <= 7) {
    return {
      status: 'critical',
      daysRemaining: days,
      color: 'text-orange-700',
      bgColor: 'bg-orange-100',
      label: 'Critical',
    };
  } else {
    return {
      status: 'warning',
      daysRemaining: days,
      color: 'text-yellow-700',
      bgColor: 'bg-yellow-100',
      label: 'Warning',
    };
  }
}

// =============================================================================
// EXPIRY TRACKER COMPONENT
// =============================================================================

export function ExpiryTracker({
  documents,
  isLoading = false,
  onViewDetails,
  onRefresh,
  className,
}: ExpiryTrackerProps) {
  const [selectedTab, setSelectedTab] = useState<'critical' | 'warning' | 'expired'>('critical');

  const criticalCount = documents?.critical?.length || 0;
  const warningCount = documents?.warning?.length || 0;
  const expiredCount = documents?.expired?.length || 0;
  const totalCount = criticalCount + warningCount + expiredCount;

  const currentDocuments = documents?.[selectedTab] || [];

  return (
    <Card className={cn('shadow-lg', className)}>
      <CardHeader className="border-b bg-gradient-to-r from-[#4F46E5] to-[#4338CA] text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <FileWarning className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">Document Expiry Tracker</CardTitle>
              <CardDescription className="text-white/90">
                {totalCount} document{totalCount !== 1 ? 's' : ''} requiring attention
              </CardDescription>
            </div>
          </div>

          {onRefresh && (
            <Button
              onClick={onRefresh}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
              disabled={isLoading}
            >
              <Clock className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Status Tabs */}
        <div className="grid grid-cols-3 border-b">
          {/* Critical Tab */}
          <button
            onClick={() => setSelectedTab('critical')}
            className={cn(
              'p-4 text-center transition-colors border-b-2',
              selectedTab === 'critical'
                ? 'border-orange-500 bg-orange-50'
                : 'border-transparent hover:bg-gray-50'
            )}
          >
            <div className="flex items-center justify-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
              <span className="font-semibold text-gray-900">Critical</span>
            </div>
            <div className="text-2xl font-bold text-orange-600">{criticalCount}</div>
            <div className="text-xs text-gray-500">≤ 7 days</div>
          </button>

          {/* Warning Tab */}
          <button
            onClick={() => setSelectedTab('warning')}
            className={cn(
              'p-4 text-center transition-colors border-b-2 border-r border-l',
              selectedTab === 'warning'
                ? 'border-yellow-500 bg-yellow-50'
                : 'border-transparent hover:bg-gray-50'
            )}
          >
            <div className="flex items-center justify-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-yellow-600" />
              <span className="font-semibold text-gray-900">Warning</span>
            </div>
            <div className="text-2xl font-bold text-yellow-600">{warningCount}</div>
            <div className="text-xs text-gray-500">8-30 days</div>
          </button>

          {/* Expired Tab */}
          <button
            onClick={() => setSelectedTab('expired')}
            className={cn(
              'p-4 text-center transition-colors border-b-2',
              selectedTab === 'expired'
                ? 'border-red-500 bg-red-50'
                : 'border-transparent hover:bg-gray-50'
            )}
          >
            <div className="flex items-center justify-center gap-2 mb-1">
              <FileWarning className="w-4 h-4 text-red-600" />
              <span className="font-semibold text-gray-900">Expired</span>
            </div>
            <div className="text-2xl font-bold text-red-600">{expiredCount}</div>
            <div className="text-xs text-gray-500">Past due</div>
          </button>
        </div>

        {/* Document List */}
        <div className="max-h-[400px] overflow-y-auto">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="w-8 h-8 border-4 border-[#4F46E5] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-gray-600">Loading documents...</p>
            </div>
          ) : currentDocuments.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <FileWarning className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium">No documents in this category</p>
              <p className="text-sm text-gray-500 mt-1">All documents are compliant</p>
            </div>
          ) : (
            <div className="divide-y">
              {currentDocuments.map((doc) => {
                const expiryInfo = getExpiryStatus(doc.expiry_date);

                return (
                  <div
                    key={doc.id}
                    className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => onViewDetails?.(doc)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      {/* Document Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-900 truncate">{doc.pilot_name}</h4>
                          <Badge variant="outline" className="text-xs">
                            {doc.employee_id}
                          </Badge>
                        </div>

                        <p className="text-sm text-gray-600 truncate mb-2">
                          {doc.document_type.replace(/_/g, ' ')} - {doc.document_name}
                        </p>

                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>
                              Expires: {format(new Date(doc.expiry_date), 'MMM dd, yyyy')}
                            </span>
                          </div>
                          {doc.document_number && <span>#{doc.document_number}</span>}
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="flex-shrink-0 text-right">
                        <Badge
                          className={cn('font-semibold', expiryInfo.bgColor, expiryInfo.color)}
                        >
                          {expiryInfo.label}
                        </Badge>
                        <p className={cn('text-xs mt-1 font-medium', expiryInfo.color)}>
                          {expiryInfo.status === 'expired'
                            ? `${expiryInfo.daysRemaining} days overdue`
                            : `${expiryInfo.daysRemaining} day${expiryInfo.daysRemaining !== 1 ? 's' : ''} left`}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {currentDocuments.length > 0 && (
          <div className="p-4 border-t bg-gray-50">
            <Button
              variant="outline"
              className="w-full border-[#4F46E5] text-[#4F46E5] hover:bg-red-50"
            >
              View All {selectedTab.charAt(0).toUpperCase() + selectedTab.slice(1)} Documents
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
