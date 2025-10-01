/**
 * System Monitoring Service
 * Air Niugini Pilot Management System
 *
 * Real-time system health and performance monitoring
 */

import { getSupabaseAdmin } from './supabase';

export interface SystemMetrics {
  timestamp: Date;
  cpu: CPUMetrics;
  memory: MemoryMetrics;
  database: DatabaseMetrics;
  api: APIMetrics;
  errors: ErrorMetrics;
  uptime: UptimeMetrics;
}

export interface CPUMetrics {
  usage: number; // Percentage
  loadAverage: number[];
  cores: number;
}

export interface MemoryMetrics {
  total: number; // MB
  used: number; // MB
  free: number; // MB
  percentage: number;
}

export interface DatabaseMetrics {
  status: 'healthy' | 'degraded' | 'down';
  connectionCount: number;
  averageQueryTime: number; // ms
  slowQueries: number;
  activeConnections: number;
  lastBackup?: Date;
}

export interface APIMetrics {
  totalRequests: number;
  successRate: number; // Percentage
  averageResponseTime: number; // ms
  requestsPerMinute: number;
  endpoints: EndpointMetric[];
}

export interface EndpointMetric {
  path: string;
  method: string;
  requestCount: number;
  averageResponseTime: number;
  errorRate: number;
  lastAccessed: Date;
}

export interface ErrorMetrics {
  total: number;
  rate: number; // errors per minute
  byType: Record<string, number>;
  recent: ErrorLog[];
}

export interface ErrorLog {
  timestamp: Date;
  type: string;
  message: string;
  stack?: string;
  endpoint?: string;
  userId?: string;
}

export interface UptimeMetrics {
  startTime: Date;
  uptime: number; // seconds
  uptimePercentage: number;
  lastDowntime?: Date;
}

export interface SessionMetrics {
  activeUsers: number;
  activeSessions: number;
  averageSessionDuration: number; // minutes
  sessionsByRole: Record<string, number>;
}

export interface PerformanceMetric {
  timestamp: Date;
  metric: string;
  value: number;
  unit: string;
}

/**
 * System Monitoring Service Class
 */
export class SystemMonitoringService {
  private static instance: SystemMonitoringService;
  private metricsHistory: PerformanceMetric[] = [];
  private maxHistorySize = 1440; // 24 hours at 1-minute intervals
  private startTime = new Date();

  private constructor() {
    // Initialize monitoring
    this.startMetricsCollection();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): SystemMonitoringService {
    if (!SystemMonitoringService.instance) {
      SystemMonitoringService.instance = new SystemMonitoringService();
    }
    return SystemMonitoringService.instance;
  }

  /**
   * Start collecting metrics periodically
   */
  private startMetricsCollection(): void {
    // Collect metrics every minute
    if (typeof window === 'undefined') {
      // Server-side only
      setInterval(() => {
        this.collectMetrics();
      }, 60000); // 1 minute
    }
  }

  /**
   * Collect current system metrics
   */
  private async collectMetrics(): Promise<void> {
    try {
      const metrics = await this.getCurrentMetrics();

      // Store in history
      this.metricsHistory.push({
        timestamp: new Date(),
        metric: 'api_response_time',
        value: metrics.api.averageResponseTime,
        unit: 'ms'
      });

      this.metricsHistory.push({
        timestamp: new Date(),
        metric: 'database_query_time',
        value: metrics.database.averageQueryTime,
        unit: 'ms'
      });

      // Trim history if needed
      if (this.metricsHistory.length > this.maxHistorySize) {
        this.metricsHistory = this.metricsHistory.slice(-this.maxHistorySize);
      }
    } catch (error) {
      console.error('Failed to collect metrics:', error);
    }
  }

