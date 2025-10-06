/**
 * @fileoverview Authenticated API client utility
 * Handles automatic token injection for API calls to protected routes
 *
 * @author Air Niugini Development Team
 * @version 1.0.0
 * @since 2025-10-06
 */

import { supabase } from './supabase';

/**
 * Performs an authenticated fetch request with automatic token injection
 *
 * @param url - The API endpoint URL
 * @param options - Standard fetch options
 * @returns Promise with the fetch response
 * @throws Error if no active session exists
 *
 * @example
 * const data = await authenticatedFetch('/api/tasks')
 *   .then(res => res.json());
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // Get current session from Supabase
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session?.access_token) {
    console.error('Authentication error:', error);
    throw new Error('No active session. Please log in again.');
  }

  // Merge headers with auth token
  const headers = new Headers(options.headers);
  headers.set('Authorization', `Bearer ${session.access_token}`);
  headers.set('Content-Type', 'application/json');

  // Perform authenticated request
  return fetch(url, {
    ...options,
    headers,
  });
}

/**
 * Performs an authenticated GET request
 *
 * @param url - The API endpoint URL
 * @returns Promise with parsed JSON response
 */
export async function apiGet<T = any>(url: string): Promise<T> {
  const response = await authenticatedFetch(url, {
    method: 'GET',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `API error: ${response.status}`);
  }

  return response.json();
}

/**
 * Performs an authenticated POST request
 *
 * @param url - The API endpoint URL
 * @param data - The request body data
 * @returns Promise with parsed JSON response
 */
export async function apiPost<T = any>(url: string, data: any): Promise<T> {
  const response = await authenticatedFetch(url, {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `API error: ${response.status}`);
  }

  return response.json();
}

/**
 * Performs an authenticated PUT request
 *
 * @param url - The API endpoint URL
 * @param data - The request body data
 * @returns Promise with parsed JSON response
 */
export async function apiPut<T = any>(url: string, data: any): Promise<T> {
  const response = await authenticatedFetch(url, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `API error: ${response.status}`);
  }

  return response.json();
}

/**
 * Performs an authenticated DELETE request
 *
 * @param url - The API endpoint URL
 * @returns Promise with parsed JSON response
 */
export async function apiDelete<T = any>(url: string): Promise<T> {
  const response = await authenticatedFetch(url, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `API error: ${response.status}`);
  }

  return response.json();
}
