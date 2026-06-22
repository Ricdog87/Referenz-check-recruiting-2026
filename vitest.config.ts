import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      // Next.js liefert 'server-only' implizit beim Build. Im Vitest-Node-
      // Lauf gibt es das Package nicht — wir aliasen es auf einen leeren
      // Stub. Die Markierung "server-only" hat keine Laufzeit-Wirkung,
      // sie ist reiner Build-Wall-Check für Client-Imports.
      'server-only': path.resolve(__dirname, '__tests__/stubs/server-only.ts'),
    },
  },
  test: {
    include: ['__tests__/**/*.test.ts'],
  },
})
