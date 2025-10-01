/**
 * PWA Initialization
 * Sets up Progressive Web App features including:
 * - Service worker registration
 * - Cache warming
 * - Offline sync
 * - Install prompts
 */

'use client';

import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { initializeCacheManagement, setupPeriodicCacheCleanup } from '@/lib/pwa-cache';
import { setupAutoSync } from '@/lib/optimistic-updates';
import toast from 'react-hot-toast';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * PWA Initialization Hook
 * Call this in the root Providers component
 */
export function usePWAInit() {
  const queryClient = useQueryClient();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Initialize PWA features
    const initPWA = async () => {
      console.log('Initializing PWA features...');

      try {
        // Register service worker
        if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
          const registration = await navigator.serviceWorker.register('/service-worker.js', {
            scope: '/',
          });
          console.log('Service Worker registered:', registration);

          // Listen for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  toast('New version available! Refresh to update.', {
                    duration: 10000,
                    icon: '🔄',
                  });
                }
              });
            }
          });
        }

        // Initialize cache management
        await initializeCacheManagement(queryClient);

        // Setup periodic cache cleanup
        setupPeriodicCacheCleanup(queryClient);

        // Setup auto sync when connection restored
        setupAutoSync(queryClient);

        console.log('PWA initialization complete');
      } catch (error) {
        console.error('PWA initialization failed:', error);
      }
    };

    initPWA();

    // Handle install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      console.log('Install prompt available');

      // Show install prompt toast after a delay
      setTimeout(() => {
        toast('Install Air Niugini PMS for offline access!', {
          duration: 8000,
          icon: '📱',
        });
      }, 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Handle successful install
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      console.log('PWA installed successfully');
      toast.success('App installed successfully!');
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [queryClient]);

  const promptInstall = async () => {
    if (!deferredPrompt) {
      toast.error('Installation not available');
      return;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`Install prompt outcome: ${outcome}`);

      if (outcome === 'accepted') {
        toast.success('Installing app...');
      }

      setDeferredPrompt(null);
    } catch (error) {
      console.error('Install prompt error:', error);
      toast.error('Installation failed');
    }
  };

  return {
    isInstalled,
    canInstall: !!deferredPrompt,
    promptInstall,
  };
}

/**
 * Check if app is running in standalone mode (installed PWA)
 */
export function isPWAInstalled(): boolean {
  if (typeof window === 'undefined') return false;

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
}

/**
 * Check if service worker is supported
 */
export function isServiceWorkerSupported(): boolean {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator;
}

/**
 * Get service worker registration
 */
export async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!isServiceWorkerSupported()) return null;

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    return registration || null;
  } catch (error) {
    console.error('Error getting service worker registration:', error);
    return null;
  }
}

/**
 * Update service worker manually
 */
export async function updateServiceWorker(): Promise<void> {
  if (!isServiceWorkerSupported()) return;

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      await registration.update();
      toast('Checking for updates...', { icon: '🔄' });
    }
  } catch (error) {
    console.error('Error updating service worker:', error);
    toast.error('Failed to check for updates');
  }
}

/**
 * Unregister service worker (for testing)
 */
export async function unregisterServiceWorker(): Promise<void> {
  if (!isServiceWorkerSupported()) return;

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      await registration.unregister();
      console.log('Service worker unregistered');
      toast.success('Service worker unregistered');
    }
  } catch (error) {
    console.error('Error unregistering service worker:', error);
    toast.error('Failed to unregister service worker');
  }
}

/**
 * Get PWA install instructions based on platform
 */
export function getInstallInstructions(): { platform: string; instructions: string[] } {
  if (typeof window === 'undefined') {
    return { platform: 'unknown', instructions: [] };
  }

  const userAgent = navigator.userAgent.toLowerCase();

  if (/iphone|ipad|ipod/.test(userAgent)) {
    return {
      platform: 'iOS',
      instructions: [
        'Tap the Share button at the bottom of Safari',
        'Scroll down and tap "Add to Home Screen"',
        'Enter a name and tap "Add"',
      ],
    };
  }

  if (/android/.test(userAgent)) {
    return {
      platform: 'Android',
      instructions: [
        'Tap the menu button (three dots) in Chrome',
        'Select "Add to Home Screen" or "Install App"',
        'Tap "Install" when prompted',
      ],
    };
  }

  if (/chrome/.test(userAgent)) {
    return {
      platform: 'Chrome Desktop',
      instructions: [
        'Click the install icon in the address bar',
        'Or click the menu (three dots) and select "Install Air Niugini PMS"',
        'Click "Install" in the confirmation dialog',
      ],
    };
  }

  return {
    platform: 'Desktop',
    instructions: [
      'Look for an install button in your browser',
      'Or check the browser menu for installation options',
      "Follow your browser's installation prompts",
    ],
  };
}
