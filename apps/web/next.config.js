/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable ESLint during builds (optional - can be enabled for stricter checks)
  eslint: {
    ignoreDuringBuilds: process.env.SKIP_LINT === 'true',
  },
  // Disable TypeScript type checking during builds (optional)
  typescript: {
    ignoreBuildErrors: process.env.SKIP_TYPE_CHECK === 'true',
  },
};
 
module.exports = nextConfig;
