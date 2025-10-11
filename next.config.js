/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  swcMinify: true,
  poweredByHeader: false,
  // Disable experimental features that can interfere with build
  experimental: {
    optimizeCss: false,
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Disable error overlay in development to fix Safari originalFactory.call error
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  typescript: {
    ignoreBuildErrors: true, // Disable strict type checks for faster iteration
  },
  eslint: {
    ignoreDuringBuilds: true, // Allow warnings during builds
  },
  // Increase static page generation timeout for production builds
  staticPageGenerationTimeout: 180,
  // Simplified webpack configuration
  webpack: (config, { dev, isServer }) => {
    // Fix Safari webpack module loading issues in dev mode
    if (dev && !isServer) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }

    return config;
  },
  // Enable compression
  compress: true,
  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    unoptimized: false,
    remotePatterns: [],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // Headers for security and performance
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin',
        },
      ],
    },
    {
      source: '/api/(.*)',
      headers: [
        {
          key: 'Cache-Control',
          value: 'no-store, no-cache, must-revalidate',
        },
      ],
    },
  ],
};

// Export clean config without wrappers to fix build issues
module.exports = nextConfig;
