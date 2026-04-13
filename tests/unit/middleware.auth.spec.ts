import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'

const { navigateToMock, useAuthMock } = vi.hoisted(() => ({
  navigateToMock: vi.fn((path: string) => path),
  useAuthMock: vi.fn(),
}))

mockNuxtImport('navigateTo', () => {
  return navigateToMock
})

vi.mock('~/composables/useAuth', () => ({
  useAuth: () => useAuthMock(),
}))

describe('middleware auth', () => {
  beforeEach(() => {
    navigateToMock.mockClear()
    useAuthMock.mockReset()
  })

  it('laisse passer si l utilisateur est connecté', async () => {
    useAuthMock.mockReturnValue({
      isLoggedIn: { value: true },
    })

    const middleware = (await import('~/middleware/auth')).default
    const result = middleware()

    expect(navigateToMock).not.toHaveBeenCalled()
    expect(result).toBeUndefined()
  })

  it('redirige vers /connexion si l utilisateur n est pas connecté', async () => {
    useAuthMock.mockReturnValue({
      isLoggedIn: { value: false },
    })

    const middleware = (await import('~/middleware/auth')).default
    const result = middleware()

    expect(navigateToMock).toHaveBeenCalledWith('/connexion')
    expect(result).toBe('/connexion')
  })
})