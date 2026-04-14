export default defineNuxtRouteMiddleware(() => {
  const { isLoggedIn, user } = useAuth()

  if (!isLoggedIn.value) {
    return navigateTo('/connexion')
  }

  const role = String(user.value?.role ?? '').toLowerCase().trim()

  if (role !== 'super_admin') {
    return navigateTo('/accueil')
  }
})