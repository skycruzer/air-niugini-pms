'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { permissions } from '@/lib/auth-utils';
import {
  getAllCheckTypes,
  getExpiringCertifications,
  getPilotsWithExpiredCertifications,
} from '@/lib/pilot-service-client';
import { getCategoryIcon, getCategoryColor } from '@/lib/certification-utils';
import { CertificationCalendar } from '@/components/calendar/CertificationCalendar';
import { LazyBulkCertificationModal } from '@/components/lazy';
import { LazyLoader } from '@/components/ui/LazyLoader';
import { FleetTimelineView } from '@/components/certifications/FleetTimelineView';
import { CategoryTimelineView } from '@/components/certifications/CategoryTimelineView';
import { FileEdit, List, Calendar as CalendarIcon, BarChart3, Target } from 'lucide-react';

interface CheckType {
  id: string;
  check_code: string;
  check_description: string;
  category: string;
}

interface ExpiringCert {
  pilotName: string;
  employeeId: string;
  checkCode: string;
  checkDescription: string;
  category: string;
  expiryDate: Date | string;
  status: {
    color: string;
    label: string;
    className: string;
  };
}

function CheckTypeCard({ checkType }: { checkType: CheckType }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-lg font-bold text-[#E4002B]">{checkType.check_code}</span>
            <span
              className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(checkType.category)}`}
            >
              {checkType.category}
            </span>
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">{checkType.check_description}</h3>
        </div>
        <div className="text-2xl ml-4">{getCategoryIcon(checkType.category)}</div>
      </div>
    </div>
  );
}

function PilotExpiredCard({ pilot }: { pilot: any }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-red-900">{pilot.name}</h3>
          <p className="text-sm text-red-700">Employee ID: {pilot.employee_id}</p>
          <div className="mt-2">
            <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded">
              {pilot.expired_count} expired certification{pilot.expired_count !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CertificationsPage() {
  const { user } = useAuth();
  const [checkTypes, setCheckTypes] = useState<CheckType[]>([]);
  const [expiringCerts, setExpiringCerts] = useState<ExpiringCert[]>([]);
  const [expiredPilots, setExpiredPilots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | string>('all');
  const [showAllExpiring, setShowAllExpiring] = useState(false);
  const [currentView, setCurrentView] = useState<
    'list' | 'calendar' | 'timeline' | 'category-timeline'
  >('list');
  const [showBulkModal, setShowBulkModal] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        console.log('🔍 Certifications Page: Starting data fetch...');

        // Use API routes for all data loading
        const [typesResponse, expiringResponse, expiredResponse] = await Promise.all([
          fetch('/api/check-types'),
          fetch('/api/expiring-certifications?daysAhead=60'),
          fetch('/api/expired-certifications'),
        ]);

        const [typesResult, expiringResult, expiredResult] = await Promise.all([
          typesResponse.json(),
          expiringResponse.json(),
          expiredResponse.json(),
        ]);

        if (typesResult.success) {
          setCheckTypes(typesResult.data || []);
          console.log('🔍 Loaded', typesResult.data?.length || 0, 'check types');
        }

        if (expiringResult.success) {
          setExpiringCerts(expiringResult.data || []);
          console.log('🔍 Loaded', expiringResult.data?.length || 0, 'expiring certifications');
        }

        if (expiredResult.success) {
          setExpiredPilots(expiredResult.data || []);
          console.log(
            '🔍 Loaded',
            expiredResult.data?.length || 0,
            'pilots with expired certifications'
          );
        }

        console.log('🔍 Certifications Page: Data loading completed');
      } catch (error) {
        console.error('Error loading certifications data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const categories = Array.from(new Set(checkTypes.map((ct) => ct.category))).sort();
  const filteredCheckTypes =
    filter === 'all' ? checkTypes : checkTypes.filter((ct) => ct.category === filter);

  // Transform expiring certifications for calendar
  const calendarEvents = expiringCerts.map((cert, index) => {
    const expiryDate =
      cert.expiryDate instanceof Date ? cert.expiryDate : new Date(cert.expiryDate);
    const daysUntilExpiry = Math.ceil(
      (expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    let status: 'expired' | 'expiring_soon' | 'due_soon' = 'due_soon';
    if (daysUntilExpiry <= 0) {
      status = 'expired';
    } else if (daysUntilExpiry <= 7) {
      status = 'expiring_soon';
    }

    return {
      id: `${cert.pilotName}-${cert.checkCode}-${index}`,
      pilotName: cert.pilotName,
      employeeId: cert.employeeId,
      checkCode: cert.checkCode,
      checkDescription: cert.checkDescription,
      expiryDate,
      status,
    };
  });

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="p-6">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E4002B] mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading certification data...</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="p-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Certification Management</h1>
                <p className="text-gray-600 mt-1">
                  Manage pilot certifications and track compliance across all check types
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowBulkModal(true)}
                  className="flex items-center px-3 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  <FileEdit className="w-4 h-4 mr-2" />
                  Bulk Update
                </button>
                <div className="h-6 w-px bg-gray-300 mx-1"></div>
                <button
                  onClick={() => setCurrentView('list')}
                  className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                    currentView === 'list'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:text-gray-900 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <List className="w-4 h-4 mr-2" />
                  List
                </button>
                <button
                  onClick={() => setCurrentView('calendar')}
                  className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                    currentView === 'calendar'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:text-gray-900 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  Calendar
                </button>
                <button
                  onClick={() => setCurrentView('timeline')}
                  className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                    currentView === 'timeline'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:text-gray-900 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Timeline
                </button>
                <button
                  onClick={() => setCurrentView('category-timeline')}
                  className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                    currentView === 'category-timeline'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:text-gray-900 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <Target className="w-4 h-4 mr-2" />
                  By Category
                </button>
              </div>
            </div>
          </div>

          {/* Calendar View */}
          {currentView === 'calendar' && (
            <div className="mb-8">
              <CertificationCalendar
                certifications={calendarEvents}
                onDateSelect={(date, events) => {
                  console.log('Selected date:', date, 'Events:', events);
                }}
              />
            </div>
          )}

          {/* Fleet Timeline View */}
          {currentView === 'timeline' && (
            <div className="mb-8">
              <FleetTimelineView />
            </div>
          )}

          {/* Category Timeline View */}
          {currentView === 'category-timeline' && (
            <div className="mb-8">
              <CategoryTimelineView />
            </div>
          )}

          {/* List View */}
          {currentView === 'list' && (
            <>
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{checkTypes.length}</p>
                    <p className="text-gray-600 text-sm">Total Check Types</p>
                  </div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-yellow-600">{expiringCerts.length}</p>
                    <p className="text-gray-600 text-sm">Expiring Soon</p>
                  </div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">{expiredPilots.length}</p>
                    <p className="text-gray-600 text-sm">Pilots with Expired</p>
                  </div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
                    <p className="text-gray-600 text-sm">Categories</p>
                  </div>
                </div>
              </div>

              {/* Filter */}
              <div className="mb-6">
                <div className="flex items-center space-x-2 flex-wrap">
                  <button
                    onClick={() => setFilter('all')}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      filter === 'all'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All Categories
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setFilter(category)}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        filter === category
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {/* Check Types Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCheckTypes.map((checkType) => (
                  <CheckTypeCard key={checkType.id} checkType={checkType} />
                ))}
              </div>
            </>
          )}

          {/* Bulk Certification Modal - Lazy Loaded */}
          {showBulkModal && (
            <LazyLoader type="modal">
              <LazyBulkCertificationModal
                isOpen={showBulkModal}
                onClose={() => setShowBulkModal(false)}
                onSuccess={() => {
                  setShowBulkModal(false);
                  // Optionally refresh data here if needed
                }}
              />
            </LazyLoader>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
