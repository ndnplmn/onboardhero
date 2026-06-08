import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'

const nextConfig: NextConfig = {
  /* config options here */
}

export default withSentryConfig(nextConfig, {
  // Suppresses source map upload logs during build
  silent: true,

  // Upload source maps to Sentry for readable stack traces in production
  // Requires SENTRY_AUTH_TOKEN env var at build time
  widenClientFileUpload: true,

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,
})