  /**
   * Get current system metrics
   */
  async getCurrentMetrics(): Promise<SystemMetrics> {
    const [cpu, memory, database, api, errors, uptime] = await Promise.all([
      this.getCPUMetrics(),
      this.getMemoryMetrics(),
      this.getDatabaseMetrics(),
      this.getAPIMetrics(),
      this.getErrorMetrics(),
      this.getUptimeMetrics()
    ]);

    return {
      timestamp: new Date(),
      cpu,
      memory,
      database,
      api,
      errors,
      uptime
    };
  }

  /**
   * Get CPU metrics (simulated for edge environment)
   */
  private async getCPUMetrics(): Promise<CPUMetrics> {
    // In Vercel/Edge environment, we simulate metrics
    return {
      usage: Math.random() * 30 + 10, // 10-40% usage
      loadAverage: [0.5, 0.6, 0.7],
      cores: 2
    };
  }

  /**
   * Get memory metrics
   */
  private async getMemoryMetrics(): Promise<MemoryMetrics> {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage();
      const totalMB = 512; // Typical Vercel function limit
      const usedMB = usage.heapUsed / 1024 / 1024;

      return {
        total: totalMB,
        used: usedMB,
        free: totalMB - usedMB,
        percentage: (usedMB / totalMB) * 100
      };
    }

