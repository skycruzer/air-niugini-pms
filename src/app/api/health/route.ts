/**
 * Health Check API Route
 * Air Niugini Pilot Management System
 *
 * System health and readiness endpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { systemMonitoring } from '@/lib/system-monitoring';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/health - Basic health check
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const check = url.searchParams.get('check') || 'basic';

    switch (check) {
      case 'basic':
        return await basicHealthCheck();
      case 'readiness':
        return await readinessCheck();
      case 'liveness':
        return await livenessCheck();
      case 'detailed':
        return await detailedHealthCheck();
      default:
        return await basicHealthCheck();
    }
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * Basic health check - returns 200 if service is running
 */
async function basicHealthCheck() {
  return NextResponse.json({
    status: 'healthy',
    service: 'Air Niugini Pilot Management System',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
}

/**
 * Readiness check - checks if service is ready to accept traffic
 */
async function readinessCheck() {
  const checks = {
    database: false,
    api: true,
    timestamp: new Date().toISOString(),
  };

  try {
    // Check database connection
    const supabase = getSupabaseAdmin();
    const startTime = Date.now();

    const { error } = await supabase.from('pilots').select('id').limit(1);

    const queryTime = Date.now() - startTime;

    if (error) {
      checks.database = false;
    } else {
      checks.database = queryTime < 2000; // Consider ready if query < 2s
    }

    const ready = checks.database && checks.api;

    return NextResponse.json(
      {
        ready,
        checks,
        message: ready ? 'Service is ready' : 'Service is not ready',
      },
      { status: ready ? 200 : 503 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        ready: false,
        checks,
        message: 'Readiness check failed',
        error: error.message,
      },
      { status: 503 }
    );
  }
}

/**
 * Liveness check - checks if service is alive (for orchestration)
 */
async function livenessCheck() {
  // Simple check - if we can respond, we're alive
  return NextResponse.json({
    alive: true,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Detailed health check - comprehensive system status
 */
async function detailedHealthCheck() {
  try {
    const [metrics, health] = await Promise.all([
      systemMonitoring.getCurrentMetrics(),
      systemMonitoring.checkSystemHealth(),
    ]);

    const status = health.healthy ? 'healthy' : health.issues.length > 0 ? 'unhealthy' : 'degraded';

    return NextResponse.json(
      {
        status,
        healthy: health.healthy,
        timestamp: new Date().toISOString(),
        checks: {
          database: {
            status: metrics.database.status,
            averageQueryTime: `${metrics.database.averageQueryTime}ms`,
            activeConnections: metrics.database.activeConnections,
          },
          api: {
            successRate: `${metrics.api.successRate}%`,
            averageResponseTime: `${metrics.api.averageResponseTime}ms`,
            requestsPerMinute: metrics.api.requestsPerMinute,
          },
          memory: {
            used: `${metrics.memory.used.toFixed(2)} MB`,
            total: `${metrics.memory.total} MB`,
            percentage: `${metrics.memory.percentage.toFixed(2)}%`,
          },
          uptime: {
            seconds: metrics.uptime.uptime,
            formatted: systemMonitoring.formatUptime(metrics.uptime.uptime),
            percentage: `${metrics.uptime.uptimePercentage}%`,
          },
          errors: {
            total: metrics.errors.total,
            rate: metrics.errors.rate,
          },
        },
        issues: health.issues,
        warnings: health.warnings,
      },
      {
        status: status === 'healthy' ? 200 : status === 'degraded' ? 200 : 503,
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'error',
        healthy: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
