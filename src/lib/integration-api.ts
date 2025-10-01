/**
 * Integration API Service
 * Air Niugini Pilot Management System
 *
 * External API integration framework with OAuth 2.0 support
 */

import { nanoid } from 'nanoid';

export interface IntegrationConfig {
  id: string;
  name: string;
  type: 'oauth2' | 'api_key' | 'basic_auth' | 'custom';
  baseUrl: string;
  authConfig: OAuth2Config | APIKeyConfig | BasicAuthConfig;
  active: boolean;
  description?: string;
  webhookUrl?: string;
  syncEnabled: boolean;
  syncInterval?: number; // minutes
  lastSync?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface OAuth2Config {
  type: 'oauth2';
  clientId: string;
  clientSecret: string;
  authorizationUrl: string;
  tokenUrl: string;
  scope: string[];
  redirectUri: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date;
}

export interface APIKeyConfig {
  type: 'api_key';
  key: string;
  headerName: string;
  prefix?: string; // e.g., 'Bearer '
}

export interface BasicAuthConfig {
  type: 'basic_auth';
  username: string;
  password: string;
}

export interface SyncJob {
  id: string;
  integrationId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  recordsSynced: number;
  errors: string[];
  duration?: number;
}

export interface ExternalAPICall {
  id: string;
  integrationId: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  endpoint: string;
  requestBody?: any;
  responseCode?: number;
  responseBody?: any;
  error?: string;
  duration: number;
  timestamp: Date;
}

/**
 * Integration API Service Class
 */
export class IntegrationAPIService {
  private static instance: IntegrationAPIService;
  private integrations: Map<string, IntegrationConfig> = new Map();
  private syncJobs: Map<string, SyncJob> = new Map();
  private apiCalls: ExternalAPICall[] = [];
  private maxCallHistorySize = 1000;
  private syncIntervals: Map<string, NodeJS.Timeout> = new Map();

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): IntegrationAPIService {
    if (!IntegrationAPIService.instance) {
      IntegrationAPIService.instance = new IntegrationAPIService();
    }
    return IntegrationAPIService.instance;
  }

  /**
   * Register new integration
   */
  async registerIntegration(config: Omit<IntegrationConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<IntegrationConfig> {
    const integration: IntegrationConfig = {
      ...config,
      id: nanoid(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.integrations.set(integration.id, integration);

    // Start sync if enabled
    if (integration.syncEnabled && integration.syncInterval) {
      this.startSync(integration.id);
    }

    return integration;
  }

  /**
   * Update integration
   */
  async updateIntegration(
    id: string,
    updates: Partial<Omit<IntegrationConfig, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<IntegrationConfig> {
    const integration = this.integrations.get(id);
    if (!integration) {
      throw new Error('Integration not found');
    }

    const updated: IntegrationConfig = {
      ...integration,
      ...updates,
      updatedAt: new Date()
    };

    this.integrations.set(id, updated);

    // Update sync if needed
    if (updated.syncEnabled && updated.syncInterval) {
      this.startSync(id);
    } else {
      this.stopSync(id);
    }

    return updated;
  }

  /**
   * Delete integration
   */
  async deleteIntegration(id: string): Promise<void> {
    this.stopSync(id);
    this.integrations.delete(id);
  }

  /**
   * Get integration
   */
  getIntegration(id: string): IntegrationConfig | undefined {
    return this.integrations.get(id);
  }

  /**
   * List all integrations
   */
  listIntegrations(): IntegrationConfig[] {
    return Array.from(this.integrations.values());
  }

  /**
   * Make API call to external service
   */
  async callAPI(
    integrationId: string,
    endpoint: string,
    options?: {
      method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
      body?: any;
      headers?: Record<string, string>;
    }
  ): Promise<any> {
    const integration = this.integrations.get(integrationId);
    if (!integration || !integration.active) {
      throw new Error('Integration not found or inactive');
    }

    const method = options?.method || 'GET';
    const url = `${integration.baseUrl}${endpoint}`;
    const startTime = Date.now();

    const call: ExternalAPICall = {
      id: nanoid(),
      integrationId,
      method,
      endpoint,
      requestBody: options?.body,
      duration: 0,
      timestamp: new Date()
    };

    try {
      // Build headers with authentication
      const headers = await this.buildHeaders(integration, options?.headers);

      const response = await fetch(url, {
        method,
        headers,
        body: options?.body ? JSON.stringify(options.body) : undefined
      });

      call.responseCode = response.status;
      call.duration = Date.now() - startTime;

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      call.responseBody = data;

      this.logAPICall(call);
      return data;
    } catch (error: any) {
      call.error = error.message;
      call.duration = Date.now() - startTime;
      this.logAPICall(call);
      throw error;
    }
  }

  /**
   * Build authentication headers
   */
  private async buildHeaders(
    integration: IntegrationConfig,
    customHeaders?: Record<string, string>
  ): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...customHeaders
    };

    const authConfig = integration.authConfig;

    if (authConfig.type === 'oauth2') {
      // Check if token needs refresh
      if (authConfig.expiresAt && authConfig.expiresAt < new Date() && authConfig.refreshToken) {
        await this.refreshOAuth2Token(integration.id);
      }

      if (authConfig.accessToken) {
        headers['Authorization'] = `Bearer ${authConfig.accessToken}`;
      }
    } else if (authConfig.type === 'api_key') {
      const prefix = authConfig.prefix || '';
      headers[authConfig.headerName] = `${prefix}${authConfig.key}`;
    } else if (authConfig.type === 'basic_auth') {
      const credentials = Buffer.from(`${authConfig.username}:${authConfig.password}`).toString('base64');
      headers['Authorization'] = `Basic ${credentials}`;
    }

    return headers;
  }

  /**
   * OAuth 2.0 Authorization
   */
  async initiateOAuth2(integrationId: string): Promise<string> {
    const integration = this.integrations.get(integrationId);
    if (!integration || integration.authConfig.type !== 'oauth2') {
      throw new Error('Invalid integration or not OAuth2');
    }

    const config = integration.authConfig as OAuth2Config;
    const state = nanoid();

    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      scope: config.scope.join(' '),
      state,
      response_type: 'code'
    });

    return `${config.authorizationUrl}?${params.toString()}`;
  }