    // Fallback for edge runtime
    return {
      total: 512,
      used: 128,
      free: 384,
      percentage: 25
    };
  }

  /**
   * Get database health metrics
   */
  private async getDatabaseMetrics(): Promise<DatabaseMetrics> {
    try {
      const supabase = getSupabaseAdmin();

      // Test database connection with simple query
      const startTime = Date.now();
      const { error } = await supabase
        .from('pilots')
        .select('id')
        .limit(1);
      const queryTime = Date.now() - startTime;

      if (error) {
        return {
          status: 'down',
          connectionCount: 0,
          averageQueryTime: 0,
          slowQueries: 0,
          activeConnections: 0
        };
      }

      // Get connection stats (simulated - Supabase doesn't expose these directly)
      return {
        status: queryTime < 1000 ? 'healthy' : 'degraded',
        connectionCount: 10,
        averageQueryTime: queryTime,
        slowQueries: 0,
        activeConnections: 5,
        lastBackup: new Date()
      };
    } catch (error) {
      return {
        status: 'down',
        connectionCount: 0,
        averageQueryTime: 0,
        slowQueries: 0,
        activeConnections: 0
      };
    }
  }

  /**
   * Get API metrics
   */
  private async getAPIMetrics(): Promise<APIMetrics> {
    // In production, these would come from logging service
    // For now, we return simulated metrics
    return {
      totalRequests: 1250,
      successRate: 98.5,
      averageResponseTime: 145,
      requestsPerMinute: 25,
      endpoints: [
        {
          path: '/api/pilots',
          method: 'GET',
          requestCount: 450,
          averageResponseTime: 120,
          errorRate: 0.5,
          lastAccessed: new Date()
        },
        {
          path: '/api/certifications',
          method: 'GET',
          requestCount: 380,
          averageResponseTime: 180,
          errorRate: 1.2,
          lastAccessed: new Date()
        },
        {
          path: '/api/dashboard',
          method: 'GET',
          requestCount: 320,
          averageResponseTime: 250,
          errorRate: 0.8,
          lastAccessed: new Date()
        }
      ]
    };
  }

  /**
   * Get error metrics
   */
  private async getErrorMetrics(): Promise<ErrorMetrics> {
    // In production, these would come from error tracking service
    return {
      total: 15,
      rate: 0.3,
      byType: {
        'DatabaseError': 5,
        'ValidationError': 7,
        'AuthenticationError': 3
      },
      recent: [
        {
          timestamp: new Date(Date.now() - 300000),
          type: 'ValidationError',
          message: 'Invalid employee ID format'
        },
        {
          timestamp: new Date(Date.now() - 600000),
          type: 'DatabaseError',
          message: 'Connection timeout'
        }
      ]
    };
  }

  /**
   * Get uptime metrics
   */
  private async getUptimeMetrics(): Promise<UptimeMetrics> {
    const now = Date.now();
    const uptimeSeconds = Math.floor((now - this.startTime.getTime()) / 1000);

    return {
      startTime: this.startTime,
      uptime: uptimeSeconds,
      uptimePercentage: 99.9,
      lastDowntime: undefined
    };
  }

  /**
   * Get session metrics
   */
  async getSessionMetrics(): Promise<SessionMetrics> {
    try {
      const supabase = getSupabaseAdmin();

      // Get active sessions from auth
      // Note: This is simulated - actual implementation would query auth sessions
      return {
        activeUsers: 12,
        activeSessions: 15,
        averageSessionDuration: 45,
        sessionsByRole: {
          admin: 2,
          manager: 5,
          user: 5
        }
      };
    } catch (error) {
      return {
        activeUsers: 0,
        activeSessions: 0,
        averageSessionDuration: 0,
        sessionsByRole: {}
      };
    }
  }

  /**
   * Get metrics history for charts
   */
  getMetricsHistory(metric: string, hours: number = 24): PerformanceMetric[] {
    const cutoffTime = Date.now() - (hours * 60 * 60 * 1000);
    return this.metricsHistory.filter(
      m => m.metric === metric && m.timestamp.getTime() >= cutoffTime
    );
  }

  /**
   * Get all metrics history
   */
  getAllMetricsHistory(hours: number = 24): PerformanceMetric[] {
    const cutoffTime = Date.now() - (hours * 60 * 60 * 1000);
    return this.metricsHistory.filter(
      m => m.timestamp.getTime() >= cutoffTime
    );
  }

  /**
   * Check system health
   */
  async checkSystemHealth(): Promise<{
    healthy: boolean;
    issues: string[];
    warnings: string[];
  }> {
    const metrics = await this.getCurrentMetrics();
    const issues: string[] = [];
    const warnings: string[] = [];

    // Check database
    if (metrics.database.status === 'down') {
      issues.push('Database is down');
    } else if (metrics.database.status === 'degraded') {
      warnings.push('Database performance is degraded');
    }

    // Check memory
    if (metrics.memory.percentage > 90) {
      issues.push('Memory usage critical (>90%)');
    } else if (metrics.memory.percentage > 75) {
      warnings.push('Memory usage high (>75%)');
    }

    // Check API performance
    if (metrics.api.averageResponseTime > 1000) {
      warnings.push('API response time slow (>1000ms)');
    }

    // Check error rate
    if (metrics.errors.rate > 5) {
      issues.push('High error rate detected');
    } else if (metrics.errors.rate > 1) {
      warnings.push('Elevated error rate');
    }

    return {
      healthy: issues.length === 0,
      issues,
      warnings
    };
  }

  /**
   * Format uptime duration
   */
  formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);

    return parts.join(' ') || '0m';
  }
}

/**
 * Singleton instance
 */
export const systemMonitoring = SystemMonitoringService.getInstance();

/**
 * Helper functions
 */

export async function getSystemStatus(): Promise<{
  status: 'healthy' | 'degraded' | 'down';
  message: string;
}> {
  const health = await systemMonitoring.checkSystemHealth();

  if (!health.healthy) {
    return {
      status: 'down',
      message: `System issues detected: ${health.issues.join(', ')}`
    };
  }

  if (health.warnings.length > 0) {
    return {
      status: 'degraded',
      message: `System warnings: ${health.warnings.join(', ')}`
    };
  }

  return {
    status: 'healthy',
    message: 'All systems operational'
  };
}

export async function getDashboardMetrics() {
  const metrics = await systemMonitoring.getCurrentMetrics();
  const sessions = await systemMonitoring.getSessionMetrics();

  return {
    system: metrics,
    sessions,
    health: await systemMonitoring.checkSystemHealth()
  };
}

export default systemMonitoring;
