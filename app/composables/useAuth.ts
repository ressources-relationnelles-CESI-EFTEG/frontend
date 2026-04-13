export function useAuth() {
  const authToken = useCookie<string | null>('auth_token', {
    sameSite: 'lax',
    secure: false,
  })

  const refreshToken = useCookie<string | null>('refresh_token', {
    sameSite: 'lax',
    secure: false,
  })

  const userCookie = useCookie<any | null>('auth_user', {
    sameSite: 'lax',
    secure: false,
    default: () => null,
  })

  const user = useState<any | null>('auth_user', () => userCookie.value ?? null)

  if (!user.value && userCookie.value) {
    user.value = userCookie.value
  }

  const isLoggedIn = computed(() => !!authToken.value)

  function login(payload: {
  accessToken: string
  refreshToken?: string | null
  user?: any | null
  }) {
  console.log('LOGIN USER PAYLOAD', payload.user)

  authToken.value = payload.accessToken
  refreshToken.value = payload.refreshToken ?? null
  user.value = payload.user ?? null
  userCookie.value = payload.user ?? null
  }

  function logout() {
    authToken.value = null
    refreshToken.value = null
    user.value = null
    userCookie.value = null

    return navigateTo('/connexion')
  }

  return {
    authToken,
    refreshToken,
    user,
    isLoggedIn,
    login,
    logout,
  }
}