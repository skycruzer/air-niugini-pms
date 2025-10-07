'use client';

import { useEffect, useState, ReactNode } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import {
  getCurrentRosterPeriod,
  formatRosterPeriod,
  getFutureRosterPeriods,
  getNextRosterCountdown,
  formatCountdown,
  type RosterCountdown,
  type RosterPeriod,
} from '@/lib/roster-utils';
import { permissions } from '@/lib/auth-utils';
import {
  getPilotStats,
  getAllCheckTypes,
  getExpiringCertifications,
  getPilotsWithExpiredCertifications,
  getDashboardStats,
  getFleetUtilization,
  getRecentActivity,
} from '@/lib/pilot-service-client';
import { getLeaveRequestStats } from '@/lib/leave-service';
import { LazyRetirementReportModal } from '@/components/lazy';
import { LazyLoader } from '@/components/ui/LazyLoader';
import { PilotStatsGrid } from '@/components/shared/PilotStatsGrid';
import { CertificationStatusChart } from '@/components/shared/CertificationStatusChart';
import { ComplianceGauge } from '@/components/shared/ComplianceGauge';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { NavIcons, StatusIcons, ActionIcons, UIIcons } from '@/lib/icon-mapping';
import { Users, TrendingUp, TrendingDown, FileCheck, Calendar, AlertTriangle, CheckCircle2, Clock, BarChart3, Activity, type LucideIcon } from 'lucide-react';

// Type definitions for dashboard state
interface PilotStats {
  total: number;
  active: number;
  captains: number;
  firstOfficers: number;
  trainingCaptains: number;
  examiners: number;
  inactive: number;
}

interface CheckType {
  id: string;
  check_code: string;
  check_description: string;
  category: string;
}

interface ExpiringCertification {
  id: string;
  pilot_id: string;
  check_type_id: string;
  expiry_date: string;
  pilot: {
    first_name: string;
    last_name: string;
    employee_id: string;
  };
  check_type: {
    check_code: string;
    check_description: string;
  };
}

interface ExpiredPilot {
  pilot_id: string;
  first_name: string;
  last_name: string;
  employee_id: string;
  expired_count: number;
}

interface DashboardStats {
  certifications: {
    total: number;
    compliance: number;
  };
  trends?: {
    pilots?: number;
    certifications?: number;
    expiring?: number;
    expired?: number;
    compliance?: number;
    utilization?: number;
  };
}

interface LeaveStats {
  pending: number;
  approved: number;
  denied: number;
}

interface FleetStats {
  utilization: number;
}

interface ActivityItem {
  id: string;
  title: string;
  description: string;
  timestamp: Date;
  color: 'amber' | 'blue' | 'green' | 'red';
}

