/**
 * Webhook Service
 * Air Niugini Pilot Management System
 *
 * Event-driven webhook system for external integrations
 */

import { getSupabaseAdmin } from './supabase';
import { nanoid } from 'nanoid';

export type WebhookEvent =
  | 'pilot.created'
  | 'pilot.updated'
  | 'pilot.deleted'
  | 'certification.created'
  | 'certification.updated'
  | 'certification.expiring'
  | 'certification.expired'
  | 'leave.created'
  | 'leave.updated'
  | 'leave.approved'
  | 'leave.rejected'
  | 'system.alert'
  | 'backup.completed'
  | 'backup.failed';

export interface Webhook {
  id: string;
  url: string;
  events: WebhookEvent[];
  secret: string;
  active: boolean;
  description?: string;
  headers?: Record<string, string>;
  retryCount: number;
  lastTriggered?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface WebhookPayload {
  id: string;
  event: WebhookEvent;
  timestamp: Date;
  data: any;
  signature: string;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  event: WebhookEvent;
  payload: WebhookPayload;
  status: 'pending' | 'success' | 'failed' | 'retrying';
  attempts: number;
  lastAttempt?: Date;
  nextRetry?: Date;
  responseCode?: number;
  responseBody?: string;
  error?: string;
  createdAt: Date;
}

export interface WebhookLog {
  id: string;
  webhookId: string;
  deliveryId: string;
  event: WebhookEvent;
  status: 'success' | 'failed';
  duration: number; // ms
  statusCode?: number;
  error?: string;
  timestamp: Date;
}

/**
 * Webhook Service Class
 */
export class WebhookService {
  private static instance: WebhookService;
  private webhooks: Map<string, Webhook> = new Map();
  private deliveryQueue: WebhookDelivery[] = [];
  private logs: WebhookLog[] = [];
  private maxLogSize = 1000;
  private processingInterval?: NodeJS.Timeout;

  private constructor() {
    // Start processing queue
    this.startQueueProcessor();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): WebhookService {
    if (!WebhookService.instance) {
      WebhookService.instance = new WebhookService();
    }
    return WebhookService.instance;
  }

  /**
   * Register a new webhook
   */
  async registerWebhook(config: {
    url: string;
    events: WebhookEvent[];
    description?: string;
    headers?: Record<string, string>;
    createdBy: string;
  }): Promise<Webhook> {
    const webhook: Webhook = {
      id: nanoid(),
      url: config.url,
      events: config.events,
      secret: this.generateSecret(),
      active: true,
      description: config.description,
      headers: config.headers,
      retryCount: 3,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: config.createdBy,
    };

    this.webhooks.set(webhook.id, webhook);

    // Persist to database (in production)
    // await this.saveWebhookToDatabase(webhook);

    return webhook;
  }

  /**
   * Update webhook configuration
   */
  async updateWebhook(
    id: string,
    updates: Partial<Pick<Webhook, 'url' | 'events' | 'active' | 'description' | 'headers'>>
  ): Promise<Webhook> {
    const webhook = this.webhooks.get(id);
    if (!webhook) {
      throw new Error('Webhook not found');
    }

    const updated: Webhook = {
      ...webhook,
      ...updates,
      updatedAt: new Date(),
    };

    this.webhooks.set(id, updated);
    return updated;
  }

  /**
   * Delete webhook
   */
  async deleteWebhook(id: string): Promise<void> {
    this.webhooks.delete(id);
  }

  /**
   * Get webhook by ID
   */
  getWebhook(id: string): Webhook | undefined {
    return this.webhooks.get(id);
  }

  /**
   * List all webhooks
   */
  listWebhooks(): Webhook[] {
    return Array.from(this.webhooks.values());
  }

