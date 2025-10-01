/**
 * @fileoverview PDF Report Data Service
 * Service layer for fetching and structuring data for PDF report generation
 *
 * @author Air Niugini Development Team
 * @version 1.0.0
 * @since 2025-09-27
 */

import { getSupabaseAdmin } from './supabase';
import { settingsService } from './settings-service';
import { getExpiringCertifications } from './expiring-certifications-service';
import { differenceInDays, differenceInYears, format, addYears } from 'date-fns';
import {
  ComplianceReportData,
  PilotReportData,
  FleetManagementReportData,
  PDFReportMetadata,
  ComplianceOverview,
  ExpirationBreakdown,
  ComplianceByCategory,
  PilotComplianceStatus,
  DetailedPilotRecord,
  PilotSummary,
  TrainingHistoryEntry,
  FleetRosterAnalysis,
  CaptainQualification,
  LeaveAnalysis,
  OperationalReadiness,
} from '@/types/pdf-reports';

/**
 * PDF Report Data Service Class
 */
export class PDFReportDataService {
  private supabase = getSupabaseAdmin();

  /**
   * Get settings data
   */
  private async getSettings() {
    try {
      return await settingsService.getSettings();
    } catch (error) {
      console.warn('Failed to load settings, using defaults:', error);
      // Return default values if settings fail to load
      return {
        app_title: 'Air Niugini Pilot Management System',
        alert_thresholds: {
          critical_days: 7,
          urgent_days: 14,
          warning_30_days: 30,
          warning_60_days: 60,
          early_warning_90_days: 90,
        },
        pilot_requirements: {
          pilot_retirement_age: 65,
          number_of_aircraft: 2,
          captains_per_hull: 7,
          first_officers_per_hull: 7,
          minimum_captains_per_hull: 10,
          minimum_first_officers_per_hull: 10,
          training_captains_per_pilots: 11,
          examiners_per_pilots: 11,
        },
      };
    }
  }

  /**
   * Generate compliance report data
   */
  async generateComplianceReportData(
    reportType: string,
    generatedBy: string,
    options?: { dateRange?: { from: string; to: string } }
  ): Promise<ComplianceReportData> {
    try {
      // Fetch base data
      const [pilotsData, checksData, checkTypesData] = await Promise.all([
        this.fetchPilots(),
        this.fetchPilotChecks(),
        this.fetchCheckTypes(),
      ]);

      const metadata = this.generateMetadata(reportType, 'Fleet Compliance Report', generatedBy);
      const overview = this.calculateComplianceOverview(pilotsData, checksData);
      const expirationBreakdown = this.calculateExpirationBreakdown(checksData);
      const complianceByCategory = this.calculateComplianceByCategory(checksData, checkTypesData);
      const pilotComplianceStatus = this.calculatePilotComplianceStatus(
        pilotsData,
        checksData,
        checkTypesData
      );

      const { expiredCertifications, expiringCertifications } =
        await this.categorizeExpiringCertifications(checksData, pilotsData, checkTypesData);

      const recommendations = this.generateComplianceRecommendations(
        overview,
        pilotComplianceStatus,
        expiredCertifications
      );

      return {
        metadata,
        overview,
        expirationBreakdown,
        complianceByCategory,
        pilotComplianceStatus,
        expiredCertifications,
        expiringCertifications,
        recommendations,
      };
    } catch (error) {
      console.error('Error generating compliance report data:', error);
      throw new Error('Failed to generate compliance report data');
    }
  }

  /**
   * Generate pilot report data
   */
  async generatePilotReportData(
    reportType: string,
    generatedBy: string,
    pilotId?: string
  ): Promise<PilotReportData> {
    try {
      const [pilotsData, checksData, checkTypesData, leaveData] = await Promise.all([
        pilotId ? this.fetchPilot(pilotId) : this.fetchPilots(),
        this.fetchPilotChecks(pilotId),
        this.fetchCheckTypes(),
        this.fetchLeaveRequests(pilotId),
      ]);

      const pilots = Array.isArray(pilotsData) ? pilotsData : [pilotsData];
      const metadata = this.generateMetadata(
        reportType,
        pilotId ? `Individual Pilot Report` : 'Pilot Summary Report',
        generatedBy
      );

      const detailedRecords = await Promise.all(
        pilots.map((pilot) =>
          this.createDetailedPilotRecord(pilot, checksData, checkTypesData, leaveData)
        )
      );

      const summary = this.calculatePilotSummaryStats(detailedRecords);

      return {
        metadata,
        reportScope: pilotId ? 'INDIVIDUAL' : 'ALL',
        pilots: detailedRecords,
        summary,
        recommendations: this.generatePilotRecommendations(detailedRecords),
      };
    } catch (error) {
      console.error('Error generating pilot report data:', error);
      throw new Error('Failed to generate pilot report data');
    }
  }

