import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable source maps in production for better debugging and Lighthouse analysis
  productionBrowserSourceMaps: true,

  // Optimize compilation
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // Experimental features for better performance
  experimental: {
    // Note: optimizeCss requires 'critters' package
    // Install with: pnpm add -D critters
    // optimizeCss: true,

    // Use modern JavaScript targets
    optimizePackageImports: [
      '@react-three/fiber',
      '@react-three/drei',
      '@react-three/postprocessing',
      'three',
      'framer-motion',
      'recharts',
      'echarts',
    ],
  },

  // Headers for better security and performance
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
        ],
      },
    ];
  },
};

export default nextConfig;
