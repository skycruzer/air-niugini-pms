/**
 * Test Helpers
 * Common utility functions for testing
 */

import { waitFor } from '@testing-library/react';

/**
 * Wait for an element to be removed from the DOM
 */
export async function waitForElementToBeRemoved(element: HTMLElement | null) {
  if (!element) return;
  await waitFor(() => {
    expect(element).not.toBeInTheDocument();
  });
}

/**
 * Simulate delay for async operations
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create a mock file for file upload testing
 */
export function createMockFile(
  name: string = 'test.pdf',
  size: number = 1024,
  type: string = 'application/pdf'
): File {
  const blob = new Blob(['test content'], { type });
  return new File([blob], name, { type });
}

/**
 * Mock localStorage
 */
export function mockLocalStorage() {
  const store: Record<string, string> = {};

  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach((key) => delete store[key]);
    }),
  };
}

/**
 * Mock sessionStorage
 */
export function mockSessionStorage() {
  return mockLocalStorage();
}

/**
 * Mock console methods
 */
export function mockConsole() {
  return {
    log: jest.spyOn(console, 'log').mockImplementation(),
    error: jest.spyOn(console, 'error').mockImplementation(),
    warn: jest.spyOn(console, 'warn').mockImplementation(),
    info: jest.spyOn(console, 'info').mockImplementation(),
  };
}

/**
 * Restore console methods
 */
export function restoreConsole(mocks: ReturnType<typeof mockConsole>) {
  mocks.log.mockRestore();
  mocks.error.mockRestore();
  mocks.warn.mockRestore();
  mocks.info.mockRestore();
}

/**
 * Create a mock date for consistent testing
 */
export function mockDate(dateString: string = '2025-10-01T00:00:00Z') {
  const mockDate = new Date(dateString);
  const RealDate = Date;

  // @ts-expect-error - Mock Date constructor
  global.Date = class extends RealDate {
    constructor(...args: any[]) {
      if (args.length === 0) {
        return mockDate;
      }
      // @ts-expect-error - Constructor with args returns Date instance
      return new RealDate(...args);
    }

    static now() {
      return mockDate.getTime();
    }
  };

  return () => {
    global.Date = RealDate;
  };
}

/**
 * Suppress specific console warnings in tests
 */
export function suppressConsoleWarning(warningText: string) {
  const originalWarn = console.warn;
  console.warn = (...args: any[]) => {
    if (args[0]?.includes(warningText)) {
      return;
    }
    originalWarn.call(console, ...args);
  };

  return () => {
    console.warn = originalWarn;
  };
}

/**
 * Create a rejected promise for error testing
 */
export function createRejectedPromise(error: Error | string) {
  return Promise.reject(typeof error === 'string' ? new Error(error) : error);
}

/**
 * Create a resolved promise for success testing
 */
export function createResolvedPromise<T>(data: T) {
  return Promise.resolve(data);
}

/**
 * Mock fetch for API testing
 */
export function mockFetch(response: any, options?: { status?: number; ok?: boolean }) {
  return jest.fn().mockResolvedValue({
    ok: options?.ok ?? true,
    status: options?.status ?? 200,
    json: async () => response,
    text: async () => JSON.stringify(response),
  });
}

/**
 * Mock failed fetch for error testing
 */
export function mockFetchError(error: string = 'Network error') {
  return jest.fn().mockRejectedValue(new Error(error));
}

/**
 * Assert element has Air Niugini brand colors
 */
export function assertAirNiuginiBranding(element: HTMLElement) {
  const styles = window.getComputedStyle(element);
  const backgroundColor = styles.backgroundColor;
  const color = styles.color;

  // Check for Air Niugini colors (red #E4002B, gold #FFC72C, black #000000)
  const hasRedBrand = backgroundColor.includes('228, 0, 43'); // rgb(228, 0, 43)
  const hasGoldBrand = backgroundColor.includes('255, 199, 44'); // rgb(255, 199, 44)
  const hasBlackBrand = color.includes('0, 0, 0'); // rgb(0, 0, 0)

  return hasRedBrand || hasGoldBrand || hasBlackBrand;
}

/**
 * Get form validation errors
 */
export function getFormErrors(container: HTMLElement): string[] {
  const errorElements = container.querySelectorAll('[role="alert"]');
  return Array.from(errorElements).map((el) => el.textContent || '');
}

/**
 * Fill form field helper
 */
export async function fillFormField(input: HTMLElement, value: string, userEventInstance: any) {
  await userEventInstance.clear(input);
  await userEventInstance.type(input, value);
}

/**
 * Submit form helper
 */
export async function submitForm(form: HTMLElement, userEventInstance: any) {
  const submitButton = form.querySelector('button[type="submit"]');
  if (submitButton) {
    await userEventInstance.click(submitButton);
  }
}
