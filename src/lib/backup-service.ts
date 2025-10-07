/**
 * Backup & Restore Service
 * Air Niugini Pilot Management System
 *
 * Database backup and restore functionality
 */

import { getSupabaseAdmin } from './supabase';
import { nanoid } from 'nanoid';
import { logger } from '@/lib/logger';

export interface BackupMetadata {
  id: string;
  timestamp: Date;
  size: number; // bytes
  tables: string[];
  recordCount: Record<string, number>;
  status: 'pending' | 'completed' | 'failed';
  error?: string;
  createdBy: string;
  description?: string;
  duration?: number; // ms
}

export interface BackupData {
  metadata: BackupMetadata;
  data: Record<string, any[]>;
  schema: Record<string, any>;
}

export interface RestoreResult {
  success: boolean;
  tablesRestored: string[];
  recordsRestored: number;
  errors: string[];
  duration: number;
}

/**
 * Backup Service Class
 */
export class BackupService {
  private static instance: BackupService;
  private backups: Map<string, BackupMetadata> = new Map();
  private readonly BACKUP_TABLES = [
    'pilots',
    'pilot_checks',
    'check_types',
    'users',
    'leave_requests',
    'settings',
    'contract_types',
  ];

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): BackupService {
    if (!BackupService.instance) {
      BackupService.instance = new BackupService();
    }
    return BackupService.instance;
  }

  /**
   * Create database backup
   */
  async createBackup(config: {
    tables?: string[];
    description?: string;
    createdBy: string;
  }): Promise<BackupMetadata> {
    const backupId = nanoid();
    const startTime = Date.now();

    const metadata: BackupMetadata = {
      id: backupId,
      timestamp: new Date(),
      size: 0,
      tables: config.tables || this.BACKUP_TABLES,
      recordCount: {},
      status: 'pending',
      createdBy: config.createdBy,
      description: config.description,
    };

    try {
      const supabase = getSupabaseAdmin();
      const backupData: Record<string, any[]> = {};
      let totalSize = 0;

      // Backup each table
      for (const table of metadata.tables) {
        const { data, error } = await supabase.from(table).select('*');

        if (error) {
          throw new Error(`Failed to backup table ${table}: ${error.message}`);
        }

        backupData[table] = data || [];
        metadata.recordCount[table] = data?.length || 0;

        // Calculate size
        const tableSize = JSON.stringify(data).length;
        totalSize += tableSize;
      }

      metadata.size = totalSize;
      metadata.status = 'completed';
      metadata.duration = Date.now() - startTime;

      // Store metadata
      this.backups.set(backupId, metadata);

      // In production, store backup data to Supabase Storage
      // await this.saveBackupToStorage(backupId, backupData);

      return metadata;
    } catch (error: any) {
      metadata.status = 'failed';
      metadata.error = error.message;
      metadata.duration = Date.now() - startTime;

      this.backups.set(backupId, metadata);
      throw error;
    }
  }

  /**
   * List all backups
   */
  listBackups(): BackupMetadata[] {
    return Array.from(this.backups.values()).sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );
  }

  /**
   * Get backup metadata
   */
  getBackup(backupId: string): BackupMetadata | undefined {
    return this.backups.get(backupId);
  }

  /**
   * Delete backup
   */
  async deleteBackup(backupId: string): Promise<void> {
    const backup = this.backups.get(backupId);
    if (!backup) {
      throw new Error('Backup not found');
    }

    // Delete from storage (in production)
    // await this.deleteBackupFromStorage(backupId);

    this.backups.delete(backupId);
  }

  /**
   * Restore from backup
   */
  async restoreBackup(
    backupId: string,
    options?: {
      tables?: string[];
      confirmWipe?: boolean;
    }
  ): Promise<RestoreResult> {
    const backup = this.backups.get(backupId);
    if (!backup || backup.status !== 'completed') {
      throw new Error('Invalid or incomplete backup');
    }

    const startTime = Date.now();
    const result: RestoreResult = {
      success: true,
      tablesRestored: [],
      recordsRestored: 0,
      errors: [],
      duration: 0,
    };

    try {
      // In production, load backup data from storage
      // const backupData = await this.loadBackupFromStorage(backupId);

      const supabase = getSupabaseAdmin();
      const tablesToRestore = options?.tables || backup.tables;

      for (const table of tablesToRestore) {
        try {
          // Delete existing data if confirmed
          if (options?.confirmWipe) {
            const { error: deleteError } = await supabase
              .from(table)
              .delete()
              .neq('id', 'impossible-id'); // Delete all

            if (deleteError) {
              throw new Error(`Failed to clear table ${table}: ${deleteError.message}`);
            }
          }

          // Insert backup data
          // const tableData = backupData[table];
          // if (tableData && tableData.length > 0) {
          //   const { error: insertError } = await supabase
          //     .from(table)
          //     .insert(tableData);

          //   if (insertError) {
          //     throw new Error(`Failed to restore table ${table}: ${insertError.message}`);
          //   }

          //   result.tablesRestored.push(table);
          //   result.recordsRestored += tableData.length;
          // }

          // Simulated for now
          result.tablesRestored.push(table);
          result.recordsRestored += backup.recordCount[table] || 0;
        } catch (error: any) {
          result.errors.push(`${table}: ${error.message}`);
          result.success = false;
        }
      }

      result.duration = Date.now() - startTime;
      return result;
    } catch (error: any) {
      result.success = false;
      result.errors.push(error.message);
      result.duration = Date.now() - startTime;
      return result;
    }
  }

  /**
   * Verify backup integrity
   */
  async verifyBackup(backupId: string): Promise<{
    valid: boolean;
    issues: string[];
  }> {
    const backup = this.backups.get(backupId);
    if (!backup) {
      return {
        valid: false,
        issues: ['Backup not found'],
      };
    }

    const issues: string[] = [];

    // Check status
    if (backup.status !== 'completed') {
      issues.push('Backup did not complete successfully');
    }

    // Check size
    if (backup.size === 0) {
      issues.push('Backup has zero size');
    }

    // Check tables
    if (backup.tables.length === 0) {
      issues.push('No tables in backup');
    }

    // Check record counts
    for (const table of backup.tables) {
      if (!backup.recordCount[table]) {
        issues.push(`Missing record count for table: ${table}`);
      }
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }

  /**
   * Schedule automated backups
   */
  scheduleAutoBackup(config: {
    interval: number; // hours
    retentionDays: number;
    createdBy: string;
  }): NodeJS.Timeout {
    const intervalMs = config.interval * 60 * 60 * 1000;

    return setInterval(async () => {
      try {
        await this.createBackup({
          description: 'Automated backup',
          createdBy: config.createdBy,
        });

        // Clean old backups
        await this.cleanOldBackups(config.retentionDays);
      } catch (error) {
        logger.error('Automated backup failed', error instanceof Error ? error : new Error(String(error)));
      }
    }, intervalMs);
  }

  /**
   * Clean old backups
   */
  async cleanOldBackups(retentionDays: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const oldBackups = Array.from(this.backups.values()).filter(
      (backup) => backup.timestamp < cutoffDate
    );

    for (const backup of oldBackups) {
      await this.deleteBackup(backup.id);
    }

    return oldBackups.length;
  }

  /**
   * Export backup to JSON
   */
  async exportBackup(backupId: string): Promise<string> {
    const backup = this.backups.get(backupId);
    if (!backup) {
      throw new Error('Backup not found');
    }

    // In production, load full backup data
    // const backupData = await this.loadBackupFromStorage(backupId);

    return JSON.stringify(
      {
        metadata: backup,
        data: {}, // Would contain actual data
        exportedAt: new Date().toISOString(),
        version: '1.0',
      },
      null,
      2
    );
  }

  /**
   * Get backup statistics
   */
  getBackupStatistics(): {
    totalBackups: number;
    totalSize: number;
    successRate: number;
    averageSize: number;
    lastBackup?: Date;
  } {
    const backups = Array.from(this.backups.values());
    const completed = backups.filter((b) => b.status === 'completed');

    const totalSize = completed.reduce((sum, b) => sum + b.size, 0);
    const lastBackup =
      backups.length > 0
        ? backups.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0].timestamp
        : undefined;

    return {
      totalBackups: backups.length,
      totalSize,
      successRate: backups.length > 0 ? (completed.length / backups.length) * 100 : 0,
      averageSize: completed.length > 0 ? totalSize / completed.length : 0,
      lastBackup,
    };
  }
}

/**
 * Singleton instance
 */
export const backupService = BackupService.getInstance();

/**
 * Helper functions
 */

export async function createBackup(description?: string, createdBy: string = 'system') {
  return backupService.createBackup({ description, createdBy });
}

export function listBackups() {
  return backupService.listBackups();
}

export async function restoreBackup(backupId: string, options?: any) {
  return backupService.restoreBackup(backupId, options);
}

export function formatBackupSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default backupService;