  /**
   * Handle OAuth 2.0 callback
   */
  async handleOAuth2Callback(
    integrationId: string,
    code: string,
    state: string
  ): Promise<void> {
    const integration = this.integrations.get(integrationId);
    if (!integration || integration.authConfig.type !== 'oauth2') {
      throw new Error('Invalid integration or not OAuth2');
    }

    const config = integration.authConfig as OAuth2Config;

    // Exchange code for token
    const response = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: config.redirectUri,
        client_id: config.clientId,
        client_secret: config.clientSecret
      })
    });

    if (!response.ok) {
      throw new Error('Failed to exchange authorization code');
    }

    const data = await response.json();

    // Update integration with tokens
    config.accessToken = data.access_token;
    config.refreshToken = data.refresh_token;
    config.expiresAt = new Date(Date.now() + (data.expires_in * 1000));

    await this.updateIntegration(integrationId, { authConfig: config });
  }

  /**
   * Refresh OAuth 2.0 token
   */
  private async refreshOAuth2Token(integrationId: string): Promise<void> {
    const integration = this.integrations.get(integrationId);
    if (!integration || integration.authConfig.type !== 'oauth2') {
      return;
    }

    const config = integration.authConfig as OAuth2Config;

    if (!config.refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: config.refreshToken,
        client_id: config.clientId,
        client_secret: config.clientSecret
      })
    });

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    const data = await response.json();

    config.accessToken = data.access_token;
    if (data.refresh_token) {
      config.refreshToken = data.refresh_token;
    }
    config.expiresAt = new Date(Date.now() + (data.expires_in * 1000));

    await this.updateIntegration(integrationId, { authConfig: config });
  }

  /**
   * Test integration connection
   */
  async testIntegration(integrationId: string): Promise<{
    success: boolean;
    responseTime: number;
    error?: string;
  }> {
    const integration = this.integrations.get(integrationId);
    if (!integration) {
      return {
        success: false,
        responseTime: 0,
        error: 'Integration not found'
      };
    }

    const startTime = Date.now();

    try {
      // Make a simple test call
      const headers = await this.buildHeaders(integration);

      const response = await fetch(integration.baseUrl, {
        method: 'GET',
        headers
      });

      const responseTime = Date.now() - startTime;

      return {
        success: response.ok,
        responseTime,
        error: response.ok ? undefined : `HTTP ${response.status}`
      };
    } catch (error: any) {
      return {
        success: false,
        responseTime: Date.now() - startTime,
        error: error.message
      };
    }
  }

  /**
   * Start data synchronization
   */
  private startSync(integrationId: string): void {
    const integration = this.integrations.get(integrationId);
    if (!integration || !integration.syncInterval) {
      return;
    }

    // Stop existing sync if any
    this.stopSync(integrationId);

    // Start new sync interval
    const interval = setInterval(async () => {
      await this.performSync(integrationId);
    }, integration.syncInterval * 60 * 1000);

    this.syncIntervals.set(integrationId, interval);

    // Perform immediate sync
    this.performSync(integrationId);
  }

  /**
   * Stop data synchronization
   */
  private stopSync(integrationId: string): void {
    const interval = this.syncIntervals.get(integrationId);
    if (interval) {
      clearInterval(interval);
      this.syncIntervals.delete(integrationId);
    }
  }

  /**
   * Perform data synchronization
   */
  private async performSync(integrationId: string): Promise<void> {
    const integration = this.integrations.get(integrationId);
    if (!integration) {
      return;
    }

    const job: SyncJob = {
      id: nanoid(),
      integrationId,
      status: 'running',
      startTime: new Date(),
      recordsSynced: 0,
      errors: []
    };

    this.syncJobs.set(job.id, job);

    try {
      // Perform actual sync logic here
      // This would be customized per integration type

      job.status = 'completed';
      job.endTime = new Date();
      job.duration = job.endTime.getTime() - job.startTime.getTime();

      // Update last sync time
      integration.lastSync = new Date();
      this.integrations.set(integrationId, integration);
    } catch (error: any) {
      job.status = 'failed';
      job.endTime = new Date();
      job.duration = job.endTime.getTime() - job.startTime.getTime();
      job.errors.push(error.message);
    }

    this.syncJobs.set(job.id, job);
  }

  /**
   * Get sync jobs
   */
  getSyncJobs(integrationId: string): SyncJob[] {
    return Array.from(this.syncJobs.values())
      .filter(job => job.integrationId === integrationId)
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
  }

  /**
   * Log API call
   */
  private logAPICall(call: ExternalAPICall): void {
    this.apiCalls.push(call);

    // Trim history
    if (this.apiCalls.length > this.maxCallHistorySize) {
      this.apiCalls = this.apiCalls.slice(-this.maxCallHistorySize);
    }
  }

  /**
   * Get API call history
   */
  getAPICallHistory(integrationId: string, limit: number = 50): ExternalAPICall[] {
    return this.apiCalls
      .filter(call => call.integrationId === integrationId)
      .slice(-limit)
      .reverse();
  }

  /**
   * Get integration statistics
   */
  getIntegrationStats(integrationId: string): {
    totalCalls: number;
    successfulCalls: number;
    failedCalls: number;
    averageResponseTime: number;
    lastCall?: Date;
    totalSyncs: number;
    successfulSyncs: number;
    lastSync?: Date;
  } {
    const calls = this.apiCalls.filter(call => call.integrationId === integrationId);
    const successful = calls.filter(call => !call.error);
    const failed = calls.filter(call => call.error);

    const avgResponseTime = successful.length > 0
      ? successful.reduce((sum, call) => sum + call.duration, 0) / successful.length
      : 0;

    const syncs = this.getSyncJobs(integrationId);
    const successfulSyncs = syncs.filter(job => job.status === 'completed');

    return {
      totalCalls: calls.length,
      successfulCalls: successful.length,
      failedCalls: failed.length,
      averageResponseTime: avgResponseTime,
      lastCall: calls.length > 0 ? calls[calls.length - 1].timestamp : undefined,
      totalSyncs: syncs.length,
      successfulSyncs: successfulSyncs.length,
      lastSync: syncs.length > 0 ? syncs[0].startTime : undefined
    };
  }

  /**
   * Clean up
   */
  destroy(): void {
    this.syncIntervals.forEach(interval => clearInterval(interval));
    this.syncIntervals.clear();
  }
}

/**
 * Singleton instance
 */
export const integrationAPI = IntegrationAPIService.getInstance();

export default integrationAPI;