  /**
   * Generate fleet management report data
   */
  async generateFleetManagementReportData(
    reportType: string,
    generatedBy: string
  ): Promise<FleetManagementReportData> {
    try {
      const [pilotsData, checksData, checkTypesData, leaveData] = await Promise.all([
        this.fetchPilots(),
        this.fetchPilotChecks(),
        this.fetchCheckTypes(),
        this.fetchLeaveRequests(),
      ]);

      const metadata = this.generateMetadata(reportType, 'Fleet Management Report', generatedBy);
      const rosterAnalysis = this.calculateFleetRosterAnalysis(pilotsData);
      const captainQualifications = this.calculateCaptainQualifications(pilotsData);
      const leaveAnalysis = this.calculateLeaveAnalysis(leaveData, pilotsData);
      const operationalReadiness = await this.calculateOperationalReadiness(
        pilotsData,
        checksData,
        leaveData
      );
      const upcomingRetirements = await this.calculateUpcomingRetirements(pilotsData);

      return {
        metadata,
        rosterAnalysis,
        captainQualifications,
        leaveAnalysis,
        operationalReadiness,
        upcomingRetirements,
        recommendations: this.generateFleetManagementRecommendations(
          rosterAnalysis,
          operationalReadiness,
          upcomingRetirements
        ),
      };
    } catch (error) {
      console.error('Error generating fleet management report data:', error);
      throw new Error('Failed to generate fleet management report data');
    }
  }

  // =============================================================================
  // PRIVATE DATA FETCHING METHODS
  // =============================================================================

