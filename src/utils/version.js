/**
 * APP VERSION CONFIGURATION
 * 
 * Single source of truth for AGP+ version number.
 * Version is automatically injected at build time from package.json.
 * 
 * Version Format: MAJOR.MINOR.PATCH
 * - MAJOR: Breaking changes or major feature releases
 * - MINOR: New features, backward compatible
 * - PATCH: Bug fixes, minor improvements
 */

// Version injected by Vite at build time from package.json
// In development, defaults to package.json version
export const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '3.9.0';
export const APP_NAME = 'AGP+';
export const APP_FULL_NAME = `${APP_NAME} v${APP_VERSION}`;

/**
 * Version display helpers
 */
export function getVersionString() {
  return `v${APP_VERSION}`;
}

export function getFullAppName() {
  return APP_FULL_NAME;
}
