/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  distDir: 'build',
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    disableOptimizedLoading: true,
  },
  generateBuildId: () => 'build',
  poweredByHeader: false,
  reactStrictMode: false,
}

module.exports = nextConfig 