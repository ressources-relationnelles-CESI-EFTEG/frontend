import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    environment: 'nuxt',
    setupFiles: ['./tests/setup/unit.setup.ts'],
    include: [
      'tests/unit/**/*.spec.ts',
      'tests/pages/**/*.spec.ts'
    ]
  }
})