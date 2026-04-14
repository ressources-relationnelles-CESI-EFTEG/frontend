import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'

const { cookiesStore, statesStore, navigateToMock } = vi.hoisted(() => ({
  cookiesStore: new Map<string, any>(),
  statesStore: new Map<string, any>(),
  navigateToMock: vi.fn((path: string) => path),
}))

mockNuxtImport('useCookie', () => {
  return (name: string, options?: { default?: () => any }) => {
    if (!cookiesStore.has(name)) {
      cookiesStore.set(name, ref(options?.default ? options.default() : null))
    }
    return cookiesStore.get(name)
  }
})

mockNuxtImport('useState', () => {
  return (name: string, init?: () => any) => {
    if (!statesStore.has(name)) {
      statesStore.set(name, ref(init ? init() : null))
    }
    return statesStore.get(name)
  }
})

mockNuxtImport('navigateTo', () => {
  return navigateToMock
})

describe('useAuth', () => {
  beforeEach(() => {
    cookiesStore.clear()
    statesStore.clear()
    navigateToMock.mockClear()
  })

  it('isLoggedIn vaut false si aucun token', async () => {
    const { useAuth } = await import('~/composables/useAuth')
    const auth = useAuth()

    expect(auth.isLoggedIn.value).toBe(false)
  })

  it('isLoggedIn vaut true si auth_token existe', async () => {
    cookiesStore.set('auth_token', ref('token-123'))

    const { useAuth } = await import('~/composables/useAuth')
    const auth = useAuth()

    expect(auth.isLoggedIn.value).toBe(true)
  })

  it('login stocke auth_token, refresh_token, user et auth_user', async () => {
    const { useAuth } = await import('~/composables/useAuth')
    const auth = useAuth()

    const payload = {
      accessToken: 'token-123',
      refreshToken: 'refresh-456',
      user: {
        id: 1,
        firstname: 'Elie',
        lastname: 'Test',
        email: 'elie@test.fr',
        role: 'user',
      },
    }

    auth.login(payload)

    expect(auth.authToken.value).toBe('token-123')
    expect(auth.refreshToken.value).toBe('refresh-456')
    expect(auth.user.value).toEqual(payload.user)
    expect(cookiesStore.get('auth_user')?.value).toEqual(payload.user)
    expect(auth.isLoggedIn.value).toBe(true)
  })

  it('login met refreshToken à null si absent', async () => {
    const { useAuth } = await import('~/composables/useAuth')
    const auth = useAuth()

    auth.login({
      accessToken: 'token-123',
      user: {
        id: 1,
        email: 'elie@test.fr',
      },
    })

    expect(auth.authToken.value).toBe('token-123')
    expect(auth.refreshToken.value).toBeNull()
  })

  it('logout vide les cookies, le state user et redirige vers /connexion', async () => {
    cookiesStore.set('auth_token', ref('token-123'))
    cookiesStore.set('refresh_token', ref('refresh-456'))
    cookiesStore.set(
      'auth_user',
      ref({
        id: 1,
        email: 'elie@test.fr',
      })
    )
    statesStore.set(
      'auth_user',
      ref({
        id: 1,
        email: 'elie@test.fr',
      })
    )

    const { useAuth } = await import('~/composables/useAuth')
    const auth = useAuth()

    const result = auth.logout()

    expect(auth.authToken.value).toBeNull()
    expect(auth.refreshToken.value).toBeNull()
    expect(auth.user.value).toBeNull()
    expect(cookiesStore.get('auth_user')?.value).toBeNull()
    expect(navigateToMock).toHaveBeenCalledWith('/connexion')
    expect(result).toBe('/connexion')
  })

  it('réinjecte user depuis auth_user si le state est vide', async () => {
    cookiesStore.set(
      'auth_user',
      ref({
        id: 2,
        firstname: 'Jean',
        email: 'jean@test.fr',
      })
    )

    const { useAuth } = await import('~/composables/useAuth')
    const auth = useAuth()

    expect(auth.user.value).toEqual({
      id: 2,
      firstname: 'Jean',
      email: 'jean@test.fr',
    })
  })
})