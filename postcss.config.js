/**
 * PostCSS Configuration
 *
 * PostCSS is a CSS processor. It takes CSS as input,
 * runs it through plugins, and outputs transformed CSS.
 *
 * Vite uses PostCSS automatically when this file exists.
 *
 * Plugin order matters:
 * 1. tailwindcss - Transforms @tailwind directives into CSS
 * 2. autoprefixer - Adds vendor prefixes for browser compatibility
 */

export default {
  plugins: {
    // Tailwind v4 uses a separate PostCSS plugin package
    '@tailwindcss/postcss': {},
  },
}
