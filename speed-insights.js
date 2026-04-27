/**
 * Vercel Speed Insights Integration
 * This module initializes Speed Insights for the ArGen website
 */

// Import from CDN for production deployments, fallback to local for development
let speedInsightsModule;

try {
  // Try to import from CDN (works in production)
  speedInsightsModule = await import('https://cdn.jsdelivr.net/npm/@vercel/speed-insights@2/dist/index.mjs');
} catch (e) {
  // Fallback to local node_modules for development
  console.log('Loading Speed Insights from local node_modules');
  speedInsightsModule = await import('./node_modules/@vercel/speed-insights/dist/index.mjs');
}

const { injectSpeedInsights } = speedInsightsModule;

// Initialize Speed Insights
// Note: Speed Insights only tracks in production environments
// Development mode tracking is disabled by default
injectSpeedInsights({
  debug: true, // Enable debug mode in development for testing
});

console.log('Speed Insights initialized');
