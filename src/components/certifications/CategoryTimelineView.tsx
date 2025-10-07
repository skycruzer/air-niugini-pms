'use client';

import { useState, useEffect } from 'react';
import { CertificationTimeline } from './CertificationTimeline';
import { getCategoryIcon, getCategoryColor } from '@/lib/certification-utils';
import { useRouter } from 'next/navigation';
import { BarChart3, TrendingUp, AlertTriangle } from 'lucide-react';

interface CategoryCertification {
  id: string;
  pilotId: string;
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

interface CategoryStats {
  category: string;
  total: number;
  expired: number;
  expiringSoon: number;
  current: number;
  complianceRate: number;
}

/**
 * CategoryTimelineView Component
 *
 * Displays timeline views grouped by certification category
 * - Shows all categories with individual timelines
 * - Category statistics and compliance rates
 * - Expandable/collapsible category sections
 */
export function CategoryTimelineView() {
  const router = useRouter();
  const [certifications, setCertifications] = useState<CategoryCertification[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategoryData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all pilots
        const pilotsResponse = await fetch('/api/pilots');
        if (!pilotsResponse.ok) {
          throw new Error('Failed to fetch pilots');
        }
        const pilotsResult = await pilotsResponse.json();

        if (!pilotsResult.success || !pilotsResult.data) {
          throw new Error('Invalid pilots data');
        }

        const pilots = pilotsResult.data;

        // Fetch certifications for all pilots
        const certPromises = pilots.map((pilot: any) =>
          fetch(`/api/pilots/${pilot.id}/certifications`)
            .then((res) => res.json())
            .then((result) => ({
              pilotId: pilot.id,
              pilotName: `${pilot.first_name} ${pilot.last_name}`,
              employeeId: pilot.employee_id,
              certifications: result.success ? result.data : [],
            }))
        );

        const allPilotCerts = await Promise.all(certPromises);

        // Flatten and transform certifications
        const allCerts: CategoryCertification[] = [];
        allPilotCerts.forEach((pilotData) => {
          pilotData.certifications
            .filter((cert: any) => cert.expiryDate) // Only include certs with expiry dates
            .forEach((cert: any) => {
              allCerts.push({
                id: `${pilotData.pilotId}-${cert.checkTypeId}`,
                pilotId: pilotData.pilotId,
                pilotName: pilotData.pilotName,
                employeeId: pilotData.employeeId,
                checkCode: cert.checkCode,
                checkDescription: cert.checkDescription,
                category: cert.category,
                expiryDate:
                  typeof cert.expiryDate === 'string' ? new Date(cert.expiryDate) : cert.expiryDate,
                status: cert.status,
              });
            });
        });

        setCertifications(allCerts);

        // Calculate stats by category
        const categories = Array.from(new Set(allCerts.map((c) => c.category)));
        const stats = categories
          .map((category) => {
            const categoryCerts = allCerts.filter((c) => c.category === category);
            const expired = categoryCerts.filter((c) => c.status.color === 'red').length;
            const expiringSoon = categoryCerts.filter((c) => c.status.color === 'yellow').length;
            const current = categoryCerts.filter((c) => c.status.color === 'green').length;
            const complianceRate =
              categoryCerts.length > 0 ? Math.round((current / categoryCerts.length) * 100) : 0;

            return {
              category,
              total: categoryCerts.length,
              expired,
              expiringSoon,
              current,
              complianceRate,
            };
          })
          .sort((a, b) => b.total - a.total); // Sort by total count descending

        setCategoryStats(stats);

        // Expand top 3 categories by default
        setExpandedCategories(new Set(stats.slice(0, 3).map((s) => s.category)));
      } catch (err) {
        console.error('Error fetching category timeline data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load category timeline data');
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryData();
  }, []);

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const expandAll = () => {
    setExpandedCategories(new Set(categoryStats.map((s) => s.category)));
  };

  const collapseAll = () => {
    setExpandedCategories(new Set());
  };

  const handleCertificationClick = (cert: any) => {
    // Navigate to pilot's certification page
    const pilotCert = certifications.find((c) => c.id === cert.id);
    if (pilotCert) {
      router.push(`/dashboard/pilots/${pilotCert.pilotId}/certifications`);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E4002B] mx-auto" />
          <p className="text-gray-600 mt-2">Loading category timelines...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="text-center py-12">
          <span className="text-6xl block mb-4">⚠️</span>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Error Loading Category Timelines
          </h3>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (certifications.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="text-center py-12">
          <span className="text-6xl block mb-4">📊</span>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Category Data</h3>
          <p className="text-gray-600">No certifications found across categories.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#E4002B] to-red-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <BarChart3 className="w-8 h-8 mr-3" />
            <div>
              <h2 className="text-2xl font-bold">Category Timeline Analysis</h2>
              <p className="text-white/90 mt-1">
                Certification timelines grouped by category • {categoryStats.length} categories
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={expandAll}
              className="px-4 py-2 bg-white text-[#E4002B] rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
            >
              Expand All
            </button>
            <button
              onClick={collapseAll}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm font-medium"
            >
              Collapse All
            </button>
          </div>
        </div>
      </div>

      {/* Category Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <span className="text-2xl font-bold text-blue-600">{categoryStats.length}</span>
          </div>
          <p className="text-sm text-blue-600">Total Categories</p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <span className="text-2xl font-bold text-green-600">
              {categoryStats.filter((s) => s.complianceRate >= 80).length}
            </span>
          </div>
          <p className="text-sm text-green-600">High Compliance (≥80%)</p>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <span className="text-2xl font-bold text-red-600">
              {categoryStats.filter((s) => s.complianceRate < 80).length}
            </span>
          </div>
          <p className="text-sm text-red-600">Needs Attention (&lt;80%)</p>
        </div>
      </div>

      {/* Category Sections */}
      <div className="space-y-4">
        {categoryStats.map((stat) => {
          const isExpanded = expandedCategories.has(stat.category);
          const categoryCerts = certifications.filter((c) => c.category === stat.category);
          const timelineEvents = categoryCerts.map((cert) => ({
            id: cert.id,
            checkCode: cert.checkCode,
            checkDescription: cert.checkDescription,
            category: cert.category,
            expiryDate:
              cert.expiryDate instanceof Date ? cert.expiryDate : new Date(cert.expiryDate),
            pilotName: cert.pilotName,
            employeeId: cert.employeeId,
          }));

          return (
            <div
              key={stat.category}
              className="bg-white rounded-lg border border-gray-200 shadow-sm"
            >
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(stat.category)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center flex-1">
                  <span className="text-2xl mr-3">{getCategoryIcon(stat.category)}</span>
                  <div className="text-left">
                    <h3 className="text-lg font-semibold text-gray-900">{stat.category}</h3>
                    <p className="text-sm text-gray-600">
                      {stat.total} certifications • {stat.complianceRate}% compliance
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 mr-4">
                  {/* Stats Pills */}
                  {stat.expired > 0 && (
                    <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                      {stat.expired} expired
                    </span>
                  )}
                  {stat.expiringSoon > 0 && (
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                      {stat.expiringSoon} expiring
                    </span>
                  )}
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    {stat.current} current
                  </span>

                  {/* Expand/Collapse Icon */}
                  <div
                    className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  >
                    ▼
                  </div>
                </div>
              </button>

              {/* Category Timeline */}
              {isExpanded && (
                <div className="border-t border-gray-200 p-6">
                  <CertificationTimeline
                    certifications={timelineEvents}
                    onCertificationClick={handleCertificationClick}
                    showPilotNames
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