  /**
   * Trigger webhook event
   */
  async triggerEvent(event: WebhookEvent, data: any): Promise<void> {
    // Find all webhooks subscribed to this event
    const subscribedWebhooks = Array.from(this.webhooks.values()).filter(
      (webhook) => webhook.active && webhook.events.includes(event)
    );

    if (subscribedWebhooks.length === 0) {
      return;
    }

    // Create payload
    const payload: WebhookPayload = {
      id: nanoid(),
      event,
      timestamp: new Date(),
      data,
      signature: '', // Will be set per webhook
    };

    // Queue deliveries for each webhook
    for (const webhook of subscribedWebhooks) {
      const delivery: WebhookDelivery = {
        id: nanoid(),
        webhookId: webhook.id,
        event,
        payload: {
          ...payload,
          signature: this.generateSignature(payload, webhook.secret),
        },
        status: 'pending',
        attempts: 0,
        createdAt: new Date(),
      };

      this.deliveryQueue.push(delivery);
    }

    // Process queue immediately
    this.processQueue();
  }

  /**
   * Start queue processor
   */
  private startQueueProcessor(): void {
    // Process queue every 10 seconds
    this.processingInterval = setInterval(() => {
      this.processQueue();
    }, 10000);
  }

  /**
   * Process delivery queue
   */
  private async processQueue(): Promise<void> {
    const pendingDeliveries = this.deliveryQueue.filter(
      (d) => d.status === 'pending' || d.status === 'retrying'
    );

    for (const delivery of pendingDeliveries) {
      await this.deliverWebhook(delivery);
    }
  }