  private async fetchPilots() {
    const { data, error } = await this.supabase
      .from('pilots')
      .select('*')
      .order('seniority_number', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  private async fetchPilot(pilotId: string) {
    const { data, error } = await this.supabase
      .from('pilots')
      .select('*')
      .eq('id', pilotId)
      .single();

    if (error) throw error;
    return data;
  }

  private async fetchPilotChecks(pilotId?: string) {
    let query = this.supabase.from('pilot_checks').select(`
        *,
        pilot:pilots(*),
        check_type:check_types(*)
      `);

    if (pilotId) {
      query = query.eq('pilot_id', pilotId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  private async fetchCheckTypes() {
    const { data, error } = await this.supabase
      .from('check_types')
      .select('*')
      .order('category', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  private async fetchLeaveRequests(pilotId?: string) {
    let query = this.supabase.from('leave_requests').select(`
        *,
        pilot:pilots(*)
      `);

    if (pilotId) {
      query = query.eq('pilot_id', pilotId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  // =============================================================================
  // PRIVATE CALCULATION METHODS
  // =============================================================================

  private generateMetadata(
    reportType: string,
    title: string,
    generatedBy: string
  ): PDFReportMetadata {
    return {
      reportType,
      title,
      generatedAt: new Date().toISOString(),
      generatedBy,
      companyName: 'Air Niugini',
      fleetType: 'B767',
      reportPeriod: format(new Date(), 'MMMM yyyy'),
    };
  }

  private calculateComplianceOverview(pilots: any[], checks: any[]): ComplianceOverview {
    const totalPilots = pilots.filter((p) => p.is_active).length;
    const totalCertifications = checks.length;

    const now = new Date();
    const currentCertifications = checks.filter((check) => {
      if (!check.expiry_date) return true;
      return new Date(check.expiry_date) > now;
    }).length;

    const expiringCertifications = checks.filter((check) => {
      if (!check.expiry_date) return false;
      const daysUntil = differenceInDays(new Date(check.expiry_date), now);
      return daysUntil <= 30 && daysUntil >= 0;
    }).length;

    const expiredCertifications = checks.filter((check) => {
      if (!check.expiry_date) return false;
      return new Date(check.expiry_date) <= now;
    }).length;

    const complianceRate =
      totalCertifications > 0
        ? Math.round((currentCertifications / totalCertifications) * 100)
        : 100;

    return {
      totalPilots,
      totalCertifications,
      currentCertifications,
      expiringCertifications,
      expiredCertifications,
      complianceRate,
      lastUpdated: new Date().toISOString(),
    };
  }

  private calculateExpirationBreakdown(checks: any[]): ExpirationBreakdown {
    const now = new Date();

    const next7Days = checks.filter((check) => {
      if (!check.expiry_date) return false;
      const daysUntil = differenceInDays(new Date(check.expiry_date), now);
      return daysUntil <= 7 && daysUntil >= 0;
    }).length;

    const next14Days = checks.filter((check) => {
      if (!check.expiry_date) return false;
      const daysUntil = differenceInDays(new Date(check.expiry_date), now);
      return daysUntil <= 14 && daysUntil >= 0;
    }).length;

    const next30Days = checks.filter((check) => {
      if (!check.expiry_date) return false;
      const daysUntil = differenceInDays(new Date(check.expiry_date), now);
      return daysUntil <= 30 && daysUntil >= 0;
    }).length;

    const next60Days = checks.filter((check) => {
      if (!check.expiry_date) return false;
      const daysUntil = differenceInDays(new Date(check.expiry_date), now);
      return daysUntil <= 60 && daysUntil >= 0;
    }).length;

    const next90Days = checks.filter((check) => {
      if (!check.expiry_date) return false;
      const daysUntil = differenceInDays(new Date(check.expiry_date), now);
      return daysUntil <= 90 && daysUntil >= 0;
    }).length;

    const beyond90Days = checks.filter((check) => {
      if (!check.expiry_date) return false;
      const daysUntil = differenceInDays(new Date(check.expiry_date), now);
      return daysUntil > 90;
    }).length;

    return {
      next7Days,
      next14Days,
      next30Days,
      next60Days,
      next90Days,
      beyond90Days,
    };
  }

  private calculateComplianceByCategory(checks: any[], checkTypes: any[]): ComplianceByCategory[] {
    const categories = Array.from(new Set(checkTypes.map((ct) => ct.category || 'Other')));
    const now = new Date();

    return categories.map((category) => {
      const categoryChecks = checks.filter((check) => {
        const checkType = checkTypes.find((ct) => ct.id === check.check_type_id);
        return (checkType?.category || 'Other') === category;
      });

      const totalChecks = categoryChecks.length;
      const currentChecks = categoryChecks.filter((check) => {
        if (!check.expiry_date) return true;
        return new Date(check.expiry_date) > now;
      }).length;

      const expiringChecks = categoryChecks.filter((check) => {
        if (!check.expiry_date) return false;
        const daysUntil = differenceInDays(new Date(check.expiry_date), now);
        return daysUntil <= 30 && daysUntil >= 0;
      }).length;

      const expiredChecks = categoryChecks.filter((check) => {
        if (!check.expiry_date) return false;
        return new Date(check.expiry_date) <= now;
      }).length;

      const compliancePercentage =
        totalChecks > 0 ? Math.round((currentChecks / totalChecks) * 100) : 100;

      return {
        category,
        totalChecks,
        currentChecks,
        expiringChecks,
        expiredChecks,
        compliancePercentage,
      };
    });
  }

  private calculatePilotComplianceStatus(
    pilots: any[],
    checks: any[],
    checkTypes: any[]
  ): PilotComplianceStatus[] {
    const now = new Date();

    return pilots
      .filter((p) => p.is_active)
      .map((pilot) => {
        const pilotChecks = checks.filter((check) => check.pilot_id === pilot.id);

        const totalChecks = pilotChecks.length;
        const currentChecks = pilotChecks.filter((check) => {
          if (!check.expiry_date) return true;
          return new Date(check.expiry_date) > now;
        }).length;

        const expiringChecks = pilotChecks.filter((check) => {
          if (!check.expiry_date) return false;
          const daysUntil = differenceInDays(new Date(check.expiry_date), now);
          return daysUntil <= 30 && daysUntil >= 0;
        }).length;

        const expiredChecks = pilotChecks.filter((check) => {
          if (!check.expiry_date) return false;
          return new Date(check.expiry_date) <= now;
        }).length;

        const compliancePercentage =
          totalChecks > 0 ? Math.round((currentChecks / totalChecks) * 100) : 100;

        let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
        if (expiredChecks >= 5) riskLevel = 'CRITICAL';
        else if (expiredChecks >= 3) riskLevel = 'HIGH';
        else if (expiredChecks >= 1) riskLevel = 'MEDIUM';
        else riskLevel = 'LOW';

        const priorityActions: string[] = [];
        if (expiredChecks > 0) {
          priorityActions.push(`Renew ${expiredChecks} expired certification(s)`);
        }
        if (expiringChecks > 0) {
          priorityActions.push(`Schedule ${expiringChecks} expiring certification(s)`);
        }

        return {
          pilot,
          totalChecks,
          currentChecks,
          expiringChecks,
          expiredChecks,
          compliancePercentage,
          riskLevel,
          priorityActions,
        };
      });
  }

  private async categorizeExpiringCertifications(checks: any[], pilots: any[], checkTypes: any[]) {
    try {
      // Use the working expiring certifications service instead of manual calculation
      const expiringData = await getExpiringCertifications(60);

      const now = new Date();

      // Categorize into expired and expiring
      const expiredCertifications = expiringData
        .filter((cert: any) => new Date(cert.expiryDate) <= now)
        .map((cert: any) => ({
          pilot: cert.pilotName || 'Unknown',
          employeeId: cert.employeeId || 'Unknown',
          checkType: cert.checkDescription || 'Unknown',
          category: cert.category || 'Other',
          expiryDate: cert.expiryDate.toISOString(),
          daysOverdue: Math.abs(differenceInDays(now, cert.expiryDate)),
          riskLevel:
            Math.abs(differenceInDays(now, cert.expiryDate)) > 30
              ? 'CRITICAL'
              : Math.abs(differenceInDays(now, cert.expiryDate)) > 14
                ? 'HIGH'
                : 'MEDIUM',
          rosterPeriod: cert.expiry_roster_period,
        }));

      const expiringCertifications = expiringData
        .filter((cert: any) => {
          const daysUntil = differenceInDays(cert.expiryDate, now);
          return daysUntil > 0 && daysUntil <= 60;
        })
        .map((cert: any) => {
          const daysUntilExpiry = differenceInDays(cert.expiryDate, now);
          return {
            pilot: cert.pilotName || 'Unknown',
            employeeId: cert.employeeId || 'Unknown',
            checkType: cert.checkDescription || 'Unknown',
            category: cert.category || 'Other',
            expiryDate: cert.expiryDate.toISOString(),
            daysUntilExpiry,
            urgencyLevel:
              daysUntilExpiry <= 7 ? 'URGENT' : daysUntilExpiry <= 14 ? 'HIGH' : 'MEDIUM',
            rosterPeriod: cert.expiry_roster_period,
          };
        });

      return { expiredCertifications, expiringCertifications };
    } catch (error) {
      console.error('Error fetching expiring certifications:', error);
      // Fallback to original method if service fails
      return this.categorizeExpiringCertificationsFallback(checks, pilots, checkTypes);
    }
  }

  private categorizeExpiringCertificationsFallback(
    checks: any[],
    pilots: any[],
    checkTypes: any[]
  ) {
    const now = new Date();

    const expiredCertifications = checks
      .filter((check) => {
        if (!check.expiry_date) return false;
        return new Date(check.expiry_date) <= now;
      })
      .map((check) => {
        const pilot = pilots.find((p) => p.id === check.pilot_id);
        const checkType = checkTypes.find((ct) => ct.id === check.check_type_id);
        const daysOverdue = Math.abs(differenceInDays(now, new Date(check.expiry_date)));

        return {
          pilot: pilot ? `${pilot.first_name} ${pilot.last_name}` : 'Unknown',
          employeeId: pilot?.employee_id || 'Unknown',
          checkType: checkType?.check_description || 'Unknown',
          category: checkType?.category || 'Other',
          expiryDate: check.expiry_date,
          daysOverdue,
          riskLevel: daysOverdue > 30 ? 'CRITICAL' : daysOverdue > 14 ? 'HIGH' : 'MEDIUM',
        };
      });

    const expiringCertifications = checks
      .filter((check) => {
        if (!check.expiry_date) return false;
        const daysUntil = differenceInDays(new Date(check.expiry_date), now);
        return daysUntil <= 30 && daysUntil > 0;
      })
      .map((check) => {
        const pilot = pilots.find((p) => p.id === check.pilot_id);
        const checkType = checkTypes.find((ct) => ct.id === check.check_type_id);
        const daysUntilExpiry = differenceInDays(new Date(check.expiry_date), now);

        return {
          pilot: pilot ? `${pilot.first_name} ${pilot.last_name}` : 'Unknown',
          employeeId: pilot?.employee_id || 'Unknown',
          checkType: checkType?.check_description || 'Unknown',
          category: checkType?.category || 'Other',
          expiryDate: check.expiry_date,
          daysUntilExpiry,
          urgencyLevel: daysUntilExpiry <= 7 ? 'URGENT' : daysUntilExpiry <= 14 ? 'HIGH' : 'MEDIUM',
        };
      });

    return { expiredCertifications, expiringCertifications };
  }

  private async createDetailedPilotRecord(
    pilot: any,
    checks: any[],
    checkTypes: any[],
    leaveData: any[]
  ): Promise<DetailedPilotRecord> {
    const pilotChecks = checks.filter((check) => check.pilot_id === pilot.id);
    const pilotLeave = leaveData.filter((leave) => leave.pilot_id === pilot.id);

    const summary = await this.calculatePilotSummary(pilot, pilotChecks, checkTypes);
    const certificationHistory = this.createCertificationHistory(pilotChecks, checkTypes);
    const leaveHistory = this.createLeaveHistory(pilotLeave);

    return {
      pilot,
      summary,
      certificationHistory,
      leaveHistory,
      performanceMetrics: this.calculatePerformanceMetrics(pilot, pilotChecks, pilotLeave),
    };
  }

  private async calculatePilotSummary(
    pilot: any,
    checks: any[],
    checkTypes: any[]
  ): Promise<PilotSummary> {
    const now = new Date();
    const currentAge = pilot.date_of_birth
      ? differenceInYears(now, new Date(pilot.date_of_birth))
      : 0;
    const totalYearsService = pilot.commencement_date
      ? differenceInYears(now, new Date(pilot.commencement_date))
      : 0;

    // Get retirement age from settings
    const settings = await this.getSettings();
    const retirementAge = settings.pilot_requirements.pilot_retirement_age;
    const retirementDate = pilot.date_of_birth
      ? addYears(new Date(pilot.date_of_birth), retirementAge)
      : undefined;
    const yearsToRetirement = retirementDate ? differenceInYears(retirementDate, now) : undefined;

    const totalCertifications = checks.length;
    const currentCertifications = checks.filter((check) => {
      if (!check.expiry_date) return true;
      return new Date(check.expiry_date) > now;
    }).length;

    const expiringCertifications = checks.filter((check) => {
      if (!check.expiry_date) return false;
      const daysUntil = differenceInDays(new Date(check.expiry_date), now);
      return daysUntil <= 30 && daysUntil >= 0;
    }).length;

    const expiredCertifications = checks.filter((check) => {
      if (!check.expiry_date) return false;
      return new Date(check.expiry_date) <= now;
    }).length;

    const captainQualifications = pilot.captain_qualifications || [];

    let complianceStatus: 'COMPLIANT' | 'AT_RISK' | 'NON_COMPLIANT';
    if (expiredCertifications > 0) complianceStatus = 'NON_COMPLIANT';
    else if (expiringCertifications > 0) complianceStatus = 'AT_RISK';
    else complianceStatus = 'COMPLIANT';

    return {
      pilot,
      totalYearsService,
      currentAge,
      retirementDate: retirementDate?.toISOString(),
      yearsToRetirement,
      totalCertifications,
      currentCertifications,
      expiringCertifications,
      expiredCertifications,
      captainQualifications,
      complianceStatus,
    };
  }

  private createCertificationHistory(checks: any[], checkTypes: any[]): TrainingHistoryEntry[] {
    const now = new Date();

    return checks.map((check) => {
      const checkType = checkTypes.find((ct) => ct.id === check.check_type_id);

      let status: 'CURRENT' | 'EXPIRING' | 'EXPIRED' | 'NOT_COMPLETED';
      let daysUntilExpiry: number | undefined;

      if (!check.expiry_date) {
        status = 'NOT_COMPLETED';
      } else {
        const expiryDate = new Date(check.expiry_date);
        daysUntilExpiry = differenceInDays(expiryDate, now);

        if (daysUntilExpiry < 0) {
          status = 'EXPIRED';
        } else if (daysUntilExpiry <= 30) {
          status = 'EXPIRING';
        } else {
          status = 'CURRENT';
        }
      }

      return {
        checkType: checkType?.check_description || 'Unknown',
        completedDate: check.created_at,
        expiryDate: check.expiry_date,
        status,
        daysUntilExpiry: daysUntilExpiry && daysUntilExpiry >= 0 ? daysUntilExpiry : undefined,
      };
    });
  }

  private createLeaveHistory(leaveData: any[]) {
    return leaveData.map((leave) => ({
      requestType: leave.request_type,
      startDate: leave.start_date,
      endDate: leave.end_date,
      daysCount: leave.days_count,
      status: leave.status || 'Approved',
      rosterPeriod: leave.roster_period || 'Unknown',
    }));
  }

  private calculatePerformanceMetrics(pilot: any, checks: any[], leaveData: any[]) {
    // This would be expanded with actual performance data
    return {
      onTimeComplianceRate: Math.floor(Math.random() * 20) + 80, // Mock data
      trainingCompletionRate: Math.floor(Math.random() * 15) + 85, // Mock data
      leaveUtilization: leaveData.length > 0 ? Math.floor(Math.random() * 30) + 10 : 0,
    };
  }

  private calculatePilotSummaryStats(pilots: DetailedPilotRecord[]) {
    const totalPilots = pilots.length;
    const averageAge = Math.round(
      pilots.reduce((sum, p) => sum + p.summary.currentAge, 0) / totalPilots
    );
    const averageServiceYears = Math.round(
      pilots.reduce((sum, p) => sum + p.summary.totalYearsService, 0) / totalPilots
    );

    const complianceDistribution = {
      compliant: pilots.filter((p) => p.summary.complianceStatus === 'COMPLIANT').length,
      atRisk: pilots.filter((p) => p.summary.complianceStatus === 'AT_RISK').length,
      nonCompliant: pilots.filter((p) => p.summary.complianceStatus === 'NON_COMPLIANT').length,
    };

    return {
      totalPilots,
      averageAge,
      averageServiceYears,
      complianceDistribution,
    };
  }

  private calculateFleetRosterAnalysis(pilots: any[]): FleetRosterAnalysis {
    const totalPilots = pilots.length;
    const activePilots = pilots.filter((p) => p.is_active).length;
    const inactivePilots = totalPilots - activePilots;
    const captains = pilots.filter((p) => p.role === 'Captain').length;
    const firstOfficers = pilots.filter((p) => p.role === 'First Officer').length;

    const contractTypes = {
      fulltime: pilots.filter((p) => p.contract_type === 'Fulltime').length,
      contract: pilots.filter((p) => p.contract_type === 'Contract').length,
      casual: pilots.filter((p) => p.contract_type === 'Casual').length,
    };

    // Calculate seniority distribution
    const seniorityRanges = [
      { range: '1-5 (Most Senior)', min: 1, max: 5 },
      { range: '6-10', min: 6, max: 10 },
      { range: '11-15', min: 11, max: 15 },
      { range: '16-20', min: 16, max: 20 },
      { range: '21+ (Least Senior)', min: 21, max: 999 },
    ];

    const seniorityDistribution = seniorityRanges.map((range) => ({
      range: range.range,
      count: pilots.filter(
        (p) =>
          p.seniority_number && p.seniority_number >= range.min && p.seniority_number <= range.max
      ).length,
    }));

    // Calculate age distribution
    const now = new Date();
    const ageRanges = [
      { range: '20-29', min: 20, max: 29 },
      { range: '30-39', min: 30, max: 39 },
      { range: '40-49', min: 40, max: 49 },
      { range: '50-59', min: 50, max: 59 },
      { range: '60+', min: 60, max: 100 },
    ];

    const ageDistribution = ageRanges.map((range) => ({
      range: range.range,
      count: pilots.filter((p) => {
        if (!p.date_of_birth) return false;
        const age = differenceInYears(now, new Date(p.date_of_birth));
        return age >= range.min && age <= range.max;
      }).length,
    }));

    return {
      totalPilots,
      activePilots,
      inactivePilots,
      captains,
      firstOfficers,
      contractTypes,
      seniorityDistribution,
      ageDistribution,
    };
  }

  private calculateCaptainQualifications(pilots: any[]): CaptainQualification[] {
    return pilots
      .filter((pilot) => pilot.role === 'Captain')
      .map((pilot) => {
        const qualifications = pilot.captain_qualifications || [];

        return {
          pilot,
          lineCaptain: qualifications.includes('Line Captain'),
          trainingCaptain: qualifications.includes('Training Captain'),
          examiner: qualifications.includes('Examiner'),
          instructor: qualifications.includes('Instructor'),
          checkAirman: qualifications.includes('Check Airman'),
          rhsCaptainExpiry: pilot.rhs_captain_expiry,
          qualificationNotes: pilot.qualification_notes,
          totalQualifications: qualifications.length,
        };
      });
  }

  private calculateLeaveAnalysis(leaveData: any[], pilots: any[]): LeaveAnalysis {
    const currentRoster = process.env.NEXT_PUBLIC_CURRENT_ROSTER || 'RP11/2025';

    const totalRequests = leaveData.length;
    const approvedRequests = leaveData.filter((leave) => leave.status === 'Approved').length;
    const pendingRequests = leaveData.filter((leave) => leave.status === 'Pending').length;
    const rejectedRequests = leaveData.filter((leave) => leave.status === 'Rejected').length;
    const totalLeaveDays = leaveData.reduce((sum, leave) => sum + (leave.days_count || 0), 0);

    const leaveTypes = Array.from(new Set(leaveData.map((leave) => leave.request_type)));
    const leaveByType = leaveTypes.map((type) => ({
      type,
      count: leaveData.filter((leave) => leave.request_type === type).length,
      totalDays: leaveData
        .filter((leave) => leave.request_type === type)
        .reduce((sum, leave) => sum + (leave.days_count || 0), 0),
    }));

    const pilotsOnLeave = leaveData.filter((leave) => leave.status === 'Approved').length;
    const activePilots = pilots.filter((p) => p.is_active).length;
    const availabilityPercentage = Math.round(
      ((activePilots - pilotsOnLeave) / activePilots) * 100
    );

    return {
      rosterPeriod: currentRoster,
      totalRequests,
      approvedRequests,
      pendingRequests,
      rejectedRequests,
      totalLeaveDays,
      leaveByType,
      availabilityImpact: {
        pilotsOnLeave,
        availabilityPercentage,
        criticalPeriods: [], // Would be calculated based on actual dates
      },
    };
  }

  private async calculateOperationalReadiness(
    pilots: any[],
    checks: any[],
    leaveData: any[]
  ): Promise<OperationalReadiness> {
    // Get settings for minimum crew requirements
    const settings = await this.getSettings();
    const activePilots = pilots.filter((p) => p.is_active);
    const captains = activePilots.filter((p) => p.role === 'Captain');
    const firstOfficers = activePilots.filter((p) => p.role === 'First Officer');

    // Calculate certified crew (pilots with current certifications)
    const now = new Date();
    const certifiedPilots = activePilots.filter((pilot) => {
      const pilotChecks = checks.filter((check) => check.pilot_id === pilot.id);
      const expiredChecks = pilotChecks.filter((check) => {
        if (!check.expiry_date) return false;
        return new Date(check.expiry_date) <= now;
      });
      return expiredChecks.length === 0; // No expired certifications
    });

    const certifiedCaptains = certifiedPilots.filter((p) => p.role === 'Captain').length;
    const certifiedFirstOfficers = certifiedPilots.filter((p) => p.role === 'First Officer').length;

    // Minimum crew requirements from settings
    const minimumCaptains =
      settings.pilot_requirements.minimum_captains_per_hull *
      settings.pilot_requirements.number_of_aircraft;
    const minimumFirstOfficers =
      settings.pilot_requirements.minimum_first_officers_per_hull *
      settings.pilot_requirements.number_of_aircraft;

    const captainShortfall = Math.max(0, minimumCaptains - certifiedCaptains);
    const firstOfficerShortfall = Math.max(0, minimumFirstOfficers - certifiedFirstOfficers);

    const captainAvailability = Math.round((certifiedCaptains / minimumCaptains) * 100);
    const firstOfficerAvailability = Math.round(
      (certifiedFirstOfficers / minimumFirstOfficers) * 100
    );
    const overallAvailability = Math.round(
      ((certifiedCaptains + certifiedFirstOfficers) / (minimumCaptains + minimumFirstOfficers)) *
        100
    );

    let riskAssessment: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    if (captainShortfall > 2 || firstOfficerShortfall > 4) riskAssessment = 'CRITICAL';
    else if (captainShortfall > 1 || firstOfficerShortfall > 2) riskAssessment = 'HIGH';
    else if (captainShortfall > 0 || firstOfficerShortfall > 0) riskAssessment = 'MEDIUM';
    else riskAssessment = 'LOW';

    const mitigationActions: string[] = [];
    if (captainShortfall > 0) {
      mitigationActions.push(
        `Expedite captain certification renewals (${captainShortfall} required)`
      );
    }
    if (firstOfficerShortfall > 0) {
      mitigationActions.push(
        `Expedite first officer certification renewals (${firstOfficerShortfall} required)`
      );
    }
    if (riskAssessment === 'CRITICAL') {
      mitigationActions.push('Consider temporary operational adjustments');
    }

    return {
      overallAvailability,
      captainAvailability,
      firstOfficerAvailability,
      minimumCrewRequirement: {
        captains: minimumCaptains,
        firstOfficers: minimumFirstOfficers,
      },
      currentCertifiedCrew: {
        captains: certifiedCaptains,
        firstOfficers: certifiedFirstOfficers,
      },
      shortfall: {
        captains: captainShortfall,
        firstOfficers: firstOfficerShortfall,
      },
      riskAssessment,
      mitigationActions,
    };
  }

  private async calculateUpcomingRetirements(pilots: any[]) {
    // Get retirement age from settings
    const settings = await this.getSettings();
    const retirementAge = settings.pilot_requirements.pilot_retirement_age;
    const now = new Date();

    return pilots
      .filter((pilot) => pilot.date_of_birth && pilot.is_active)
      .map((pilot) => {
        const retirementDate = addYears(new Date(pilot.date_of_birth), retirementAge);
        const yearsToRetirement = differenceInYears(retirementDate, now);

        return {
          pilot,
          retirementDate: retirementDate.toISOString(),
          yearsToRetirement,
        };
      })
      .filter(
        (retirement) => retirement.yearsToRetirement <= 5 && retirement.yearsToRetirement >= 0
      )
      .sort((a, b) => a.yearsToRetirement - b.yearsToRetirement);
  }

  // =============================================================================
  // RECOMMENDATION GENERATORS
  // =============================================================================

  private generateComplianceRecommendations(
    overview: ComplianceOverview,
    pilotStatus: PilotComplianceStatus[],
    expiredCerts: any[]
  ): string[] {
    const recommendations: string[] = [];

    if (overview.expiredCertifications > 0) {
      recommendations.push(
        `Immediate action required: ${overview.expiredCertifications} certifications have expired`
      );
    }

    if (overview.expiringCertifications > 0) {
      recommendations.push(
        `Schedule renewal training for ${overview.expiringCertifications} expiring certifications`
      );
    }

    const highRiskPilots = pilotStatus.filter(
      (p) => p.riskLevel === 'HIGH' || p.riskLevel === 'CRITICAL'
    ).length;
    if (highRiskPilots > 0) {
      recommendations.push(`Priority focus on ${highRiskPilots} high-risk pilots`);
    }

    if (overview.complianceRate < 90) {
      recommendations.push('Implement proactive certification tracking system');
      recommendations.push('Review training schedule to prevent future expirations');
    }

    return recommendations;
  }

  private generatePilotRecommendations(pilots: DetailedPilotRecord[]): string[] {
    const recommendations: string[] = [];

    const nonCompliantCount = pilots.filter(
      (p) => p.summary.complianceStatus === 'NON_COMPLIANT'
    ).length;
    if (nonCompliantCount > 0) {
      recommendations.push(`${nonCompliantCount} pilot(s) require immediate certification renewal`);
    }

    const atRiskCount = pilots.filter((p) => p.summary.complianceStatus === 'AT_RISK').length;
    if (atRiskCount > 0) {
      recommendations.push(
        `${atRiskCount} pilot(s) have expiring certifications - schedule renewals`
      );
    }

    return recommendations;
  }

  private generateFleetManagementRecommendations(
    roster: FleetRosterAnalysis,
    readiness: OperationalReadiness,
    retirements: any[]
  ): string[] {
    const recommendations: string[] = [];

    if (readiness.riskAssessment !== 'LOW') {
      recommendations.push(
        `Fleet operational readiness at ${readiness.riskAssessment} risk - immediate attention required`
      );
    }

    if (retirements.filter((r) => r.yearsToRetirement <= 2).length > 0) {
      recommendations.push('Initiate succession planning for upcoming retirements');
    }

    if (roster.inactivePilots > 0) {
      recommendations.push(`Review status of ${roster.inactivePilots} inactive pilot(s)`);
    }

    return recommendations;
  }
}

// Export singleton instance
export const pdfReportDataService = new PDFReportDataService();
