/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable ESLint during builds (linting should be done in CI/CD, not during production builds)
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Disable TypeScript type checking during builds (type checking should be done in CI/CD)
  typescript: {
    ignoreBuildErrors: true,
  },
};
 
module.exports = nextConfig;