  /**
   * Deliver webhook to endpoint
   */
  private async deliverWebhook(delivery: WebhookDelivery): Promise<void> {
    const webhook = this.webhooks.get(delivery.webhookId);
    if (!webhook || !webhook.active) {
      delivery.status = 'failed';
      delivery.error = 'Webhook not found or inactive';
      return;
    }

    delivery.attempts++;
    delivery.lastAttempt = new Date();

    const startTime = Date.now();

    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': delivery.payload.signature,
          'X-Webhook-Event': delivery.event,
          'X-Webhook-ID': delivery.id,
          ...webhook.headers,
        },
        body: JSON.stringify(delivery.payload),
      });

      const duration = Date.now() - startTime;
      delivery.responseCode = response.status;

      if (response.ok) {
        delivery.status = 'success';
        delivery.responseBody = await response.text();

        // Update webhook last triggered
        webhook.lastTriggered = new Date();
        this.webhooks.set(webhook.id, webhook);

        // Log success
        this.logDelivery(delivery, duration, 'success');
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error: any) {
      delivery.error = error.message;

      // Retry logic
      if (delivery.attempts < webhook.retryCount) {
        delivery.status = 'retrying';
        delivery.nextRetry = new Date(Date.now() + this.getRetryDelay(delivery.attempts));
      } else {
        delivery.status = 'failed';
      }

      // Log failure
      this.logDelivery(delivery, Date.now() - startTime, 'failed');
    }
  }

  /**
   * Get retry delay (exponential backoff)
   */
  private getRetryDelay(attempt: number): number {
    return Math.min(1000 * Math.pow(2, attempt), 60000); // Max 1 minute
  }

  /**
   * Log delivery attempt
   */
  private logDelivery(
    delivery: WebhookDelivery,
    duration: number,
    status: 'success' | 'failed'
  ): void {
    const log: WebhookLog = {
      id: nanoid(),
      webhookId: delivery.webhookId,
      deliveryId: delivery.id,
      event: delivery.event,
      status,
      duration,
      statusCode: delivery.responseCode,
      error: delivery.error,
      timestamp: new Date(),
    };

    this.logs.push(log);

    // Trim logs if needed
    if (this.logs.length > this.maxLogSize) {
      this.logs = this.logs.slice(-this.maxLogSize);
    }
  }

  /**
   * Get webhook logs
   */
  getWebhookLogs(webhookId: string, limit: number = 50): WebhookLog[] {
    return this.logs
      .filter((log) => log.webhookId === webhookId)
      .slice(-limit)
      .reverse();
  }

  /**
   * Get all logs
   */
  getAllLogs(limit: number = 100): WebhookLog[] {
    return this.logs.slice(-limit).reverse();
  }

  /**
   * Get delivery status
   */
  getDeliveryStatus(deliveryId: string): WebhookDelivery | undefined {
    return this.deliveryQueue.find((d) => d.id === deliveryId);
  }

  /**
   * Get webhook statistics
   */
  getWebhookStats(webhookId: string): {
    totalDeliveries: number;
    successfulDeliveries: number;
    failedDeliveries: number;
    averageResponseTime: number;
    successRate: number;
  } {
    const logs = this.logs.filter((log) => log.webhookId === webhookId);

    const successful = logs.filter((log) => log.status === 'success');
    const failed = logs.filter((log) => log.status === 'failed');

    const averageResponseTime =
      successful.length > 0
        ? successful.reduce((sum, log) => sum + log.duration, 0) / successful.length
        : 0;

    return {
      totalDeliveries: logs.length,
      successfulDeliveries: successful.length,
      failedDeliveries: failed.length,
      averageResponseTime,
      successRate: logs.length > 0 ? (successful.length / logs.length) * 100 : 0,
    };
  }

  /**
   * Generate webhook secret
   */
  private generateSecret(): string {
    return nanoid(32);
  }

  /**
   * Generate HMAC signature for payload
   */
  private generateSignature(payload: WebhookPayload, secret: string): string {
    // In production, use proper HMAC-SHA256
    // For now, simple hash
    const data = JSON.stringify({
      id: payload.id,
      event: payload.event,
      timestamp: payload.timestamp,
      data: payload.data,
    });

    // Simplified signature (use crypto.createHmac in production)
    return Buffer.from(`${secret}:${data}`).toString('base64');
  }

  /**
   * Verify webhook signature
   */
  verifySignature(payload: WebhookPayload, signature: string, secret: string): boolean {
    const expectedSignature = this.generateSignature(payload, secret);
    return signature === expectedSignature;
  }

  /**
   * Test webhook endpoint
   */
  async testWebhook(webhookId: string): Promise<{
    success: boolean;
    responseTime: number;
    statusCode?: number;
    error?: string;
  }> {
    const webhook = this.webhooks.get(webhookId);
    if (!webhook) {
      return {
        success: false,
        responseTime: 0,
        error: 'Webhook not found',
      };
    }

    const testPayload: WebhookPayload = {
      id: nanoid(),
      event: 'system.alert',
      timestamp: new Date(),
      data: {
        message: 'This is a test webhook delivery',
      },
      signature: this.generateSignature(
        {
          id: 'test',
          event: 'system.alert',
          timestamp: new Date(),
          data: { message: 'test' },
        } as WebhookPayload,
        webhook.secret
      ),
    };

    const startTime = Date.now();

    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': testPayload.signature,
          'X-Webhook-Event': 'system.alert',
          'X-Webhook-ID': 'test',
          ...webhook.headers,
        },
        body: JSON.stringify(testPayload),
      });

      const responseTime = Date.now() - startTime;

      return {
        success: response.ok,
        responseTime,
        statusCode: response.status,
        error: response.ok ? undefined : `HTTP ${response.status}`,
      };
    } catch (error: any) {
      return {
        success: false,
        responseTime: Date.now() - startTime,
        error: error.message,
      };
    }
  }

  /**
   * Clean up
   */
  destroy(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }
  }
}

/**
 * Singleton instance
 */
export const webhookService = WebhookService.getInstance();

/**
 * Helper functions
 */

export async function registerWebhook(config: {
  url: string;
  events: WebhookEvent[];
  description?: string;
  headers?: Record<string, string>;
  createdBy: string;
}): Promise<Webhook> {
  return webhookService.registerWebhook(config);
}

export async function triggerWebhookEvent(event: WebhookEvent, data: any): Promise<void> {
  return webhookService.triggerEvent(event, data);
}

export function getWebhookStats(webhookId: string) {
  return webhookService.getWebhookStats(webhookId);
}

export default webhookService;