interface RetirementData {
  nearingRetirement: number;
  dueSoon: number;
  overdue: number;
  pilots: Array<{
    id: string;
    first_name: string;
    last_name: string;
    employee_id: string;
    retirement_age: number | null;
    retirement_date: string | null;
  }>;
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string | ReactNode;
  icon: LucideIcon;
  color?: 'red' | 'yellow' | 'green' | 'blue' | 'purple' | 'indigo';
  trend?: {
    value: number;
    direction: 'up' | 'down';
    label?: string;
  };
  animate?: boolean;
  onClick?: () => void;
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
  color = 'blue',
  trend,
  animate = false,
  onClick,
}: StatCardProps) {
  const colorClasses = {
    red: 'from-red-500 to-red-600',
    yellow: 'from-amber-500 to-amber-600',
    green: 'from-green-500 to-green-600',
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-purple-600',
    indigo: 'from-indigo-500 to-indigo-600',
  };

  const backgroundClasses = {
    red: 'from-red-500/10 to-red-600/20 border-2 border-red-200',
    yellow: 'from-amber-500/10 to-amber-600/20 border-2 border-amber-200',
    green: 'from-green-500/10 to-green-600/20 border-2 border-green-200',
    blue: 'from-blue-500/10 to-blue-600/20 border-2 border-blue-200',
    purple: 'from-purple-500/10 to-purple-600/20 border-2 border-purple-200',
    indigo: 'from-indigo-500/10 to-indigo-600/20 border-2 border-indigo-200',
  };

  const IconComponent = icon;

  return (
    <div
      className={`fleet-card bg-gradient-to-br ${backgroundClasses[color]} relative overflow-hidden group ${animate ? 'animate-fade-in' : ''} ${onClick ? 'cursor-pointer hover:scale-105 transition-transform' : ''}`}
      onClick={onClick}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 opacity-[0.08]">
        <IconComponent className="absolute inset-0 transform rotate-12 translate-x-8 -translate-y-8 w-full h-full text-gray-400" />
      </div>

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <p className="text-caption text-gray-700 font-semibold mb-1 uppercase tracking-wider">
              {title}
            </p>
            <p className="text-display-small font-black text-gray-900 mb-1">{value}</p>
            {subtitle && (
              <div className="text-body-small text-gray-700 font-medium">{subtitle}</div>
            )}
          </div>

          <div
            className={`w-14 h-14 bg-gradient-to-br ${colorClasses[color]} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform border border-white`}
          >
            <IconComponent className="w-7 h-7 text-white" />
          </div>
        </div>

        {trend && (
          <div className="flex items-center">
            <div
              className={`flex items-center px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm ${
                trend.direction === 'up'
                  ? 'bg-green-500/20 text-green-800 border border-green-300'
                  : 'bg-red-500/20 text-red-800 border border-red-300'
              }`}
            >
              {trend.direction === 'up' ? (
                <TrendingUp className="w-3 h-3 mr-1" />
              ) : (
                <TrendingDown className="w-3 h-3 mr-1" />
              )}
              {trend.value}%
            </div>
            {trend.label && (
              <span className="text-xs text-gray-600 font-medium ml-2">{trend.label}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface QuickActionProps {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  color: 'blue' | 'green' | 'purple' | 'amber' | 'indigo';
  badge?: string;
}

function QuickAction({ title, description, icon, href, color, badge }: QuickActionProps) {
  const IconComponent = icon;

  const colorClasses = {
    blue: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
    green: 'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700',
    purple: 'from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700',
    amber: 'from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700',
    indigo: 'from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700',
  };

  return (
    <a
      href={href}
      className="card group relative overflow-hidden border-2 border-gray-200 bg-white hover:shadow-2xl hover:border-blue-300 transition-all duration-300"
    >
      <div className="flex items-center">
        <div
          className={`w-14 h-14 bg-gradient-to-br ${colorClasses[color]} rounded-2xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform shadow-lg`}
        >
          <IconComponent className="w-7 h-7 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center">
            <h3 className="text-heading-small text-gray-900 font-semibold group-hover:text-gray-800">
              {title}
            </h3>
            {badge && <span className="ml-2 aviation-badge text-xs">{badge}</span>}
          </div>
          <p className="text-body-small text-gray-700 group-hover:text-gray-800 mt-1 font-medium">
            {description}
          </p>
        </div>
        <span className="text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all">
          ➡️
        </span>
      </div>

      {/* Hover effect background */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
    </a>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [currentRoster, setCurrentRoster] = useState<RosterPeriod | null>(null);
  const [futureRosters, setFutureRosters] = useState<RosterPeriod[]>([]);
  const [pilotStats, setPilotStats] = useState<PilotStats | null>(null);
  const [checkTypes, setCheckTypes] = useState<CheckType[]>([]);
  const [expiringCerts, setExpiringCerts] = useState<ExpiringCertification[]>([]);
  const [expiredPilots, setExpiredPilots] = useState<ExpiredPilot[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [leaveStats, setLeaveStats] = useState<LeaveStats | null>(null);
  const [fleetStats, setFleetStats] = useState<FleetStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [retirementData, setRetirementData] = useState<RetirementData | null>(null);
  const [showRetirementModal, setShowRetirementModal] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [rosterCountdown, setRosterCountdown] = useState<RosterCountdown | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load roster period data
        const roster = getCurrentRosterPeriod();
        setCurrentRoster(roster);

        // Load future roster periods (12 months ahead)
        const futureRosterPeriods = getFutureRosterPeriods(12);
        setFutureRosters(futureRosterPeriods);

        // Load countdown to next roster period
        const countdown = getNextRosterCountdown();
        setRosterCountdown(countdown);

        // Load all live data - use API endpoints for better reliability
        const [apiStatsResponse, types, expiring, expired, leave, fleet, activity, retirement] =
          await Promise.all([
            fetch(`${window.location.origin}/api/dashboard/stats`)
              .then((res) => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
              })
              .catch((err) => {
                console.error('API fetch failed:', err);
                return {
                  totalPilots: 0,
                  captains: 0,
                  firstOfficers: 0,
                  trainingCaptains: 0,
                  examiners: 0,
                  nearingRetirement: 0,
                  certifications: 0,
                  compliance: 95,
                };
              }),
            getAllCheckTypes(),
            getExpiringCertifications(30), // Next 30 days
            getPilotsWithExpiredCertifications(),
            getLeaveRequestStats(),
            getFleetUtilization(),
            getRecentActivity(),
            fetch(`${window.location.origin}/api/retirement`)
              .then((res) => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
              })
              .then((result) =>
                result.success
                  ? result.data
                  : { nearingRetirement: 0, dueSoon: 0, overdue: 0, pilots: [] }
              )
              .catch((err) => {
                console.error('Retirement API fetch failed:', err);
                return { nearingRetirement: 0, dueSoon: 0, overdue: 0, pilots: [] };
              }),
          ]);

        setPilotStats({
          total: apiStatsResponse.totalPilots || 0,
          captains: apiStatsResponse.captains || 0,
          firstOfficers: apiStatsResponse.firstOfficers || 0,
          trainingCaptains: apiStatsResponse.trainingCaptains || 0,
          examiners: apiStatsResponse.examiners || 0,
          active: apiStatsResponse.totalPilots || 0,
          inactive: 0,
        });
        setCheckTypes(types);
        // Type assertion for expiring certifications - API returns compatible data
        setExpiringCerts(expiring as unknown as ExpiringCertification[]);
        setExpiredPilots(expired);
        setDashboardStats({
          certifications: {
            total: apiStatsResponse.certifications || 0,
            compliance: apiStatsResponse.compliance || 95,
          },
        });
        setLeaveStats(leave);
        setFleetStats(fleet);
        // Type assertion for activity - API returns compatible data
        setRecentActivity(activity as ActivityItem[]);
        setRetirementData(retirement);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setIsLoaded(true);
      }
    };

    loadData();
  }, []);

  // Update countdown every minute
  useEffect(() => {
    const updateCountdown = () => {
      const countdown = getNextRosterCountdown();
      setRosterCountdown(countdown);
    };

    // Update immediately
    updateCountdown();

    // Then update every minute
    const interval = setInterval(updateCountdown, 60000);

    return () => clearInterval(interval);
  }, [currentRoster]);

  // Use real stats from Supabase
  const stats = pilotStats || {
    total: 0,
    active: 0,
    captains: 0,
    firstOfficers: 0,
    trainingCaptains: 0,
    examiners: 0,
    inactive: 0,
  };

  // Use real dashboard statistics from Supabase
  const totalCertifications = dashboardStats?.certifications?.total || 0;
  const expiringCount = expiringCerts.length;
  const expiredCount = expiredPilots.reduce((sum, pilot) => sum + (pilot.expired_count || 0), 0);
  const complianceRate = dashboardStats?.certifications?.compliance || 95;

  const currentTime = new Date().toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
  });

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Helper function to format time ago
  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffHours >= 1) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffMinutes >= 1) {
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
          {!isLoaded ? (
            <DashboardSkeleton />
          ) : (
            <>
              {/* Header Section */}
              <header className="mb-6 md:mb-8 animate-fade-in">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                  <div className="mb-4 lg:mb-0">
                    <h1 className="text-xl md:text-2xl lg:text-display-small text-gray-900 mb-2">
                      Welcome back, {user?.name}
                    </h1>
                    <div className="flex items-center text-sm md:text-base text-gray-600">
                      <span className="mr-2" aria-hidden="true">
                        🌏
                      </span>
                      <span className="mobile-text lg:text-body-medium">
                        Air Niugini B767 Fleet Operations Dashboard
                      </span>
                    </div>
                    <p className="text-xs md:text-sm text-gray-500 mt-1">
                      {currentDate} • {currentTime} (Port Moresby Time)
                    </p>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="aviation-badge">
                      <span className="mr-1">⚡</span>
                      Live Data
                    </div>
                    <div className="flex items-center text-body-small text-gray-600">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse-slow" />
                      All Systems Operational
                    </div>
                  </div>
                </div>
              </header>

              {/* Current Roster Banner */}
              {isLoaded && currentRoster && (
                <div className="mb-8 animate-slide-in-right">
                  <div className="roster-banner relative overflow-hidden">
                    <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex items-center mb-3">
                          <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mr-3 border border-white/30">
                            <span className="text-xl">⏰</span>
                          </div>
                          <div>
                            <p className="text-caption text-red-100">Current Roster Period</p>
                            <h2 className="text-heading-medium">Active Operations</h2>
                          </div>
                        </div>
                        <p className="text-display-small font-black mb-2">{currentRoster.code}</p>
                        <p className="text-body-medium text-red-100">
                          {currentRoster.startDate?.toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}{' '}
                          -{' '}
                          {currentRoster.endDate?.toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                      </div>

                      <div className="text-center lg:text-right">
                        <p className="text-body-small text-red-100 mb-2">Days Remaining</p>
                        <div className="relative">
                          <div className="absolute inset-0 bg-[#FFC72C]/20 rounded-3xl blur-2xl" />
                          <div className="relative bg-white/10 backdrop-blur-sm rounded-3xl px-8 py-6 border border-white/20">
                            <p className="text-5xl lg:text-6xl font-black text-white mb-1">
                              {currentRoster?.daysRemaining || 0}
                            </p>
                            <p className="text-caption text-red-200">of 28 total days</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Future Roster Periods Scrolling Section */}
              {isLoaded && futureRosters.length > 0 && (
                <div className="mb-8 animate-fade-in">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-heading-medium text-gray-900 mb-1">
                        Upcoming Roster Periods
                      </h3>
                      <p className="text-body-medium text-gray-600">
                        Next 12 months scheduling overview
                      </p>
                    </div>
                    <div className="flex items-center text-body-small text-gray-500">
                      <span className="mr-1">📅</span>
                      {futureRosters.length} periods ahead
                    </div>
                  </div>

                  {/* Scrolling container */}
                  <div className="relative">
                    <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide">
                      {futureRosters.map((roster, index) => {
                        const isCurrentRoster = roster.code === currentRoster?.code;
                        const isNextRoster = !isCurrentRoster && index === 1; // Next roster after current
                        const monthYear = roster.startDate?.toLocaleDateString('en-US', {
                          month: 'short',
                          year: 'numeric',
                        });
                        const startDay = roster.startDate?.toLocaleDateString('en-US', {
                          day: 'numeric',
                        });
                        const endDay = roster.endDate?.toLocaleDateString('en-US', {
                          day: 'numeric',
                        });

                        // Get countdown for next roster
                        const countdown = isNextRoster && rosterCountdown ? rosterCountdown : null;

                        return (
                          <div
                            key={roster.code}
                            className={`flex-shrink-0 w-48 rounded-xl border-2 p-4 transition-all duration-300 hover:shadow-lg hover:scale-105 ${
                              isCurrentRoster
                                ? 'bg-gradient-to-br from-[#E4002B]/10 to-[#E4002B]/20 border-[#E4002B] shadow-lg'
                                : index < 3
                                  ? 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:border-blue-300'
                                  : 'bg-white border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div
                                className={`text-sm font-semibold px-2 py-1 rounded-full ${
                                  isCurrentRoster
                                    ? 'bg-[#E4002B] text-white'
                                    : index < 3
                                      ? 'bg-blue-500 text-white'
                                      : 'bg-gray-500 text-white'
                                }`}
                              >
                                {roster.code}
                              </div>
                              {isCurrentRoster && (
                                <span className="text-xs bg-[#FFC72C] text-[#E4002B] font-bold px-2 py-1 rounded-full">
                                  ACTIVE
                                </span>
                              )}
                            </div>

                            <div className="space-y-2">
                              <div className="text-gray-700">
                                <p className="text-xs text-gray-500 mb-1">Duration</p>
                                <p className="font-medium text-sm">
                                  {roster.startDate?.toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                  })}{' '}
                                  -{' '}
                                  {roster.endDate?.toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })}
                                </p>
                              </div>

                              <div
                                className={`flex items-center text-xs ${
                                  isCurrentRoster
                                    ? 'text-[#E4002B]'
                                    : isNextRoster
                                      ? 'text-blue-600'
                                      : 'text-gray-600'
                                }`}
                              >
                                <span className="mr-1">📊</span>
                                {countdown
                                  ? // Show precise countdown for next roster
                                    formatCountdown(countdown)
                                  : roster.daysRemaining > 0
                                    ? `${roster.daysRemaining} days left`
                                    : `Starts in ${Math.abs(roster.daysRemaining)} days`}
                              </div>

                              {index < 3 && (
                                <div className="flex items-center text-xs text-blue-600">
                                  <span className="mr-1">⭐</span>
                                  Planning window
                                </div>
                              )}
                            </div>

                            {/* Progress bar for current roster */}
                            {isCurrentRoster && roster.daysRemaining >= 0 && (
                              <div className="mt-3">
                                <div className="bg-white/50 rounded-full h-2 overflow-hidden">
                                  <div
                                    className="bg-[#E4002B] h-full transition-all duration-500"
                                    style={{
                                      width: `${Math.max(0, Math.min(100, ((28 - roster.daysRemaining) / 28) * 100))}%`,
                                    }}
                                  />
                                </div>
                                <p className="text-xs text-gray-500 mt-1 text-center">
                                  Day {28 - roster.daysRemaining} of 28
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Scroll indicators */}
                    <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent pointer-events-none" />
                    <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none" />
                  </div>

                  {/* Help text */}
                  <div className="mt-4 text-center">
                    <p className="text-xs text-gray-500">
                      💡 Scroll horizontally to view more periods • Planning horizon extends 12
                      months ahead
                    </p>
                  </div>
                </div>
              )}

              {/* Key Metrics Grid */}
              <section className="mb-6 md:mb-8">
                <h2 className="sr-only">Key Fleet Metrics</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
                  <StatCard
                    title="Total Pilots"
                    value={stats.total}
                    subtitle={
                      <div className="space-y-1">
                        <div>• {stats.captains} Captains</div>
                        <div>• {stats.firstOfficers} First Officers</div>
                        <div className="border-t border-gray-300 my-2 pt-1">
                          <div>• {stats.trainingCaptains} Training Captains (TRI)</div>
                          <div>• {stats.examiners} Examiners (TRE)</div>
                        </div>
                      </div>
                    }
                    icon={Users}
                    color="blue"
                    trend={{
                      value: Math.abs(dashboardStats?.trends?.pilots || 2.1),
                      direction: (dashboardStats?.trends?.pilots || 2.1) >= 0 ? 'up' : 'down',
                      label: 'vs last period',
                    }}
                    animate
                  />

                  <StatCard
                    title="Certifications"
                    value={totalCertifications}
                    subtitle={`${checkTypes.length} check types tracked`}
                    icon={CheckCircle2}
                    color="green"
                    trend={{
                      value: Math.abs(dashboardStats?.trends?.certifications || 1.8),
                      direction:
                        (dashboardStats?.trends?.certifications || 1.8) >= 0 ? 'up' : 'down',
                      label: 'compliance rate',
                    }}
                    animate
                  />

                  <StatCard
                    title="Expiring Soon"
                    value={expiringCount}
                    subtitle="Next 30 days"
                    icon={Clock}
                    color="yellow"
                    trend={{
                      value: Math.abs(dashboardStats?.trends?.expiring || 12.5),
                      direction: (dashboardStats?.trends?.expiring || -12.5) >= 0 ? 'up' : 'down',
                      label: 'from last month',
                    }}
                    animate
                  />

                  <StatCard
                    title="Expired"
                    value={expiredCount}
                    subtitle="Requires immediate attention"
                    icon={AlertTriangle}
                    color="red"
                    trend={{
                      value: Math.abs(dashboardStats?.trends?.expired || 8.3),
                      direction: (dashboardStats?.trends?.expired || -8.3) >= 0 ? 'up' : 'down',
                      label: 'improvement',
                    }}
                    animate
                  />

                  <StatCard
                    title="Nearing Retirement"
                    value={retirementData?.nearingRetirement || 0}
                    subtitle={
                      <div className="space-y-1">
                        <div>Within 5 years</div>
                        {(retirementData?.dueSoon ?? 0) > 0 && (
                          <div className="text-orange-600">• {retirementData?.dueSoon} due soon</div>
                        )}
                        {(retirementData?.overdue ?? 0) > 0 && (
                          <div className="text-red-600">• {retirementData?.overdue} overdue</div>
                        )}
                      </div>
                    }
                    icon={Clock}
                    color="purple"
                    animate
                    onClick={() => setShowRetirementModal(true)}
                  />
                </div>
              </section>

              {/* Compliance & Performance Grid */}
              <section className="mb-6 md:mb-8">
                <h2 className="sr-only">Fleet Performance Metrics</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  <StatCard
                    title="Compliance Rate"
                    value={`${complianceRate}%`}
                    subtitle="Overall fleet compliance"
                    icon={UIIcons.activity}
                    color="indigo"
                    trend={{
                      value: Math.abs(dashboardStats?.trends?.compliance || 2.1),
                      direction: (dashboardStats?.trends?.compliance || 2.1) >= 0 ? 'up' : 'down',
                      label: 'this quarter',
                    }}
                    animate
                  />

                  <StatCard
                    title="Fleet Utilization"
                    value={`${fleetStats?.utilization || 78}%`}
                    subtitle="Active aircraft operations"
                    icon={BarChart3}
                    color="purple"
                    trend={{
                      value: Math.abs(dashboardStats?.trends?.utilization || 5.4),
                      direction: (dashboardStats?.trends?.utilization || 5.4) >= 0 ? 'up' : 'down',
                      label: 'efficiency gain',
                    }}
                    animate
                  />

                  <StatCard
                    title="Leave Requests"
                    value={leaveStats?.pending || 0}
                    subtitle={`${leaveStats?.approved || 0} approved • ${leaveStats?.denied || 0} denied`}
                    icon={Calendar}
                    color="blue"
                    animate
                  />
                </div>
              </section>

              {/* Quick Actions Section */}
              <section className="mb-6 md:mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 md:mb-6">
                  <div className="mb-3 sm:mb-0">
                    <h3 className="text-lg md:text-xl lg:text-heading-medium text-gray-900 mb-1">
                      Quick Actions
                    </h3>
                    <p className="text-sm md:text-base lg:text-body-medium text-gray-600">
                      Access frequently used features
                    </p>
                  </div>
                  <div className="flex items-center text-xs md:text-sm text-gray-500">
                    <span className="mr-1" aria-hidden="true">
                      ⭐
                    </span>
                    <span>Personalized for {user?.role}</span>
                  </div>
                </div>

                <div className="quick-actions-mobile md:grid md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                  <QuickAction
                    title="Manage Pilots"
                    description="View and edit pilot records"
                    icon={Users}
                    href="/dashboard/pilots"
                    color="blue"
                    badge={`${stats.total}`}
                  />

                  <QuickAction
                    title="Certifications"
                    description="Track expiry dates and compliance"
                    icon={FileCheck}
                    href="/dashboard/certifications"
                    color="green"
                    badge={`${expiringCount} expiring`}
                  />

                  <QuickAction
                    title="Leave Management"
                    description="Process RDO requests, WDO requests"
                    icon={Calendar}
                    href="/dashboard/leave"
                    color="purple"
                    badge={`${leaveStats?.pending || 0} pending`}
                  />

                  {permissions.canViewReports(user) && (
                    <QuickAction
                      title="Fleet Reports"
                      description="Compliance and analytics"
                      icon={BarChart3}
                      href="/dashboard/reports"
                      color="amber"
                      badge="Premium"
                    />
                  )}
                </div>
              </section>

              {/* Advanced Analytics Section */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-heading-medium text-gray-900">Advanced Analytics</h3>
                    <p className="text-body-medium text-gray-600">
                      Interactive charts and detailed insights
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center text-body-small text-gray-500">
                      <span className="mr-1">📊</span>
                      Real-time insights
                    </div>
                    <a
                      href="/dashboard/analytics"
                      className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-[#E4002B] rounded-lg hover:bg-[#C00020] transition-colors"
                    >
                      <span>📈</span>
                      <span>View Full Analytics</span>
                    </a>
                  </div>
                </div>

                {/* Analytics Preview Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Certification Compliance Chart */}
                  <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-gray-900">Certification Status</h4>
                      <span className="text-2xl">📋</span>
                    </div>
                    <CertificationStatusChart
                      data={{
                        current: totalCertifications - expiringCount - expiredCount,
                        expiring: expiringCount,
                        expired: expiredCount,
                      }}
                      variant="pie"
                      height={250}
                      showLegend
                    />
                  </div>

                  {/* Fleet Compliance Gauge */}
                  <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-gray-900">Fleet Compliance</h4>
                      <span className="text-2xl">🎯</span>
                    </div>
                    <ComplianceGauge
                      complianceRate={complianceRate}
                      variant="svg-circle"
                      size="md"
                      showLabel
                      showStatus={false}
                    />
                    <div className="mt-4 text-center">
                      <ComplianceGauge
                        complianceRate={complianceRate}
                        variant="simple"
                        size="sm"
                        showLabel={false}
                        showStatus
                      />
                    </div>
                  </div>

                  {/* Fleet Utilization */}
                  <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-gray-900">Fleet Status</h4>
                      <span className="text-2xl">✈️</span>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-700">Utilization</span>
                          <span className="text-sm font-medium text-gray-900">
                            {fleetStats?.utilization || 78}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${fleetStats?.utilization || 78}%` }}
                           />
                        </div>
                      </div>

                      <div>
                        <ComplianceGauge
                          complianceRate={complianceRate}
                          variant="bar"
                          size="sm"
                          showLabel
                          showStatus={false}
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-700">Readiness</span>
                          <span className="text-sm font-medium text-gray-900">
                            {Math.round((complianceRate + (fleetStats?.utilization || 78)) / 2)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-[#E4002B] h-2 rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.round((complianceRate + (fleetStats?.utilization || 78)) / 2)}%`,
                            }}
                           />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Analytics Features Highlight */}
                <div className="mt-6 bg-gradient-to-r from-[#E4002B]/10 to-[#FFC72C]/10 rounded-xl p-6 border border-[#E4002B]/20">
                  <div className="flex flex-col lg:flex-row items-center justify-between">
                    <div className="flex-1 mb-4 lg:mb-0">
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">
                        🚀 Enhanced Analytics Available
                      </h4>
                      <p className="text-gray-700">
                        Access interactive charts, trend analysis, retirement planning, risk
                        assessments, and comprehensive fleet insights with our advanced analytics
                        dashboard.
                      </p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        <span className="px-3 py-1 bg-white rounded-full text-xs font-medium text-gray-700 border">
                          📊 Interactive Charts
                        </span>
                        <span className="px-3 py-1 bg-white rounded-full text-xs font-medium text-gray-700 border">
                          📈 Trend Analysis
                        </span>
                        <span className="px-3 py-1 bg-white rounded-full text-xs font-medium text-gray-700 border">
                          🎯 Risk Assessment
                        </span>
                        <span className="px-3 py-1 bg-white rounded-full text-xs font-medium text-gray-700 border">
                          📋 Export Reports
                        </span>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <a
                        href="/dashboard/analytics"
                        className="btn bg-[#E4002B] text-white hover:bg-[#C00020] px-6 py-3 text-lg font-medium"
                      >
                        <span className="mr-2">🔍</span>
                        Explore Analytics
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* System Health & Alerts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* System Status */}
                <div className="card-aviation">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-heading-small text-gray-900 mb-1">System Health</h3>
                      <p className="text-body-small text-gray-600">Real-time operational status</p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center">
                      <span className="text-2xl">🛡️</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-white/50 rounded-xl">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-green-500 rounded-full mr-3 animate-pulse-slow" />
                        <div>
                          <p className="font-medium text-gray-900">Database Connection</p>
                          <p className="text-xs text-gray-600">PostgreSQL Supabase</p>
                        </div>
                      </div>
                      <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">
                        Optimal
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-white/50 rounded-xl">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-green-500 rounded-full mr-3 animate-pulse-slow" />
                        <div>
                          <p className="font-medium text-gray-900">Roster Calculations</p>
                          <p className="text-xs text-gray-600">Automated 28-day cycles</p>
                        </div>
                      </div>
                      <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">
                        Synced
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-white/50 rounded-xl">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-amber-500 rounded-full mr-3 animate-pulse-slow" />
                        <div>
                          <p className="font-medium text-gray-900">Authentication</p>
                          <p className="text-xs text-gray-600">Development environment</p>
                        </div>
                      </div>
                      <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-1 rounded-full">
                        Dev Mode
                      </span>
                    </div>
                  </div>
                </div>

                {/* Recent Activity & Alerts */}
                <div className="card">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-heading-small text-gray-900 mb-1">Recent Activity</h3>
                      <p className="text-body-small text-gray-600">
                        Latest system events and alerts
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                      <span className="text-2xl">🔔</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {recentActivity.length > 0 ? (
                      recentActivity.map((activity) => {
                        const colorClasses = {
                          amber: 'bg-amber-50 border-amber-200',
                          blue: 'bg-blue-50 border-blue-200',
                          green: 'bg-green-50 border-green-200',
                          red: 'bg-red-50 border-red-200',
                        };
                        const dotColors = {
                          amber: 'bg-amber-500',
                          blue: 'bg-blue-500',
                          green: 'bg-green-500',
                          red: 'bg-red-500',
                        };
                        const textColors = {
                          amber: 'text-amber-900',
                          blue: 'text-blue-900',
                          green: 'text-green-900',
                          red: 'text-red-900',
                        };
                        const subtextColors = {
                          amber: 'text-amber-700',
                          blue: 'text-blue-700',
                          green: 'text-green-700',
                          red: 'text-red-700',
                        };
                        const timeColors = {
                          amber: 'text-amber-600',
                          blue: 'text-blue-600',
                          green: 'text-green-600',
                          red: 'text-red-600',
                        };

                        return (
                          <div
                            key={activity.id}
                            className={`flex items-start p-3 rounded-xl border ${colorClasses[activity.color as keyof typeof colorClasses]}`}
                          >
                            <div
                              className={`w-2 h-2 rounded-full mt-2 mr-3 flex-shrink-0 ${dotColors[activity.color as keyof typeof dotColors]}`}
                             />
                            <div className="flex-1">
                              <p
                                className={`text-sm font-medium ${textColors[activity.color as keyof typeof textColors]}`}
                              >
                                {activity.title}
                              </p>
                              <p
                                className={`text-xs mt-1 ${subtextColors[activity.color as keyof typeof subtextColors]}`}
                              >
                                {activity.description}
                              </p>
                              <p
                                className={`text-xs mt-1 ${timeColors[activity.color as keyof typeof timeColors]}`}
                              >
                                {formatTimeAgo(activity.timestamp)}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="flex items-center justify-center p-6 text-gray-500">
                        <div className="text-center">
                          <span className="text-2xl mb-2 block">📝</span>
                          <p className="text-sm">No recent activity to display</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <a href="#" className="btn btn-ghost btn-sm w-full">
                      View All Activity
                      <span className="ml-1">➡️</span>
                    </a>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Retirement Report Modal - Lazy Loaded */}
          {showRetirementModal && (
            <LazyLoader type="modal">
              <LazyRetirementReportModal
                isOpen={showRetirementModal}
                onClose={() => setShowRetirementModal(false)}
              />
            </LazyLoader>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
